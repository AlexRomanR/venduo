-- ============================================================================
-- Venduo — 0020 la IA escribe la consulta
--
-- Reemplaza la especificación cerrada por SQL generado. El motivo es de
-- alcance: una especificación con conjunto/métrica/dimensión solo responde las
-- preguntas que alguien anticipó. Con SQL, la IA puede cruzar tablas, comparar
-- períodos y calcular razones que nadie enumeró.
--
-- Lo que hace esto defendible no es filtrar palabras —eso siempre se rodea—
-- sino tres cosas que impone Postgres, no la aplicación:
--
--   1. `security invoker`: la consulta corre como el usuario, con RLS activa.
--      La IA no puede leer otra tienda porque las políticas ya la filtran. No
--      hace falta inyectar `store_id` en SQL ajeno, que era el punto frágil.
--   2. `set local transaction read only`: la base rechaza cualquier escritura,
--      aunque el filtro de texto se rodee. Comprobado: un UPDATE levanta
--      "cannot execute UPDATE in a read-only transaction".
--   3. `statement_timeout`: una consulta cara se corta sola.
--
-- El filtro de texto queda como primera barrera, no como la única.
-- ============================================================================

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

  -- Una sola sentencia: se quita el punto y coma final y no puede haber otro.
  v_sql := btrim(rtrim(v_sql, '; '));
  if position(';' in v_sql) > 0 then
    raise exception 'Solo se permite una consulta';
  end if;

  if lower(left(v_sql, 6)) <> 'select' and lower(left(v_sql, 4)) <> 'with' then
    raise exception 'Solo se permiten consultas SELECT';
  end if;

  -- Primera barrera. La que manda es la transacción de solo lectura.
  if v_sql ~* '\m(insert|update|delete|drop|alter|truncate|grant|revoke|copy|vacuum|analyze|reindex|call|merge|refresh|comment|listen|notify|prepare|execute|lock)\M' then
    raise exception 'La consulta contiene una instrucción no permitida';
  end if;

  -- Esquemas fuera de alcance: identidad, archivos y catálogos del motor.
  if v_sql ~* '\m(auth|storage|vault|pg_catalog|information_schema|pg_temp|extensions)\s*\.' then
    raise exception 'Esa tabla no está disponible para consultas';
  end if;

  -- Funciones que no calculan nada y sí molestan.
  if v_sql ~* '\m(pg_sleep|pg_read_file|pg_read_binary_file|lo_import|lo_export|dblink|set_config|current_setting)\M' then
    raise exception 'Esa función no está permitida';
  end if;

  set local transaction read only;
  set local statement_timeout = '8s';

  -- El tope de filas lo impone el servidor, no la consulta que llegó.
  return query execute 'select q.etiqueta::text, q.valor::numeric from (' || v_sql || ') as q limit 200';
end $$;

revoke all on function public.run_insight_sql(text) from public;
grant execute on function public.run_insight_sql(text) to authenticated;

-- ----------------------------------------------------------------------------
-- Los gráficos guardados pasan a guardar la consulta.
--
-- `spec` sigue siendo jsonb y ahora lleva `{ sql, grafico, formato }`. Las
-- filas guardadas antes con el formato viejo quedan obsoletas: se marcan para
-- que la pantalla no intente dibujarlas.
-- ----------------------------------------------------------------------------
update public.insights
   set deleted_at = now()
 where deleted_at is null
   and spec ? 'conjunto';
