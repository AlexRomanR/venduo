-- ============================================================================
-- Combos que se compran.
--
-- Un combo de un catálogo en PDF se pide como combo: una sola línea del pedido
-- con su nombre y su precio, y sus productos aparte. Brief:
-- docs/briefs/2026-11-20-combos-que-se-compran.md. Fijado en
-- supabase/tests/combos.test.sql.
--
-- 1. La función "Combos" (`combos`), activa de fábrica, que /admin apaga.
-- 2. `order_items` sabe de qué combo es una línea: `catalog_id` y `combo_id`.
-- 3. `order_item_components`: los productos de cada línea de combo. La escribe
--    solo `create_order`; la política, en `…_combos_rls.sql`.
-- 4. `create_order` acepta líneas de combo. **La rama de los productos sueltos
--    es la de `20261020090000_variantes.sql`, sin cambios**: el carrito de hoy
--    sigue el mismo camino.
-- 5. `handle_order_status_change` mueve el stock de los productos del combo.
-- 6. `run_insight_sql` no deja nombrar la tabla nueva.
--
-- Aditiva: el código anterior solo manda productos sueltos, y con la tabla
-- vacía el disparador hace lo mismo que antes.
-- ============================================================================

-- 1. La función.
insert into public.feature_states (feature, state) values
  ('combos', 'activa')
on conflict (feature) do nothing;

-- 2. De qué combo es una línea. El nombre y el precio ya van en la línea,
--    copiados: el catálogo puede cambiar o borrarse después.
alter table public.order_items
  add column if not exists catalog_id uuid references public.catalogs(id) on delete set null,
  add column if not exists combo_id text;

do $$ begin
  alter table public.order_items
    add constraint order_items_combo_id_largo check (combo_id is null or length(combo_id) <= 64);
exception when duplicate_object then null; end $$;

comment on column public.order_items.catalog_id is
  'El catálogo del combo, si la línea es un combo. Sus productos están en order_item_components.';
comment on column public.order_items.combo_id is
  'El id del combo dentro de catalogs.config.packs, si la línea es un combo.';

