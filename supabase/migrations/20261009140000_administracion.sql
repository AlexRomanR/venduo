-- ============================================================================
-- Administración de Venduo y visitas (docs/plan-administracion.md).
--
-- Todo aditivo: tablas nuevas, columnas nuevas y funciones. Las políticas van
-- en 20261009140100_administracion_rls.sql.
--
-- Casi todas las tablas nuevas tienen RLS activo y **ninguna política**: las
-- escribe y las lee solo el servidor, con la clave de servicio y detrás de
-- `exigirAdmin()`. Lo que una tienda necesita saber de ellas —qué funciones
-- tiene— lo resuelven funciones `security definer` que devuelven solo lo suyo.
--
-- Idempotente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Quién administra.
-- ----------------------------------------------------------------------------
create table if not exists public.platform_admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins where user_id = (select auth.uid())
  )
$$;

-- La primera cuenta de administrador. Ya existe en auth.users.
insert into public.platform_admins (user_id)
select id from auth.users where lower(email) = 'alexromanramos96@gmail.com'
on conflict (user_id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Lo que cambia un administrador, con el antes y el después.
-- ----------------------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid not null references auth.users (id),
  action       text not null,
  target_type  text not null,
  target_id    text,
  before       jsonb,
  after        jsonb,
  note         text,
  created_at   timestamptz not null default now()
);
create index if not exists admin_audit_log_fecha_idx
  on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;

-- ----------------------------------------------------------------------------
-- 3. Ajustes de la plataforma: registro, IA de emergencia, tope de IA.
-- ----------------------------------------------------------------------------
create table if not exists public.platform_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id)
);
alter table public.platform_settings enable row level security;

insert into public.platform_settings (key, value) values
  ('registro', '"abierto"'::jsonb),
  ('ia_apagada', 'false'::jsonb),
  ('ia_tope_diario', 'null'::jsonb)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- 4. Las funciones de cada tienda: un estado general y uno por tienda.
--
-- La lista cerrada vive en `lib/funciones.ts`; acá se siembra el estado general
-- de cada una para que la base sepa resolverlo sola —la política de visitas lo
-- necesita—. Una clave que no tenga fila se toma como activa.
-- ----------------------------------------------------------------------------
create table if not exists public.feature_states (
  feature     text primary key,
  state       text not null check (state in ('activa', 'desactivada', 'oculta')),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id)
);
alter table public.feature_states enable row level security;

insert into public.feature_states (feature, state) values
  ('ia_editor', 'activa'),
  ('ia_estadisticas', 'activa'),
  ('ia_catalogos', 'activa'),
  ('catalogos', 'activa'),
  ('canva', 'activa'),
  ('catalogo_compartido', 'activa'),
  ('estadisticas', 'activa'),
  ('editor', 'activa'),
  ('cambiar_plantilla', 'activa'),
  ('visitas', 'oculta')
on conflict (feature) do nothing;

create table if not exists public.store_feature_states (
  store_id    uuid not null references public.stores (id) on delete cascade,
  feature     text not null,
  state       text not null check (state in ('activa', 'desactivada', 'oculta')),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id),
  primary key (store_id, feature)
);
alter table public.store_feature_states enable row level security;

/**
 * El estado final de una función en una tienda: el de la tienda manda sobre el
 * general, y con la IA apagada de emergencia, toda la IA queda oculta.
 */
create or replace function public.funcion_de_tienda(p_store_id uuid, p_feature text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_feature like 'ia\_%'
         and coalesce((select (value)::text = 'true' from public.platform_settings where key = 'ia_apagada'), false)
      then 'oculta'
    else coalesce(
      (select state from public.store_feature_states where store_id = p_store_id and feature = p_feature),
      (select state from public.feature_states where feature = p_feature),
      'activa'
    )
  end
$$;

/** Todas las funciones de la tienda de quien pregunta, ya resueltas. */
create or replace function public.funciones_de_mi_tienda()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(f.feature, public.funcion_de_tienda(public.my_store_id(), f.feature)),
    '{}'::jsonb
  )
  from public.feature_states f
  where public.my_store_id() is not null
$$;

