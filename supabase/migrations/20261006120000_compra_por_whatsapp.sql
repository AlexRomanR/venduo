-- ============================================================================
-- Venduo — la compra se cierra por WhatsApp
--
-- Tres cambios de producto que se resuelven juntos porque tocan las mismas
-- tablas:
--
-- 1. **El comprador no deja datos.** Ve su carrito, toca "Enviar a WhatsApp" y
--    le escribe a la tienda. El pedido se guarda igual, sin nombre ni teléfono,
--    para que el panel, el stock y las estadísticas sigan teniendo de dónde
--    leer. El cobro y la entrega los arreglan la tienda y el comprador en el
--    chat: se van el QR de pago, el comprobante y los estados de envío.
--
-- 2. **El stock baja al confirmar el pago, no al crear el pedido.** Un pedido
--    anónimo cuesta un toque, y muchos no terminan en un mensaje. Si el stock
--    bajara al tocar el botón, cualquiera podría vaciar una tienda tocándolo
--    en bucle, y un carrito abandonado retendría unidades sin que el dueño
--    supiera de quién. El pedido comprueba que haya stock; lo descuenta el
--    dueño cuando marca el pedido pagado.
--
-- 3. **No hay red de vendedores.** Se borran sus tablas, funciones, columnas y
--    políticas. Es destructivo a propósito: vínculos, comisiones y perfiles de
--    vendedor desaparecen y no se recuperan.
--
-- La migración es reejecutable. Lo que no se puede hacer dos veces —devolver el
-- stock de los pendientes y reescribir los estados— va dentro de un bloque que
-- solo corre mientras el estado `enviado` siga existiendo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Políticas que dependen de lo que se borra.
--
-- Van primero: `my_seller_ids()` no se puede borrar mientras una política la
-- use, y un `drop ... cascade` se llevaría la política entera sin avisar.
-- ----------------------------------------------------------------------------
drop policy if exists "pedidos referidos: leer" on public.orders;
drop policy if exists "items referidos: leer" on public.order_items;

-- Sin comprobantes no hay nada que subir. La de subida dejaba escribir a
-- cualquiera, sin cuenta, en `payment-proofs`.
drop policy if exists "comprobantes: subir" on storage.objects;
drop policy if exists "comprobantes: leer propios" on storage.objects;

-- ----------------------------------------------------------------------------
-- 2. Las vistas de la IA se rehacen al final, sin vendedores ni comisiones.
--
-- Se borran y no se reemplazan: `create or replace view` no admite quitar
-- columnas, y `mis_ventas` y `mis_items` dependen de `orders.status`, que más
-- abajo cambia de tipo.
-- ----------------------------------------------------------------------------
drop view if exists public.mis_comisiones;
drop view if exists public.mis_vendedores;
drop view if exists public.mis_ventas;
drop view if exists public.mis_items;
drop view if exists public.mis_productos;

-- ----------------------------------------------------------------------------
-- 3. Los estados del pedido: pendiente, pagado y cancelado.
--
-- Postgres no quita un valor de un enum: se arma uno nuevo y se pasa la
-- columna. Los pedidos enviados, entregados o en disputa ya estaban pagados.
--
-- Antes, los pendientes descontaban stock al crearse. Con la regla nueva lo
-- descuenta el pago, así que se devuelve el de los pendientes que ya hay: si
-- no, marcarlos pagados lo descontaría dos veces.
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'public'
       and t.typname = 'order_status'
       and e.enumlabel = 'enviado'
  ) then
    update public.products p
       set stock = p.stock + r.cantidad,
           updated_at = now()
      from (
        select oi.product_id, sum(oi.quantity)::int as cantidad
          from public.order_items oi
          join public.orders o on o.id = oi.order_id
         where o.status = 'pendiente'
           and oi.product_id is not null
         group by oi.product_id
      ) r
     where p.id = r.product_id;

    -- El disparador viejo se borra antes de tocar los estados: no tiene que
    -- crear comisiones ni mover stock por esta reescritura.
    drop trigger if exists on_order_status_change on public.orders;

    update public.orders
       set status = 'pagado',
           paid_at = coalesce(paid_at, updated_at)
     where status in ('enviado', 'entregado', 'en_disputa');

    alter type public.order_status rename to order_status_anterior;
    create type public.order_status as enum ('pendiente', 'pagado', 'cancelado');

    alter table public.orders alter column status drop default;
    alter table public.orders
      alter column status type public.order_status
      using status::text::public.order_status;
    alter table public.orders alter column status set default 'pendiente';

    drop type public.order_status_anterior;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 4. El pedido sin comprador, sin vendedor y sin comprobante.
