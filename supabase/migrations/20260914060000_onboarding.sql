-- ============================================================================
-- Venduo — 0014 onboarding: rubros, catálogo de plantillas y alta de tienda
--
-- Tres cosas, todas necesarias para que un emprendedor recién registrado pueda
-- llegar solo desde el alta hasta su panel:
--
--   1. Un catálogo de rubros, para que la galería de plantillas se pueda
--      agrupar sin que la interfaz invente los nombres.
--   2. Más plantillas, cubriendo los rubros que el producto promete.
--   3. `create_store`, que es lo que faltaba: hoy no hay forma de crear una
--      tienda dejándola en un estado consistente.
--
-- Corrige además el registro de los textos sembrados, que estaban en voseo
-- rioplatense y se leen en pantalla.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Rubros.
--
-- Catálogo global, como planes y tipos de bloque: lo lee todo el mundo y solo
-- lo escribe la clave de servicio. Existe para que el nombre visible y el orden
-- de los rubros vivan en un lado solo; sin esto, cada pantalla que agrupe
-- plantillas tiene que traer su propio diccionario y se desincronizan.
-- ----------------------------------------------------------------------------
create table if not exists public.sectors (
  key         text primary key,
  name        text not null,
  position    integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.sectors (key, name, position) values
  ('moda',         'Moda',        10),
  ('gastronomia',  'Comida',      20),
  ('tecnologia',   'Tecnología',  30),
  ('belleza',      'Belleza',     40),
  ('hogar',        'Hogar',       50),
  ('abarrotes',    'Abarrotes',   60)
on conflict (key) do update
  set name = excluded.name,
      position = excluded.position;

-- El taller de carpintería es una tienda de muebles: pertenece a Hogar. Se
-- reasigna antes de declarar la clave foránea, o quedaría huérfana.
update public.templates set sector = 'hogar' where sector = 'carpinteria';

do $$ begin
  alter table public.templates
    add constraint templates_sector_fkey
    foreign key (sector) references public.sectors(key);
exception when duplicate_object then null; end $$;

create index if not exists templates_sector_idx
  on public.templates (sector) where is_active;

-- ----------------------------------------------------------------------------
-- Plantillas nuevas.
--
-- La galería agrupa por rubro, así que un rubro con una sola opción se lee
-- como una lista incompleta. Los rubros con volumen real en el mercado
-- boliviano llevan dos.
-- ----------------------------------------------------------------------------
insert into public.templates (key, name, sector, description, theme) values
  ('moda_calzado', 'Calzado', 'moda',
   'Fichas con talles y fotos por ángulo. Pensada para zapatillas y calzado urbano.',
   '{"primary":"#1f2937","accent":"#f97316","font":"Inter"}'::jsonb),

  ('reposteria', 'Repostería', 'gastronomia',
   'Catálogo por encargo con anticipación de pedido. Para tortas, postres y mesas dulces.',
   '{"primary":"#9d174d","accent":"#fb7185","font":"Inter"}'::jsonb),

  ('tecnologia', 'Electrónica', 'tecnologia',
   'Ficha técnica extendida y comparación de precios. Incluye sección de reacondicionados.',
   '{"primary":"#1e3a8a","accent":"#38bdf8","font":"Inter"}'::jsonb),

  ('celulares', 'Celulares', 'tecnologia',
   'Equipos y accesorios, con estado del producto bien visible y garantía declarada.',
   '{"primary":"#0f172a","accent":"#22d3ee","font":"Inter"}'::jsonb),

  ('belleza', 'Cosmética', 'belleza',
   'Productos por tipo de piel y rutina, con testimonios de clientas.',
   '{"primary":"#6b21a8","accent":"#e879f9","font":"Inter"}'::jsonb),

  ('hogar', 'Decoración', 'hogar',
   'Ambientes completos y piezas sueltas, con foco en la foto grande.',
   '{"primary":"#3f6212","accent":"#a3e635","font":"Inter"}'::jsonb)
on conflict (key) do nothing;

insert into public.template_pages (template_key, page_key, title, is_home, blocks) values
  ('moda_calzado', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Calzado que camina contigo","subtitle":"Talles reales, stock al día."}},
     {"block_type_key":"product_grid","props":{"title":"Lo nuevo","columns":3,"limit":12,"condition":"nuevo"}},
     {"block_type_key":"product_grid","props":{"title":"Segunda mano","columns":3,"limit":8,"condition":"segunda_mano"}},
     {"block_type_key":"contact","props":{"title":"Contacto"}}]'::jsonb),

  ('reposteria', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Dulces por encargo","subtitle":"Pide con dos días de anticipación."}},
     {"block_type_key":"product_grid","props":{"title":"Catálogo","columns":3,"limit":12,"condition":"todos"}},
     {"block_type_key":"faq","props":{"title":"Antes de pedir","items":[]}},
     {"block_type_key":"contact","props":{"title":"Haz tu pedido"}}]'::jsonb),

  ('tecnologia', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Tecnología con garantía","subtitle":"Nuevo y reacondicionado, siempre revisado."}},
     {"block_type_key":"product_grid","props":{"title":"Nuevos","columns":3,"limit":12,"condition":"nuevo"}},
     {"block_type_key":"product_grid","props":{"title":"Reacondicionados","columns":3,"limit":8,"condition":"reacondicionado"}},
     {"block_type_key":"faq","props":{"title":"Garantía y devoluciones","items":[]}},
     {"block_type_key":"contact","props":{"title":"Contacto"}}]'::jsonb),

  ('celulares', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Tu próximo equipo","subtitle":"Liberados, con garantía escrita."}},
     {"block_type_key":"product_grid","props":{"title":"Equipos","columns":3,"limit":12,"condition":"todos"}},
     {"block_type_key":"product_grid","props":{"title":"Accesorios","columns":4,"limit":8,"condition":"nuevo"}},
     {"block_type_key":"contact","props":{"title":"Dónde encontrarnos"}}]'::jsonb),

  ('belleza', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Tu rutina, completa","subtitle":"Productos probados, sin promesas raras."}},
     {"block_type_key":"product_grid","props":{"title":"Productos","columns":3,"limit":12,"condition":"todos"}},
     {"block_type_key":"testimonials","props":{"title":"Lo que dicen","items":[]}},
     {"block_type_key":"contact","props":{"title":"Contacto"}}]'::jsonb),

  ('hogar', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Tu casa, como la imaginas","subtitle":"Piezas que duran."}},
     {"block_type_key":"about","props":{"title":"Nuestro trabajo","body":"Cuenta aquí de dónde salen tus piezas y cómo las eliges."}},
     {"block_type_key":"product_grid","props":{"title":"Catálogo","columns":3,"limit":12,"condition":"todos"}},
     {"block_type_key":"cta","props":{"title":"¿Buscas algo puntual?","buttonLabel":"Escríbenos"}}]'::jsonb)
on conflict (template_key, page_key) do nothing;

-- ----------------------------------------------------------------------------
-- Registro del idioma.
--
-- Los textos sembrados estaban en voseo rioplatense —"necesitás", "Contá",
-- "Pedí"— y no son datos internos: se copian tal cual a la tienda del
-- emprendedor cuando elige la plantilla, y los lee un comprador boliviano.
-- ----------------------------------------------------------------------------
update public.template_pages
   set blocks = '[{"block_type_key":"hero","props":{"title":"Tu almacén de confianza","subtitle":"Todo lo que necesitas, cerca."}},
                  {"block_type_key":"product_grid","props":{"title":"Productos","columns":3,"limit":12,"condition":"todos"}},
                  {"block_type_key":"contact","props":{"title":"Dónde encontrarnos"}}]'::jsonb
 where template_key = 'abarrotes' and page_key = 'home';

