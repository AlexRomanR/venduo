-- ============================================================================
-- Los avisos de la app móvil: pedido nuevo, cobros pendientes y stock bajo.
--
-- La app registra el celular con su token de Expo y la base le avisa sola: un
-- disparador al crearse un pedido, otro cuando una venta deja un producto sin
-- stock o con poco, y una tarea diaria para lo que quedó sin cobrar.
--
-- Los avisos salen de la base y no de un servidor porque el hecho que los
-- dispara ocurre acá —un pedido que se confirma— y así no hay un segundo
-- lugar que tenga que enterarse. `pg_net` manda el pedido HTTP a Expo después
-- de confirmada la transacción y sin esperar la respuesta: avisar nunca demora
-- ni hace fallar una compra.
--
-- No viaja ningún secreto: el servicio de avisos de Expo recibe el token del
-- celular, que solo sirve para avisarle a ese celular.
-- ============================================================================

create extension if not exists pg_net;
create extension if not exists pg_cron with schema pg_catalog;

-- ----------------------------------------------------------------------------
-- Los celulares que reciben avisos
-- ----------------------------------------------------------------------------

create table if not exists public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- El token de Expo de esa instalación de la app: `ExponentPushToken[...]`.
  token       text not null,
  platform    text not null check (platform in ('android', 'ios')),
  device_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz default null
);

-- Un token es de una sola cuenta a la vez. Parcial: uno dado de baja no
-- bloquea que el mismo celular vuelva a registrarse.
create unique index if not exists push_tokens_token_idx
  on public.push_tokens (token) where deleted_at is null;

create index if not exists push_tokens_user_idx
  on public.push_tokens (user_id) where deleted_at is null;

alter table public.push_tokens enable row level security;

-- Qué avisos quiere cada persona. Sin fila, los quiere todos: apagar uno es
-- una decisión, recibirlos es el punto de tener la app.
create table if not exists public.notification_preferences (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  new_orders     boolean not null default true,
  pending_orders boolean not null default true,
  low_stock      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

-- ----------------------------------------------------------------------------
-- Registrar y olvidar un celular
-- ----------------------------------------------------------------------------

-- No es un `insert` desde la app: el mismo celular puede pasar de una cuenta a
-- otra —alguien cierra sesión y entra otra persona— y la fila anterior es de
-- alguien más, así que RLS no dejaría tocarla. La función se la queda quien
-- está usando el celular ahora.
create or replace function public.registrar_dispositivo(
  p_token       text,
  p_platform    text,
  p_device_name text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then
    raise exception 'Necesitas iniciar sesión';
  end if;

  if p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,80}\]$' then
    raise exception 'Ese token no es de Expo';
  end if;

  if p_platform not in ('android', 'ios') then
    raise exception 'Plataforma desconocida';
  end if;

  -- Si estaba a nombre de otra cuenta, deja de estarlo: los pedidos de una
  -- tienda no le pueden llegar a quien ya salió de ella.
  update public.push_tokens
     set deleted_at = now(), updated_at = now()
   where token = p_token
     and deleted_at is null
     and user_id <> v_user;

  insert into public.push_tokens (user_id, token, platform, device_name)
  values (v_user, p_token, p_platform, nullif(btrim(left(coalesce(p_device_name, ''), 80)), ''))
  on conflict (token) where deleted_at is null
  do update set
    platform    = excluded.platform,
    device_name = excluded.device_name,
    updated_at  = now();
end $$;

