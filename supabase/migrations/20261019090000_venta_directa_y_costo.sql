-- ============================================================================
-- Venta directa y costo de los productos.
--
-- Una venta directa es la que se cerró fuera de la tienda —en el chat de
-- Instagram o TikTok, en persona— y la tienda registra para que el stock y las
-- estadísticas digan la verdad. Es un pedido más, con `origen = 'directa'`,
-- que nace pagado: el stock lo descuenta el disparador de siempre.
--
-- El costo es lo que el producto le cuesta a la tienda, para mostrar la
-- ganancia y no solo las ventas. Va en su propia tabla, solo del dueño: los
-- productos los lee cualquiera que mire la tienda, y una columna en
-- `products` le mostraría el costo a quien compra.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. De dónde vino cada pedido.
-- ----------------------------------------------------------------------------
alter table public.orders
  add column if not exists origen text not null default 'tienda';

do $$ begin
  alter table public.orders
    add constraint orders_origen_check check (origen in ('tienda', 'directa'));
exception when duplicate_object then null; end $$;

comment on column public.orders.origen is
  'tienda: lo mandó quien compra desde la tienda. directa: la registró la tienda, vendida fuera de ella.';

-- ----------------------------------------------------------------------------
-- 2. El costo de cada producto, solo del dueño.
-- ----------------------------------------------------------------------------
-- Una fila por producto. Sin costo, `cost_cents` queda en null: no se borra la
-- fila, y el producto dado de baja se lleva la suya con su borrado lógico.
create table if not exists public.product_costs (
  product_id  uuid primary key references public.products(id) on delete cascade,
  store_id    uuid not null references public.stores(id) on delete cascade,
  cost_cents  integer check (cost_cents is null or cost_cents between 0 and 100000000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists product_costs_store_idx on public.product_costs (store_id);

alter table public.product_costs enable row level security;

-- La tienda la pone la base, desde el producto: así la política compara una
-- sola columna y nadie puede colgar un costo de un producto ajeno.
create or replace function public.costo_de_producto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select store_id into new.store_id
    from public.products
   where id = new.product_id;

  if new.store_id is null then
    raise exception 'Producto no encontrado';
  end if;

  new.updated_at := now();
  return new;
end $$;

revoke all on function public.costo_de_producto() from public, anon, authenticated;

drop trigger if exists costo_de_producto on public.product_costs;
create trigger costo_de_producto
  before insert or update on public.product_costs
  for each row execute function public.costo_de_producto();

-- ----------------------------------------------------------------------------
-- 3. El costo de cada línea, al cobrarla.
-- ----------------------------------------------------------------------------
-- Se copia al pasar a pagado: si mañana el costo cambia, la ganancia de ayer
-- no. Las líneas solo las lee el dueño.
alter table public.order_items
  add column if not exists unit_cost_cents integer
    check (unit_cost_cents is null or unit_cost_cents >= 0);

comment on column public.order_items.unit_cost_cents is
  'Lo que costaba el producto cuando se cobró el pedido. null: no tenía costo cargado.';

-- El mismo disparador de siempre, con una línea más al pagar: copia el costo.
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
    for v_item in
      select oi.product_id, oi.product_name, oi.quantity
        from public.order_items oi
       where oi.order_id = new.id
         and oi.product_id is not null
    loop
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
    end loop;

    update public.order_items oi
       set unit_cost_cents = pc.cost_cents
      from public.product_costs pc
     where oi.order_id = new.id
       and pc.product_id = oi.product_id
       and oi.unit_cost_cents is null;

    new.paid_at := coalesce(new.paid_at, now());
  end if;

  if new.status = 'cancelado' and old.status = 'pagado' then
    update public.products p
       set stock = p.stock + oi.quantity,
           updated_at = now()
      from public.order_items oi
     where oi.order_id = new.id
       and oi.product_id = p.id;
  end if;

  return new;
end $$;

-- ----------------------------------------------------------------------------
-- 4. Registrar una venta directa.
-- ----------------------------------------------------------------------------
-- La llama el dueño desde el panel o la app. No pide datos de quien compra.
-- Cada línea puede llevar el precio al que se vendió —una rebaja en el chat—;
-- si no, va el del catálogo. Nace pendiente y pasa a pagado en la misma
-- transacción: el disparador descuenta el stock, rechaza la venta entera si
-- no alcanza y copia el costo. Como al confirmarse ya está pagado, no sale el
-- aviso de pedido nuevo: la persona sabe que vendió.
create or replace function public.registrar_venta(p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tienda    uuid := public.my_store_id();
  v_order_id  uuid;
  v_numero    bigint;
  v_total     int := 0;
  v_item      jsonb;
  v_product   record;
  v_qty       int;
  v_precio    int;
begin
  if v_tienda is null then
    raise exception 'No tienes una tienda';
  end if;

  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta no tiene productos';
  end if;

  if jsonb_array_length(p_items) > 50 then
    raise exception 'Demasiados productos en una sola venta';
  end if;

  -- El mismo candado y la misma numeración que los pedidos de la tienda.
  perform pg_advisory_xact_lock(hashtextextended('pedido:' || v_tienda::text, 0));

  select coalesce(max(order_number), 0) + 1 into v_numero
    from public.orders
   where store_id = v_tienda;

  insert into public.orders (store_id, order_number, subtotal_cents, total_cents, origen)
  values (v_tienda, v_numero, 0, 0, 'directa')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'quantity')::int, 1);
    if v_qty < 1 or v_qty > 999 then
      raise exception 'Cantidad no válida';
    end if;

    -- Un producto oculto también se vende en persona; uno que Venduo ocultó, no.
    select id, name, price_cents
      into v_product
      from public.products
     where id = (v_item->>'product_id')::uuid
       and store_id = v_tienda
       and moderated_at is null
       and deleted_at is null;

    if v_product.id is null then
      raise exception 'Producto no disponible: %', v_item->>'product_id';
    end if;

    v_precio := coalesce((v_item->>'precio_cents')::int, v_product.price_cents);
    if v_precio < 0 or v_precio > 100000000 then
      raise exception 'Precio no válido';
    end if;

    insert into public.order_items (
      order_id, store_id, product_id, product_name, quantity, unit_price_cents
    )
    values (
      v_order_id, v_tienda, v_product.id, v_product.name, v_qty, v_precio
    );

    v_total := v_total + (v_precio * v_qty);
  end loop;

  update public.orders
     set subtotal_cents = v_total,
         total_cents = v_total,
         updated_at = now()
   where id = v_order_id;

  update public.orders
     set status = 'pagado'
   where id = v_order_id;

  return jsonb_build_object(
    'id',          v_order_id,
    'numero',      v_numero,
    'total_cents', v_total
  );
end $$;

revoke all on function public.registrar_venta(jsonb) from public, anon;
grant execute on function public.registrar_venta(jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Las vistas de la IA, con el origen y el costo.
-- ----------------------------------------------------------------------------
-- Las columnas nuevas van al final: `create or replace view` no deja moverlas.
create or replace view public.mis_ventas as
select o.id,
       o.order_number as numero,
       o.created_at,
       o.status,
       o.total_cents,
       o.origen
  from public.orders o
 where o.store_id = public.my_store_id();

comment on view public.mis_ventas is
  'Pedidos de mi tienda. status: pendiente, pagado, cancelado. origen: tienda (llegó por la tienda) o directa (vendida en el chat o en persona). Montos en centavos.';

create or replace view public.mis_items as
select oi.id,
       oi.order_id,
       oi.product_name,
       oi.quantity,
       oi.unit_price_cents,
       (oi.quantity * oi.unit_price_cents) as total_cents,
       o.created_at,
       o.status,
       oi.unit_cost_cents,
       case
         when oi.unit_cost_cents is null then null
         else oi.quantity * (oi.unit_price_cents - oi.unit_cost_cents)
       end as ganancia_cents,
       o.origen
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
 where oi.store_id = public.my_store_id();

comment on view public.mis_items is
  'Líneas de pedido de mi tienda: qué producto se vendió, cuántas unidades, a qué precio, a qué costo y cuánto se ganó. ganancia_cents es null si el producto no tenía costo.';

create or replace view public.mis_productos as
select p.id,
       p.name,
       p.category,
       p.price_cents,
       p.compare_at_price_cents,
       p.stock,
       p.is_active,
       p.created_at,
       p.low_stock_threshold,
       p.sku,
       p.is_featured,
       pc.cost_cents
  from public.products p
  left join public.product_costs pc on pc.product_id = p.id
 where p.store_id = public.my_store_id()
   and p.deleted_at is null;

comment on view public.mis_productos is
  'Catálogo de mi tienda. cost_cents: lo que le cuesta a la tienda, null si no lo cargó.';

grant select on public.mis_ventas, public.mis_items, public.mis_productos
   to authenticated;

-- La IA no puede nombrar la tabla de costos: lee el costo por las vistas.
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
  if v_sql ~* '\m(orders|order_items|products|product_categories|product_costs|profiles|stores|subscriptions|store_pages|store_blocks|store_design_versions|catalogs|insights|ai_generations|social_connections|social_posts|templates|template_pages|block_types|plans|sectors|users|store_visits|store_visits_daily|visit_salts|platform_admins|admin_audit_log|platform_settings|feature_states|store_feature_states|catalog_template_settings|store_notes|invitations|ai_requests)\M' then
    raise exception 'Usa las vistas mis_ventas, mis_items, mis_productos o mis_visitas';
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