update public.template_pages
   set blocks = '[{"block_type_key":"hero","props":{"title":"Muebles a medida","subtitle":"Madera maciza, trabajo artesanal."}},
                  {"block_type_key":"about","props":{"title":"El taller","body":"Cuenta aquí tu historia y tu forma de trabajar."}},
                  {"block_type_key":"product_grid","props":{"title":"Trabajos","columns":2,"limit":8,"condition":"todos"}},
                  {"block_type_key":"cta","props":{"title":"¿Tienes un proyecto?","buttonLabel":"Pide presupuesto"}}]'::jsonb
 where template_key = 'carpinteria' and page_key = 'home';

update public.block_types
   set default_props = '{"title":"¿Hacemos negocio?","buttonLabel":"Escríbenos"}'::jsonb
 where key = 'cta';

update public.templates
   set name = 'Muebles a medida'
 where key = 'carpinteria';

-- ----------------------------------------------------------------------------
-- Crear la tienda.
--
-- Vive en el servidor por las mismas razones que `join_store`: hay tres cosas
-- que el cliente no puede decidir ni resolver solo.
--
--   El slug tiene que ser único entre tiendas vivas, y comprobarlo desde el
--   cliente es una carrera perdida: dos personas con el mismo nombre de
--   negocio chocan contra el índice y reciben un error ilegible.
--
--   La suscripción no tiene política de INSERT a propósito —su estado lo
--   cambia el servidor, nunca el emprendedor— así que nacería sin ella.
--
--   La plantilla se siembra con `apply_template`, que exige que la tienda ya
--   exista. Separarlo en dos llamadas del cliente deja la puerta abierta a una
--   tienda a medio crear si la segunda falla.
-- ----------------------------------------------------------------------------
create or replace function public.create_store(
  p_name         text,
  p_description  text,
  p_template_key text
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
begin
  if v_user_id is null then
    raise exception 'Hace falta iniciar sesión';
  end if;

  -- El índice único ya lo impide, pero su error no se puede traducir a algo
  -- que una persona entienda.
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

  -- Se translitera antes de limpiar, igual que el slug del vendedor: si no,
  -- "Panadería Doña Elsa" termina como "panader-a-do-a-elsa", y este slug es
  -- la URL que se imprime en el código QR.
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

  insert into public.stores (owner_id, name, slug, description, template_key)
  values (
    v_user_id,
    btrim(p_name),
    v_slug,
    nullif(btrim(coalesce(p_description, '')), ''),
    p_template_key
  )
  returning id into v_store_id;

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

  -- Siembra páginas y bloques. Va último porque exige que la tienda exista.
  perform public.apply_template(v_store_id, p_template_key);

  return v_store_id;
end $$;

-- ----------------------------------------------------------------------------
-- Mismo arreglo de registro en el mensaje que ve el vendedor.
-- ----------------------------------------------------------------------------
create or replace function public.join_store(p_store_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_store record;
  v_existing uuid;
  v_status public.seller_status;
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

  select id into v_existing
    from public.store_sellers
   where store_id = v_store.id and user_id = v_user_id and deleted_at is null;

  if v_existing is not null then
    return v_existing;
  end if;

  perform public.ensure_seller_profile(v_user_id);

  v_status := case v_store.seller_join_mode
                when 'abierta' then 'activo'::public.seller_status
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
-- RLS y permisos.
-- ----------------------------------------------------------------------------
alter table public.sectors enable row level security;

drop policy if exists "rubros: leer" on public.sectors;
create policy "rubros: leer" on public.sectors
  for select using (is_active);

revoke all on function public.create_store(text, text, text) from public;
grant execute on function public.create_store(text, text, text) to authenticated;
