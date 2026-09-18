-- ============================================================================
-- Venduo — checkout central, custodia simulada y reparto por entrega
-- ============================================================================

-- Tomar un producto crea o reactiva exactamente un enlace de producto.
create or replace function public.take_product(p_product_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := (select auth.uid());
  v_producto record;
  v_vinculo  uuid;
  v_codigo   text;
begin
  if v_user_id is null then
    raise exception 'Hace falta iniciar sesión';
  end if;

  select p.id, p.store_id, p.seller_enabled, s.owner_id
    into v_producto
    from public.products p
    join public.stores s on s.id = p.store_id
   where p.id = p_product_id
     and p.is_active
     and p.deleted_at is null
     and s.deleted_at is null;

  if v_producto.id is null then
    raise exception 'El producto no existe o no está disponible';
  end if;
  if not v_producto.seller_enabled then
    raise exception 'Ese producto no está abierto a promotores';
  end if;
  if not public.store_is_live(v_producto.store_id) then
    raise exception 'El negocio no está disponible';
  end if;
  if v_producto.owner_id = v_user_id then
    raise exception 'No puedes promocionar tu propio producto';
  end if;

  perform public.ensure_seller_profile(v_user_id);

  update public.store_sellers
     set status = 'activo',
         approved_at = coalesce(approved_at, now()),
         updated_at = now()
   where store_id = v_producto.store_id
     and user_id = v_user_id
     and deleted_at is null
  returning id into v_vinculo;

  if v_vinculo is null then
    insert into public.store_sellers (store_id, user_id, referral_code, status, approved_at)
    values (v_producto.store_id, v_user_id, public.generate_referral_code(), 'activo', now())
    returning id into v_vinculo;
  end if;

  select referral_code into v_codigo
    from public.seller_products
   where product_id = v_producto.id
     and user_id = v_user_id
   order by deleted_at nulls first, created_at
   limit 1;

  if v_codigo is null then
    v_codigo := public.generate_product_referral_code();
  end if;

  update public.seller_products
     set deleted_at = null,
         seller_id = v_vinculo,
         referral_code = v_codigo,
         taken_at = now(),
         updated_at = now()
   where id = (
     select id from public.seller_products
      where product_id = v_producto.id and user_id = v_user_id
      order by deleted_at nulls first, created_at
      limit 1
   );

  if not found then
    insert into public.seller_products (
      product_id, store_id, user_id, seller_id, referral_code
    ) values (
      v_producto.id, v_producto.store_id, v_user_id, v_vinculo, v_codigo
    );
  end if;

  return v_codigo;
end
$$;

-- El nombre es informativo. La atribución real vuelve a resolverse al crear el pedido.
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
  select spx.referral_code,
         coalesce(sp.display_name, 'un promotor')
    from public.seller_products spx
    left join public.seller_profiles sp
           on sp.user_id = spx.user_id
          and sp.deleted_at is null
   where spx.store_id = p_store_id
     and spx.referral_code = upper(btrim(p_codigo))
     and public.store_is_live(spx.store_id)
   order by spx.deleted_at nulls first, spx.created_at
   limit 1
$$;

-- La ficha central no acepta un código de otro producto del mismo negocio.
create or replace function public.referido_producto_publico(
  p_product_id uuid,
  p_codigo     text
)
returns table (codigo text, nombre text)
language sql
security definer
stable
set search_path = public
as $$
  select spx.referral_code,
         coalesce(sp.display_name, 'un promotor')
    from public.seller_products spx
    join public.products p
      on p.id = spx.product_id
     and p.deleted_at is null
     and p.is_active
    left join public.seller_profiles sp
           on sp.user_id = spx.user_id
          and sp.deleted_at is null
   where spx.product_id = p_product_id
     and spx.referral_code = upper(btrim(p_codigo))
     and public.store_is_live(p.store_id)
   order by spx.deleted_at nulls first, spx.created_at
   limit 1
$$;

-- Un pedido sigue perteneciendo a un negocio, pero su referido corresponde a
-- un producto concreto. Solo ese producto genera la comisión directa.
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
  v_order_id       uuid;
  v_owner_id       uuid;
  v_key            text;
  v_seller_id      uuid;
  v_seller_user    uuid;
  v_ref_product    uuid;
  v_atribuido      uuid;
  v_subtotal       int := 0;
  v_base_total     int := 0;
  v_take_total     int := 0;
  v_comision_base  int := 0;
  v_comision       int := 0;
  v_item           jsonb;
  v_product        record;
  v_qty            int;
  v_take_unit      int;
  v_comision_unit  int;
  v_indirecta_bps  int;
begin
  if not public.store_is_live(p_store_id) then
    raise exception 'El negocio no está disponible';
  end if;
  if p_buyer_name is null or btrim(p_buyer_name) = '' then
    raise exception 'Falta el nombre del comprador';
  end if;
  if p_buyer_phone is null or btrim(p_buyer_phone) = '' then
    raise exception 'Falta el teléfono del comprador';
  end if;

  v_key := public.normalizar_telefono(p_buyer_phone);
  if v_key is null or length(v_key) < 7 then
    raise exception 'Revisa el teléfono: tiene que tener al menos 7 dígitos';
  end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  select owner_id into v_owner_id from public.stores where id = p_store_id;

  if p_referral_code is not null and btrim(p_referral_code) <> '' then
    select spx.seller_id, spx.user_id, spx.product_id
      into v_seller_id, v_seller_user, v_ref_product
      from public.seller_products spx
     where spx.referral_code = upper(btrim(p_referral_code))
       and spx.store_id = p_store_id
       and exists (
         select 1
           from jsonb_array_elements(p_items) x
          where (x->>'product_id')::uuid = spx.product_id
       )
     order by spx.deleted_at nulls first, spx.created_at
     limit 1;
  end if;

  if v_seller_id is null then
    select seller_user_id into v_atribuido
      from public.buyer_attributions
     where buyer_key = v_key
       and deleted_at is null
       and expires_at > now()
     order by created_at
     limit 1;
    if v_atribuido = v_owner_id then
      v_atribuido := null;
    end if;
  end if;

  insert into public.orders (
    store_id, buyer_name, buyer_phone, buyer_email, buyer_key,
    seller_id, referral_code, attributed_seller_user_id,
    subtotal_cents, total_cents,
    commission_bps, commission_base_cents, commission_cents, net_to_store_cents
  ) values (
    p_store_id, btrim(p_buyer_name), btrim(p_buyer_phone),
    nullif(btrim(coalesce(p_buyer_email, '')), ''), v_key,
    v_seller_id,
    case when v_seller_id is not null then upper(btrim(p_referral_code)) else null end,
    v_atribuido,
    0, 0, 0, 0, 0, 0
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest((v_item->>'quantity')::int, 1);

    select id, name, price_cents, base_cost_cents, take_bps, stock, seller_enabled
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

    v_take_unit := round(v_product.base_cost_cents::numeric * coalesce(v_product.take_bps, 0) / 10000)::int;
    v_comision_unit := greatest(v_product.price_cents - v_product.base_cost_cents - v_take_unit, 0);

    insert into public.order_items (
      order_id, store_id, product_id, product_name, quantity, unit_price_cents
    ) values (
      v_order_id, p_store_id, v_product.id, v_product.name, v_qty, v_product.price_cents
    );

    update public.products set stock = stock - v_qty where id = v_product.id;

    v_subtotal := v_subtotal + v_product.price_cents * v_qty;
    v_base_total := v_base_total + v_product.base_cost_cents * v_qty;
    v_take_total := v_take_total + v_take_unit * v_qty;

    if v_product.seller_enabled then
      if v_seller_id is not null and v_product.id = v_ref_product then
        v_comision_base := v_comision_base + v_product.base_cost_cents * v_qty;
        v_comision := v_comision + v_comision_unit * v_qty;
      elsif v_seller_id is null and v_atribuido is not null then
        select t.indirect_bps into v_indirecta_bps
          from public.pricing_tiers t
         where v_product.base_cost_cents >= t.min_cost_cents
           and (t.max_cost_cents is null or v_product.base_cost_cents <= t.max_cost_cents)
         order by t.min_cost_cents desc
         limit 1;

        v_comision_base := v_comision_base + v_product.base_cost_cents * v_qty;
        v_comision := v_comision + least(
          round(v_product.base_cost_cents::numeric * coalesce(v_indirecta_bps, 0) / 10000)::int,
          v_comision_unit
        ) * v_qty;
      end if;
    end if;
  end loop;

  update public.orders
     set subtotal_cents = v_subtotal,
         total_cents = v_subtotal,
         base_cost_cents = v_base_total,
         take_cents = v_take_total,
         commission_base_cents = v_comision_base,
         commission_cents = v_comision,
         commission_bps = case
           when v_comision_base > 0 then least(round(v_comision::numeric * 10000 / v_comision_base)::int, 10000)
           else 0
         end,
         attributed_seller_user_id = case when v_comision > 0 then v_atribuido else null end,
         net_to_store_cents = v_subtotal - v_comision - v_take_total,
         updated_at = now()
   where id = v_order_id;

  return v_order_id;
end
$$;

-- Un carrito central puede mezclar negocios y enlaces. Esta función los
-- separa dentro de una sola transacción para no dejar pedidos a medias.
create or replace function public.create_marketplace_orders(
  p_buyer_name   text,
  p_buyer_phone  text,
  p_buyer_email  text,
  p_items        jsonb
)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group record;
  v_group_items jsonb;
  v_order_id uuid;
  v_order_ids uuid[] := '{}';
begin
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'El carrito está vacío';
  end if;

  for v_group in
    select p.store_id,
           nullif(upper(btrim(coalesce(x.item->>'referral_code', ''))), '') as referral_code
      from jsonb_array_elements(p_items) x(item)
      join public.products p on p.id = (x.item->>'product_id')::uuid
     where p.deleted_at is null and p.is_active
     group by p.store_id, nullif(upper(btrim(coalesce(x.item->>'referral_code', ''))), '')
  loop
    select jsonb_agg(jsonb_build_object(
      'product_id', x.item->>'product_id',
      'quantity', greatest((x.item->>'quantity')::int, 1)
    ))
      into v_group_items
      from jsonb_array_elements(p_items) x(item)
      join public.products p on p.id = (x.item->>'product_id')::uuid
     where p.store_id = v_group.store_id
       and nullif(upper(btrim(coalesce(x.item->>'referral_code', ''))), '')
           is not distinct from v_group.referral_code;

    v_order_id := public.create_order(
      v_group.store_id,
      p_buyer_name,
      p_buyer_phone,
      p_buyer_email,
      coalesce(v_group.referral_code, ''),
      v_group_items
    );
    v_order_ids := array_append(v_order_ids, v_order_id);
  end loop;

  if cardinality(v_order_ids) = 0 then
    raise exception 'Los productos ya no están disponibles';
  end if;

  return v_order_ids;
end
$$;

-- PagoFácil falso del MVP: representa el aviso firmado del proveedor. Ningún
-- botón del negocio puede mover un pedido a pagado.
create or replace function public.simulate_pagofacil_payment(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.orders
     set status = 'pagado',
         payment_reference = coalesce(payment_reference, 'PF-SIM-' || upper(substr(replace(id::text, '-', ''), 1, 12))),
         paid_at = coalesce(paid_at, now()),
         updated_at = now()
   where id = p_order_id
     and status = 'pendiente'
     and released_at is null
     and refunded_at is null;

  get diagnostics v_count = row_count;
  return v_count > 0;
end
$$;

create or replace function public.confirm_order_received(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.orders
     set status = 'entregado', updated_at = now()
   where id = p_order_id
     and status = 'enviado'
     and disputed_at is null
     and released_at is null
     and refunded_at is null;

  get diagnostics v_count = row_count;
  return v_count > 0;
end
$$;

create or replace function public.open_order_dispute(
  p_order_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if length(btrim(coalesce(p_reason, ''))) < 10 then
    raise exception 'Cuéntanos el problema con un poco más de detalle';
  end if;

  update public.orders
     set status = 'en_disputa',
         disputed_at = coalesce(disputed_at, now()),
         dispute_reason = left(btrim(p_reason), 500),
         updated_at = now()
   where id = p_order_id
     and status in ('pagado', 'enviado')
     and released_at is null
     and refunded_at is null;

  get diagnostics v_count = row_count;
  return v_count > 0;
end
$$;

create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pagado' and old.status is distinct from 'pagado' then
    if new.seller_id is not null and new.commission_cents > 0 then
      insert into public.commissions (
        order_id, store_id, store_name, seller_id, seller_user_id, kind,
        base_amount_cents, rate_bps, amount_cents, status, confirmed_at
      )
      select
        new.id, new.store_id, s.name, new.seller_id, ss.user_id, 'directa',
        new.commission_base_cents, new.commission_bps, new.commission_cents,
        'pendiente', null
      from public.store_sellers ss
      join public.stores s on s.id = new.store_id
      where ss.id = new.seller_id
      on conflict (order_id) do nothing;
    elsif new.attributed_seller_user_id is not null and new.commission_cents > 0 then
      insert into public.commissions (
        order_id, store_id, store_name, seller_id, seller_user_id, kind,
        base_amount_cents, rate_bps, amount_cents, status, confirmed_at
      )
      select
        new.id, new.store_id, s.name, null, new.attributed_seller_user_id, 'indirecta',
        new.commission_base_cents, new.commission_bps, new.commission_cents,
        'pendiente', null
      from public.stores s
      where s.id = new.store_id
      on conflict (order_id) do nothing;
    end if;

    if new.seller_id is not null and new.buyer_key is not null then
      perform pg_advisory_xact_lock(hashtext('atribucion:' || new.buyer_key));
      insert into public.buyer_attributions (
        buyer_key, seller_user_id, seller_id, first_order_id, created_at, expires_at
      )
      select new.buyer_key, ss.user_id, ss.id, new.id, now(),
             now() + public.ventana_de_atribucion()
        from public.store_sellers ss
       where ss.id = new.seller_id
         and not exists (
           select 1 from public.buyer_attributions a
            where a.buyer_key = new.buyer_key
              and a.deleted_at is null
              and a.expires_at > now()
         )
      on conflict (first_order_id) do nothing;
    end if;
  end if;

  if new.status = 'enviado' and old.status is distinct from 'enviado' then
    update public.orders
       set shipped_at = coalesce(shipped_at, now()),
           release_due_at = coalesce(release_due_at, now() + interval '7 days')
     where id = new.id;
  end if;

  if new.status = 'entregado' and old.status is distinct from 'entregado' then
    update public.orders
       set delivered_at = coalesce(delivered_at, now()),
           released_at = coalesce(released_at, now())
     where id = new.id and refunded_at is null;

    update public.commissions
       set status = 'confirmada', confirmed_at = coalesce(confirmed_at, now())
     where order_id = new.id and status = 'pendiente';
  end if;

  if new.status = 'cancelado' and old.status is distinct from 'cancelado' then
    update public.orders
       set refunded_at = case when paid_at is not null then coalesce(refunded_at, now()) else refunded_at end
     where id = new.id and released_at is null;

    update public.commissions
       set status = 'anulada'
     where order_id = new.id and status <> 'pagada';

    update public.products p
       set stock = p.stock + oi.quantity, updated_at = now()
      from public.order_items oi
     where oi.order_id = new.id and oi.product_id = p.id;
  end if;

  return new;
end
$$;

create or replace function public.pedido_publico(p_order_id uuid)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id', o.id,
    'numero', o.order_number,
    'estado', o.status,
    'total_cents', o.total_cents,
    'comprador', o.buyer_name,
    'telefono', o.buyer_phone,
    'creado', o.created_at,
    'payment_reference', o.payment_reference,
    'paid_at', o.paid_at,
    'shipped_at', o.shipped_at,
    'delivered_at', o.delivered_at,
    'release_due_at', o.release_due_at,
    'released_at', o.released_at,
    'refunded_at', o.refunded_at,
    'disputed_at', o.disputed_at,
    'dispute_reason', o.dispute_reason,
    'tienda', jsonb_build_object(
      'nombre', s.name,
      'slug', s.slug,
      'logo_url', s.logo_url,
      'whatsapp', s.whatsapp
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nombre', i.product_name,
        'cantidad', i.quantity,
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

revoke all on function public.create_marketplace_orders(text, text, text, jsonb) from public;
grant execute on function public.create_marketplace_orders(text, text, text, jsonb) to anon, authenticated;

revoke all on function public.simulate_pagofacil_payment(uuid) from public;
grant execute on function public.simulate_pagofacil_payment(uuid) to anon, authenticated;

revoke all on function public.confirm_order_received(uuid) from public;
grant execute on function public.confirm_order_received(uuid) to anon, authenticated;

revoke all on function public.open_order_dispute(uuid, text) from public;
grant execute on function public.open_order_dispute(uuid, text) to anon, authenticated;

revoke all on function public.create_order(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.create_order(uuid, text, text, text, text, jsonb) to anon, authenticated;

revoke all on function public.take_product(uuid) from public;
grant execute on function public.take_product(uuid) to authenticated;

revoke all on function public.referido_publico(uuid, text) from public;
grant execute on function public.referido_publico(uuid, text) to anon, authenticated;

revoke all on function public.referido_producto_publico(uuid, text) from public;
grant execute on function public.referido_producto_publico(uuid, text) to anon, authenticated;

revoke all on function public.pedido_publico(uuid) from public;
grant execute on function public.pedido_publico(uuid) to anon, authenticated;
