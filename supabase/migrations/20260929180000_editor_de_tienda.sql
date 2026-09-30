-- ============================================================================
-- Venduo — el editor de la tienda: publicar, restaurar e imágenes propias
--
-- El editor trabaja sobre un borrador que vive en el navegador. Nada llega al
-- comprador hasta que el dueño publica, y publicar es una sola función: guarda
-- una versión de cómo estaba la tienda y escribe apariencia, logo y secciones
-- en la misma transacción. Si algo no valida, no se escribe nada.
--
-- Restaurar es la vuelta: cualquier versión del historial vuelve a ser la
-- tienda, y antes se guarda la que había. Deshacer una restauración es
-- restaurar la versión que ella misma guardó.
--
-- La validación fina —cada propiedad de cada sección, cada color— la hace zod
-- en el servidor antes de llamar. Estas funciones imponen lo que Postgres puede
-- imponer: de quién es la tienda, qué tipos de sección existen, cuántas veces
-- puede ir cada uno y de dónde puede venir el logo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Por qué se guardó cada versión.
--
-- Una versión es siempre el estado **anterior** a un cambio, como las que ya
-- existen: `antes_de_cambiar_plantilla`. Los valores nuevos solo se usan dentro
-- de funciones plpgsql, que no se validan al crearse: por eso pueden ir en la
-- misma migración que los agrega.
-- ----------------------------------------------------------------------------
alter type public.design_origin add value if not exists 'antes_de_publicar';
alter type public.design_origin add value if not exists 'antes_de_restaurar';

