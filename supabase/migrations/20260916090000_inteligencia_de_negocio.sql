-- ============================================================================
-- Venduo — 0019 inteligencia de negocio
--
-- El emprendedor pregunta en sus palabras y recibe un gráfico. Lo que la IA
-- devuelve NO es SQL: es una especificación cerrada —conjunto, métrica,
-- dimensión, rango— que esta función compila. La diferencia es la que sostiene
-- las tres defensas que la regla exige:
--
--   1. La IA solo lee. Acá no hay más verbo que SELECT, y la función es
--      `stable`: Postgres rechaza cualquier escritura.
--   2. El `store_id` lo impone el sistema. Sale de `my_store_id()` dentro de la
--      función; el cliente no lo pasa y no puede influirlo. Un modelo no puede
--      redactar una consulta que cruce tenants porque no redacta la consulta.
--   3. Lista blanca de tablas, tope de filas y rango acotado. Cada fragmento
--      que se interpola sale de un CASE sobre un valor ya validado, nunca del
--      texto que llegó.
-- ============================================================================

create or replace function public.run_insight(
  p_dataset   text,
  p_metrica   text,
  p_dimension text,
  p_desde     date default null,
  p_hasta     date default null,
  p_limite    integer default 30
)
returns table (etiqueta text, valor numeric, orden text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_store  uuid := public.my_store_id();
  v_origen text;
  v_fecha  text;
  v_valor  text;
  v_dim    text;
  v_orden  text;
  v_limite int := least(greatest(coalesce(p_limite, 30), 1), 200);
  v_sql    text;
begin
  if v_store is null then
    raise exception 'No tienes una tienda';
  end if;

  -- --------------------------------------------------------------------
  -- Lista blanca de orígenes. Cualquier otro valor cae al `else` y corta.
  -- --------------------------------------------------------------------
  case p_dataset
    when 'ventas' then
      v_origen := 'public.orders o';
      v_fecha  := 'o.created_at';
    when 'productos' then
      v_origen := 'public.order_items oi join public.orders o on o.id = oi.order_id';
      v_fecha  := 'o.created_at';
    when 'vendedores' then
      v_origen := 'public.commissions c left join public.seller_profiles sp on sp.user_id = c.seller_user_id';
      v_fecha  := 'c.created_at';
    when 'catalogo' then
      v_origen := 'public.products p';
      v_fecha  := 'p.created_at';
    else
      raise exception 'Conjunto de datos no permitido: %', p_dataset;
  end case;

  -- --------------------------------------------------------------------
  -- Métricas, por conjunto. Los montos salen en centavos enteros.
  -- --------------------------------------------------------------------
  v_valor := case
    when p_dataset = 'ventas'     and p_metrica = 'ingresos'   then 'coalesce(sum(o.total_cents), 0)'
    when p_dataset = 'ventas'     and p_metrica = 'pedidos'    then 'count(*)'
    when p_dataset = 'ventas'     and p_metrica = 'ticket'     then 'coalesce(round(avg(o.total_cents)), 0)'
    when p_dataset = 'productos'  and p_metrica = 'unidades'   then 'coalesce(sum(oi.quantity), 0)'
    when p_dataset = 'productos'  and p_metrica = 'ingresos'   then 'coalesce(sum(oi.quantity * oi.unit_price_cents), 0)'
    when p_dataset = 'vendedores' and p_metrica = 'comisiones' then 'coalesce(sum(c.amount_cents), 0)'
    when p_dataset = 'vendedores' and p_metrica = 'ventas'     then 'count(*)'
    when p_dataset = 'vendedores' and p_metrica = 'volumen'    then 'coalesce(sum(c.base_amount_cents), 0)'
    when p_dataset = 'catalogo'   and p_metrica = 'productos'  then 'count(*)'
    when p_dataset = 'catalogo'   and p_metrica = 'stock'      then 'coalesce(sum(p.stock), 0)'
    when p_dataset = 'catalogo'   and p_metrica = 'valor'      then 'coalesce(sum(p.price_cents * p.stock), 0)'
  end;

  if v_valor is null then
    raise exception 'La métrica % no existe en %', p_metrica, p_dataset;
  end if;

  -- --------------------------------------------------------------------
  -- Dimensiones. `total` devuelve una sola fila: es la cifra suelta.
  -- --------------------------------------------------------------------
  v_dim := case
    when p_dimension = 'total'  then null
    when p_dimension = 'dia'    then 'to_char(date_trunc(''day'', '   || v_fecha || '), ''YYYY-MM-DD'')'
    when p_dimension = 'semana' then 'to_char(date_trunc(''week'', '  || v_fecha || '), ''YYYY-MM-DD'')'
    when p_dimension = 'mes'    then 'to_char(date_trunc(''month'', ' || v_fecha || '), ''YYYY-MM'')'
    when p_dataset = 'ventas'     and p_dimension = 'estado'    then 'o.status::text'
    when p_dataset = 'productos'  and p_dimension = 'producto'  then 'oi.product_name'
    when p_dataset = 'vendedores' and p_dimension = 'vendedor'  then 'coalesce(sp.display_name, ''Vendedor'')'
    when p_dataset = 'catalogo'   and p_dimension = 'categoria' then 'coalesce(nullif(btrim(p.category), ''''), ''Sin categoría'')'
    when p_dataset = 'catalogo'   and p_dimension = 'condicion' then 'p.condition::text'
  end;

  if p_dimension <> 'total' and v_dim is null then
    raise exception 'La dimensión % no existe en %', p_dimension, p_dataset;
  end if;

  if p_dimension = 'total' then
    -- Una sola fila, sin agrupar.
    v_sql := format(
      'select ''Total''::text, (%s)::numeric, ''''::text from %s where %s',
      v_valor, v_origen, public.insight_filtro(p_dataset, v_fecha)
    );
  else
    -- El tiempo se ordena cronológicamente; una categoría, por magnitud.
    v_orden := case
      when p_dimension in ('dia', 'semana', 'mes') then '1 asc'
      else '2 desc'
    end;

    v_sql := format(
      'select (%s)::text, (%s)::numeric, (%s)::text from %s where %s group by 1 order by %s limit %s',
      v_dim, v_valor, v_dim, v_origen,
      public.insight_filtro(p_dataset, v_fecha), v_orden, v_limite
    );
  end if;

  return query execute v_sql using v_store, p_desde, p_hasta;
