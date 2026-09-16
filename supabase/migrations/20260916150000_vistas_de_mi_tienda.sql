-- ============================================================================
-- Venduo — 0021 las vistas que ve la IA
--
-- RLS impide que la IA lea datos privados de otra tienda, pero no alcanza: la
-- política de `products` deja leer el catálogo de **toda tienda publicada**
-- —hace falta para que un comprador navegue— y la de `seller_profiles` es
-- pública por el historial laboral. Con las tablas base a la vista, una
-- pregunta como "mis productos más vendidos" podía devolver los de todos.
--
-- No es una fuga de datos privados: es una fuente de respuestas incorrectas,
-- que para una herramienta de análisis es igual de grave.
--
-- La salida es que la IA no escriba contra las tablas sino contra estas vistas,
-- cada una ya acotada a `my_store_id()`. El alcance deja de depender de que el
-- modelo se acuerde de poner un WHERE, y de paso el esquema que tiene que
-- entender es más chico: acá no existe `store_id`.
-- ============================================================================

create or replace view public.mis_ventas as
select o.id,
       o.created_at,
       o.status,
       o.total_cents,
       o.commission_cents,
       o.commission_base_cents,
       o.seller_id,
       o.referral_code
  from public.orders o
 where o.store_id = public.my_store_id();

comment on view public.mis_ventas is
  'Pedidos de mi tienda. status: pendiente, pagado, enviado, entregado, cancelado. Montos en centavos.';

create or replace view public.mis_items as
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

create or replace view public.mis_productos as
select p.id,
       p.name,
       p.category,
       p.condition,
       p.price_cents,
       p.compare_at_price_cents,
       p.stock,
       p.is_active,
       p.seller_enabled,
       p.created_at
  from public.products p
 where p.store_id = public.my_store_id()
   and p.deleted_at is null;

comment on view public.mis_productos is
  'Catálogo de mi tienda. condition: nuevo, segunda_mano, reacondicionado.';

create or replace view public.mis_vendedores as
select ss.id,
       coalesce(sp.display_name, 'Vendedor') as nombre,
       sp.city as ciudad,
       ss.status,
       ss.referral_code,
       ss.joined_at
  from public.store_sellers ss
  left join public.seller_profiles sp on sp.user_id = ss.user_id
 where ss.store_id = public.my_store_id()
   and ss.deleted_at is null;

comment on view public.mis_vendedores is
  'Vendedores vinculados a mi tienda. status: pendiente, activo, rechazado, suspendido.';

create or replace view public.mis_comisiones as
select c.id,
       c.created_at,
       c.status,
       c.amount_cents,
       c.base_amount_cents,
       c.rate_bps,
       coalesce(sp.display_name, 'Vendedor') as nombre
  from public.commissions c
  left join public.seller_profiles sp on sp.user_id = c.seller_user_id
 where c.store_id = public.my_store_id();

comment on view public.mis_comisiones is
  'Comisiones generadas en mi tienda. status: pendiente, confirmada, pagada, anulada.';

grant select on public.mis_ventas, public.mis_items, public.mis_productos,
                public.mis_vendedores, public.mis_comisiones
   to authenticated;

-- ----------------------------------------------------------------------------
-- La consulta solo puede tocar las vistas.
--
-- Se rechaza cualquier mención a una tabla base. Los nombres no colisionan:
-- `mis_productos` no dispara la regla de `products` porque el guion bajo es
-- carácter de palabra y no hay frontera entre `mis_` y el resto.
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
  if v_sql ~* '\m(orders|order_items|products|commissions|store_sellers|seller_profiles|profiles|stores|subscriptions|store_pages|store_blocks|store_invites|insights|ai_generations|social_connections|social_posts|templates|template_pages|block_types|plans|sectors|users)\M' then
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
