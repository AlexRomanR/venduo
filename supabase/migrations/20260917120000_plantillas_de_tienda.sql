-- ============================================================================
-- Venduo — plantillas de tienda: base, personalización y versiones
--
-- Tres capas que hasta ahora estaban mezcladas o sin usar:
--
--   1. La BASE de una plantilla. Su identidad visual (tokens, tipografía,
--      componentes) vive en código, en `lib/plantillas` y
--      `components/plantillas`: las fuentes se compilan con next/font y los
--      componentes son React, así que no pueden ser datos. La base guarda acá
--      su ficha de catálogo, su versión y el contenido que siembra.
--
--   2. La PERSONALIZACIÓN de cada tienda. `stores.theme_overrides` guarda solo
--      lo que la tienda cambia respecto de la base, y `store_pages` /
--      `store_blocks` guardan su estructura y su contenido.
--
--   3. La configuración FINAL se calcula al dibujar —base más personalización—
--      y no se persiste: una copia resuelta se desactualiza en cuanto cambia la
--      base. Lo único que la congela es una versión del historial.
--
-- `templates.theme` y `stores.theme` guardaban colores y una fuente que nadie
-- leía nunca. Se reemplazan, no se reinterpretan.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- La base: versión y retiro del tema sin uso.
--
-- `version` se sube en una migración cada vez que cambia la base en código de
-- forma que pueda afectar una personalización. Una versión del historial
-- registra contra qué base se guardó.
-- ----------------------------------------------------------------------------
alter table public.templates
  add column if not exists version integer not null default 1
    check (version >= 1);

alter table public.templates drop column if exists theme;

-- ----------------------------------------------------------------------------
-- La personalización de la tienda.
--
-- Se renombra para que el nombre diga lo que guarda: un objeto vacío es la
-- plantilla tal cual. Los valores viejos se descartan en el mismo paso porque
-- eran una copia del tema de la plantilla, no una elección del emprendedor.
-- ----------------------------------------------------------------------------
do $$ begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'stores' and column_name = 'theme'
  ) then
    alter table public.stores rename column theme to theme_overrides;
    update public.stores set theme_overrides = '{}'::jsonb;
  end if;
end $$;

do $$ begin
  alter table public.stores
    add constraint stores_theme_overrides_objeto
    check (jsonb_typeof(theme_overrides) = 'object');
exception when duplicate_object then null; end $$;

comment on column public.stores.theme_overrides is
  'Solo lo que la tienda cambia respecto de la base de su plantilla. {} es la plantilla tal cual. Se valida con zod al leer: un valor fuera del esquema se ignora.';