--
-- `buyer_*` se queda, opcional: los pedidos viejos guardan a quién se le
-- vendió, y esa historia no se borra.
-- ----------------------------------------------------------------------------
alter table public.orders alter column buyer_name drop not null;
alter table public.orders alter column buyer_phone drop not null;

alter table public.orders drop column if exists seller_id;
alter table public.orders drop column if exists referral_code;
alter table public.orders drop column if exists commission_bps;
alter table public.orders drop column if exists commission_base_cents;
alter table public.orders drop column if exists commission_cents;
alter table public.orders drop column if exists net_to_store_cents;
alter table public.orders drop column if exists payment_proof_url;

-- La tienda: sin red de vendedores y sin datos de cobro. `whatsapp` se queda:
-- es a donde llega cada pedido.
alter table public.stores drop column if exists commission_bps;
alter table public.stores drop column if exists seller_network_enabled;
alter table public.stores drop column if exists seller_join_mode;
alter table public.stores drop column if exists payment_qr_url;
alter table public.stores drop column if exists payment_instructions;

alter table public.products drop column if exists seller_enabled;

-- `primary_role` decidía entre la tienda y el panel del vendedor. Sin
-- vendedores, toda cuenta va a su tienda.
alter table public.profiles drop column if exists primary_role;

-- ----------------------------------------------------------------------------
-- 5. Las tablas de la red de vendedores.
--
-- `commissions` antes que `store_sellers`, que es a quien apunta.
-- ----------------------------------------------------------------------------
drop table if exists public.commissions;
drop table if exists public.store_invites;
drop table if exists public.store_sellers;
drop table if exists public.seller_profiles;

-- ----------------------------------------------------------------------------
-- 6. Las funciones que ya no tienen a quién servir.
--
-- Por nombre y en todas sus firmas: `create_store` y `create_order` cambiaron
-- de argumentos más de una vez, y una sobrecarga vieja olvidada seguiría
-- abierta a `anon`. Las dos se vuelven a crear abajo con su firma nueva.
--
-- `run_insight` e `insight_filtro` son la primera versión de las estadísticas,
-- reemplazada por `run_insight_sql`, y todavía sabían de vendedores.
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as firma
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in (
         'join_store', 'take_product', 'my_seller_invite',
         'rotate_seller_invite', 'seller_public_stats', 'seller_public_stores',
         'referido_publico', 'ensure_seller_profile', 'generate_invite_code',
         'generate_referral_code', 'my_seller_ids', 'adjuntar_comprobante',
         'pedido_publico', 'run_insight', 'insight_filtro',
         'create_order', 'create_store'
       )
  loop
    execute format('drop function %s', r.firma);
  end loop;
end $$;

drop type if exists public.commission_status;
drop type if exists public.seller_status;
drop type if exists public.seller_join_mode;
drop type if exists public.user_role;

-- ----------------------------------------------------------------------------
-- 7. El alta de una cuenta: solo el perfil.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end $$;

