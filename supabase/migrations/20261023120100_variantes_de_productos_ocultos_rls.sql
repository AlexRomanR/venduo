-- ============================================================================
-- Las tallas de un producto oculto no se ven desde afuera.
--
-- La política leía las variantes de toda tienda que se sirve, sin mirar su
-- producto: de un producto oculto, borrado o moderado, cualquiera podía leer
-- sus tallas, su stock y su precio. Ahora quien compra lee las de un producto
-- que también puede ver, con las mismas condiciones que "productos
-- publicados: leer". El dueño sigue leyendo todas las suyas.
--
-- Fijado en supabase/tests/rls_entre_tiendas.test.sql.
-- ============================================================================

drop policy if exists "variantes: leer" on public.product_variants;
create policy "variantes: leer" on public.product_variants
  for select
  using (
    deleted_at is null
    and (
      store_id = public.my_store_id()
      or (
        public.store_is_live(store_id)
        and exists (
          select 1 from public.products p
           where p.id = product_variants.product_id
             and p.is_active
             and p.moderated_at is null
             and p.deleted_at is null
        )
      )
    )
  );