-- 3. Los productos de cada combo. Sin deleted_at, como order_items: un pedido
--    no se borra, se cancela.
create table if not exists public.order_item_components (
  id            uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  order_id      uuid not null references public.orders(id) on delete cascade,
  store_id      uuid not null references public.stores(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  product_name  text not null,
  variant_id    uuid references public.product_variants(id) on delete set null,
  variant_name  text,
  quantity      int not null check (quantity > 0),
  created_at    timestamptz not null default now()
);

comment on table public.order_item_components is
  'Los productos de una línea de combo: cuántos de cada uno por combo, con la talla elegida. Al cobrar, el stock baja cantidad × combos pedidos.';

create index if not exists order_item_components_item_idx on public.order_item_components (order_item_id);
create index if not exists order_item_components_order_idx on public.order_item_components (order_id);
create index if not exists order_item_components_product_idx on public.order_item_components (product_id);

-- 4. El pedido de la tienda, con combos.
create or replace function public.create_order(
  p_store_id  uuid,
  p_items     jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_whatsapp  text;
  v_order_id  uuid;
  v_numero    bigint;
  v_total     int := 0;
  v_item      jsonb;
  v_product   record;
  v_var_id     uuid;
  v_var_nombre text;
  v_var_precio int;
  v_var_stock  int;
  v_qty       int;
  v_precio    int;
  v_stock     int;
  v_lineas    jsonb := '[]'::jsonb;
  -- Los combos.
  v_combo_id  text;
  v_catalogo  record;
  v_pack      jsonb;
  v_productos jsonb;
  v_partes    jsonb;
  v_parte     jsonb;
  v_indice    int;
  v_item_id   uuid;
  v_elegidos  jsonb;
  v_grupo     record;
  v_detalle   jsonb;
begin
  if not public.store_is_live(p_store_id) then
    raise exception 'La tienda no está disponible';
  end if;

  select nullif(btrim(coalesce(whatsapp, '')), '') into v_whatsapp
    from public.stores
   where id = p_store_id;

  if v_whatsapp is null then
    raise exception 'La tienda no tiene WhatsApp';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  if jsonb_array_length(p_items) > 30 then
    raise exception 'Demasiados productos en un solo pedido';
  end if;

  -- El número es el siguiente de esta tienda. El candado es por tienda: dos
  -- tiendas distintas no se esperan entre sí.
  perform pg_advisory_xact_lock(hashtextextended('pedido:' || p_store_id::text, 0));

  select coalesce(max(order_number), 0) + 1 into v_numero
    from public.orders
   where store_id = p_store_id;

  insert into public.orders (store_id, order_number, subtotal_cents, total_cents)
  values (p_store_id, v_numero, 0, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := least(greatest(coalesce((v_item->>'quantity')::int, 1), 1), 99);

    if v_item ? 'combo' then
      -- ------------------------------------------------------------------
      -- Un combo: el precio sale del catálogo guardado, nunca del carrito.
      -- ------------------------------------------------------------------
      v_combo_id := left(coalesce(v_item->'combo'->>'id', ''), 64);

      if public.funcion_de_tienda(p_store_id, 'combos') <> 'activa' then
        raise exception 'Los combos no están disponibles';
      end if;

      select id, config into v_catalogo
        from public.catalogs
       where share_token = v_item->'combo'->>'catalogo'
         and store_id = p_store_id
         and deleted_at is null;

      -- El combo existe y alguna hoja del catálogo lo muestra.
      v_pack := null;
      if v_catalogo.id is not null then
        select pack into v_pack
          from jsonb_array_elements(coalesce(v_catalogo.config->'packs', '[]'::jsonb)) as pack
         where pack->>'id' = v_combo_id
           and exists (
             select 1
               from jsonb_array_elements(coalesce(v_catalogo.config->'bloques', '[]'::jsonb)) as bloque
              where bloque->>'tipo' = 'pack' and bloque->>'pack' = v_combo_id
           )
         limit 1;
      end if;

      if v_pack is null
         or jsonb_typeof(v_pack->'productos') is distinct from 'array'
         or jsonb_typeof(v_pack->'precioCents') is distinct from 'number'
         or (v_pack->>'precioCents')::numeric <= 0
         or (v_pack->>'precioCents')::numeric > 100000000 then
        raise exception 'Combo no disponible: %', v_combo_id;
      end if;

      v_precio := (v_pack->>'precioCents')::int;
      v_productos := v_pack->'productos';
      v_partes := coalesce(v_item->'partes', '[]'::jsonb);

      -- Lo elegido tiene que ser, en orden, los productos del combo.
      if jsonb_typeof(v_partes) is distinct from 'array'
         or jsonb_array_length(v_partes) <> jsonb_array_length(v_productos)
         or jsonb_array_length(v_productos) = 0 then
        raise exception 'Combo no disponible: %', v_combo_id;
      end if;

      v_elegidos := '[]'::jsonb;
      for v_indice in 0 .. jsonb_array_length(v_productos) - 1
      loop
        v_parte := v_partes->v_indice;

        if v_parte->>'product_id' is distinct from v_productos->>v_indice
           or (v_productos->>v_indice) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
          raise exception 'Combo no disponible: %', v_combo_id;
        end if;

        -- Un producto que ya no se vende deja el combo sin poder pedirse.
        v_product := null;
        select id, name, stock
          into v_product
          from public.products
         where id = (v_productos->>v_indice)::uuid
           and store_id = p_store_id
           and is_active
           and moderated_at is null
           and deleted_at is null;

        if v_product.id is null then
          raise exception 'Combo no disponible: %', v_combo_id;
        end if;

        v_var_id := null;
        v_var_nombre := null;
        v_var_stock := null;
        if nullif(v_parte->>'variant_id', '') is not null then
          if (v_parte->>'variant_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
            raise exception 'Opción no disponible de %', v_product.name;
          end if;

          select id, nombre, stock
            into v_var_id, v_var_nombre, v_var_stock
            from public.product_variants
           where id = (v_parte->>'variant_id')::uuid
             and product_id = v_product.id
             and deleted_at is null;

          if v_var_id is null then
            raise exception 'Opción no disponible de %', v_product.name;
          end if;
        elsif exists (
          select 1 from public.product_variants
           where product_id = v_product.id and deleted_at is null
        ) then
          raise exception 'Elige una opción de %', v_product.name;
        end if;

        v_elegidos := v_elegidos || jsonb_build_array(jsonb_build_object(
          'producto', v_product.id,
          'nombre',   v_product.name,
          'variante', v_var_id,
          'opcion',   v_var_nombre,
          'stock',    coalesce(v_var_stock, v_product.stock),
          'orden',    v_indice
        ));
      end loop;

      -- El stock, sumando las veces que el combo lleva cada producto.
      for v_grupo in
        select e->>'nombre' as nombre,
               e->>'opcion' as opcion,
               (e->>'stock')::int as stock,
               count(*)::int as veces
          from jsonb_array_elements(v_elegidos) e
         group by e->>'producto', e->>'variante', e->>'nombre', e->>'opcion', e->>'stock'
         order by min((e->>'orden')::int)
      loop
        if v_grupo.stock < v_grupo.veces * v_qty then
          raise exception 'Stock insuficiente de %: quedan %',
            v_grupo.nombre || coalesce(' · ' || v_grupo.opcion, ''), v_grupo.stock;
        end if;
      end loop;

      insert into public.order_items (
        order_id, store_id, product_id, product_name, quantity, unit_price_cents,
        catalog_id, combo_id
      )
      values (
        v_order_id, p_store_id, null, left(coalesce(v_pack->>'nombre', 'Combo'), 120),
        v_qty, v_precio, v_catalogo.id, v_combo_id
      )
      returning id into v_item_id;

      insert into public.order_item_components (
        order_item_id, order_id, store_id, product_id, product_name,
        variant_id, variant_name, quantity
      )
      select v_item_id, v_order_id, p_store_id,
             (e->>'producto')::uuid, e->>'nombre',
             nullif(e->>'variante', '')::uuid, e->>'opcion',
             count(*)::int
        from jsonb_array_elements(v_elegidos) e
       group by e->>'producto', e->>'variante', e->>'nombre', e->>'opcion'
       order by min((e->>'orden')::int);

      select coalesce(jsonb_agg(jsonb_build_object(
               'nombre',   e->>'nombre',
               'variante', e->>'opcion',
               'cantidad', 1
             ) order by (e->>'orden')::int), '[]'::jsonb)
        into v_detalle
        from jsonb_array_elements(v_elegidos) e;

      v_total := v_total + (v_precio * v_qty);
      v_lineas := v_lineas || jsonb_build_array(jsonb_build_object(
        'nombre',       left(coalesce(v_pack->>'nombre', 'Combo'), 120),
        'variante',     null,
        'cantidad',     v_qty,
        'precio_cents', v_precio,
        'total_cents',  v_precio * v_qty,
        'combo',        true,
        'partes',       v_detalle
      ));
      continue;
    end if;

    -- El precio sale del catálogo, nunca del cliente.
    select id, name, price_cents, stock
      into v_product
      from public.products
     where id = (v_item->>'product_id')::uuid
       and store_id = p_store_id
       and is_active
       and moderated_at is null
       and deleted_at is null;

    if v_product.id is null then
      raise exception 'Producto no disponible: %', v_item->>'product_id';
    end if;

    v_var_id := null;
    v_var_nombre := null;
    v_var_precio := null;
    v_var_stock := null;
    if nullif(v_item->>'variant_id', '') is not null then
      select id, nombre, price_cents, stock
        into v_var_id, v_var_nombre, v_var_precio, v_var_stock
        from public.product_variants
       where id = (v_item->>'variant_id')::uuid
         and product_id = v_product.id
         and deleted_at is null;

      if v_var_id is null then
        raise exception 'Opción no disponible de %', v_product.name;
      end if;
    elsif exists (
      select 1 from public.product_variants
       where product_id = v_product.id and deleted_at is null
    ) then
      raise exception 'Elige una opción de %', v_product.name;
    end if;

    v_precio := coalesce(v_var_precio, v_product.price_cents);
    v_stock := coalesce(v_var_stock, v_product.stock);

    if v_stock < v_qty then
      raise exception 'Stock insuficiente de %: quedan %',
        v_product.name || coalesce(' · ' || v_var_nombre, ''), v_stock;
    end if;

    insert into public.order_items (
      order_id, store_id, product_id, product_name, quantity, unit_price_cents,
      variant_id, variant_name
    )
    values (
      v_order_id, p_store_id, v_product.id, v_product.name, v_qty, v_precio,
      v_var_id, v_var_nombre
    );

    v_total := v_total + (v_precio * v_qty);
    v_lineas := v_lineas || jsonb_build_array(jsonb_build_object(
      'nombre',       v_product.name,
      'variante',     v_var_nombre,
      'cantidad',     v_qty,
      'precio_cents', v_precio,
      'total_cents',  v_precio * v_qty
    ));
  end loop;

  update public.orders
     set subtotal_cents = v_total,
         total_cents = v_total,
         updated_at = now()
   where id = v_order_id;

  return jsonb_build_object(
    'id',          v_order_id,
    'numero',      v_numero,
    'total_cents', v_total,
    'whatsapp',    v_whatsapp,
    'items',       v_lineas
  );
end $$;

revoke all on function public.create_order(uuid, jsonb) from public;
grant execute on function public.create_order(uuid, jsonb) to anon, authenticated;

-- 5. El stock, también de los productos de cada combo. Parte de
--    `20261023120000_devolver_stock_a_la_variante.sql`; lo nuevo son los
--    bloques marcados "Combos".
create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item  record;
  v_stock int;
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'cancelado' then
    raise exception 'Un pedido cancelado no cambia de estado';
  end if;

  if old.status = 'pagado' and new.status = 'pendiente' then
    raise exception 'Un pedido pagado no vuelve a pendiente';
  end if;

  if new.status = 'pagado' then
    perform set_config('venduo.por_venta', '1', true);

    -- Los productos sueltos y, en el mismo recorrido, los de cada combo:
    -- cantidad por combo × combos pedidos. Una línea de combo no tiene
    -- producto propio.
    for v_item in
      select oi.product_id, oi.product_name, oi.quantity, oi.variant_id, oi.variant_name
        from public.order_items oi
       where oi.order_id = new.id
         and oi.product_id is not null
      union all
      -- Combos
      select c.product_id, c.product_name, c.quantity * oi.quantity, c.variant_id, c.variant_name
        from public.order_item_components c
        join public.order_items oi on oi.id = c.order_item_id
       where c.order_id = new.id
         and c.product_id is not null
    loop
      if v_item.variant_id is not null then
        update public.product_variants
           set stock = stock - v_item.quantity,
               updated_at = now()
         where id = v_item.variant_id
           and stock >= v_item.quantity;

        if not found then
          select stock into v_stock
            from public.product_variants
           where id = v_item.variant_id;
          raise exception 'Stock insuficiente de %: quedan %',
            v_item.product_name || ' · ' || coalesce(v_item.variant_name, ''),
            coalesce(v_stock, 0);
        end if;
      else
        update public.products
           set stock = stock - v_item.quantity,
               updated_at = now()
         where id = v_item.product_id
           and stock >= v_item.quantity;

        if not found then
          select stock into v_stock
            from public.products
           where id = v_item.product_id;
          raise exception 'Stock insuficiente de %: quedan %',
            v_item.product_name, coalesce(v_stock, 0);
        end if;
      end if;
    end loop;

    update public.order_items oi
       set unit_cost_cents = pc.cost_cents
      from public.product_costs pc
     where oi.order_id = new.id
       and pc.product_id = oi.product_id
       and oi.unit_cost_cents is null;

    -- Combos: el costo de un combo es la suma del de sus productos, solo si
    -- todos tienen costo. Si falta uno, queda sin costo.
    update public.order_items oi
       set unit_cost_cents = costo.total
      from (
        select c.order_item_id,
               sum(c.quantity * pc.cost_cents)::int as total,
               bool_and(pc.cost_cents is not null) as completo
          from public.order_item_components c
          left join public.product_costs pc on pc.product_id = c.product_id
         where c.order_id = new.id
         group by c.order_item_id
      ) costo
     where oi.id = costo.order_item_id
       and costo.completo
       and oi.unit_cost_cents is null;

    perform set_config('venduo.por_venta', '', true);
    new.paid_at := coalesce(new.paid_at, now());
  end if;

  if new.status = 'cancelado' and old.status = 'pagado' then
    -- Vuelve a la variante viva con la misma combinación: la suya o, si se
    -- borró y se volvió a crear, la nueva. Si ya no hay ninguna, no se suma a
    -- nada: esa opción ya no se vende. Se suma por destino porque un
    -- `update … from` con dos líneas de la misma variante devolvía una sola.
    update public.product_variants v
       set stock = v.stock + devuelto.cantidad,
           updated_at = now()
      from (
        select viva.id, sum(vendido.cantidad) as cantidad
          from (
            select oi.variant_id, oi.quantity as cantidad
              from public.order_items oi
             where oi.order_id = new.id
            union all
            -- Combos
            select c.variant_id, c.quantity * oi.quantity
              from public.order_item_components c
              join public.order_items oi on oi.id = c.order_item_id
             where c.order_id = new.id
          ) vendido
          join public.product_variants original on original.id = vendido.variant_id
          join public.product_variants viva
            on viva.product_id = original.product_id
           and viva.valores = original.valores
           and viva.deleted_at is null
         group by viva.id
      ) devuelto
     where v.id = devuelto.id;

    -- Un producto sin variantes vivas lleva su propio stock: ahí vuelve todo.
    update public.products p
       set stock = p.stock + devuelto.cantidad,
           updated_at = now()
      from (
        select vendido.product_id, sum(vendido.cantidad) as cantidad
          from (
            select oi.product_id, oi.quantity as cantidad
              from public.order_items oi
             where oi.order_id = new.id
               and oi.product_id is not null
            union all
            -- Combos
            select c.product_id, c.quantity * oi.quantity
              from public.order_item_components c
              join public.order_items oi on oi.id = c.order_item_id
             where c.order_id = new.id
               and c.product_id is not null
          ) vendido
         group by vendido.product_id
      ) devuelto
     where p.id = devuelto.product_id
       and not exists (
         select 1 from public.product_variants v
          where v.product_id = p.id and v.deleted_at is null
       );
  end if;

  return new;
end $$;

-- 6. Las preguntas de la IA no nombran la tabla nueva.
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
  if v_sql ~* '\m(orders|order_items|order_item_components|products|product_categories|product_costs|product_variants|profiles|stores|subscriptions|store_pages|store_blocks|store_design_versions|catalogs|insights|ai_generations|social_connections|social_posts|templates|template_pages|block_types|plans|sectors|users|store_visits|store_visits_daily|visit_salts|platform_admins|admin_audit_log|platform_settings|feature_states|store_feature_states|catalog_template_settings|store_notes|invitations|ai_requests)\M' then
    raise exception 'Usa las vistas mis_ventas, mis_items, mis_productos, mis_variantes o mis_visitas';
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
