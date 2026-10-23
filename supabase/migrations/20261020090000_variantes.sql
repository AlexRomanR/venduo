-- ============================================================================
-- Variantes: talla, color, número.
--
-- Un producto puede tener hasta dos opciones —Talla: S, M, L; Color: Negro,
-- Blanco— y una variante por cada combinación, con su stock, su precio si es
-- distinto y su foto si la tiene. Es opcional: un producto sin opciones se
-- comporta exactamente como antes.
--
-- El stock del producto pasa a ser la suma de sus variantes, y lo mantiene la
-- base: así todo lo que ya lee `products.stock` —"Agotado", "Se está
-- acabando", los catálogos, la IA, la captura de la tienda— sigue igual.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Las opciones del producto.
-- ----------------------------------------------------------------------------
-- [{"nombre": "Talla", "valores": ["S", "M", "L"]}, {"nombre": "Color", ...}]
-- La validación fina la hace `guardar_variantes`; acá, solo la forma.
alter table public.products
  add column if not exists opciones jsonb not null default '[]'::jsonb;

do $$ begin
  alter table public.products
    add constraint products_opciones_check
    check (jsonb_typeof(opciones) = 'array' and jsonb_array_length(opciones) <= 2);
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Las variantes.
-- ----------------------------------------------------------------------------
create table if not exists public.product_variants (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products(id) on delete cascade,
  store_id     uuid not null references public.stores(id) on delete cascade,
  -- {"Talla": "M", "Color": "Negro"}: un valor por cada opción del producto.
  valores      jsonb not null,
  -- "M · Negro", en el orden de las opciones. Lo arma `guardar_variantes`.
  nombre       text not null check (char_length(nombre) between 1 and 80),
  -- null: cuesta lo mismo que el producto.
  price_cents  integer check (price_cents is null or price_cents between 0 and 100000000),
  stock        integer not null default 0 check (stock between 0 and 999999),
  sku          text check (sku is null or char_length(sku) <= 40),
  -- La foto de esta combinación, una de las del producto: la ficha la muestra
  -- al elegir su color.
  image_url    text,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index if not exists product_variants_product_idx
  on public.product_variants (product_id) where deleted_at is null;
create index if not exists product_variants_store_idx
  on public.product_variants (store_id);
create unique index if not exists product_variants_combinacion_idx
  on public.product_variants (product_id, valores) where deleted_at is null;

alter table public.product_variants enable row level security;

-- La tienda de cada variante la pone la base, desde el producto: la política
-- compara una sola columna y nadie cuelga una variante de un producto ajeno.
create or replace function public.variante_de_producto()
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

revoke all on function public.variante_de_producto() from public, anon, authenticated;

drop trigger if exists variante_de_producto on public.product_variants;
create trigger variante_de_producto
  before insert or update on public.product_variants
  for each row execute function public.variante_de_producto();

-- ----------------------------------------------------------------------------
-- 3. El stock del producto es la suma de sus variantes.
-- ----------------------------------------------------------------------------
create or replace function public.sumar_stock_de_variantes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto uuid := coalesce(new.product_id, old.product_id);
begin
  -- La marca deja pasar este cambio por `stock_de_producto`, que rechaza el
  -- que llega a mano.
  perform set_config('venduo.stock_de_variantes', '1', true);

  update public.products p
     set stock = coalesce((
           select sum(v.stock)
             from public.product_variants v
            where v.product_id = v_producto
              and v.deleted_at is null
         ), 0),
         updated_at = now()
   where p.id = v_producto
     and exists (
       select 1 from public.product_variants v
        where v.product_id = v_producto and v.deleted_at is null
     );

  perform set_config('venduo.stock_de_variantes', '', true);
  return null;
end $$;

revoke all on function public.sumar_stock_de_variantes() from public, anon, authenticated;

drop trigger if exists sumar_stock_de_variantes on public.product_variants;
create trigger sumar_stock_de_variantes
  after insert or update or delete on public.product_variants
  for each row execute function public.sumar_stock_de_variantes();

-- El stock de un producto con variantes no se cambia a mano: se cambia en cada
-- variante. Sin esto, el más y menos de una lista inventaría unidades que
-- ninguna talla tiene.
create or replace function public.stock_de_producto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.stock is distinct from old.stock
     and coalesce(current_setting('venduo.stock_de_variantes', true), '') <> '1'
     and exists (
       select 1 from public.product_variants v
        where v.product_id = new.id and v.deleted_at is null
     ) then
    raise exception 'El stock de % se cambia en cada variante', new.name;
  end if;
  return new;
end $$;

revoke all on function public.stock_de_producto() from public, anon, authenticated;

drop trigger if exists stock_de_producto on public.products;
create trigger stock_de_producto
  before update of stock on public.products
  for each row execute function public.stock_de_producto();

-- ----------------------------------------------------------------------------
-- 4. Guardar las variantes de un producto, todas a la vez.
-- ----------------------------------------------------------------------------
-- p_opciones:  [{"nombre": "Talla", "valores": ["S", "M"]}]
-- p_variantes: [{"valores": {"Talla": "S"}, "stock": 3, "price_cents": null,
--                "sku": null, "image_url": null}]
--
-- Una combinación que ya existía se actualiza y conserva su id —los pedidos la
-- nombran—; una nueva se crea; una que ya no está se da de baja. Sin
-- opciones, se dan de baja todas y el producto vuelve a tener su stock propio,
-- el que sumaban.
create or replace function public.guardar_variantes(
  p_producto  uuid,
  p_opciones  jsonb,
  p_variantes jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tienda    uuid := public.my_store_id();
  v_opcion    jsonb;
  v_valor     jsonb;
  v_nombres   text[] := '{}';
  v_variante  jsonb;
  v_valores   jsonb;
  v_nombre    text;
  v_vistas    jsonb := '[]'::jsonb;
  v_posicion  int := 0;
  v_imagen    text;
  v_imagenes  text[];
begin
  if v_tienda is null then
    raise exception 'No tienes una tienda';
  end if;

  select images into v_imagenes
    from public.products
   where id = p_producto
     and store_id = v_tienda
     and deleted_at is null;

  if not found then
    raise exception 'Producto no encontrado';
  end if;

  if jsonb_typeof(p_opciones) is distinct from 'array'
     or jsonb_array_length(p_opciones) > 2 then
    raise exception 'Un producto lleva hasta dos opciones';
  end if;

  -- Las opciones: un nombre y sus valores, sin repetir.
  for v_opcion in select * from jsonb_array_elements(p_opciones)
  loop
    if jsonb_typeof(v_opcion->'valores') is distinct from 'array'
       or char_length(btrim(coalesce(v_opcion->>'nombre', ''))) not between 1 and 30
       or jsonb_array_length(v_opcion->'valores') not between 1 and 20 then
      raise exception 'Opción no válida';
    end if;
    if btrim(v_opcion->>'nombre') = any(v_nombres) then
      raise exception 'Dos opciones con el mismo nombre';
    end if;
    v_nombres := v_nombres || btrim(v_opcion->>'nombre');

    if (select count(distinct lower(btrim(x))) from jsonb_array_elements_text(v_opcion->'valores') x)
       <> jsonb_array_length(v_opcion->'valores') then
      raise exception 'Valores repetidos en %', v_opcion->>'nombre';
    end if;
    for v_valor in select * from jsonb_array_elements(v_opcion->'valores')
    loop
      if jsonb_typeof(v_valor) <> 'string'
         or char_length(btrim(v_valor #>> '{}')) not between 1 and 30 then
        raise exception 'Valor no válido en %', v_opcion->>'nombre';
      end if;
    end loop;
  end loop;

  if jsonb_typeof(p_variantes) is distinct from 'array'
     or jsonb_array_length(p_variantes) > 60 then
    raise exception 'Demasiadas variantes';
  end if;

  if jsonb_array_length(p_opciones) = 0 and jsonb_array_length(p_variantes) > 0 then
    raise exception 'Variantes sin opciones';
  end if;

  if jsonb_array_length(p_opciones) > 0 and jsonb_array_length(p_variantes) = 0 then
    raise exception 'Faltan las variantes';
  end if;

  for v_variante in select * from jsonb_array_elements(p_variantes)
  loop
    v_valores := v_variante->'valores';

    -- Un valor por opción, de los que la opción tiene, y nada más.
    if jsonb_typeof(v_valores) is distinct from 'object'
       or (select count(*) from jsonb_object_keys(v_valores)) <> jsonb_array_length(p_opciones) then
      raise exception 'Combinación no válida';
    end if;
    v_nombre := '';
    for v_opcion in select * from jsonb_array_elements(p_opciones)
    loop
      if not (v_opcion->'valores') ? (v_valores->>(btrim(v_opcion->>'nombre'))) then
        raise exception 'Combinación no válida';
      end if;
      v_nombre := v_nombre
        || case when v_nombre = '' then '' else ' · ' end
        || btrim(v_valores->>(btrim(v_opcion->>'nombre')));
    end loop;

    if v_vistas @> jsonb_build_array(v_valores) then
      raise exception 'Combinación repetida: %', v_nombre;
    end if;
    v_vistas := v_vistas || jsonb_build_array(v_valores);

    -- La foto, una de las del producto: nada que venga de afuera.
    v_imagen := nullif(btrim(coalesce(v_variante->>'image_url', '')), '');
    if v_imagen is not null and not (v_imagen = any(coalesce(v_imagenes, '{}'))) then
      v_imagen := null;
    end if;

    update public.product_variants
       set nombre = v_nombre,
           stock = greatest(coalesce((v_variante->>'stock')::int, 0), 0),
           price_cents = (v_variante->>'price_cents')::int,
           sku = nullif(btrim(coalesce(v_variante->>'sku', '')), ''),
           image_url = v_imagen,
           position = v_posicion
     where product_id = p_producto
       and valores = v_valores
       and deleted_at is null;

    if not found then
      insert into public.product_variants (
        product_id, store_id, valores, nombre, stock, price_cents, sku, image_url, position
      )
      values (
        p_producto, v_tienda, v_valores, v_nombre,
        greatest(coalesce((v_variante->>'stock')::int, 0), 0),
        (v_variante->>'price_cents')::int,
        nullif(btrim(coalesce(v_variante->>'sku', '')), ''),
        v_imagen,
        v_posicion
      );
    end if;

    v_posicion := v_posicion + 1;
  end loop;

  -- Las que ya no están se dan de baja. Si eran todas, el producto vuelve a
  -- llevar su propio stock: el que sumaban, que queda como estaba.
  update public.product_variants
     set deleted_at = now()
   where product_id = p_producto
     and deleted_at is null
     and not (v_vistas @> jsonb_build_array(valores));

  update public.products
     set opciones = (
           select coalesce(jsonb_agg(jsonb_build_object(
             'nombre', btrim(o->>'nombre'),
             'valores', (select jsonb_agg(btrim(x)) from jsonb_array_elements_text(o->'valores') x)
           )), '[]'::jsonb)
             from jsonb_array_elements(p_opciones) o
         ),
         updated_at = now()
   where id = p_producto;
end $$;

revoke all on function public.guardar_variantes(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.guardar_variantes(uuid, jsonb, jsonb) to authenticated;

-- El stock de una sola variante, como el más y menos de las listas: se manda
-- el número que quedó, no cuánto se sumó, que es lo que la persona contó.
create or replace function public.ajustar_stock_de_variante(p_variante uuid, p_stock int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock int;
begin
  if p_stock is null or p_stock < 0 or p_stock > 999999 then
    raise exception 'Stock no válido';
  end if;

  update public.product_variants
     set stock = p_stock
   where id = p_variante
     and store_id = public.my_store_id()
     and deleted_at is null
  returning stock into v_stock;

  if v_stock is null then
    raise exception 'Variante no encontrada';
  end if;
  return v_stock;
end $$;

revoke all on function public.ajustar_stock_de_variante(uuid, int) from public, anon;
grant execute on function public.ajustar_stock_de_variante(uuid, int) to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Qué variante se pidió.
-- ----------------------------------------------------------------------------
-- El nombre se copia, como el del producto: si mañana la talla se renombra,
-- el pedido de ayer no cambia.
alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null,
  add column if not exists variant_name text;

-- ----------------------------------------------------------------------------
-- 6. El pedido de la tienda, con variantes.
-- ----------------------------------------------------------------------------
-- Igual que antes, con una regla más: un producto con variantes se pide con
-- la variante, que pone su precio —si tiene uno propio— y su stock.
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

-- ----------------------------------------------------------------------------
-- 7. La venta directa, con variantes.
-- ----------------------------------------------------------------------------
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
  v_var_id     uuid;
  v_var_nombre text;
  v_var_precio int;
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

    v_var_id := null;
    v_var_nombre := null;
    v_var_precio := null;
    if nullif(v_item->>'variant_id', '') is not null then
      select id, nombre, price_cents
        into v_var_id, v_var_nombre, v_var_precio
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

    v_precio := coalesce(
      (v_item->>'precio_cents')::int,
      v_var_precio,
      v_product.price_cents
    );
    if v_precio < 0 or v_precio > 100000000 then
      raise exception 'Precio no válido';
    end if;

    insert into public.order_items (
      order_id, store_id, product_id, product_name, quantity, unit_price_cents,
      variant_id, variant_name
    )
    values (
      v_order_id, v_tienda, v_product.id, v_product.name, v_qty, v_precio,
      v_var_id, v_var_nombre
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
-- 8. El disparador del pedido: descuenta de la variante si la hay.
-- ----------------------------------------------------------------------------
-- La marca `venduo.por_venta` les dice a los avisos de stock que lo movió una
-- venta: antes lo deducían de la profundidad de disparadores, que con las
-- variantes ya no distingue una venta de una corrección a mano.
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

    for v_item in
      select oi.product_id, oi.product_name, oi.quantity, oi.variant_id, oi.variant_name
        from public.order_items oi
       where oi.order_id = new.id
         and oi.product_id is not null
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

    perform set_config('venduo.por_venta', '', true);
    new.paid_at := coalesce(new.paid_at, now());
  end if;

  if new.status = 'cancelado' and old.status = 'pagado' then
    -- Vuelve a la variante si la tenía y sigue viva; si no, al producto.
    update public.product_variants v
       set stock = v.stock + oi.quantity,
           updated_at = now()
      from public.order_items oi
     where oi.order_id = new.id
       and oi.variant_id = v.id
       and v.deleted_at is null;

    update public.products p
       set stock = p.stock + oi.quantity,
           updated_at = now()
      from public.order_items oi
     where oi.order_id = new.id
       and oi.product_id = p.id
       and (
         oi.variant_id is null
         or not exists (
           select 1 from public.product_variants v
            where v.id = oi.variant_id and v.deleted_at is null
         )
       )
       and not exists (
         select 1 from public.product_variants v
          where v.product_id = p.id and v.deleted_at is null
       );
  end if;

  return new;
end $$;

-- ----------------------------------------------------------------------------
-- 9. Los avisos de stock: por venta, y por variante.
-- ----------------------------------------------------------------------------
create or replace function public.avisar_stock_bajo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dueno uuid;
  v_con_variantes boolean;
begin
  if coalesce(current_setting('venduo.por_venta', true), '') <> '1' then
    return null;
  end if;

  if new.deleted_at is not null or not new.is_active then
    return null;
  end if;

  select owner_id into v_dueno
    from public.stores
   where id = new.store_id
     and deleted_at is null;

  if v_dueno is null then
    return null;
  end if;

  -- Con variantes, "se agotó" lo dice cada variante: el producto avisa solo
  -- cuando el total cruza su umbral.
  v_con_variantes := exists (
    select 1 from public.product_variants v
     where v.product_id = new.id and v.deleted_at is null
  );

  if new.stock = 0 and old.stock > 0 and not v_con_variantes then
    perform public.enviar_aviso(
      v_dueno,
      'low_stock',
      'Se agotó ' || new.name,
      'Nadie puede comprarlo hasta que lo repongas.',
      '/productos/' || new.id,
      'stock'
    );
  elsif new.stock > 0
    and new.stock <= new.low_stock_threshold
    and old.stock > new.low_stock_threshold then
    perform public.enviar_aviso(
      v_dueno,
      'low_stock',
      'Queda poco de ' || new.name,
      case when new.stock = 1 then 'Queda 1 unidad.' else 'Quedan ' || new.stock || ' unidades.' end
        || ' Repón antes de que te lo pidan.',
      '/productos/' || new.id,
      'stock'
    );
  end if;

  return null;
exception when others then
  raise warning 'avisar_stock_bajo: %', sqlerrm;
  return null;
end $$;

create or replace function public.avisar_variante_agotada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dueno    uuid;
  v_producto record;
begin
  if coalesce(current_setting('venduo.por_venta', true), '') <> '1' then
    return null;
  end if;

  if new.deleted_at is not null or new.stock > 0 or old.stock = 0 then
    return null;
  end if;

  select p.id, p.name, p.is_active, p.deleted_at, s.owner_id
    into v_producto
    from public.products p
    join public.stores s on s.id = p.store_id and s.deleted_at is null
   where p.id = new.product_id;

  if v_producto.id is null or not v_producto.is_active or v_producto.deleted_at is not null then
    return null;
  end if;

  perform public.enviar_aviso(
    v_producto.owner_id,
    'low_stock',
    'Se agotó ' || v_producto.name || ' · ' || new.nombre,
    'Nadie puede comprar esa opción hasta que la repongas.',
    '/productos/' || v_producto.id,
    'stock'
  );

  return null;
exception when others then
  raise warning 'avisar_variante_agotada: %', sqlerrm;
  return null;
end $$;

revoke all on function public.avisar_variante_agotada() from public, anon, authenticated;

drop trigger if exists on_variant_stock_out_notify on public.product_variants;
create trigger on_variant_stock_out_notify
  after update of stock on public.product_variants
  for each row
  when (new.stock < old.stock)
  execute function public.avisar_variante_agotada();

-- ----------------------------------------------------------------------------
-- 10. Las vistas de la IA.
-- ----------------------------------------------------------------------------
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
       o.origen,
       oi.variant_name as variante
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
 where oi.store_id = public.my_store_id();

comment on view public.mis_items is
  'Líneas de pedido de mi tienda: qué producto y qué variante se vendió, cuántas unidades, a qué precio, a qué costo y cuánto se ganó.';

create or replace view public.mis_variantes as
select v.id,
       p.name as producto,
       v.nombre as variante,
       v.valores,
       coalesce(v.price_cents, p.price_cents) as price_cents,
       v.stock,
       p.category,
       p.is_active
  from public.product_variants v
  join public.products p on p.id = v.product_id and p.deleted_at is null
 where v.store_id = public.my_store_id()
   and v.deleted_at is null;

comment on view public.mis_variantes is
  'Variantes de mis productos (talla, color...): su stock y su precio. valores es un objeto: {"Talla": "M", "Color": "Negro"}.';

grant select on public.mis_items, public.mis_variantes to authenticated;

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
  if v_sql ~* '\m(orders|order_items|products|product_categories|product_costs|product_variants|profiles|stores|subscriptions|store_pages|store_blocks|store_design_versions|catalogs|insights|ai_generations|social_connections|social_posts|templates|template_pages|block_types|plans|sectors|users|store_visits|store_visits_daily|visit_salts|platform_admins|admin_audit_log|platform_settings|feature_states|store_feature_states|catalog_template_settings|store_notes|invitations|ai_requests)\M' then
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
