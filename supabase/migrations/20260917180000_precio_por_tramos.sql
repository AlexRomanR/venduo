-- ============================================================================
-- Venduo — el precio se construye: costo base, comisión y take-rate por tramo
--
-- El negocio declara **lo que quiere recibir** por su producto y la plataforma
-- arma el precio encima:
--
--   precio publicado = costo base + comisión del promotor + take-rate
--
-- Los dos porcentajes salen de `pricing_tiers` según el costo base, y son los
-- mismos para todos los negocios: nadie negocia porcentajes. El modelo está en
-- `docs/modelo-de-negocio.md`.
--
-- `products.price_cents` pasa a ser **derivado**: lo calcula un disparador y la
-- aplicación no lo escribe nunca, igual que `image_url` y `category`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Los tramos.
--
-- Catálogo global, como los planes y los tipos de bloque: lo lee todo el mundo
-- y solo lo escribe la clave de servicio. El porcentaje baja cuando sube el
-- precio: un 25% sobre Bs 40 son Bs 10 y vale el esfuerzo de una venta; el
-- mismo 25% sobre Bs 2.000 deja el producto fuera de mercado.
--
-- `max_cost_cents` nulo es el último tramo, sin techo.
-- ----------------------------------------------------------------------------
create table if not exists public.pricing_tiers (
  id              uuid primary key default gen_random_uuid(),
  min_cost_cents  integer not null check (min_cost_cents >= 0),
  max_cost_cents  integer check (max_cost_cents > min_cost_cents),
  commission_bps  integer not null check (commission_bps between 0 and 10000),
  take_bps        integer not null check (take_bps between 0 and 10000),
  -- La comisión indirecta nunca supera a la directa: la diferencia vuelve al
  -- negocio. Se guarda acá porque se decide con los mismos cortes.
  indirect_bps    integer not null check (indirect_bps between 0 and 10000),
  created_at      timestamptz not null default now(),
  check (indirect_bps <= commission_bps)
);

create unique index if not exists pricing_tiers_desde_key
  on public.pricing_tiers (min_cost_cents);

insert into public.pricing_tiers (min_cost_cents, max_cost_cents, commission_bps, take_bps, indirect_bps)
select * from (values
  (0,       5000,    2500, 1000, 1000),
  (5001,    20000,   2000,  800,  800),
  (20001,   60000,   1500,  600,  600),
  (60001,   150000,  1200,  500,  500),
  (150001,  null,     800,  400,  300)
) as t(min_cost_cents, max_cost_cents, commission_bps, take_bps, indirect_bps)
where not exists (select 1 from public.pricing_tiers);

alter table public.pricing_tiers enable row level security;

drop policy if exists "tramos: leer" on public.pricing_tiers;
create policy "tramos: leer" on public.pricing_tiers for select using (true);

-- ----------------------------------------------------------------------------
-- El costo base y los porcentajes que le tocaron.
-- ----------------------------------------------------------------------------
alter table public.products
  add column if not exists base_cost_cents integer check (base_cost_cents >= 0);

alter table public.products
  add column if not exists commission_bps integer check (commission_bps between 0 and 10000);

alter table public.products
  add column if not exists take_bps integer check (take_bps between 0 and 10000);

comment on column public.products.base_cost_cents is
  'Lo que el negocio quiere recibir. Es la unica cifra de dinero que escribe.';
comment on column public.products.price_cents is
  'DERIVADO: costo base + comision + take-rate. Lo calcula producto_precio; no escribirlo desde la aplicacion.';

-- ----------------------------------------------------------------------------
-- El tramo de un costo base, y el precio que sale de él.
--
-- Cada componente se redondea al centavo y el precio es su suma. Redondear el
-- precio aparte descuadraría el reparto entre negocio, promotor y plataforma.
-- ----------------------------------------------------------------------------
create or replace function public.precio_publicado(p_base_cost_cents integer)
returns table (
  price_cents      integer,
  commission_bps   integer,
  take_bps         integer,
  commission_cents integer,
  take_cents       integer
)
language sql
stable
set search_path = public
as $$
  with tramo as (
    select t.commission_bps, t.take_bps
      from public.pricing_tiers t
     where coalesce(p_base_cost_cents, 0) >= t.min_cost_cents
       and (t.max_cost_cents is null or coalesce(p_base_cost_cents, 0) <= t.max_cost_cents)
     order by t.min_cost_cents desc
     limit 1
  ), partes as (
    select
      tramo.commission_bps,
      tramo.take_bps,
      round(coalesce(p_base_cost_cents, 0)::numeric * tramo.commission_bps / 10000)::integer as comision,
      round(coalesce(p_base_cost_cents, 0)::numeric * tramo.take_bps / 10000)::integer as take
    from tramo
  )
  select
    coalesce(p_base_cost_cents, 0) + partes.comision + partes.take,
    partes.commission_bps,
    partes.take_bps,
    partes.comision,
    partes.take
  from partes;
