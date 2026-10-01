-- ============================================================================
-- Venduo — políticas de los catálogos en PDF
--
-- Son del dueño y de nadie más: ni el vendedor ni el comprador los leen por
-- `select`. El enlace compartido pasa por `catalogo_compartido`.
--
-- No hay política de DELETE: un catálogo se da de baja poniendo `deleted_at`.
-- Por eso la de UPDATE tiene su `with check` propio: sin él, Postgres usaría
-- el `using`, que pide `deleted_at is null`, y la baja misma quedaría
-- rechazada.
-- ============================================================================

drop policy if exists "catalogos: leer los mios" on public.catalogs;
create policy "catalogos: leer los mios" on public.catalogs
  for select to authenticated
  using (deleted_at is null and store_id = (select public.my_store_id()));

drop policy if exists "catalogos: crear" on public.catalogs;
create policy "catalogos: crear" on public.catalogs
  for insert to authenticated
  with check (store_id = (select public.my_store_id()));

drop policy if exists "catalogos: editar" on public.catalogs;
create policy "catalogos: editar" on public.catalogs
  for update to authenticated
  using (deleted_at is null and store_id = (select public.my_store_id()))
  with check (store_id = (select public.my_store_id()));
