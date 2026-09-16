-- ============================================================================
-- Venduo — 0016 enlace de invitación
--
-- Hasta acá, sumarse a una tienda `con_aprobacion` siempre dejaba al vendedor
-- esperando, aunque el dueño le hubiera pasado el enlace él mismo.
--
-- La tentación era que tener el enlace de la tienda alcanzara. No alcanza: esa
-- URL es pública, está impresa en el código QR y se manda por WhatsApp a
-- cualquiera. Si bastara con tenerla, `con_aprobacion` sería decorativo.
--
-- Por eso la invitación es un código aparte, que solo conoce quien lo recibió
-- del dueño. Tener la URL de la tienda te deja pedir; tener la invitación te
-- deja entrar.
--
-- Y por eso vive en su propia tabla y no en una columna de `stores`: la
-- política de lectura de `stores` expone toda tienda publicada a cualquiera,
-- así que una columna ahí sería un código de invitación que se puede consultar
-- con un `select`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Generador del código.
--
-- Más largo que el de referido (10 contra 7) porque el costo de acertar uno es
-- distinto: un código de referido acertado regala una comisión, y uno de
-- invitación acertado mete a un desconocido en la red de la tienda.
-- ----------------------------------------------------------------------------
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  -- Mismo alfabeto sin caracteres ambiguos que el código de referido: este
  -- también se dicta por teléfono cuando el enlace no se puede pegar.
  v_alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
  v_intentos int := 0;
begin
  loop
    v_code := '';
    for i in 1..10 loop
      v_code := v_code || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1);
    end loop;

    exit when not exists (
      select 1 from public.store_invites where code = v_code
    );

    v_intentos := v_intentos + 1;
    if v_intentos > 20 then
      raise exception 'No se pudo generar un código de invitación único';
    end if;
  end loop;

  return v_code;
end $$;

