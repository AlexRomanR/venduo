-- ============================================================================
-- La nota interna del pedido: "entrega el sábado", "pagó la mitad".
--
-- La escribe la tienda y solo la ve la tienda. No necesita política nueva: la
-- de "pedidos de mi tienda: actualizar" ya deja escribir al dueño. Nunca la
-- lee nada de quien compra: `create_order` arma su respuesta a mano, el
-- mensaje de WhatsApp sale de esa respuesta y las vistas `mis_*` nombran sus
-- columnas una por una.
-- ============================================================================

alter table public.orders
  add column if not exists nota text;

alter table public.orders drop constraint if exists orders_nota_largo;
alter table public.orders add constraint orders_nota_largo
  check (nota is null or char_length(nota) between 1 and 500);

comment on column public.orders.nota is
  'Nota interna de la tienda, hasta 500 caracteres. Nunca la ve quien compra.';
