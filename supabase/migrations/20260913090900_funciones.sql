-- ============================================================================
-- Venduo — 0009 funciones: auxiliares de seguridad y operaciones del servidor
--
-- Las operaciones sensibles no se hacen con INSERT del cliente. Viven acá,
-- donde el servidor controla los valores que el cliente no puede decidir.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Auxiliares de seguridad.
--
-- Son `security definer` para saltarse las políticas de las tablas que
-- consultan: sin esto, una política sobre store_sellers que consulte
-- store_sellers entra en recursión infinita.
-- ----------------------------------------------------------------------------

-- La tienda del usuario. Devuelve un identificador y no una lista porque
-- multi-tienda está fuera de alcance.
create or replace function public.my_store_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.stores
  where owner_id = (select auth.uid()) and deleted_at is null
  limit 1
$$;

-- Los vínculos activos del usuario como vendedor, en todas las tiendas.
create or replace function public.my_seller_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(id), '{}')
  from public.store_sellers
  where user_id = (select auth.uid())
    and status = 'activo'
    and deleted_at is null
$$;

-- Si una tienda se sirve al público: publicada, viva y con suscripción vigente.
create or replace function public.store_is_live(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.stores s
    left join public.subscriptions sub on sub.store_id = s.id
    where s.id = p_store_id
      and s.is_published
      and s.deleted_at is null
      and (sub.id is null or sub.status in ('prueba', 'activa'))
  )
$$;

-- ----------------------------------------------------------------------------
-- Sembrar una tienda desde una plantilla.
--
-- Copia las páginas y bloques que define la plantilla. Es idempotente por
-- página: volver a aplicar la misma plantilla no duplica.
-- ----------------------------------------------------------------------------
create or replace function public.apply_template(
  p_store_id uuid,
  p_template_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page record;
  v_block jsonb;
  v_page_id uuid;
  v_pos int;
begin
  if p_store_id is distinct from public.my_store_id() then
    raise exception 'La tienda no pertenece al usuario';
  end if;

  update public.stores
     set template_key = p_template_key,
         theme = coalesce((select theme from public.templates where key = p_template_key), '{}'::jsonb),
         updated_at = now()
   where id = p_store_id;

  for v_page in
    select * from public.template_pages where template_key = p_template_key
  loop
    insert into public.store_pages (store_id, key, title, is_home, status)
    values (p_store_id, v_page.page_key, v_page.title, v_page.is_home, 'borrador')
    on conflict do nothing
    returning id into v_page_id;

    -- Si la página ya existía, se reemplazan sus bloques.
    if v_page_id is null then
      select id into v_page_id from public.store_pages
       where store_id = p_store_id and key = v_page.page_key and deleted_at is null;

      update public.store_blocks
         set deleted_at = now()
       where page_id = v_page_id and deleted_at is null;
    end if;

    v_pos := 0;
    for v_block in select * from jsonb_array_elements(v_page.blocks)
    loop
      insert into public.store_blocks (store_id, page_id, block_type_key, position, props)
      values (
        p_store_id,
        v_page_id,
        v_block->>'block_type_key',
        v_pos,
        coalesce(v_block->'props', '{}'::jsonb)
      );
      v_pos := v_pos + 1;
    end loop;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Sumarse a una tienda como vendedor.
--
-- El estado inicial lo decide la tienda, no el cliente: abierta entra activo,
-- con aprobación entra pendiente.
-- ----------------------------------------------------------------------------
create or replace function public.join_store(p_store_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_store record;
  v_existing uuid;
  v_status public.seller_status;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Hace falta iniciar sesión';
  end if;

  select id, owner_id, seller_network_enabled, seller_join_mode
    into v_store
    from public.stores
   where slug = p_store_slug and is_published and deleted_at is null;

  if v_store.id is null then
    raise exception 'La tienda no existe o no está publicada';
  end if;

  if not v_store.seller_network_enabled then
    raise exception 'Esta tienda no tiene la red de vendedores activada';
  end if;

  if v_store.owner_id = v_user_id then
    raise exception 'No podés ser vendedor de tu propia tienda';
  end if;

  select id into v_existing
    from public.store_sellers
   where store_id = v_store.id and user_id = v_user_id and deleted_at is null;

  if v_existing is not null then
    return v_existing;
  end if;

  -- El perfil de vendedor se crea al primer vínculo, si todavía no existe.
  insert into public.seller_profiles (user_id, display_name, slug)
  select
    v_user_id,
    coalesce(p.full_name, 'Vendedor'),
    lower(regexp_replace(coalesce(p.full_name, 'vendedor'), '[^a-zA-Z0-9]+', '-', 'g'))
      || '-' || substr(replace(v_user_id::text, '-', ''), 1, 6)
  from public.profiles p
  where p.id = v_user_id
  on conflict (user_id) do nothing;

  v_status := case v_store.seller_join_mode
                when 'abierta' then 'activo'::public.seller_status
                else 'pendiente'::public.seller_status
              end;

  insert into public.store_sellers (store_id, user_id, referral_code, status, approved_at)
  values (
    v_store.id,
    v_user_id,
    public.generate_referral_code(),
    v_status,
    case when v_status = 'activo' then now() else null end
  )
  returning id into v_id;

  return v_id;
end $$;

-- ----------------------------------------------------------------------------
-- Crear un pedido.
--
-- El comprador es anónimo, así que NO puede insertar en `orders` directamente:
-- podría declarar el total que quiera. Acá el servidor recalcula cada precio
-- desde el catálogo y resuelve el código de referido validando que pertenezca
-- a esta tienda y esté activo.
--
-- `p_items` es [{"product_id": uuid, "quantity": int}, ...]
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
    commission_bps, commission_cents, net_to_store_cents
  )
  values (
    p_store_id, btrim(p_buyer_name), btrim(p_buyer_phone), nullif(btrim(coalesce(p_buyer_email, '')), ''),
    v_seller_id,
    case when v_seller_id is not null then upper(btrim(p_referral_code)) else null end,
    0, 0, v_commission_bps, 0, 0
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest((v_item->>'quantity')::int, 1);

    -- El precio sale del catálogo, nunca del cliente.
    select id, name, price_cents, stock
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
  end loop;

  v_commission := (v_subtotal * v_commission_bps) / 10000;

  update public.orders
     set subtotal_cents = v_subtotal,
         total_cents = v_subtotal,
         commission_cents = v_commission,
         net_to_store_cents = v_subtotal - v_commission,
         updated_at = now()
   where id = v_order_id;

  return v_order_id;
end $$;

-- ----------------------------------------------------------------------------
-- Permisos explícitos.
--
-- El checkout lo llama un comprador sin cuenta, así que `create_order` tiene
-- que ser ejecutable por el rol anónimo. El resto exige sesión.
-- ----------------------------------------------------------------------------
revoke all on function public.create_order(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.create_order(uuid, text, text, text, text, jsonb) to anon, authenticated;

revoke all on function public.join_store(text) from public;
grant execute on function public.join_store(text) to authenticated;

revoke all on function public.apply_template(uuid, text) from public;
grant execute on function public.apply_template(uuid, text) to authenticated;

grant execute on function public.store_is_live(uuid) to anon, authenticated;
grant execute on function public.my_store_id() to authenticated;
grant execute on function public.my_seller_ids() to authenticated;