-- ----------------------------------------------------------------------------
-- La invitación, una por tienda.
-- ----------------------------------------------------------------------------
create table if not exists public.store_invites (
  store_id    uuid primary key references public.stores(id) on delete cascade,
  code        text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Las tiendas que ya existían nacen sin invitación; se les genera una.
insert into public.store_invites (store_id, code)
select s.id, public.generate_invite_code()
  from public.stores s
 where s.deleted_at is null
   and not exists (
     select 1 from public.store_invites i where i.store_id = s.id
   );

-- ----------------------------------------------------------------------------
-- Sumarse a una tienda, con o sin invitación.
--
-- `p_invite_code` es opcional y tiene default, así que las llamadas de un solo
-- argumento que ya existen siguen funcionando igual.
--
-- Es `security definer`, que es lo que le permite leer `store_invites` para
-- comparar sin que el cliente pueda leerla nunca.
-- ----------------------------------------------------------------------------
create or replace function public.join_store(
  p_store_slug  text,
  p_invite_code text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_store record;
  v_codigo text;
  v_existing record;
  v_status public.seller_status;
  v_invitado boolean;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Hace falta iniciar sesión';
  end if;

  select id, owner_id, seller_network_enabled, seller_join_mode
    into v_store
    from public.stores
   where slug = p_store_slug and is_published and deleted_at is null;

  if v_store.id is null then
    raise exception 'La tienda no existe o no está publicada';
  end if;

  if not v_store.seller_network_enabled then
    raise exception 'Esta tienda no tiene la red de vendedores activada';
  end if;

  if v_store.owner_id = v_user_id then
    raise exception 'No puedes ser vendedor de tu propia tienda';
  end if;

  select code into v_codigo
    from public.store_invites where store_id = v_store.id;

  -- La comparación exige que el código exista: si la tienda no tiene ninguno,
  -- pasar null no puede dar por válida la invitación.
  v_invitado := v_codigo is not null
                and p_invite_code is not null
                and upper(btrim(p_invite_code)) = v_codigo;

  select id, status into v_existing
    from public.store_sellers
   where store_id = v_store.id and user_id = v_user_id and deleted_at is null;

  if v_existing.id is not null then
    -- Quien ya pidió sumarse y después recibe la invitación del dueño no se
    -- queda esperando: la invitación es la aprobación.
    if v_invitado and v_existing.status = 'pendiente' then
      update public.store_sellers
         set status = 'activo',
             approved_at = coalesce(approved_at, now()),
             updated_at = now()
       where id = v_existing.id;
    end if;

    return v_existing.id;
  end if;

  perform public.ensure_seller_profile(v_user_id);

  v_status := case
                when v_invitado then 'activo'::public.seller_status
                when v_store.seller_join_mode = 'abierta' then 'activo'::public.seller_status
                else 'pendiente'::public.seller_status
              end;

  insert into public.store_sellers (store_id, user_id, referral_code, status, approved_at)
  values (
    v_store.id,
    v_user_id,
    public.generate_referral_code(),
    v_status,
    case when v_status = 'activo' then now() else null end
  )
  returning id into v_id;

  return v_id;
end $$;

-- ----------------------------------------------------------------------------
-- Leer y rotar la invitación propia.
--
-- Rotar importa: un enlace de invitación se reenvía, se pega en un grupo y
-- termina donde el dueño no quiso. Sin forma de rotarlo, la única salida sería
-- apagar la red entera.
-- ----------------------------------------------------------------------------
create or replace function public.my_seller_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := public.my_store_id();
  v_code text;
begin
  if v_store_id is null then
    return null;
  end if;

  select code into v_code from public.store_invites where store_id = v_store_id;

  -- Una tienda sin invitación todavía es un caso real: se creó antes de que
  -- esto existiera y la migración corrió después.
  if v_code is null then
    v_code := public.generate_invite_code();
    insert into public.store_invites (store_id, code) values (v_store_id, v_code)
    on conflict (store_id) do update set code = excluded.code, updated_at = now()
    returning code into v_code;
  end if;

  return v_code;
end $$;

create or replace function public.rotate_seller_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := public.my_store_id();
  v_code text;
begin
  if v_store_id is null then
    raise exception 'No tienes una tienda';
  end if;

  v_code := public.generate_invite_code();

  insert into public.store_invites (store_id, code)
  values (v_store_id, v_code)
  on conflict (store_id) do update
    set code = excluded.code, updated_at = now();

  return v_code;
end $$;

-- ----------------------------------------------------------------------------
-- El alta genera la invitación desde el principio.
-- ----------------------------------------------------------------------------
create or replace function public.create_store(
  p_name           text,
  p_description    text,
  p_template_key   text,
  p_sellers        boolean default false,
  p_commission_bps integer default 1000
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := (select auth.uid());
  v_store_id uuid;
  v_base     text;
  v_slug     text;
  v_intento  int := 0;
  v_plan     text;
  v_dias     int;
  v_bps      int;
begin
  if v_user_id is null then
    raise exception 'Hace falta iniciar sesión';
  end if;

  if public.my_store_id() is not null then
    raise exception 'Ya tienes una tienda';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'Falta el nombre de la tienda';
  end if;

  if not exists (
    select 1 from public.templates
     where key = p_template_key and is_active
  ) then
    raise exception 'La plantilla no existe';
  end if;

  -- La comisión la impone el servidor dentro de un rango razonable: el
  -- cliente no declara un 90% ni un negativo.
  v_bps := least(greatest(coalesce(p_commission_bps, 1000), 0), 5000);
  if not coalesce(p_sellers, false) then
    v_bps := 0;
  end if;

  v_base := trim(both '-' from lower(
    regexp_replace(
      translate(
        btrim(p_name),
        'áéíóúÁÉÍÓÚñÑüÜàèìòùâêîôûäëïöÿçÇ',
        'aeiouAEIOUnNuUaeiouaeiouaeiyccC'
      ),
      '[^a-zA-Z0-9]+', '-', 'g'
    )
  ));

  v_base := nullif(left(v_base, 40), '');
  if v_base is null then
    v_base := 'tienda';
  end if;

  v_slug := v_base;
  while exists (
    select 1 from public.stores where slug = v_slug and deleted_at is null
  ) loop
    v_intento := v_intento + 1;
    if v_intento > 25 then
      v_slug := v_base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
      exit;
    end if;
    v_slug := v_base || '-' || v_intento::text;
  end loop;

  insert into public.stores (
    owner_id, name, slug, description, template_key,
    seller_network_enabled, commission_bps
  )
  values (
    v_user_id,
    btrim(p_name),
    v_slug,
    nullif(btrim(coalesce(p_description, '')), ''),
    p_template_key,
    coalesce(p_sellers, false),
    v_bps
  )
  returning id into v_store_id;

  insert into public.store_invites (store_id, code)
  values (v_store_id, public.generate_invite_code())
  on conflict (store_id) do nothing;

  select key, trial_days into v_plan, v_dias
    from public.plans
   where is_active
   order by created_at
   limit 1;

  if v_plan is not null then
    insert into public.subscriptions (store_id, plan_key, status, trial_ends_at)
    values (
      v_store_id,
      v_plan,
      'prueba',
      now() + make_interval(days => coalesce(v_dias, 30))
    )
    on conflict (store_id) do nothing;
  end if;

  perform public.apply_template(v_store_id, p_template_key);

  return v_store_id;
end $$;

-- ----------------------------------------------------------------------------
-- RLS y permisos.
--
-- `store_invites` queda con RLS activo y CERO políticas, igual que
-- `social_connections`: nadie la lee desde el cliente. El dueño llega a su
-- código por `my_seller_invite()`, que es `security definer`; el cliente no
-- puede hacer un `select` contra la tabla ni siquiera sobre su propia fila.
-- ----------------------------------------------------------------------------
alter table public.store_invites enable row level security;

revoke all on function public.generate_invite_code() from public;

drop function if exists public.join_store(text);
revoke all on function public.join_store(text, text) from public;
grant execute on function public.join_store(text, text) to authenticated;

revoke all on function public.my_seller_invite() from public;
grant execute on function public.my_seller_invite() to authenticated;

revoke all on function public.rotate_seller_invite() from public;
grant execute on function public.rotate_seller_invite() to authenticated;