-- ----------------------------------------------------------------------------
-- La versión también guarda el logo.
--
-- Nulo en las versiones anteriores a esta migración, y es exacto: hasta acá
-- ninguna tienda tenía logo.
-- ----------------------------------------------------------------------------
alter table public.store_design_versions
  add column if not exists logo_url text;

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
  select template_key, theme_overrides, logo_url
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
    theme_overrides, logo_url, pages, created_by
  )
  values (
    p_store_id,
    v_numero,
    p_origin,
    p_note,
    v_tienda.template_key,
    (select version from public.templates where key = v_tienda.template_key),
    coalesce(v_tienda.theme_overrides, '{}'::jsonb),
    v_tienda.logo_url,
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

-- `create or replace` conserva los permisos, pero se repiten para que este
-- archivo se lea solo: esta función no comprueba dueño y no se expone.
revoke all on function public.capture_design_version(uuid, public.design_origin, text)
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Lo que propuso la IA también puede tocar la apariencia, no solo secciones.
-- `snapshot_before` sigue guardando las secciones; esto guarda la apariencia
-- que había, para poder decir qué cambió.
-- ----------------------------------------------------------------------------
alter table public.block_edit_proposals
  add column if not exists theme_before jsonb;

-- ----------------------------------------------------------------------------
-- La portada de una tienda. La siembra la plantilla; si no existe, se crea.
-- ----------------------------------------------------------------------------
create or replace function public.portada_de_tienda(p_store_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pagina uuid;
begin
  select id into v_pagina
    from public.store_pages
   where store_id = p_store_id and is_home and deleted_at is null;

  if v_pagina is null then
    insert into public.store_pages (store_id, key, title, status, is_home, published_at)
    values (p_store_id, 'home', 'Inicio', 'publicada', true, now())
    returning id into v_pagina;
  end if;

  return v_pagina;
end $$;

revoke all on function public.portada_de_tienda(uuid)
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Publicar lo que se armó en el editor.
--
-- `p_bloques` es la portada entera, en orden: `[{ id, tipo, visible, props }]`.
-- Una sección que ya existía se actualiza por su `id` y conserva su identidad;
-- una nueva se inserta; la que ya no está se da de baja, no se borra.
--
-- Devuelve la versión que guardó el estado anterior.
-- ----------------------------------------------------------------------------
create or replace function public.publicar_diseno(
  p_theme_overrides jsonb,
  p_logo_url        text,
  p_bloques         jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tienda   uuid := public.my_store_id();
  v_pagina   uuid;
  v_version  uuid;
  v_bloque   jsonb;
  v_id       uuid;
  v_vivos    uuid[] := '{}';
  v_posicion int := 0;
begin
  if v_tienda is null then
    raise exception 'No tienes una tienda';
  end if;

  if jsonb_typeof(coalesce(p_theme_overrides, '{}'::jsonb)) <> 'object' then
    raise exception 'La apariencia no es válida';
  end if;

  if jsonb_typeof(coalesce(p_bloques, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_bloques, '[]'::jsonb)) > 30 then
    raise exception 'Las secciones no son válidas';
  end if;

  -- El logo solo puede venir de la carpeta de esta tienda en su bucket. El
  -- servidor ya lo comprobó contra la URL exacta; esto cierra la puerta a quien
  -- llame a la función directo.
  if p_logo_url is not null and p_logo_url !~ (
    '^https://[a-z0-9.-]+(:[0-9]+)?/storage/v1/object/public/store-assets/'
    || v_tienda::text || '/[^?#]+$'
  ) then
    raise exception 'El logo no es válido';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(coalesce(p_bloques, '[]'::jsonb)) b
     where jsonb_typeof(b) <> 'object'
        or jsonb_typeof(b->'props') is distinct from 'object'
        or not exists (
          select 1 from public.block_types t
           where t.key = b->>'tipo' and t.is_active
        )
  ) then
    raise exception 'Hay una sección que no es válida';
  end if;

  if exists (
    select 1
      from (
        select b->>'tipo' as tipo, count(*) as veces
          from jsonb_array_elements(coalesce(p_bloques, '[]'::jsonb)) b
         group by 1
      ) x
      join public.block_types t on t.key = x.tipo
     where t.max_per_page is not null and x.veces > t.max_per_page
  ) then
    raise exception 'Hay una sección repetida que solo puede ir una vez';
  end if;

  v_pagina := public.portada_de_tienda(v_tienda);
  v_version := public.capture_design_version(v_tienda, 'antes_de_publicar', null);

  for v_bloque in select * from jsonb_array_elements(coalesce(p_bloques, '[]'::jsonb))
  loop
    v_id := null;

    -- Un `id` que no es de esta portada no se respeta: se inserta como nueva.
    if (v_bloque->>'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      update public.store_blocks
         set block_type_key = v_bloque->>'tipo',
             position = v_posicion,
             props = v_bloque->'props',
             is_visible = coalesce((v_bloque->>'visible')::boolean, true),
             updated_at = now()
       where id = (v_bloque->>'id')::uuid
         and page_id = v_pagina
         and store_id = v_tienda
         and deleted_at is null
      returning id into v_id;
    end if;

    if v_id is null then
      insert into public.store_blocks (
        store_id, page_id, block_type_key, position, props, is_visible
      )
      values (
        v_tienda,
        v_pagina,
        v_bloque->>'tipo',
        v_posicion,
        v_bloque->'props',
        coalesce((v_bloque->>'visible')::boolean, true)
      )
      returning id into v_id;
    end if;

    v_vivos := v_vivos || v_id;
    v_posicion := v_posicion + 1;
  end loop;

  update public.store_blocks
     set deleted_at = now(), updated_at = now()
   where page_id = v_pagina
     and deleted_at is null
     and not (id = any (v_vivos));

  update public.stores
     set theme_overrides = coalesce(p_theme_overrides, '{}'::jsonb),
         logo_url = p_logo_url,
         updated_at = now()
   where id = v_tienda;

  return v_version;
end $$;

revoke all on function public.publicar_diseno(jsonb, text, jsonb) from public, anon;
grant execute on function public.publicar_diseno(jsonb, text, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- Volver a una versión del historial.
--
-- Vuelve todo lo que la versión guardó: la plantilla, la apariencia, el logo y
-- las secciones de cada página. Las secciones se reemplazan —las de ahora se
-- dan de baja y se insertan las de la versión—, porque una versión es una foto
-- y no una lista de cambios.
--
-- Devuelve la versión que guardó cómo estaba la tienda antes de restaurar.
-- ----------------------------------------------------------------------------
create or replace function public.restaurar_version(p_version_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tienda  uuid := public.my_store_id();
  v_origen  record;
  v_version uuid;
  v_pagina  jsonb;
  v_id      uuid;
  v_bloque  jsonb;
begin
  if v_tienda is null then
    raise exception 'No tienes una tienda';
  end if;

  select number, template_key, theme_overrides, logo_url, pages
    into v_origen
    from public.store_design_versions
   where id = p_version_id
     and store_id = v_tienda
     and deleted_at is null;

  if not found then
    raise exception 'Esa versión no existe';
  end if;

  v_version := public.capture_design_version(
    v_tienda,
    'antes_de_restaurar',
    'Antes de volver a la versión ' || v_origen.number
  );

  update public.stores
     set template_key = coalesce(v_origen.template_key, template_key),
         theme_overrides = coalesce(v_origen.theme_overrides, '{}'::jsonb),
         logo_url = v_origen.logo_url,
         updated_at = now()
   where id = v_tienda;

  for v_pagina in select * from jsonb_array_elements(coalesce(v_origen.pages, '[]'::jsonb))
  loop
    if coalesce((v_pagina->>'is_home')::boolean, false) then
      v_id := public.portada_de_tienda(v_tienda);
    else
      select id into v_id
        from public.store_pages
       where store_id = v_tienda
         and key = v_pagina->>'key'
         and deleted_at is null;

      if v_id is null then
        insert into public.store_pages (store_id, key, title, status, is_home, published_at)
        values (
          v_tienda,
          v_pagina->>'key',
          coalesce(v_pagina->>'title', v_pagina->>'key'),
          'publicada',
          false,
          now()
        )
        returning id into v_id;
      end if;
    end if;

    update public.store_blocks
       set deleted_at = now(), updated_at = now()
     where page_id = v_id and deleted_at is null;

    for v_bloque in select * from jsonb_array_elements(coalesce(v_pagina->'blocks', '[]'::jsonb))
    loop
      insert into public.store_blocks (
        store_id, page_id, block_type_key, position, props, is_visible
      )
      values (
        v_tienda,
        v_id,
        v_bloque->>'block_type_key',
        coalesce((v_bloque->>'position')::int, 0),
        coalesce(v_bloque->'props', '{}'::jsonb),
        coalesce((v_bloque->>'is_visible')::boolean, true)
      );
    end loop;
  end loop;

  return v_version;
end $$;

revoke all on function public.restaurar_version(uuid) from public, anon;
grant execute on function public.restaurar_version(uuid) to authenticated;
