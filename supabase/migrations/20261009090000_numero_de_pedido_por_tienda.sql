-- ============================================================================
-- El número de pedido es de cada tienda.
--
-- Salía de una secuencia global: el primer pedido de una tienda recién creada
-- llegaba al WhatsApp como "#261", y quien compra leía que la tienda tenía
-- doscientos pedidos que no eran suyos. Ahora cada tienda cuenta los suyos:
-- el siguiente es el último de esa tienda más uno.
--
-- Los números que ya existen no se tocan: están escritos en chats de WhatsApp
-- y en el panel. Una tienda sigue desde su último número.
--
-- Dos compras al mismo tiempo en la misma tienda no pueden sacar el mismo
-- número: el cálculo va bajo un candado por tienda que dura la transacción, y
-- el índice único lo impone la base por si algún día alguien inserta por fuera
-- de `create_order`.
-- ============================================================================

create unique index if not exists orders_store_numero_key
  on public.orders (store_id, order_number);

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
  v_qty       int;
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
       and deleted_at is null;

    if v_product.id is null then
      raise exception 'Producto no disponible: %', v_item->>'product_id';
    end if;

    if v_product.stock < v_qty then
      raise exception 'Stock insuficiente de %: quedan %', v_product.name, v_product.stock;
    end if;

    insert into public.order_items (
      order_id, store_id, product_id, product_name, quantity, unit_price_cents
    )
    values (
      v_order_id, p_store_id, v_product.id, v_product.name, v_qty, v_product.price_cents
    );

    v_total := v_total + (v_product.price_cents * v_qty);
    v_lineas := v_lineas || jsonb_build_array(jsonb_build_object(
      'nombre',       v_product.name,
      'cantidad',     v_qty,
      'precio_cents', v_product.price_cents,
      'total_cents',  v_product.price_cents * v_qty
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