-- ----------------------------------------------------------------------------
-- 8. El alta de la tienda, con su WhatsApp.
--
-- Obligatorio porque ahí llega cada pedido: una tienda sin número tendría un
-- botón de compra que no le escribe a nadie. Se exige acá y no con un
-- `not null` en la columna porque las tiendas que ya existen pueden no
-- tenerlo, y una restricción haría fallar cualquier cambio que se les haga.
-- Se guardan solo las cifras.
-- ----------------------------------------------------------------------------
create or replace function public.create_store(
  p_name          text,
  p_description   text,
  p_template_key  text,
  p_whatsapp      text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid := (select auth.uid());
  v_store_id uuid;
  v_whatsapp text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  v_base     text;
  v_slug     text;
  v_intento  int := 0;
  v_plan     text;
  v_dias     int;
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

  -- Ocho cifras es un celular de Bolivia; hasta quince, uno con su código
  -- de país.
  if length(v_whatsapp) not between 8 and 15 then
    raise exception 'Falta el WhatsApp de la tienda';
  end if;

  if not exists (
    select 1 from public.templates
     where key = p_template_key and is_active
  ) then
    raise exception 'La plantilla no existe';
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
    owner_id, name, slug, description, template_key, whatsapp
  )
  values (
    v_user_id,
    btrim(p_name),
    v_slug,
    nullif(btrim(coalesce(p_description, '')), ''),
    p_template_key,
    v_whatsapp
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

-- ----------------------------------------------------------------------------
-- 9. El pedido que sale por WhatsApp.
--
-- Recibe solo la tienda y los productos. Recalcula cada precio desde el
-- catálogo y comprueba el stock, pero no lo descuenta (ver el encabezado).
--
-- Devuelve el número, las líneas con sus precios y el WhatsApp de la tienda:
-- el mensaje se arma con lo que calculó el servidor, no con lo que decía el
-- carrito del navegador.
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

  insert into public.orders (store_id, subtotal_cents, total_cents)
  values (p_store_id, 0, 0)
  returning id, order_number into v_order_id, v_numero;

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

-- ----------------------------------------------------------------------------
-- 10. Lo que se sigue de un cambio de estado.
--
-- Corre antes de guardar, así un stock que no alcanza frena el cambio en vez
-- de dejar el pedido pagado con productos en negativo.
--
-- - **pagado**: descuenta el stock y fecha el pago.
-- - **cancelado** desde pagado: devuelve el stock. Desde pendiente no hay nada
--   que devolver, porque nunca se descontó.
-- - Un pedido cancelado no vuelve, y uno pagado no vuelve a pendiente: el
--   stock quedaría contado dos veces o ninguna.
-- ----------------------------------------------------------------------------
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

drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
  before update of status on public.orders
  for each row execute function public.handle_order_status_change();

-- ----------------------------------------------------------------------------
-- 11. Las vistas de la IA, sin vendedores ni comisiones.
-- ----------------------------------------------------------------------------
create view public.mis_ventas as
select o.id,
       o.order_number as numero,
       o.created_at,
       o.status,
       o.total_cents
  from public.orders o
 where o.store_id = public.my_store_id();

comment on view public.mis_ventas is
  'Pedidos de mi tienda. status: pendiente, pagado, cancelado. Montos en centavos.';

create view public.mis_items as
select oi.id,
       oi.order_id,
       oi.product_name,
       oi.quantity,
       oi.unit_price_cents,
       (oi.quantity * oi.unit_price_cents) as total_cents,
       o.created_at,
       o.status
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
 where oi.store_id = public.my_store_id();

comment on view public.mis_items is
  'Líneas de pedido de mi tienda: qué producto se vendió, cuántas unidades y a qué precio.';

create view public.mis_productos as
select p.id,
       p.name,
       p.category,
       p.condition,
       p.price_cents,
       p.compare_at_price_cents,
       p.stock,
       p.is_active,
       p.created_at,
       p.low_stock_threshold,
       p.sku,
       p.is_featured
  from public.products p
 where p.store_id = public.my_store_id()
   and p.deleted_at is null;

comment on view public.mis_productos is
  'Catálogo de mi tienda. condition: nuevo, segunda_mano, reacondicionado.';

grant select on public.mis_ventas, public.mis_items, public.mis_productos
   to authenticated;

-- ----------------------------------------------------------------------------
-- 12. La consulta de la IA, contra las tres vistas que quedan.
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
  if v_sql ~* '\m(orders|order_items|products|product_categories|profiles|stores|subscriptions|store_pages|store_blocks|store_design_versions|catalogs|insights|ai_generations|social_connections|social_posts|templates|template_pages|block_types|plans|sectors|users)\M' then
    raise exception 'Usa las vistas mis_ventas, mis_items o mis_productos';
  end if;

  if v_sql ~* '\m(pg_sleep|pg_read_file|pg_read_binary_file|lo_import|lo_export|dblink|set_config|current_setting)\M' then
    raise exception 'Esa función no está permitida';
  end if;

  set local transaction read only;
  set local statement_timeout = '8s';

  return query execute 'select q.etiqueta::text, q.valor::numeric from (' || v_sql || ') as q limit 200';
end $$;

-- ----------------------------------------------------------------------------
-- 13. Permisos.
-- ----------------------------------------------------------------------------
revoke all on function public.create_order(uuid, jsonb) from public;
grant execute on function public.create_order(uuid, jsonb) to anon, authenticated;

revoke all on function public.create_store(text, text, text, text) from public;
grant execute on function public.create_store(text, text, text, text) to authenticated;

revoke all on function public.run_insight_sql(text) from public;
grant execute on function public.run_insight_sql(text) to authenticated;
