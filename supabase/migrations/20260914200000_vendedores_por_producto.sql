-- ============================================================================
-- Venduo — 0015 dos caminos para el vendedor
--
-- Hasta acá un vendedor solo podía sumarse a una tienda entera. Se agrega el
-- segundo camino: una vitrina pública de productos que cada emprendedor marca
-- como vendibles, de donde cualquiera saca su enlace de referido.
--
-- La decisión que ordena todo esto: **marcar un producto es el consentimiento**.
-- Por eso tomar un producto no espera aprobación aunque la tienda sea
-- `con_aprobacion`: ese modo gobierna el acceso al catálogo completo, no al
-- producto que el dueño ya publicó como disponible para vendedores.
--
-- Y por eso la comisión deja de calcularse sobre el pedido entero: si un
-- pedido mezcla productos habilitados con otros que no lo están, pagar sobre
-- el total le cobraría al emprendedor una comisión que nunca ofreció.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- El interruptor por producto.
--
-- Nace en `true` porque el interruptor que manda es el de la tienda: mientras
-- `stores.seller_network_enabled` esté apagado no hay vendedores, y cuando se
-- enciende lo razonable es que el catálogo entero esté disponible y el dueño
-- apague las excepciones.
-- ----------------------------------------------------------------------------
alter table public.products
  add column if not exists seller_enabled boolean not null default true;

-- La vitrina cruza todas las tiendas, así que necesita su propio índice
-- parcial: sin él es un recorrido completo de la tabla de productos.
create index if not exists products_vitrina_vendedores_idx
  on public.products (store_id, created_at desc)
  where deleted_at is null and is_active and seller_enabled;

-- ----------------------------------------------------------------------------
-- La base de la comisión deja de ser el total del pedido.
--
-- Se guarda en el pedido, junto a la tasa, por la misma razón que la tasa: al
-- momento de la venta queda congelado qué parte del pedido generaba comisión.
-- Cambiar después qué productos aceptan vendedores no reescribe la historia.
-- ----------------------------------------------------------------------------
alter table public.orders
  add column if not exists commission_base_cents integer not null default 0
    check (commission_base_cents >= 0);

-- Los pedidos que ya existían calcularon comisión sobre el total: se deja
-- constancia de eso y no del criterio nuevo.
update public.orders
   set commission_base_cents = subtotal_cents
 where commission_base_cents = 0 and commission_cents > 0;

-- ----------------------------------------------------------------------------
-- Tomar un producto de la vitrina.
--
-- Reutiliza el vínculo de `store_sellers` en vez de inventar un código por
-- producto. Es deliberado: `orders.seller_id` apunta a un vínculo y el índice
-- único sobre `commissions.order_id` garantiza una comisión por pedido. Un
-- código por producto obligaría a rehacer las dos cosas, que son justamente
-- las que sostienen que la comisión no se duplique.
--
-- Para el vendedor son dos caminos distintos; por debajo es el mismo vínculo.
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
-- El checkout, con la comisión acotada a lo que la tienda ofreció.
--
-- Único cambio respecto de la versión anterior: se acumula por separado el
-- subtotal del pedido y la base de comisión, que solo suma los productos con
-- `seller_enabled`. Todo lo demás —precios desde el catálogo, validación de
-- stock, resolución del código de referido— queda igual.
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
-- La comisión se registra contra la base congelada, no contra el total.
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
-- El alta de la tienda decide desde el principio si acepta vendedores.
--
-- Antes nacía siempre con la red apagada y en 0% de comisión, lo que obligaba
-- a pasar por una pantalla de configuración que todavía no existe.
-- ----------------------------------------------------------------------------
create or replace function public.create_store(
  p_name           text,
  p_description    text,
  p_template_key   text,
  p_sellers        boolean default false,
  p_commission_bps integer default 1000
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
  v_bps      int;
begin
  if v_user_id is null then
    raise exception 'Hace falta iniciar sesión';
  end if;

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

  -- La comisión la impone el servidor dentro de un rango razonable: el
  -- cliente no declara un 90% ni un negativo.
  v_bps := least(greatest(coalesce(p_commission_bps, 1000), 0), 5000);
  if not coalesce(p_sellers, false) then
    v_bps := 0;
  end if;

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

  insert into public.stores (
    owner_id, name, slug, description, template_key,
    seller_network_enabled, commission_bps
  )
  values (
    v_user_id,
    btrim(p_name),
    v_slug,
    nullif(btrim(coalesce(p_description, '')), ''),
    p_template_key,
    coalesce(p_sellers, false),
    v_bps
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

  perform public.apply_template(v_store_id, p_template_key);

  return v_store_id;
end $$;

-- La firma cambió, así que la anterior queda huérfana y hay que retirarla.
drop function if exists public.create_store(text, text, text);

-- ----------------------------------------------------------------------------
-- Permisos.
-- ----------------------------------------------------------------------------
revoke all on function public.take_product(uuid) from public;
grant execute on function public.take_product(uuid) to authenticated;

revoke all on function public.create_store(text, text, text, boolean, integer) from public;
grant execute on function public.create_store(text, text, text, boolean, integer) to authenticated;

revoke all on function public.create_order(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.create_order(uuid, text, text, text, text, jsonb) to anon, authenticated;
