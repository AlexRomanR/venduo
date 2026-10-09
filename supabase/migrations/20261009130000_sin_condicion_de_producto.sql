-- ============================================================================
-- La segunda mano se retira (segundo paso): la columna.
--
-- El código que leía y escribía la condición ya no está publicado
-- (20261009120000_sin_segunda_mano.sql y su despliegue). Se borran la columna,
-- su nota, su índice y su tipo.
-- ============================================================================

drop index if exists public.products_segunda_mano_idx;

alter table public.products
  drop column if exists condition,
  drop column if exists condition_note;

drop type if exists public.product_condition;
