-- ============================================================================
-- Las consultas del panel de administración.
--
-- Contar tiendas distintas con un producto, una visita o una venta, o cruzar
-- cada tienda con su dueño y sus números, no se hace bien desde PostgREST: son
-- funciones de una sola vuelta. Las llama solo el servidor, detrás de
-- `exigirAdmin()`: no se exponen ni a `anon` ni a `authenticated`.
-- ============================================================================

create or replace function public.admin_resumen()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with
    dia as (select (now() at time zone 'America/La_Paz')::date as hoy),
    tiendas as (select * from public.stores where deleted_at is null)
  select jsonb_build_object(
    'tiendas', (select count(*) from tiendas),
    'tiendas_nuevas_7d', (select count(*) from tiendas where created_at > now() - interval '7 days'),
    'publicadas', (select count(*) from tiendas t where public.store_is_live(t.id)),
    'pausadas', (select count(*) from tiendas where suspended_at is not null),
    'en_prueba', (select count(*) from public.subscriptions s join tiendas t on t.id = s.store_id where s.status = 'prueba'),
    'activas', (select count(*) from public.subscriptions s join tiendas t on t.id = s.store_id where s.status = 'activa'),
    'bloqueadas', (select count(*) from public.subscriptions s join tiendas t on t.id = s.store_id where s.status = 'bloqueada'),
    'pedidos_30d', (select count(*) from public.orders where created_at > now() - interval '30 days'),
    'ventas_30d_cents', (select coalesce(sum(total_cents), 0) from public.orders where status = 'pagado' and created_at > now() - interval '30 days'),
    'visitas_7d', (select coalesce(sum(visits), 0) from public.store_visits_daily, dia where kind in ('portada', 'catalogo', 'producto') and day > dia.hoy - 7),
    'visitas_30d', (select coalesce(sum(visits), 0) from public.store_visits_daily, dia where kind in ('portada', 'catalogo', 'producto') and day > dia.hoy - 30),
    'embudo', jsonb_build_object(
      'cuentas', (select count(*) from public.profiles where deleted_at is null and id not in (select user_id from public.platform_admins)),
      'tiendas', (select count(*) from tiendas where template_key is not null),
      'con_producto', (select count(distinct p.store_id) from public.products p join tiendas t on t.id = p.store_id where p.deleted_at is null),
      'con_visita', (select count(distinct v.store_id) from public.store_visits_daily v join tiendas t on t.id = v.store_id),
      'con_pedido', (select count(distinct o.store_id) from public.orders o join tiendas t on t.id = o.store_id),
      'con_venta', (select count(distinct o.store_id) from public.orders o join tiendas t on t.id = o.store_id where o.status = 'pagado')
    ),
    'ia_24h', jsonb_build_object(
      'pedidos', (select count(*) from public.ai_requests where created_at > now() - interval '24 hours'),
      'fallas', (select count(*) from public.ai_requests where not ok and created_at > now() - interval '24 hours'),
      'ms_promedio', (select coalesce(round(avg(ms)), 0) from public.ai_requests where ok and created_at > now() - interval '24 hours'),
      'ms_p95', (select coalesce(percentile_disc(0.95) within group (order by ms), 0) from public.ai_requests where ok and created_at > now() - interval '24 hours')
    )
  )
$$;

create or replace function public.admin_tiendas()
returns table (
  id               uuid,
  nombre           text,
  slug             text,
  dueno            text,
  plantilla        text,
  creada           timestamptz,
  publicada        boolean,
  pausada          boolean,
  suscripcion      text,
  prueba_hasta     timestamptz,
  productos        bigint,
  pedidos_30d      bigint,
  ventas_30d_cents bigint,
  visitas_7d       bigint,
  visitas_30d      bigint,
  ultima_actividad timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with dia as (select (now() at time zone 'America/La_Paz')::date as hoy)
  select
    s.id,
    s.name,
    s.slug,
    u.email::text,
    s.template_key,
    s.created_at,
    s.is_published,
    s.suspended_at is not null,
    sub.status::text,
    sub.trial_ends_at,
    (select count(*) from public.products p where p.store_id = s.id and p.deleted_at is null),
    (select count(*) from public.orders o where o.store_id = s.id and o.created_at > now() - interval '30 days'),
    (select coalesce(sum(o.total_cents), 0) from public.orders o where o.store_id = s.id and o.status = 'pagado' and o.created_at > now() - interval '30 days'),
    (select coalesce(sum(v.visits), 0) from public.store_visits_daily v, dia where v.store_id = s.id and v.kind in ('portada', 'catalogo', 'producto') and v.day > dia.hoy - 7),
    (select coalesce(sum(v.visits), 0) from public.store_visits_daily v, dia where v.store_id = s.id and v.kind in ('portada', 'catalogo', 'producto') and v.day > dia.hoy - 30),
    greatest(
      s.updated_at,
      (select max(p.updated_at) from public.products p where p.store_id = s.id),
      (select max(o.created_at) from public.orders o where o.store_id = s.id)
    )
  from public.stores s
  left join auth.users u on u.id = s.owner_id
  left join public.subscriptions sub on sub.store_id = s.id
  where s.deleted_at is null
  order by s.created_at desc
$$;

revoke all on function public.admin_resumen() from public, anon, authenticated;
revoke all on function public.admin_tiendas() from public, anon, authenticated;
grant execute on function public.admin_resumen() to service_role;
grant execute on function public.admin_tiendas() to service_role;
