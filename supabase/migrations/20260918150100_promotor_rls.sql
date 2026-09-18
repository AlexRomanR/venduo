-- ============================================================================
-- Venduo — políticas de lo que eligió cada promotor y a quién trajo
-- ============================================================================

-- ----------------------------------------------------------------------------
-- `seller_products`: la ve el promotor que tomó el producto y el negocio dueño
-- del producto. Nadie escribe directo: `take_product` y `release_product`.
-- ----------------------------------------------------------------------------
alter table public.seller_products enable row level security;

drop policy if exists "productos tomados: leer" on public.seller_products;
create policy "productos tomados: leer" on public.seller_products
  for select to authenticated
  using (
    deleted_at is null
    and (user_id = (select auth.uid()) or store_id = public.my_store_id())
  );

-- ----------------------------------------------------------------------------
-- `buyer_attributions`: RLS activo y cero políticas, como `store_invites`.
-- Guarda el teléfono completo del comprador; el promotor lo ve censurado por
-- `mis_compradores()`, y el checkout la lee como `security definer`.
-- ----------------------------------------------------------------------------
alter table public.buyer_attributions enable row level security;
