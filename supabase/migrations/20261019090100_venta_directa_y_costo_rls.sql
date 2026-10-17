-- ============================================================================
-- Políticas del costo de los productos: solo el dueño lo lee y lo escribe.
--
-- La tienda de cada fila la pone el disparador `costo_de_producto` desde el
-- producto, así que comparar `store_id` con mi tienda alcanza. No hay política
-- de DELETE: quitar un costo es dejarlo en null.
-- ============================================================================

drop policy if exists "costos de mi tienda: leer" on public.product_costs;
create policy "costos de mi tienda: leer" on public.product_costs
  for select to authenticated
  using (store_id = public.my_store_id());

drop policy if exists "costos de mi tienda: crear" on public.product_costs;
create policy "costos de mi tienda: crear" on public.product_costs
  for insert to authenticated
  with check (store_id = public.my_store_id());

drop policy if exists "costos de mi tienda: actualizar" on public.product_costs;
create policy "costos de mi tienda: actualizar" on public.product_costs
  for update to authenticated
  using (store_id = public.my_store_id())
  with check (store_id = public.my_store_id());