end $$;

-- ----------------------------------------------------------------------------
-- El filtro obligatorio de toda consulta.
--
-- Vive aparte para que no se pueda olvidar en una rama: `$1` es siempre la
-- tienda del usuario, y las dos comparaciones de fecha son opcionales.
-- ----------------------------------------------------------------------------
create or replace function public.insight_filtro(p_dataset text, p_fecha text)
returns text
language sql
immutable
as $$
  select case p_dataset
           when 'ventas'     then 'o.store_id = $1 and o.status <> ''cancelado'''
           when 'productos'  then 'oi.store_id = $1 and o.status <> ''cancelado'''
           when 'vendedores' then 'c.store_id = $1 and c.status <> ''anulada'''
           when 'catalogo'   then 'p.store_id = $1 and p.deleted_at is null'
         end
      || ' and ($2::date is null or ' || p_fecha || ' >= $2::date)'
      || ' and ($3::date is null or ' || p_fecha || ' < ($3::date + 1))'
$$;

-- ----------------------------------------------------------------------------
-- Gráficos guardados.
--
-- `spec` guarda la especificación y no las filas: un gráfico guardado se
-- vuelve a calcular contra los datos de hoy. Guardar el resultado lo dejaría
-- congelado en el día que se creó, que es lo contrario de un panel.
-- ----------------------------------------------------------------------------
create table if not exists public.insights (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  titulo      text not null,
  pregunta    text not null,
  spec        jsonb not null,
  posicion    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists insights_store_idx
  on public.insights (store_id, posicion) where deleted_at is null;

alter table public.insights enable row level security;

drop policy if exists "graficos propios: administrar" on public.insights;
create policy "graficos propios: administrar" on public.insights
  for all to authenticated
  using (store_id = public.my_store_id() and deleted_at is null)
  with check (store_id = public.my_store_id());

-- ----------------------------------------------------------------------------
-- Permisos.
--
-- `insight_filtro` no se expone: es un detalle interno de `run_insight`.
-- ----------------------------------------------------------------------------
revoke all on function public.insight_filtro(text, text) from public;
revoke all on function public.run_insight(text, text, text, date, date, integer) from public;
grant execute on function public.run_insight(text, text, text, date, date, integer) to authenticated;
