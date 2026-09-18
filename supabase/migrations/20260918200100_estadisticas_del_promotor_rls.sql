-- ============================================================================
-- Venduo — políticas del tablero del promotor
--
-- Cada promotor ve y administra solo sus gráficos. El borrado es lógico, y el
-- filtro de `deleted_at` va en la política y no solo en la consulta.
-- ============================================================================

drop policy if exists "graficos del promotor: administrar" on public.seller_insights;
create policy "graficos del promotor: administrar" on public.seller_insights
  for all to authenticated
  using (user_id = (select auth.uid()) and deleted_at is null)
  with check (user_id = (select auth.uid()));