$$;

-- ----------------------------------------------------------------------------
-- El disparador que mantiene el precio.
--
-- Se ejecuta antes que `producto_derivados`, que ya refresca `image_url`,
-- `category` y `updated_at`. Si llega un producto sin costo base —una fila
-- vieja, o un insert que todavía escribe el precio— se toma el precio como
-- costo base para no perder el dato.
-- ----------------------------------------------------------------------------
create or replace function public.producto_precio()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_precio record;
begin
  if new.base_cost_cents is null then
    new.base_cost_cents := coalesce(new.price_cents, 0);
  end if;

  select * into v_precio from public.precio_publicado(new.base_cost_cents);

  new.price_cents := v_precio.price_cents;
  new.commission_bps := v_precio.commission_bps;
  new.take_bps := v_precio.take_bps;

  return new;
end $$;

drop trigger if exists producto_precio on public.products;
create trigger producto_precio
  before insert or update on public.products
  for each row execute function public.producto_precio();

-- ----------------------------------------------------------------------------
-- Las filas que ya existen.
--
-- Su `price_cents` era el precio que el negocio había fijado, con la comisión
-- ya adentro o no según cómo lo pensó cada uno. Se elige el costo base que
-- **deja el precio publicado lo más cerca posible del que ya tenía**, para que
-- ningún producto de la demostración cambie de precio al migrar. Con dos pasos
-- alcanza: el tramo se estima con el precio y se corrige con el costo.
-- ----------------------------------------------------------------------------
do $$
declare
  v_fila record;
  v_base integer;
  v_factor numeric;
  v_precio record;
begin
  for v_fila in
    select id, price_cents, compare_at_price_cents
      from public.products
     where base_cost_cents is null
  loop
    select (10000 + t.commission_bps + t.take_bps)::numeric / 10000
      into v_factor
      from public.pricing_tiers t
     where v_fila.price_cents >= t.min_cost_cents
       and (t.max_cost_cents is null or v_fila.price_cents <= t.max_cost_cents)
     order by t.min_cost_cents desc
     limit 1;

    v_base := greatest(round(v_fila.price_cents / coalesce(v_factor, 1))::integer, 0);

    select (10000 + t.commission_bps + t.take_bps)::numeric / 10000
      into v_factor
      from public.pricing_tiers t
     where v_base >= t.min_cost_cents
       and (t.max_cost_cents is null or v_base <= t.max_cost_cents)
     order by t.min_cost_cents desc
     limit 1;

    v_base := greatest(round(v_fila.price_cents / coalesce(v_factor, 1))::integer, 0);

    -- El precio anterior tiene que seguir siendo mayor que el publicado, o la
    -- restriccion de la tabla rechaza la fila.
    select * into v_precio from public.precio_publicado(v_base);

    update public.products
       set base_cost_cents = v_base,
           compare_at_price_cents = case
             when compare_at_price_cents is null then null
             when compare_at_price_cents < v_precio.price_cents then null
             else compare_at_price_cents
           end
     where id = v_fila.id;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- De acá en adelante el costo base es obligatorio.
-- ----------------------------------------------------------------------------
alter table public.products alter column base_cost_cents set not null;

-- ----------------------------------------------------------------------------
-- La consulta de la IA no puede nombrar la tabla nueva.
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
  if v_sql ~* '\m(orders|order_items|products|product_categories|pricing_tiers|commissions|store_sellers|seller_profiles|profiles|stores|subscriptions|store_pages|store_blocks|store_design_versions|store_invites|insights|ai_generations|social_connections|social_posts|templates|template_pages|block_types|plans|sectors|users)\M' then
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
