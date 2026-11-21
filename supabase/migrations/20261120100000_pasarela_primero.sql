-- ============================================================================
-- Pasarela abre el rubro "Moda" en el alta.
--
-- Atelier estaba primera de todas (posición 10) y es de carteras: quien vende
-- ropa y tocaba "Moda" veía primero una tienda de carteras. Pasarela, que es de
-- ropa y la que más tiendas usan, pasa a la 10, y Atelier a la 60, el lugar que
-- tenía Pasarela. El resto del orden no cambia.
--
-- Es el mismo orden que se elige desde /admin/plantillas: cambia solo
-- `position`, y la administración lo puede volver a mover cuando quiera.
-- ============================================================================

update public.templates set position = 10 where key = 'fashion';
update public.templates set position = 60 where key = 'atelier';
