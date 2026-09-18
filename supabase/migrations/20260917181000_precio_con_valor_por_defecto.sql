-- ============================================================================
-- Venduo — `price_cents` deja de ser obligatorio al insertar
--
-- Lo calcula el disparador `producto_precio` desde el costo base, así que la
-- aplicación no lo manda. Sin valor por defecto, los tipos generados lo siguen
-- pidiendo en cada insert y obligarían a escribir una cifra falsa.
-- ============================================================================

alter table public.products alter column price_cents set default 0;
