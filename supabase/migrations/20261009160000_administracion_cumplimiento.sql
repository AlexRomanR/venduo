-- ============================================================================
-- Venduo — lo que la administración apaga, apagado también en la base
--
-- 1. Un producto oculto por Venduo no se puede pedir. La política ya se lo
--    esconde al comprador, pero `create_order` es `security definer` y salta
--    RLS: sin esto, un carrito viejo o un id escrito a mano lo compraría igual.
-- 2. `mis_visitas`, la vista de visitas para la IA de estadísticas. Responde
--    solo si Venduo le activó las visitas a la tienda: igual que la pantalla.
-- 3. `run_insight_sql` deja afuera las tablas nuevas. Las de visitas tienen
--    `store_id` y la IA tiene que pasar por la vista, que no lo tiene.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. El pedido, sin productos moderados. El resto es igual a la anterior.
-- ----------------------------------------------------------------------------
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
       and moderated_at is null
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

revoke all on function public.create_order(uuid, jsonb) from public;
grant execute on function public.create_order(uuid, jsonb) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. Las visitas de mi tienda, para la IA.
-- ----------------------------------------------------------------------------
create or replace view public.mis_visitas as
select d.day as dia,
       d.kind as tipo,
       d.source as origen,
       nullif(d.product_id, '00000000-0000-0000-0000-000000000000') as producto_id,
       p.name as producto,
       d.visits as visitas,
       d.visitors as visitantes
  from public.store_visits_daily d
  left join public.products p on p.id = d.product_id
 where d.store_id = public.my_store_id()
   and public.funcion_activa('visitas');

comment on view public.mis_visitas is
  'Visitas de mi tienda por día. tipo: portada, catalogo, producto, carrito, pedido. origen: whatsapp, tiktok, instagram, facebook, qr, catalogo, otro, directo.';

grant select on public.mis_visitas to authenticated;

-- ----------------------------------------------------------------------------
-- 3. La lista de tablas que la IA no puede nombrar, con las nuevas.
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
  if v_sql ~* '\m(orders|order_items|products|product_categories|profiles|stores|subscriptions|store_pages|store_blocks|store_design_versions|catalogs|insights|ai_generations|social_connections|social_posts|templates|template_pages|block_types|plans|sectors|users|store_visits|store_visits_daily|visit_salts|platform_admins|admin_audit_log|platform_settings|feature_states|store_feature_states|catalog_template_settings|store_notes|invitations|ai_requests)\M' then
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
