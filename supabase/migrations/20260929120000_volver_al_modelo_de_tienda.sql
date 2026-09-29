-- ============================================================================
-- Venduo — vuelta al modelo de tienda propia, antes del Marketplace
--
-- Deshace las once migraciones del 17 y 18 de septiembre (de
-- `20260917180000_precio_por_tramos` a `20260918200100_estadisticas_del_promotor_rls`).
-- El código volvió al estado del 17/09: el negocio fija su precio, la comisión
-- sale de `stores.commission_bps` y el promotor se suma a una tienda.
--
-- Se borra, no se conserva: los tramos, los productos tomados, la atribución
-- del comprador, las columnas que congelaban el reparto a tres, la custodia
-- simulada y el tablero del promotor. Las funciones que el Marketplace
-- reescribió vuelven a su versión del 17/09, copiadas de
-- `20260914200000_vendedores_por_producto.sql`,
-- `20260916230000_referido_publico.sql`, `20260917090000_compra_publica.sql` y
-- `20260917120000_plantillas_de_tienda.sql`.
--
-- Lo que no se puede deshacer:
--
-- - `precio_por_tramos` recalculó el precio de los productos que ya existían
--   para dejarlo lo más cerca posible del anterior, y a algunos les quitó el
--   precio tachado. El precio original no quedó guardado.
-- - `en_disputa` queda en el enum `order_status`: Postgres no quita un valor de
--   un enum sin recrear el tipo y todo lo que lo usa. Ningún pedido lo tiene y
--   nada lo escribe.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Primero lo que depende de las columnas y tablas que se van.
-- ----------------------------------------------------------------------------
drop view if exists public.promotor_ventas;
drop view if exists public.promotor_items;
drop view if exists public.promotor_comisiones;
drop view if exists public.promotor_enlaces;

drop table if exists public.seller_insights;

drop function if exists public.ranking_promotores_global(int);
drop function if exists public.create_marketplace_orders(text, text, text, jsonb);
drop function if exists public.simulate_pagofacil_payment(uuid);
drop function if exists public.confirm_order_received(uuid);
drop function if exists public.open_order_dispute(uuid, text);
drop function if exists public.referido_producto_publico(uuid, text);
drop function if exists public.generate_product_referral_code();

-- ----------------------------------------------------------------------------
-- La custodia simulada.
-- ----------------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_liberacion_excluyente;
alter table public.orders drop column if exists payment_reference;
alter table public.orders drop column if exists shipped_at;
alter table public.orders drop column if exists delivered_at;
alter table public.orders drop column if exists release_due_at;
alter table public.orders drop column if exists released_at;
alter table public.orders drop column if exists refunded_at;
alter table public.orders drop column if exists disputed_at;
alter table public.orders drop column if exists dispute_reason;

-- ----------------------------------------------------------------------------
-- El precio vuelve a ser lo que escribe el negocio.
-- ----------------------------------------------------------------------------
drop trigger if exists producto_precio on public.products;
drop function if exists public.producto_precio();
drop function if exists public.precio_publicado(integer);

alter table public.products drop column if exists base_cost_cents;
alter table public.products drop column if exists commission_bps;
alter table public.products drop column if exists take_bps;

alter table public.products alter column price_cents drop default;
comment on column public.products.price_cents is null;

drop table if exists public.pricing_tiers;

-- ----------------------------------------------------------------------------
-- Lo que eligió cada promotor y a quién trajo.
-- ----------------------------------------------------------------------------
drop function if exists public.release_product(uuid);
drop function if exists public.mis_compradores();

drop table if exists public.seller_products;
drop table if exists public.buyer_attributions;

alter table public.orders drop column if exists buyer_key;
alter table public.orders drop column if exists base_cost_cents;
alter table public.orders drop column if exists take_cents;
alter table public.orders drop column if exists attributed_seller_user_id;

drop function if exists public.normalizar_telefono(text);
drop function if exists public.ventana_de_atribucion();

-- Las comisiones indirectas que se hayan cobrado quedan como filas: una
-- comisión nunca se borra. Solo desaparece la marca.
alter table public.commissions drop column if exists kind;
drop type if exists public.commission_kind;

-- ----------------------------------------------------------------------------
-- La guía del negocio.
-- ----------------------------------------------------------------------------
alter table public.stores drop column if exists onboarded_at;

-- ----------------------------------------------------------------------------
-- La plantilla editorial deja de ofrecerse.
--
-- No se borra: las tiendas creadas durante el Marketplace la tienen en
-- `template_key` y se siguen dibujando con la base editorial.
-- ----------------------------------------------------------------------------
update public.templates
   set is_active = false
 where key = 'clasica';

