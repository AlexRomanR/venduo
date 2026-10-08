-- ============================================================================
-- Los gráficos guardados que contaban como venta lo que no se cobró.
--
-- Se guardaron cuando la regla era "todo lo que no se canceló": con la compra
-- por WhatsApp, un pendiente es un pedido que todavía no se cobró, y una venta
-- es un pedido pagado. Esos gráficos se recalculan cada día con su consulta
-- guardada, así que siguen sumando pendientes hasta que se corrija la consulta.
--
-- Y los que leían `mis_vendedores` ya no pueden calcularse: la vista se fue con
-- la red de vendedores. Se dan de baja.
--
-- Idempotente: lo que ya está corregido no vuelve a cambiar.
-- ============================================================================

update public.insights
   set deleted_at = now(),
       updated_at = now()
 where deleted_at is null
   and spec->>'sql' ilike '%mis_vendedores%';

update public.insights
   set spec = jsonb_set(
                jsonb_set(
                  spec,
                  '{sql}',
                  to_jsonb(regexp_replace(
                    spec->>'sql',
                    'status\s*(!=|<>)\s*''cancelado''',
                    'status = ''pagado''',
                    'gi'
                  ))
                ),
                '{explicacion}',
                to_jsonb(replace(
                  coalesce(spec->>'explicacion', ''),
                  'excluyendo pedidos cancelados',
                  'contando solo los pedidos pagados'
                ))
              ),
       updated_at = now()
 where deleted_at is null
   and spec->>'sql' ~* 'status\s*(!=|<>)\s*''cancelado''';