-- ----------------------------------------------------------------------------
-- Historial de diseño.
--
-- Cada fila es un punto de restauración inmutable: la plantilla, su versión,
-- la personalización y las páginas con sus bloques tal como estaban. Se toma
-- ANTES de toda operación que reemplace el diseño, así ningún cambio de
-- plantilla —ni mañana una edición con IA— pierde lo anterior.
--
-- Deshacer, rehacer, restaurar y la vista previa de una versión se construyen
-- encima de esto sin migrar datos: todo lo que hace falta para volver a un
-- estado ya está en la fila.
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.design_origin as enum (
    'inicial',
    'alta',
    'antes_de_cambiar_plantilla'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.store_design_versions (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores(id) on delete cascade,
  number            integer not null check (number >= 1),
  origin            public.design_origin not null,
  note              text,
  template_key      text references public.templates(key) on delete set null,
  template_version  integer,
  theme_overrides   jsonb not null default '{}'::jsonb,
  pages             jsonb not null default '[]'::jsonb,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create unique index if not exists store_design_versions_numero_key
  on public.store_design_versions (store_id, number) where deleted_at is null;

create index if not exists store_design_versions_tienda_idx
  on public.store_design_versions (store_id, created_at desc)
  where deleted_at is null;

alter table public.store_design_versions enable row level security;

-- Solo lectura para el dueño. Las versiones las escriben las funciones de
-- abajo: una versión editable desde el cliente dejaría de ser un respaldo.
drop policy if exists "versiones de diseño propias: leer" on public.store_design_versions;
create policy "versiones de diseño propias: leer" on public.store_design_versions
  for select to authenticated
  using (deleted_at is null and store_id = public.my_store_id());

-- ----------------------------------------------------------------------------
-- Tomar un punto de restauración.
--
-- Interna: no comprueba dueño, así que no se expone. La llaman las funciones
-- públicas que ya lo comprobaron, y la migración.
-- ----------------------------------------------------------------------------
create or replace function public.capture_design_version(
  p_store_id uuid,
  p_origin   public.design_origin,
  p_note     text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tienda record;
  v_numero int;
  v_id     uuid;
begin
  select template_key, theme_overrides
    into v_tienda
    from public.stores
   where id = p_store_id and deleted_at is null;

  if not found then
    raise exception 'La tienda no existe';
  end if;

  -- Dos capturas simultáneas de la misma tienda calcularían el mismo número.
  perform pg_advisory_xact_lock(hashtext('store_design_versions:' || p_store_id::text));

  -- Sobre todas las filas, incluidas las dadas de baja: un número no se reusa.
  select coalesce(max(number), 0) + 1
    into v_numero
    from public.store_design_versions
   where store_id = p_store_id;

  insert into public.store_design_versions (
    store_id, number, origin, note, template_key, template_version,
    theme_overrides, pages, created_by
  )
  values (
    p_store_id,
    v_numero,
    p_origin,
    p_note,
    v_tienda.template_key,
    (select version from public.templates where key = v_tienda.template_key),
    coalesce(v_tienda.theme_overrides, '{}'::jsonb),
    coalesce((
      select jsonb_agg(
               jsonb_build_object(
                 'key', p.key,
                 'title', p.title,
                 'is_home', p.is_home,
                 'status', p.status,
                 'blocks', coalesce((
                   select jsonb_agg(
                            jsonb_build_object(
                              'block_type_key', b.block_type_key,
                              'position', b.position,
                              'props', b.props,
                              'is_visible', b.is_visible
                            )
                            order by b.position
                          )
                     from public.store_blocks b
                    where b.page_id = p.id and b.deleted_at is null
                 ), '[]'::jsonb)
               )
               order by p.is_home desc, p.key
             )
        from public.store_pages p
       where p.store_id = p_store_id and p.deleted_at is null
    ), '[]'::jsonb),
    (select auth.uid())
  )
  returning id into v_id;

  return v_id;
end $$;

revoke all on function public.capture_design_version(uuid, public.design_origin, text)
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Sembrar las páginas de una plantilla.
--
-- Interna, por la misma razón. Las páginas nacen PUBLICADAS: sin editor no hay
-- quién las publique, y en borrador la política de lectura se las esconde al
-- comprador anónimo mientras el dueño sí las ve. La tienda se veía distinta
-- según quién la mirara.
-- ----------------------------------------------------------------------------
create or replace function public.seed_template_pages(
  p_store_id     uuid,
  p_template_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page    record;
  v_block   jsonb;
  v_page_id uuid;
  v_pos     int;
begin
  for v_page in
    select * from public.template_pages where template_key = p_template_key
  loop
    select id into v_page_id
      from public.store_pages
     where store_id = p_store_id and key = v_page.page_key and deleted_at is null;

    if v_page_id is null then
      insert into public.store_pages (store_id, key, title, is_home, status, published_at)
      values (p_store_id, v_page.page_key, v_page.title, v_page.is_home, 'publicada', now())
      returning id into v_page_id;
    else
      update public.store_blocks
         set deleted_at = now(), updated_at = now()
       where page_id = v_page_id and deleted_at is null;

      update public.store_pages
         set title = v_page.title,
             status = 'publicada',
             published_at = coalesce(published_at, now()),
             updated_at = now()
       where id = v_page_id;
    end if;

    v_pos := 0;
    for v_block in select * from jsonb_array_elements(v_page.blocks)
    loop
      insert into public.store_blocks (store_id, page_id, block_type_key, position, props)
      values (
        p_store_id,
        v_page_id,
        v_block->>'block_type_key',
        v_pos,
        coalesce(v_block->'props', '{}'::jsonb)
      );
      v_pos := v_pos + 1;
    end loop;
  end loop;
end $$;

revoke all on function public.seed_template_pages(uuid, text)
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Aplicar una plantilla. La usa `create_store` en el alta.
--
-- Ya no copia un tema: la base está en código y la tienda arranca sin
-- personalización. Si la tienda ya tenía bloques, se guardan antes de
-- reemplazarlos; si es la primera vez, el resultado queda como versión 1.
-- ----------------------------------------------------------------------------
create or replace function public.apply_template(
  p_store_id     uuid,
  p_template_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_store_id is distinct from public.my_store_id() then
    raise exception 'La tienda no pertenece al usuario';
  end if;

  if not exists (select 1 from public.templates where key = p_template_key) then
    raise exception 'La plantilla no existe';
  end if;

  if exists (
    select 1 from public.store_blocks
     where store_id = p_store_id and deleted_at is null
  ) then
    perform public.capture_design_version(
      p_store_id, 'antes_de_cambiar_plantilla', 'Antes de volver a aplicar la plantilla'
    );
  end if;

  update public.stores
     set template_key = p_template_key,
         theme_overrides = '{}'::jsonb,
         updated_at = now()
   where id = p_store_id;

  perform public.seed_template_pages(p_store_id, p_template_key);

  if not exists (
    select 1 from public.store_design_versions where store_id = p_store_id
  ) then
    perform public.capture_design_version(p_store_id, 'alta', null);
  end if;
end $$;

revoke all on function public.apply_template(uuid, text) from public;
grant execute on function public.apply_template(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Cambiar de plantilla.
--
-- Cambia la apariencia y nada del negocio: productos, categorías, pedidos,
-- comisiones y vendedores no se tocan porque no dependen de la plantilla.
--
-- Por defecto conserva las secciones y sus textos, que pueden ser trabajo del
-- emprendedor; la nueva plantilla las dibuja a su manera. Con
-- `p_keep_sections = false` siembra las de la plantilla nueva. En los dos
-- casos, antes de tocar nada queda un punto de restauración.
--
-- La personalización se descarta: unos colores elegidos contra una base no
-- tienen por qué funcionar sobre otra. Queda guardada en la versión.
-- ----------------------------------------------------------------------------
create or replace function public.change_store_template(
  p_template_key  text,
  p_keep_sections boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid := public.my_store_id();
  v_actual   text;
  v_anterior text;
  v_nueva    text;
  v_version  uuid;
begin
  if v_store_id is null then
    raise exception 'No tienes una tienda';
  end if;

  select name into v_nueva
    from public.templates
   where key = p_template_key and is_active;

  if v_nueva is null then
    raise exception 'La plantilla no existe';
  end if;

  select s.template_key, t.name
    into v_actual, v_anterior
    from public.stores s
    left join public.templates t on t.key = s.template_key
   where s.id = v_store_id;

  if v_actual = p_template_key then
    raise exception 'Tu tienda ya usa esa plantilla';
  end if;

  v_version := public.capture_design_version(
    v_store_id,
    'antes_de_cambiar_plantilla',
    coalesce(v_anterior, 'Sin plantilla') || ' → ' || v_nueva
  );

  update public.stores
     set template_key = p_template_key,
         theme_overrides = '{}'::jsonb,
         updated_at = now()
   where id = v_store_id;

  -- Sin bloques vivos no hay nada que conservar: se siembra igual, o la
  -- portada quedaría vacía.
  if not coalesce(p_keep_sections, true) or not exists (
    select 1 from public.store_blocks
     where store_id = v_store_id and deleted_at is null
  ) then
    perform public.seed_template_pages(v_store_id, p_template_key);
  end if;

  return v_version;
end $$;

revoke all on function public.change_store_template(text, boolean) from public;
grant execute on function public.change_store_template(text, boolean) to authenticated;

-- ----------------------------------------------------------------------------
-- Tipos de bloque.
--
-- `categories` muestra las categorías del catálogo con la foto de uno de sus
-- productos: las dos plantillas nuevas arman su portada alrededor de eso.
-- `product_grid` suma `featured`, para una grilla de solo destacados.
-- ----------------------------------------------------------------------------
insert into public.block_types (key, name, description, category, max_per_page, props_schema, default_props) values
  ('categories', 'Categorías', 'Las categorías del catálogo, cada una con la foto de uno de sus productos.', 'catalogo', 1,
   '{"type":"object","properties":{"title":{"type":"string","maxLength":120},"subtitle":{"type":"string","maxLength":240},"limit":{"type":"integer","minimum":2,"maximum":12}},"required":["title"],"additionalProperties":false}'::jsonb,
   '{"title":"Compra por categoría","limit":6}'::jsonb)
on conflict (key) do update
  set name = excluded.name,
      description = excluded.description,
      category = excluded.category,
      max_per_page = excluded.max_per_page,
      props_schema = excluded.props_schema,
      default_props = excluded.default_props;

update public.block_types
   set props_schema = '{"type":"object","properties":{"title":{"type":"string","maxLength":120},"columns":{"type":"integer","minimum":2,"maximum":4},"limit":{"type":"integer","minimum":1,"maximum":48},"condition":{"type":"string","enum":["todos","nuevo","segunda_mano","reacondicionado"]},"category":{"type":"string","maxLength":60},"featured":{"type":"boolean"}},"required":["title"],"additionalProperties":false}'::jsonb
 where key = 'product_grid';

-- ----------------------------------------------------------------------------
-- Las dos plantillas iniciales.
--
-- Las claves son las de la base en código (`lib/plantillas`). El nombre visible
-- no repite el del rubro: la galería muestra los dos juntos.
-- ----------------------------------------------------------------------------
insert into public.templates (key, name, sector, description, version, is_active) values
  ('fashion', 'Pasarela', 'moda',
   'Ropa, calzado y carteras. Fotos grandes en retrato, las categorías a la vista y la segunda mano con vitrina propia.',
   1, true),
  ('perfume', 'Esencia', 'belleza',
   'Perfumes, fragancias y cuidado personal. Una vitrina serena, fichas con presencia y asesoría por WhatsApp.',
   1, true)
on conflict (key) do update
  set name = excluded.name,
      sector = excluded.sector,
      description = excluded.description,
      is_active = true;

insert into public.template_pages (template_key, page_key, title, is_home, blocks) values
  ('fashion', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Nueva temporada","subtitle":"Ropa, calzado y carteras elegidos uno por uno. Pide aquí y coordinamos la entrega por WhatsApp.","ctaLabel":"Ver la colección"}},
     {"block_type_key":"categories","props":{"title":"Compra por categoría","limit":6}},
     {"block_type_key":"product_grid","props":{"title":"Lo nuevo","columns":4,"limit":8,"condition":"nuevo"}},
     {"block_type_key":"product_grid","props":{"title":"Los más buscados","columns":4,"limit":4,"condition":"todos","featured":true}},
     {"block_type_key":"product_grid","props":{"title":"Segunda mano","columns":4,"limit":4,"condition":"segunda_mano"}}]'::jsonb),

  ('perfume', 'home', 'Inicio', true,
   '[{"block_type_key":"hero","props":{"title":"Aromas que se quedan contigo","subtitle":"Para regalar o para usar todos los días. Si no sabes cuál elegir, escríbenos y te asesoramos.","ctaLabel":"Descubrir la colección"}},
     {"block_type_key":"product_grid","props":{"title":"Los favoritos de la casa","columns":3,"limit":6,"condition":"todos","featured":true}},
     {"block_type_key":"categories","props":{"title":"Explora la colección","limit":6}},
     {"block_type_key":"product_grid","props":{"title":"Recién llegados","columns":3,"limit":6,"condition":"nuevo"}},
     {"block_type_key":"faq","props":{"title":"Antes de comprar","items":[{"question":"¿Cómo recibo mi pedido?","answer":"Después de confirmar tu pedido, la tienda te escribe por WhatsApp para acordar el lugar y la hora de entrega."},{"question":"¿Me pueden ayudar a elegir?","answer":"Sí. Escríbenos por WhatsApp contándonos qué aromas te gustan y te recomendamos opciones de la colección."}]}}]'::jsonb)
on conflict (template_key, page_key) do update
  set title = excluded.title,
      is_home = excluded.is_home,
      blocks = excluded.blocks;

-- Las anteriores dejan de ofrecerse, pero no se borran: `stores.template_key`
-- las referencia y sus tiendas se siguen dibujando con la base editorial.
update public.templates
   set is_active = false
 where key not in ('fashion', 'perfume');

-- ----------------------------------------------------------------------------
-- Las tiendas que ya existen.
--
-- Primero se publican sus páginas —ver `seed_template_pages`—, después cada
-- una recibe su versión inicial, y recién entonces las de moda y belleza pasan
-- a la plantilla nueva de su rubro. El orden importa: la versión inicial es el
-- respaldo de lo que había antes del cambio.
-- ----------------------------------------------------------------------------
update public.store_pages
   set status = 'publicada',
       published_at = coalesce(published_at, now()),
       updated_at = now()
 where status = 'borrador'
   and deleted_at is null
   and created_at < '2026-09-18';

do $$
declare
  v_tienda record;
begin
  for v_tienda in
    select s.id from public.stores s
     where s.deleted_at is null
       and not exists (
         select 1 from public.store_design_versions v where v.store_id = s.id
       )
  loop
    perform public.capture_design_version(
      v_tienda.id, 'inicial', 'El diseño que tenía la tienda antes de las plantillas nuevas'
    );
  end loop;
end $$;

do $$
declare
  v_tienda  record;
  v_destino text;
begin
  for v_tienda in
    select id, template_key from public.stores
     where deleted_at is null
       and template_key in ('moda', 'moda_calzado', 'belleza')
  loop
    v_destino := case v_tienda.template_key when 'belleza' then 'perfume' else 'fashion' end;

    update public.stores
       set template_key = v_destino,
           theme_overrides = '{}'::jsonb,
           updated_at = now()
     where id = v_tienda.id;

    perform public.seed_template_pages(v_tienda.id, v_destino);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- La consulta de la IA tampoco puede nombrar las tablas nuevas.
--
-- Suma `store_design_versions` y `product_categories`, que faltaba desde que se
-- creó: su política expone las categorías de toda tienda publicada, así que
-- una pregunta sobre "mis categorías" podía mezclar las de otras.
-- ----------------------------------------------------------------------------
create or replace function public.run_insight_sql(p_sql text)
returns table (etiqueta text, valor numeric)
language plpgsql
security invoker
as $$
declare
  v_sql text := btrim(coalesce(p_sql, ''));
begin
  if v_sql = '' then
    raise exception 'La consulta está vacía';
  end if;

  v_sql := btrim(rtrim(v_sql, '; '));
  if position(';' in v_sql) > 0 then
    raise exception 'Solo se permite una consulta';
  end if;

  if lower(left(v_sql, 6)) <> 'select' and lower(left(v_sql, 4)) <> 'with' then
    raise exception 'Solo se permiten consultas SELECT';
  end if;

  if v_sql ~* '\m(insert|update|delete|drop|alter|truncate|grant|revoke|copy|vacuum|analyze|reindex|call|merge|refresh|comment|listen|notify|prepare|execute|lock)\M' then
    raise exception 'La consulta contiene una instrucción no permitida';
  end if;

  if v_sql ~* '\m(auth|storage|vault|pg_catalog|information_schema|pg_temp|extensions)\s*\.' then
    raise exception 'Ese esquema no está disponible';
  end if;

  -- Solo las vistas de mi tienda. Nombrar una tabla base corta la consulta.
  if v_sql ~* '\m(orders|order_items|products|product_categories|commissions|store_sellers|seller_profiles|profiles|stores|subscriptions|store_pages|store_blocks|store_design_versions|store_invites|insights|ai_generations|social_connections|social_posts|templates|template_pages|block_types|plans|sectors|users)\M' then
    raise exception 'Usa las vistas mis_ventas, mis_items, mis_productos, mis_vendedores o mis_comisiones';
  end if;

  if v_sql ~* '\m(pg_sleep|pg_read_file|pg_read_binary_file|lo_import|lo_export|dblink|set_config|current_setting)\M' then
    raise exception 'Esa función no está permitida';
  end if;

  set local transaction read only;
  set local statement_timeout = '8s';

  return query execute 'select q.etiqueta::text, q.valor::numeric from (' || v_sql || ') as q limit 200';
end $$;

revoke all on function public.run_insight_sql(text) from public;
grant execute on function public.run_insight_sql(text) to authenticated;
