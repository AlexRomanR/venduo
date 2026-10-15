-- ============================================================================
-- Venduo — dar de baja un catálogo y un gráfico del tablero
--
-- Las dos bajas fallaban siempre con "new row violates row-level security
-- policy". La política de lectura de `catalogs` y la de `insights` piden
-- `deleted_at is null`, y Postgres exige que la fila que deja un UPDATE siga
-- siendo visible para quien la cambia cuando la consulta filtra por columnas
-- de la tabla: poner `deleted_at` la vuelve invisible, y la baja se rechaza.
--
-- El filtro tiene que quedarse en la política —es lo que impide que una
-- consulta nueva se olvide de él—, así que la baja pasa a estas funciones:
-- `security definer`, solo sobre la tienda de la sesión y solo sobre una fila
-- viva. No reciben la tienda: la sacan de `my_store_id()`.
-- ============================================================================

create or replace function public.dar_de_baja_catalogo(p_catalogo uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tienda uuid := public.my_store_id();
begin
  if v_tienda is null then
    raise exception 'No tienes una tienda.' using errcode = '42501';
  end if;

  update public.catalogs
     set deleted_at = now(),
         updated_at = now()
   where id = p_catalogo
     and store_id = v_tienda
     and deleted_at is null;

  return found;
end;
$$;

revoke all on function public.dar_de_baja_catalogo(uuid) from public, anon;
grant execute on function public.dar_de_baja_catalogo(uuid) to authenticated;

create or replace function public.quitar_grafico(p_grafico uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tienda uuid := public.my_store_id();
begin
  if v_tienda is null then
    raise exception 'No tienes una tienda.' using errcode = '42501';
  end if;

  update public.insights
     set deleted_at = now(),
         updated_at = now()
   where id = p_grafico
     and store_id = v_tienda
     and deleted_at is null;

  return found;
end;
$$;

revoke all on function public.quitar_grafico(uuid) from public, anon;
grant execute on function public.quitar_grafico(uuid) to authenticated;
