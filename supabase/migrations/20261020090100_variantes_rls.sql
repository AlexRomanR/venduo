-- ============================================================================
-- Políticas de las variantes.
--
-- Quien compra las lee en una tienda que se sirve, como los productos: elige
-- la talla en la ficha. El dueño las lee todas. Escribir es solo con
-- `guardar_variantes`, que las arma todas juntas y valida cada combinación:
-- no hay políticas de escritura, a propósito.
-- ============================================================================

drop policy if exists "variantes: leer" on public.product_variants;
create policy "variantes: leer" on public.product_variants
  for select
  using (
    deleted_at is null
    and (
      public.store_is_live(store_id)
      or store_id = public.my_store_id()
    )
  );
