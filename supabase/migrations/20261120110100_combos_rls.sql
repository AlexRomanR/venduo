-- ============================================================================
-- Combos: quién lee los productos de cada combo.
--
-- La tienda lee los de sus pedidos. Nadie escribe: los escribe `create_order`,
-- que es security definer. Quien compra no los lee.
-- ============================================================================

alter table public.order_item_components enable row level security;

drop policy if exists "componentes de mi tienda: leer" on public.order_item_components;
create policy "componentes de mi tienda: leer"
  on public.order_item_components
  for select
  to authenticated
  using (store_id = (select public.my_store_id()));

revoke all on public.order_item_components from anon;
grant select on public.order_item_components to authenticated;