/** Si una función está activa en la tienda de quien pregunta. La usa RLS. */
create or replace function public.funcion_activa(p_feature text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.my_store_id() is not null
     and public.funcion_de_tienda(public.my_store_id(), p_feature) = 'activa'
$$;

-- ----------------------------------------------------------------------------
-- 5. Plantillas: orden, "Nueva" y recomendada; y las de catálogo.
-- ----------------------------------------------------------------------------
alter table public.templates
  add column if not exists position int not null default 100,
  add column if not exists is_new boolean not null default false,
  add column if not exists is_recommended boolean not null default false;

create table if not exists public.catalog_template_settings (
  key         text primary key,
  is_active   boolean not null default true,
  position    int not null default 100,
  updated_at  timestamptz not null default now()
);
alter table public.catalog_template_settings enable row level security;

-- ----------------------------------------------------------------------------
-- 6. Moderación y operación de tiendas.
-- ----------------------------------------------------------------------------
alter table public.stores
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text;

alter table public.products
  add column if not exists moderated_at timestamptz,
  add column if not exists moderation_reason text;

-- Una tienda pausada por Venduo no se sirve, aunque esté publicada y al día.
create or replace function public.store_is_live(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.stores s
    left join public.subscriptions sub on sub.store_id = s.id
    where s.id = p_store_id
      and s.is_published
      and s.deleted_at is null
      and s.suspended_at is null
      and (sub.id is null or sub.status in ('prueba', 'activa'))
  )
$$;

create table if not exists public.store_notes (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores (id) on delete cascade,
  admin_id    uuid not null references auth.users (id),
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index if not exists store_notes_tienda_idx on public.store_notes (store_id, created_at desc);
alter table public.store_notes enable row level security;

-- ----------------------------------------------------------------------------
-- 7. El registro: abierto, cerrado o por invitación.
-- ----------------------------------------------------------------------------
create table if not exists public.invitations (
  code        text primary key,
  note        text,
  created_by  uuid references auth.users (id),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,
  used_at     timestamptz,
  used_by     uuid references auth.users (id)
);
alter table public.invitations enable row level security;

/** Cómo está el registro. Lo lee la pantalla de ingreso, sin sesión. */
create or replace function public.estado_del_registro()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select value #>> '{}' from public.platform_settings where key = 'registro'),
    'abierto'
  )
$$;

grant execute on function public.estado_del_registro() to anon, authenticated;

-- El registro se impone en la base: aunque alguien llame a la API de Auth sin
-- pasar por la pantalla, una cuenta nueva no nace con el registro cerrado.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_registro  text := public.estado_del_registro();
  v_codigo    text := nullif(btrim(new.raw_user_meta_data->>'invitacion'), '');
begin
  if v_registro = 'cerrado' then
    raise exception 'registro_cerrado';
  end if;

  if v_registro = 'invitacion' then
    update public.invitations
       set used_at = now(), used_by = new.id
     where code = upper(v_codigo)
       and used_at is null
       and (expires_at is null or expires_at > now());
    if not found then
      raise exception 'invitacion_invalida';
    end if;
  end if;

  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end $$;

-- ----------------------------------------------------------------------------
-- 8. Uso de la IA: cada pedido, salga bien o mal, con cuánto tardó.
-- ----------------------------------------------------------------------------
create table if not exists public.ai_requests (
  id          bigint generated always as identity primary key,
  store_id    uuid references public.stores (id) on delete cascade,
  kind        text not null,
  ok          boolean not null,
  ms          int not null,
  error       text,
  created_at  timestamptz not null default now()
);
create index if not exists ai_requests_tienda_idx on public.ai_requests (store_id, created_at desc);
create index if not exists ai_requests_fecha_idx on public.ai_requests (created_at desc);
alter table public.ai_requests enable row level security;

-- ----------------------------------------------------------------------------
-- 9. Las visitas.
--
-- Sin identificar a nadie: la huella es tienda + red + navegador con una sal
-- que cambia cada día, y la sal de ayer se borra. Nada de esto se guarda en
-- crudo. El detalle dura 90 días; el resumen por día, siempre.
-- ----------------------------------------------------------------------------
create table if not exists public.visit_salts (
  day   date primary key,
  salt  text not null default encode(extensions.gen_random_bytes(16), 'hex')
);
alter table public.visit_salts enable row level security;

create table if not exists public.store_visits (
  id          bigint generated always as identity primary key,
  store_id    uuid not null references public.stores (id) on delete cascade,
  product_id  uuid,
  kind        text not null check (kind in ('portada', 'catalogo', 'producto', 'carrito', 'pedido')),
  source      text not null check (source in ('whatsapp', 'tiktok', 'instagram', 'facebook', 'qr', 'catalogo', 'otro', 'directo')),
  device      text not null check (device in ('celular', 'computadora')),
  visitor     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists store_visits_tienda_idx on public.store_visits (store_id, created_at desc);
create index if not exists store_visits_huella_idx on public.store_visits (store_id, visitor, created_at desc);
alter table public.store_visits enable row level security;

create table if not exists public.store_visits_daily (
  store_id    uuid not null references public.stores (id) on delete cascade,
  day         date not null,
  kind        text not null,
  source      text not null,
  -- Sin producto, el uuid en cero: la clave no admite nulos.
  product_id  uuid not null default '00000000-0000-0000-0000-000000000000',
  visits      int not null default 0,
  visitors    int not null default 0,
  primary key (store_id, day, kind, source, product_id)
);
create index if not exists store_visits_daily_dia_idx on public.store_visits_daily (day desc);
alter table public.store_visits_daily enable row level security;

/**
 * Anota una visita. Solo la llama el servidor (`/api/visita`), con la clave de
 * servicio: si el navegador pudiera, cualquiera inflaría los números de otra
 * tienda.
 */
create or replace function public.registrar_visita(
  p_store_id    uuid,
  p_kind        text,
  p_product_id  uuid,
  p_source      text,
  p_device      text,
  p_firma       text,
  p_usuario     uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia      date := (now() at time zone 'America/La_Paz')::date;
  v_inicio   timestamptz := (v_dia::timestamp at time zone 'America/La_Paz');
  v_sal      text;
  v_huella   text;
  v_nuevo    boolean;
  v_producto uuid := coalesce(p_product_id, '00000000-0000-0000-0000-000000000000');
begin
  -- El dueño mirando su tienda y los administradores no cuentan.
  if p_usuario is not null and (
    exists (select 1 from public.stores where id = p_store_id and owner_id = p_usuario)
    or exists (select 1 from public.platform_admins where user_id = p_usuario)
  ) then
    return;
  end if;

  if not public.store_is_live(p_store_id) then
    return;
  end if;

  insert into public.visit_salts (day) values (v_dia) on conflict (day) do nothing;
  select salt into v_sal from public.visit_salts where day = v_dia;
  v_huella := md5(v_sal || ':' || p_store_id::text || ':' || coalesce(p_firma, ''));

  -- La misma persona en la misma página dentro de media hora es una recarga.
  if exists (
    select 1 from public.store_visits
     where store_id = p_store_id
       and visitor = v_huella
       and kind = p_kind
       and product_id is not distinct from p_product_id
       and created_at > now() - interval '30 minutes'
  ) then
    return;
  end if;

  v_nuevo := not exists (
    select 1 from public.store_visits
     where store_id = p_store_id and visitor = v_huella and created_at >= v_inicio
  );

  insert into public.store_visits (store_id, product_id, kind, source, device, visitor)
  values (p_store_id, p_product_id, p_kind, p_source, p_device, v_huella);

  insert into public.store_visits_daily (store_id, day, kind, source, product_id, visits, visitors)
  values (p_store_id, v_dia, p_kind, p_source, v_producto, 1, case when v_nuevo then 1 else 0 end)
  on conflict (store_id, day, kind, source, product_id) do update
    set visits = public.store_visits_daily.visits + 1,
        visitors = public.store_visits_daily.visitors + excluded.visitors;

  -- Limpieza de a poco, sin un trabajo programado: el detalle de más de 90
  -- días y las sales de días pasados.
  if random() < 0.002 then
    delete from public.store_visits where created_at < now() - interval '90 days';
    delete from public.visit_salts where day < v_dia;
  end if;
end $$;

revoke all on function public.registrar_visita(uuid, text, uuid, text, text, text, uuid)
  from public, anon, authenticated;

grant execute on function public.registrar_visita(uuid, text, uuid, text, text, text, uuid)
  to service_role;

-- El estado de otra tienda no le importa a nadie más: se resuelve adentro de
-- las funciones de arriba, que corren como su dueño.
revoke all on function public.funcion_de_tienda(uuid, text) from public, anon, authenticated;
grant execute on function public.funcion_de_tienda(uuid, text) to service_role;