-- Al cerrar sesión: este celular deja de recibir los avisos de esta cuenta.
create or replace function public.olvidar_dispositivo(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.push_tokens
     set deleted_at = now(), updated_at = now()
   where token = p_token
     and user_id = (select auth.uid())
     and deleted_at is null;
$$;

revoke all on function public.registrar_dispositivo(text, text, text) from public, anon;
revoke all on function public.olvidar_dispositivo(text) from public, anon;
grant execute on function public.registrar_dispositivo(text, text, text) to authenticated;
grant execute on function public.olvidar_dispositivo(text) to authenticated;

-- ----------------------------------------------------------------------------
-- Mandar un aviso
-- ----------------------------------------------------------------------------

-- Un monto en centavos como lo muestra la app: "Bs 8.500".
create or replace function public.monto_en_texto(p_cents bigint)
returns text
language sql
stable
set search_path = public
as $$
  select 'Bs ' || replace(to_char(round(p_cents / 100.0), 'FM999G999G999G990'), ',', '.');
$$;

-- Le avisa a todos los celulares de una persona. Interna: la llaman los
-- disparadores y la tarea diaria, nunca la app.
--
-- Todo va dentro de un bloque que atrapa cualquier error: se llama desde el
-- disparador de un pedido, y un aviso que no sale no puede hacer fallar la
-- compra de nadie.
create or replace function public.enviar_aviso(
  p_user_id uuid,
  p_tipo    text,  -- 'new_orders' | 'pending_orders' | 'low_stock'
  p_titulo  text,
  p_cuerpo  text,
  p_url     text,
  p_canal   text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quiere   boolean;
  v_mensajes jsonb;
begin
  select case p_tipo
           when 'new_orders'     then new_orders
           when 'pending_orders' then pending_orders
           when 'low_stock'      then low_stock
         end
    into v_quiere
    from public.notification_preferences
   where user_id = p_user_id;

  -- Sin fila de preferencias, quiere todos.
  if coalesce(v_quiere, true) is false then
    return;
  end if;

  select jsonb_agg(jsonb_build_object(
           'to',        token,
           'title',     p_titulo,
           'body',      p_cuerpo,
           'data',      jsonb_build_object('url', p_url, 'tipo', p_tipo),
           'sound',     'default',
           'channelId', p_canal,
           'priority',  case when p_tipo = 'new_orders' then 'high' else 'default' end
         ))
    into v_mensajes
    from public.push_tokens
   where user_id = p_user_id
     and deleted_at is null;

  if v_mensajes is null then
    return;
  end if;

  perform net.http_post(
    url     := 'https://exp.host/--/api/v2/push/send',
    body    := v_mensajes,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept', 'application/json'
    )
  );
exception when others then
  -- Un aviso que no salió no es motivo para deshacer lo que lo provocó.
  raise warning 'No se pudo enviar el aviso: %', sqlerrm;
end $$;

revoke all on function public.enviar_aviso(uuid, text, text, text, text, text)
  from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- Pedido nuevo
-- ----------------------------------------------------------------------------

create or replace function public.avisar_pedido_nuevo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido    record;
  v_dueno     uuid;
  v_articulos int;
  v_primero   text;
  v_cuerpo    text;
begin
  -- El pedido se inserta en cero y recién después suma sus líneas: se vuelve a
  -- leer, que para eso el disparador corre al final de la transacción.
  select id, store_id, order_number, total_cents, status
    into v_pedido
    from public.orders
   where id = new.id;

  if v_pedido.id is null or v_pedido.status <> 'pendiente' then
    return null;
  end if;

  select owner_id into v_dueno
    from public.stores
   where id = v_pedido.store_id
     and deleted_at is null;

  if v_dueno is null then
    return null;
  end if;

  select coalesce(sum(quantity), 0),
         (array_agg(product_name order by created_at, id))[1]
    into v_articulos, v_primero
    from public.order_items
   where order_id = v_pedido.id;

  v_cuerpo := public.monto_en_texto(v_pedido.total_cents)
    || case
         when v_primero is null then ''
         when v_articulos > 1 then ' · ' || v_primero || ' y más'
         else ' · ' || v_primero
       end
    || '. Márcalo pagado cuando te paguen.';

  perform public.enviar_aviso(
    v_dueno,
    'new_orders',
    'Nuevo pedido #' || v_pedido.order_number,
    v_cuerpo,
    '/pedidos/' || v_pedido.id,
    'pedidos'
  );

  return null;
exception when others then
  raise warning 'avisar_pedido_nuevo: %', sqlerrm;
  return null;
end $$;

revoke all on function public.avisar_pedido_nuevo() from public, anon, authenticated;

-- Diferido: corre al confirmarse la transacción, cuando el pedido ya tiene su
-- total y sus líneas. Un pedido que se deshace no avisa.
drop trigger if exists on_order_created_notify on public.orders;
create constraint trigger on_order_created_notify
  after insert on public.orders
  deferrable initially deferred
  for each row execute function public.avisar_pedido_nuevo();

-- ----------------------------------------------------------------------------
-- Stock bajo
-- ----------------------------------------------------------------------------

-- Avisa cuando una venta deja un producto sin stock o por debajo de su umbral.
--
-- Solo cuando el stock lo movió otro disparador —el del pedido que se marcó
-- pagado—: si la persona lo cambió a mano, ya lo sabe. Y solo al cruzar el
-- umbral, no en cada unidad que baja después.
create or replace function public.avisar_stock_bajo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dueno uuid;
begin
  if pg_trigger_depth() < 2 then
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

  if new.stock = 0 and old.stock > 0 then
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

revoke all on function public.avisar_stock_bajo() from public, anon, authenticated;

drop trigger if exists on_product_stock_low_notify on public.products;
create trigger on_product_stock_low_notify
  after update of stock on public.products
  for each row
  when (new.stock < old.stock)
  execute function public.avisar_stock_bajo();

-- ----------------------------------------------------------------------------
-- Cobros pendientes, una vez al día
-- ----------------------------------------------------------------------------

-- A cada tienda con pedidos que llevan más de medio día esperando, uno solo
-- aviso con cuántos son y cuánto suman. Los que pasaron la semana ya no
-- cuentan: son los "no concretados" (`DIAS_PARA_CONCRETAR` en la aplicación).
create or replace function public.enviar_recordatorios()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tienda record;
begin
  for v_tienda in
    select s.owner_id,
           count(*)::int as pedidos,
           sum(o.total_cents)::bigint as total
      from public.orders o
      join public.stores s on s.id = o.store_id and s.deleted_at is null
     where o.status = 'pendiente'
       and o.created_at >= now() - interval '7 days'
       and o.created_at <  now() - interval '12 hours'
     group by s.owner_id
  loop
    perform public.enviar_aviso(
      v_tienda.owner_id,
      'pending_orders',
      case when v_tienda.pedidos = 1
           then 'Tienes 1 pedido por cobrar'
           else 'Tienes ' || v_tienda.pedidos || ' pedidos por cobrar'
      end,
      public.monto_en_texto(v_tienda.total)
        || ' en espera. Márcalos pagados cuando te paguen, o cancélalos si no se concretaron.',
      '/pedidos?estado=pendiente',
      'recordatorios'
    );
  end loop;

  -- Un token que no se renueva en dos meses es de una app que ya no se abre.
  update public.push_tokens
     set deleted_at = now()
   where deleted_at is null
     and updated_at < now() - interval '60 days';
end $$;

revoke all on function public.enviar_recordatorios() from public, anon, authenticated;

-- A las 9 de la mañana en Bolivia, que no cambia de hora: las 13:00 UTC.
do $$
begin
  perform cron.unschedule('venduo-recordatorios');
exception when others then
  null;
end $$;

select cron.schedule(
  'venduo-recordatorios',
  '0 13 * * *',
  $$select public.enviar_recordatorios()$$
);