-- ----------------------------------------------------------------------------
-- Tomar un producto, como el 17/09.
-- ----------------------------------------------------------------------------
create or replace function public.take_product(p_product_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_producto record;
  v_codigo text;
begin
  if v_user_id is null then
    raise exception 'Hace falta iniciar sesión';
  end if;

  select p.id, p.store_id, p.seller_enabled, s.owner_id, s.seller_network_enabled
    into v_producto
    from public.products p
    join public.stores s on s.id = p.store_id
   where p.id = p_product_id
     and p.is_active
     and p.deleted_at is null;

  if v_producto.id is null then
    raise exception 'El producto no existe o no está disponible';
  end if;

  if not v_producto.seller_enabled then
    raise exception 'Ese producto no acepta vendedores';
  end if;

  if not v_producto.seller_network_enabled then
    raise exception 'Esa tienda no tiene la red de vendedores activada';
  end if;

  if not public.store_is_live(v_producto.store_id) then
    raise exception 'La tienda no está disponible';
  end if;

  if v_producto.owner_id = v_user_id then
    raise exception 'No puedes ser vendedor de tu propia tienda';
  end if;

  select referral_code into v_codigo
    from public.store_sellers
   where store_id = v_producto.store_id
     and user_id = v_user_id
     and status = 'activo'
     and deleted_at is null;

  if v_codigo is not null then
    return v_codigo;
  end if;

  perform public.ensure_seller_profile(v_user_id);

  -- Un vínculo pendiente pasa a activo: el dueño ya dio su consentimiento al
  -- marcar este producto, y dejarlo esperando sería contradecirlo.
  update public.store_sellers
     set status = 'activo',
         approved_at = coalesce(approved_at, now()),
         updated_at = now()
   where store_id = v_producto.store_id
     and user_id = v_user_id
     and deleted_at is null
  returning referral_code into v_codigo;

  if v_codigo is not null then
    return v_codigo;
  end if;

  insert into public.store_sellers (store_id, user_id, referral_code, status, approved_at)
  values (
    v_producto.store_id,
    v_user_id,
    public.generate_referral_code(),
    'activo',
    now()
  )
  returning referral_code into v_codigo;

  return v_codigo;
end $$;

-- ----------------------------------------------------------------------------
-- El checkout, como el 17/09: la comisión sale de la tienda.
-- ----------------------------------------------------------------------------
create or replace function public.create_order(
  p_store_id       uuid,
  p_buyer_name     text,
  p_buyer_phone    text,
  p_buyer_email    text,
  p_referral_code  text,
  p_items          jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_seller_id uuid;
  v_commission_bps int;
  v_subtotal int := 0;
  v_base int := 0;
  v_commission int;
  v_item jsonb;
  v_product record;
  v_qty int;
begin
  if not public.store_is_live(p_store_id) then
    raise exception 'La tienda no está disponible';
  end if;

  if p_buyer_name is null or btrim(p_buyer_name) = '' then
    raise exception 'Falta el nombre del comprador';
  end if;

  -- Obligatorio: es el canal por el que se coordina la entrega.
  if p_buyer_phone is null or btrim(p_buyer_phone) = '' then
    raise exception 'Falta el teléfono del comprador';
  end if;

  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  select commission_bps into v_commission_bps
    from public.stores where id = p_store_id;

  -- El código de referido solo vale si es de ESTA tienda y está activo.
  if p_referral_code is not null and btrim(p_referral_code) <> '' then
    select id into v_seller_id
      from public.store_sellers
     where referral_code = upper(btrim(p_referral_code))
       and store_id = p_store_id
       and status = 'activo'
       and deleted_at is null;
  end if;

  -- Sin vendedor no hay comisión.
  if v_seller_id is null then
    v_commission_bps := 0;
  end if;

  insert into public.orders (
    store_id, buyer_name, buyer_phone, buyer_email,
    seller_id, referral_code,
    subtotal_cents, total_cents,
    commission_bps, commission_base_cents, commission_cents, net_to_store_cents
  )
  values (
    p_store_id, btrim(p_buyer_name), btrim(p_buyer_phone), nullif(btrim(coalesce(p_buyer_email, '')), ''),
    v_seller_id,
    case when v_seller_id is not null then upper(btrim(p_referral_code)) else null end,
    0, 0, v_commission_bps, 0, 0, 0
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest((v_item->>'quantity')::int, 1);

    -- El precio sale del catálogo, nunca del cliente.
    select id, name, price_cents, stock, seller_enabled
      into v_product
      from public.products
     where id = (v_item->>'product_id')::uuid
       and store_id = p_store_id
       and is_active
       and deleted_at is null
     for update;

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

    update public.products
       set stock = stock - v_qty, updated_at = now()
     where id = v_product.id;

    v_subtotal := v_subtotal + (v_product.price_cents * v_qty);

    -- Solo lo que el dueño marcó como vendible genera comisión.
    if v_product.seller_enabled then
      v_base := v_base + (v_product.price_cents * v_qty);
    end if;
  end loop;

  v_commission := (v_base * v_commission_bps) / 10000;

  update public.orders
     set subtotal_cents = v_subtotal,
         total_cents = v_subtotal,
         commission_base_cents = v_base,
         commission_cents = v_commission,
         net_to_store_cents = v_subtotal - v_commission,
         updated_at = now()
   where id = v_order_id;

  return v_order_id;
end $$;

-- ----------------------------------------------------------------------------
-- El estado del pedido mueve la comisión, como el 17/09.
-- ----------------------------------------------------------------------------
create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'pagado' and old.status is distinct from 'pagado'
     and new.seller_id is not null and new.commission_cents > 0 then

    insert into public.commissions (
      order_id, store_id, store_name, seller_id, seller_user_id,
      base_amount_cents, rate_bps, amount_cents, status, confirmed_at
    )
    select
      new.id, new.store_id, s.name, new.seller_id, ss.user_id,
      new.commission_base_cents, new.commission_bps, new.commission_cents,
      'confirmada', now()
    from public.store_sellers ss
    join public.stores s on s.id = new.store_id
    where ss.id = new.seller_id
    on conflict (order_id) do nothing;
  end if;

  if new.status = 'cancelado' and old.status is distinct from 'cancelado' then
    update public.commissions
       set status = 'anulada'
     where order_id = new.id
       and status <> 'pagada';

    update public.products p
       set stock = p.stock + oi.quantity, updated_at = now()
      from public.order_items oi
     where oi.order_id = new.id
       and oi.product_id = p.id;
  end if;

  return new;
end $$;

-- ----------------------------------------------------------------------------
-- La consulta de la IA, como el 17/09.
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

-- ----------------------------------------------------------------------------
-- El cartel de "te trajo Ana", como el 17/09: el código vive en el vínculo.
-- ----------------------------------------------------------------------------
create or replace function public.referido_publico(
  p_store_id uuid,
  p_codigo   text
)
returns table (codigo text, nombre text)
language sql
security definer
stable
set search_path = public
as $$
  select ss.referral_code,
         coalesce(sp.display_name, 'un vendedor')
    from public.store_sellers ss
    left join public.seller_profiles sp
           on sp.user_id = ss.user_id
          and sp.deleted_at is null
   where ss.store_id = p_store_id
     and ss.referral_code = upper(btrim(p_codigo))
     and ss.status = 'activo'
     and ss.deleted_at is null
     -- Solo si la tienda se sirve al público: en una tienda despublicada no
     -- hay nada que mostrarle a nadie.
     and public.store_is_live(ss.store_id)
   limit 1
$$;

-- ----------------------------------------------------------------------------
-- El pedido para el comprador, como el 17/09: con el QR y el comprobante.
-- ----------------------------------------------------------------------------
create or replace function public.pedido_publico(p_order_id uuid)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id',            o.id,
    'numero',        o.order_number,
    'estado',        o.status,
    'total_cents',   o.total_cents,
    'comprador',     o.buyer_name,
    'telefono',      o.buyer_phone,
    'tiene_comprobante', o.payment_proof_url is not null,
    'creado',        o.created_at,
    'tienda', jsonb_build_object(
      'nombre',       s.name,
      'slug',         s.slug,
      'logo_url',     s.logo_url,
      'whatsapp',     s.whatsapp,
      'qr_url',       s.payment_qr_url,
      'instrucciones', s.payment_instructions
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nombre',      i.product_name,
        'cantidad',    i.quantity,
        'precio_cents', i.unit_price_cents,
        'total_cents', i.quantity * i.unit_price_cents
      ) order by i.product_name)
        from public.order_items i
       where i.order_id = o.id
    ), '[]'::jsonb)
  )
    from public.orders o
    join public.stores s on s.id = o.store_id
   where o.id = p_order_id
$$;

-- ----------------------------------------------------------------------------
-- Permisos.
-- ----------------------------------------------------------------------------
revoke all on function public.take_product(uuid) from public;
grant execute on function public.take_product(uuid) to authenticated;

revoke all on function public.create_order(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.create_order(uuid, text, text, text, text, jsonb) to anon, authenticated;

revoke all on function public.referido_publico(uuid, text) from public;
grant execute on function public.referido_publico(uuid, text) to anon, authenticated;

revoke all on function public.pedido_publico(uuid) from public;
grant execute on function public.pedido_publico(uuid) to anon, authenticated;
