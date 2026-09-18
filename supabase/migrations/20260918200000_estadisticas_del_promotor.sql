-- ============================================================================
-- Venduo — estadísticas del promotor por lenguaje natural
--
-- El negocio pregunta contra las vistas `mis_*`, acotadas a `my_store_id()`.
-- Un promotor no tiene tienda: con esas vistas vería todo vacío. Estas son sus
-- equivalentes, acotadas a quien pregunta y cruzando todos los negocios donde
-- vende, que es como funciona su panel.
--
-- Las vistas corren con los permisos de su dueño, así que el alcance lo da el
-- WHERE sobre `auth.uid()`, igual que el de `mis_*` lo da `my_store_id()`. Para
-- `anon` devuelven vacío.
-- ============================================================================

-- Pedidos que trajo con alguno de sus códigos.
--
-- `comprador` es un hash y no el teléfono: sirve para contar compradores
-- distintos sin que la IA —ni la respuesta— vea el número de nadie.
create or replace view public.promotor_ventas as
select o.id,
       o.created_at,
       o.status,
       o.total_cents,
       s.name as negocio,
       md5(coalesce(o.buyer_key, o.id::text)) as comprador
  from public.orders o
  join public.store_sellers ss on ss.id = o.seller_id
  left join public.stores s on s.id = o.store_id
 where ss.user_id = (select auth.uid());

comment on view public.promotor_ventas is
  'Pedidos que trajo el promotor con su enlace, en todos los negocios. Montos en centavos.';

create or replace view public.promotor_items as
select oi.id,
       oi.order_id,
       oi.product_name,
       oi.quantity,
       oi.unit_price_cents,
       (oi.quantity * oi.unit_price_cents) as total_cents,
       o.created_at,
       o.status,
       s.name as negocio
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  join public.store_sellers ss on ss.id = o.seller_id
  left join public.stores s on s.id = o.store_id
 where ss.user_id = (select auth.uid());

comment on view public.promotor_items is
  'Líneas de los pedidos que trajo el promotor: qué producto, cuántas unidades y a qué precio.';

-- Directas e indirectas, las dos. `negocio` es la copia congelada del nombre:
-- sobrevive a la purga de una tienda, como el historial laboral.
create or replace view public.promotor_comisiones as
select c.id,
       c.created_at,
       c.status,
       c.kind as tipo,
       c.amount_cents,
       c.base_amount_cents,
       c.rate_bps,
       c.store_name as negocio
  from public.commissions c
 where c.seller_user_id = (select auth.uid());

comment on view public.promotor_comisiones is
  'Comisiones del promotor. tipo: directa (con su enlace) o indirecta (comprador que trajo). status: pendiente, confirmada, pagada, anulada.';

-- Los productos que tomó. La ganancia por unidad se calcula igual que en
-- `create_order`: el take-rate redondeado y la comisión como lo que falta.
create or replace view public.promotor_enlaces as
select spx.id,
       p.name as producto,
       p.category as categoria,
       s.name as negocio,
       p.price_cents,
       greatest(
         p.price_cents - p.base_cost_cents
           - round(p.base_cost_cents * coalesce(p.take_bps, 0) / 10000.0)::int,
         0
       ) as ganancia_cents,
       p.stock,
       (p.is_active and p.seller_enabled and p.deleted_at is null and p.stock > 0)
         as disponible,
       spx.taken_at
  from public.seller_products spx
  join public.products p on p.id = spx.product_id
  left join public.stores s on s.id = spx.store_id
 where spx.user_id = (select auth.uid())
   and spx.deleted_at is null;

comment on view public.promotor_enlaces is
  'Productos que el promotor tomó para promocionar, con lo que gana por unidad.';

revoke all on public.promotor_ventas, public.promotor_items,
              public.promotor_comisiones, public.promotor_enlaces
  from anon;
grant select on public.promotor_ventas, public.promotor_items,
                public.promotor_comisiones, public.promotor_enlaces
  to authenticated;

-- ----------------------------------------------------------------------------
-- El tablero del promotor.
--
-- Tabla aparte y no `insights` con `store_id` anulable: la política de esa
-- tabla es por tienda, y mezclar los dos alcances en una sola política es
-- justo lo que se rompe sin que nadie lo note.
-- ----------------------------------------------------------------------------
create table if not exists public.seller_insights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  titulo      text not null,
  pregunta    text not null,
  spec        jsonb not null,
  posicion    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists seller_insights_user_idx
  on public.seller_insights (user_id, posicion) where deleted_at is null;

alter table public.seller_insights enable row level security;

-- ----------------------------------------------------------------------------
-- La consulta de la IA puede tocar también las vistas del promotor.
--
-- La lista de tablas base suma las que se crearon después de la última
-- versión: `seller_products`, `buyer_attributions`, `block_edit_proposals` y
-- la nueva `seller_insights`. RLS ya las protegía; esto evita respuestas que
-- mezclen datos de otros.
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

  -- Solo las vistas del panel. Nombrar una tabla base corta la consulta.
  if v_sql ~* '\m(orders|order_items|products|product_categories|pricing_tiers|commissions|store_sellers|seller_products|buyer_attributions|seller_profiles|profiles|stores|subscriptions|store_pages|store_blocks|block_edit_proposals|store_design_versions|store_invites|insights|seller_insights|ai_generations|social_connections|social_posts|templates|template_pages|block_types|plans|sectors|users)\M' then
    raise exception 'Usa las vistas de tu panel: mis_* para tu tienda o promotor_* para tus ventas como promotor';
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
