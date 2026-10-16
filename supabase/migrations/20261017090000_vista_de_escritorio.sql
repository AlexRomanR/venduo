-- ============================================================================
-- La vista de la tienda en una computadora.
--
-- `vista_url` es la portada como la ve quien compra desde el celular, a
-- 390 × 780: la muestran el Inicio de la app y el Resumen en el celular. En el
-- Resumen de una pantalla ancha, un celular dibujado se veía fuera de lugar:
-- ahí va la portada como la ve alguien desde su computadora, a 1280 × 800.
--
-- Se saca en la misma pasada que la del celular (`lib/vista.ts`), con el mismo
-- candado y la misma marca de vieja (`vista_cambio_at`): escribirla no la
-- vuelve vieja, porque no es algo que se vea en la portada. Una tienda que ya
-- tiene la del celular y no esta se fotografía de nuevo la próxima vez que se
-- abre su Resumen.
-- ============================================================================

alter table public.stores
  add column if not exists vista_escritorio_url text;
