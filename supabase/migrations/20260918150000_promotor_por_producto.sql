-- ============================================================================
-- Venduo — el promotor elige productos, y el comprador que trae queda con él
--
-- Tres piezas del modelo vigente (`docs/modelo-de-negocio.md`) que faltaban:
--
-- 1. `seller_products`: qué productos tomó cada promotor. Hasta acá tomar un
--    producto solo creaba el vínculo con el negocio entero y no quedaba
--    registrado cuál; el panel del promotor no tenía qué listar.
-- 2. `buyer_attributions`: a qué promotor quedó asociado un comprador, por su
--    teléfono normalizado y por una ventana de 90 días. El primero manda.
-- 3. `create_order` congela los tres componentes del precio —costo base,
--    comisión y take-rate— y resuelve quién cobra la comisión: el promotor del
--    enlace (directa), el promotor asociado al comprador (indirecta) o nadie,
--    y entonces vuelve al negocio. El comprador paga lo mismo en los tres.
--
-- El código de referido sigue siendo por promotor y negocio, en
-- `store_sellers`, y no por producto como propone `VENDUO.md` §8: el carrito
-- lleva un solo código por tienda y `orders.seller_id` apunta a ese vínculo.
-- Cambiarlo obligaba a rehacer el checkout y el índice que impide comisiones
-- duplicadas. El vínculo queda como un detalle interno que nadie aprueba.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- El teléfono como llave del comprador.
--
-- Una sola forma de normalizarlo, acá: dos maneras de escribir el mismo número
-- serían dos compradores distintos, y eso le roba la comisión a alguien. Se
-- quedan los dígitos y se quita el prefijo de Bolivia.
-- ----------------------------------------------------------------------------
create or replace function public.normalizar_telefono(p_telefono text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(
    case when d ~ '^591[0-9]{8}$' then substr(d, 4) else d end,
    ''
  )
  from (select regexp_replace(coalesce(p_telefono, ''), '[^0-9]', '', 'g') as d) x
$$;

-- Cuánto dura la asociación entre comprador y promotor. Una función y no un
-- número repetido en tres lugares: es la decisión abierta del modelo.
create or replace function public.ventana_de_atribucion()
returns interval
language sql
immutable
as $$ select interval '90 days' $$;

-- ----------------------------------------------------------------------------
-- Los productos que tomó cada promotor.
-- ----------------------------------------------------------------------------
create table if not exists public.seller_products (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  -- Redundante a propósito: el negocio ve quién promociona lo suyo con una
  -- comparación sobre esta sola tabla.
  store_id    uuid not null references public.stores(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- El vínculo que lleva el código del enlace.
  seller_id   uuid references public.store_sellers(id) on delete set null,
  taken_at    timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create unique index if not exists seller_products_producto_usuario_key
  on public.seller_products (product_id, user_id) where deleted_at is null;

create index if not exists seller_products_usuario_idx
  on public.seller_products (user_id, taken_at desc) where deleted_at is null;

create index if not exists seller_products_tienda_idx
  on public.seller_products (store_id) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- La atribución del comprador.
--
-- Guarda el teléfono completo, así que no tiene políticas: el promotor llega a
-- sus compradores por `mis_compradores()`, que lo devuelve censurado.
-- ----------------------------------------------------------------------------
create table if not exists public.buyer_attributions (
  id              uuid primary key default gen_random_uuid(),
  buyer_key       text not null,
  seller_user_id  uuid not null references auth.users(id) on delete cascade,
  seller_id       uuid references public.store_sellers(id) on delete set null,
  first_order_id  uuid references public.orders(id) on delete set null,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  deleted_at      timestamptz
);

create unique index if not exists buyer_attributions_pedido_key
  on public.buyer_attributions (first_order_id);

create index if not exists buyer_attributions_comprador_idx
  on public.buyer_attributions (buyer_key, expires_at desc) where deleted_at is null;

create index if not exists buyer_attributions_promotor_idx
  on public.buyer_attributions (seller_user_id, created_at desc) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- El pedido congela los tres componentes y a quién le tocó la comisión.
-- ----------------------------------------------------------------------------
alter table public.orders
  add column if not exists buyer_key text;

alter table public.orders
  add column if not exists base_cost_cents integer not null default 0
    check (base_cost_cents >= 0);

alter table public.orders
  add column if not exists take_cents integer not null default 0
    check (take_cents >= 0);

-- En una compra directa, el promotor asociado al comprador que cobra la
-- comisión indirecta. Es un usuario y no un vínculo: pudo haberlo traído con
-- el producto de otro negocio.
alter table public.orders
  add column if not exists attributed_seller_user_id uuid
    references auth.users(id) on delete set null;

update public.orders
   set buyer_key = public.normalizar_telefono(buyer_phone)
 where buyer_key is null;

create index if not exists orders_comprador_idx
  on public.orders (buyer_key, created_at);

create index if not exists orders_atribuido_idx
  on public.orders (attributed_seller_user_id) where attributed_seller_user_id is not null;

-- ----------------------------------------------------------------------------
-- La comisión dice si la ganó vendiendo o trayendo al comprador.
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.commission_kind as enum ('directa', 'indirecta');
exception when duplicate_object then null; end $$;

alter table public.commissions
  add column if not exists kind public.commission_kind not null default 'directa';

-- ----------------------------------------------------------------------------
-- Tomar un producto.
--
-- Publicar un producto ya es el consentimiento del negocio: no se mira
-- `seller_network_enabled` ni se espera aprobación. Sigue mandando
-- `seller_enabled`, que es el interruptor por producto.
-- ----------------------------------------------------------------------------
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

  -- El vínculo con el negocio lleva el código. Si existía en cualquier estado
  -- del modelo anterior, se activa: acá nadie aprueba nada.
  update public.store_sellers
     set status = 'activo',
         approved_at = coalesce(approved_at, now()),
         updated_at = now()
   where store_id = v_producto.store_id
     and user_id = v_user_id
     and deleted_at is null
  returning id, referral_code into v_vinculo, v_codigo;

  if v_vinculo is null then
    insert into public.store_sellers (store_id, user_id, referral_code, status, approved_at)
    values (v_producto.store_id, v_user_id, public.generate_referral_code(), 'activo', now())
    returning id, referral_code into v_vinculo, v_codigo;
  end if;

  insert into public.seller_products (product_id, store_id, user_id, seller_id)
  select v_producto.id, v_producto.store_id, v_user_id, v_vinculo
   where not exists (
     select 1 from public.seller_products
      where product_id = v_producto.id
        and user_id = v_user_id
        and deleted_at is null
   );

  return v_codigo;
end $$;

-- ----------------------------------------------------------------------------
-- Dejar de promocionar un producto.
--
-- Solo lo saca de su lista. El código sigue valiendo: un enlace que ya circula
-- por WhatsApp no puede dejar de pagarle a quien lo compartió.
-- ----------------------------------------------------------------------------
create or replace function public.release_product(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Hace falta iniciar sesión';
  end if;

  update public.seller_products
     set deleted_at = now(), updated_at = now()
   where product_id = p_product_id
     and user_id = (select auth.uid())
     and deleted_at is null;
end $$;

-- ----------------------------------------------------------------------------
-- El checkout.
--
-- Por cada línea, los tres componentes salen del producto: el costo base que
-- declaró el negocio, el take-rate redondeado al centavo, y la comisión como
-- lo que falta para llegar al precio. Así suman exactamente el total, que es
-- lo que exige la dispersión.
--
-- Quién cobra la comisión:
--   con código válido de este negocio      → el promotor del enlace, completa
--   sin código, comprador asociado vigente → ese promotor, al porcentaje indirecto
--   ninguno de los dos                     → nadie: vuelve al negocio
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
  v_order_id     uuid;
  v_owner_id     uuid;
  v_key          text;
  v_seller_id    uuid;
  v_seller_user  uuid;
  v_atribuido    uuid;
  v_subtotal     int := 0;
  v_base_total   int := 0;
  v_take_total   int := 0;
  v_comision_base int := 0;
  v_comision     int := 0;
  v_item         jsonb;
  v_product      record;
  v_qty          int;
  v_take_unit    int;
  v_comision_unit int;
  v_indirecta_bps int;
begin
  if not public.store_is_live(p_store_id) then
    raise exception 'La tienda no está disponible';
  end if;

  if p_buyer_name is null or btrim(p_buyer_name) = '' then
    raise exception 'Falta el nombre del comprador';
  end if;

  -- Obligatorio: es el canal de la entrega y la llave de la atribución.
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

  -- El código solo vale si es de ESTE negocio y está activo. Uno inventado o
  -- de otro negocio se ignora y la venta se resuelve como compra directa.
  if p_referral_code is not null and btrim(p_referral_code) <> '' then
    select id, user_id into v_seller_id, v_seller_user
      from public.store_sellers
     where referral_code = upper(btrim(p_referral_code))
       and store_id = p_store_id
       and status = 'activo'
       and deleted_at is null;
  end if;

  if v_seller_id is null then
    select seller_user_id into v_atribuido
      from public.buyer_attributions
     where buyer_key = v_key
       and deleted_at is null
       and expires_at > now()
     order by created_at
     limit 1;

    -- El dueño no cobra comisión indirecta por lo que le compran a él.
    if v_atribuido = v_owner_id then
      v_atribuido := null;
    end if;
  end if;

  insert into public.orders (
    store_id, buyer_name, buyer_phone, buyer_email, buyer_key,
    seller_id, referral_code, attributed_seller_user_id,
    subtotal_cents, total_cents,
    commission_bps, commission_base_cents, commission_cents, net_to_store_cents
  )
  values (
    p_store_id, btrim(p_buyer_name), btrim(p_buyer_phone),
    nullif(btrim(coalesce(p_buyer_email, '')), ''), v_key,
    v_seller_id,
    case when v_seller_id is not null then upper(btrim(p_referral_code)) else null end,
    v_atribuido,
    0, 0, 0, 0, 0, 0
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest((v_item->>'quantity')::int, 1);

    -- El precio y sus partes salen del catálogo, nunca del cliente.
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
    )
    values (
      v_order_id, p_store_id, v_product.id, v_product.name, v_qty, v_product.price_cents
    );

    update public.products
       set stock = stock - v_qty
     where id = v_product.id;

    v_subtotal := v_subtotal + v_product.price_cents * v_qty;
    v_base_total := v_base_total + v_product.base_cost_cents * v_qty;
    v_take_total := v_take_total + v_take_unit * v_qty;

    -- Solo lo que el negocio dejó abierto a promotores paga comisión; el
    -- componente de lo demás vuelve al negocio.
    if v_product.seller_enabled then
      if v_seller_id is not null then
        v_comision_base := v_comision_base + v_product.base_cost_cents * v_qty;
        v_comision := v_comision + v_comision_unit * v_qty;
      elsif v_atribuido is not null then
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
         -- La tasa efectiva sobre el costo base: con productos de distintos
         -- tramos no hay un único porcentaje, y este es el que reproduce el monto.
         commission_bps = case
           when v_comision_base > 0 then least(round(v_comision::numeric * 10000 / v_comision_base)::int, 10000)
           else 0
         end,
         attributed_seller_user_id = case when v_comision > 0 then v_atribuido else null end,
         net_to_store_cents = v_subtotal - v_comision - v_take_total,
         updated_at = now()
   where id = v_order_id;

  return v_order_id;
end $$;

-- ----------------------------------------------------------------------------
-- El estado del pedido mueve la comisión y crea la atribución.
--
-- La atribución nace cuando el pedido que trajo un promotor se cobra, no
-- cuando se crea: un pedido que se cancela no trajo a nadie. Se toma un
-- candado por comprador para que dos pedidos cobrados a la vez no creen dos.
-- ----------------------------------------------------------------------------
create or replace function public.handle_order_status_change()
returns trigger
language plpgsql
security definer set search_path = public
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
        'confirmada', now()
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
        'confirmada', now()
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

  if new.status = 'cancelado' and old.status is distinct from 'cancelado' then
    update public.commissions
       set status = 'anulada'
     where order_id = new.id
       and status <> 'pagada';

    update public.products p
       set stock = p.stock + oi.quantity
      from public.order_items oi
     where oi.order_id = new.id
       and oi.product_id = p.id;
  end if;

  return new;
end $$;

-- ----------------------------------------------------------------------------
-- Los compradores que trajo un promotor, con el teléfono censurado.
--
-- `security definer` porque la tabla no tiene políticas. Si el teléfono es de
-- alguien con cuenta en Venduo —un promotor o un negocio— se muestra su
-- nombre; si no, solo el primer dígito y los dos últimos.
-- ----------------------------------------------------------------------------
create or replace function public.mis_compradores()
returns table (
  id                        uuid,
  comprador                 text,
  registrado                boolean,
  desde                     timestamptz,
  vence                     timestamptz,
  vigente                   boolean,
  primera_tienda            text,
  primera_compra_cents      integer,
  compras_indirectas        integer,
  comision_indirecta_cents  integer
)
language sql
stable
security definer
set search_path = public
as $$
  with mias as (
    select a.*
      from public.buyer_attributions a
     where a.seller_user_id = (select auth.uid())
       and a.deleted_at is null
  ), cuentas as (
    select public.normalizar_telefono(sp.phone) as llave, pr.full_name as nombre
      from public.seller_profiles sp
      join public.profiles pr on pr.id = sp.user_id
     where sp.phone is not null and sp.deleted_at is null
    union all
    select public.normalizar_telefono(s.whatsapp), s.name
      from public.stores s
     where s.whatsapp is not null and s.deleted_at is null
  )
  select
    m.id,
    coalesce(
      (select c.nombre from cuentas c where c.llave = m.buyer_key and c.nombre is not null limit 1),
      left(m.buyer_key, 1) || repeat('•', greatest(length(m.buyer_key) - 3, 3)) || right(m.buyer_key, 2)
    ),
    exists (select 1 from cuentas c where c.llave = m.buyer_key),
    m.created_at,
    m.expires_at,
    m.expires_at > now(),
    s.name,
    o.total_cents,
    (select count(*)::int from public.commissions k
       join public.orders oo on oo.id = k.order_id
      where k.seller_user_id = m.seller_user_id
        and k.kind = 'indirecta'
        and k.status <> 'anulada'
        and oo.buyer_key = m.buyer_key),
    (select coalesce(sum(k.amount_cents), 0)::int from public.commissions k
       join public.orders oo on oo.id = k.order_id
      where k.seller_user_id = m.seller_user_id
        and k.kind = 'indirecta'
        and k.status <> 'anulada'
        and oo.buyer_key = m.buyer_key)
  from mias m
  left join public.orders o on o.id = m.first_order_id
  left join public.stores s on s.id = o.store_id
  order by m.created_at desc
$$;

-- ----------------------------------------------------------------------------
-- Lo que ya pasó.
--
-- Los productos que cada promotor vendió con su enlace pasan a ser productos
-- que tomó, y cada comprador cobrado por un enlace queda asociado a quien lo
-- trajo primero, con la ventana contada desde esa compra. Las comisiones ya
-- congeladas no se tocan: una compra directa de antes siguió las reglas de
-- antes.
-- ----------------------------------------------------------------------------
insert into public.seller_products (product_id, store_id, user_id, seller_id, taken_at)
select distinct on (oi.product_id, ss.user_id)
       oi.product_id, oi.store_id, ss.user_id, ss.id, o.created_at
  from public.orders o
  join public.order_items oi on oi.order_id = o.id
  join public.store_sellers ss on ss.id = o.seller_id
  join public.products p on p.id = oi.product_id
 where p.deleted_at is null
   and ss.deleted_at is null
   and not exists (
     select 1 from public.seller_products x
      where x.product_id = oi.product_id and x.user_id = ss.user_id and x.deleted_at is null
   )
 order by oi.product_id, ss.user_id, o.created_at;

insert into public.buyer_attributions (
  buyer_key, seller_user_id, seller_id, first_order_id, created_at, expires_at
)
select distinct on (o.buyer_key)
       o.buyer_key, ss.user_id, ss.id, o.id, o.created_at,
       o.created_at + public.ventana_de_atribucion()
  from public.orders o
  join public.store_sellers ss on ss.id = o.seller_id
 where o.buyer_key is not null
   and o.status in ('pagado', 'enviado', 'entregado')
   and not exists (select 1 from public.buyer_attributions a where a.buyer_key = o.buyer_key)
 order by o.buyer_key, o.created_at
on conflict (first_order_id) do nothing;

-- ----------------------------------------------------------------------------
-- Permisos.
-- ----------------------------------------------------------------------------
revoke all on function public.take_product(uuid) from public;
grant execute on function public.take_product(uuid) to authenticated;

revoke all on function public.release_product(uuid) from public;
grant execute on function public.release_product(uuid) to authenticated;

revoke all on function public.mis_compradores() from public;
grant execute on function public.mis_compradores() to authenticated;

revoke all on function public.create_order(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.create_order(uuid, text, text, text, text, jsonb) to anon, authenticated;
