-- ============================================================================
-- Venduo — las tiendas nacen publicadas
--
-- `stores.is_published` nacía en `false` y `create_store` no lo tocaba, así que
-- quien terminaba el alta y abría su enlace recibía "no encontrado": la tienda
-- existía pero no se servía, y lo único que la publicaba era un interruptor en
-- `/cuenta` que nadie sabía que tenía que usar.
--
-- El alta ya es el paso de publicar: al terminarla el emprendedor recibe su
-- enlace y su QR para compartirlos. Una tienda sin productos se sirve igual,
-- con su estado vacío. Despublicarla sigue siendo posible desde `/cuenta`.
--
-- Las tiendas que ya existen no se tocan: una que está despublicada puede
-- estarlo a propósito.
-- ============================================================================

alter table public.stores alter column is_published set default true;
