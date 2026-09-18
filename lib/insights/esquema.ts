/**
 * El esquema que la IA tiene permitido consultar.
 *
 * Son vistas, no tablas, y cada una ya está acotada a la tienda de quien
 * pregunta: acá no existe `store_id` y no hace falta que el modelo se acuerde
 * de filtrar. Eso no es comodidad, es lo que hace que una respuesta no pueda
 * mezclar datos de otro comercio.
 *
 * Este texto es lo único que el modelo sabe de la base. Si se agrega una
 * columna a una vista hay que agregarla acá, o la IA no la va a usar nunca.
 */
export const ESQUEMA = `
mis_ventas — un pedido de mi tienda por fila
  created_at            timestamptz
  status                text: pendiente | pagado | enviado | entregado | cancelado
  total_cents           integer, centavos
  commission_cents      integer, centavos (lo que se llevó el vendedor)
  commission_base_cents integer, centavos
  seller_id             uuid, nulo si la venta no vino de un vendedor
  referral_code         text, nulo si no hubo referido

mis_items — una línea de pedido por fila (qué producto se vendió)
  order_id          uuid
  product_name      text
  quantity          integer
  unit_price_cents  integer, centavos
  total_cents       integer, centavos (quantity * unit_price_cents)
  created_at        timestamptz, del pedido
  status            text, del pedido

mis_productos — el catálogo de hoy, no depende de ventas
  name                    text
  category                text, puede ser nulo
  condition               text: nuevo | segunda_mano | reacondicionado
  price_cents             integer, centavos
  compare_at_price_cents  integer, centavos, puede ser nulo
  stock                   integer
  low_stock_threshold     integer, debajo de esto conviene reponer
  sku                     text, código interno, puede ser nulo
  is_active               boolean, si se ve en la tienda
  is_featured             boolean, si va destacado en la portada
  seller_enabled          boolean
  created_at              timestamptz

mis_vendedores — quiénes venden para mí
  nombre         text
  ciudad         text, puede ser nulo
  status         text: pendiente | activo | rechazado | suspendido
  referral_code  text
  joined_at      timestamptz

mis_comisiones — lo que generó cada vendedor
  created_at         timestamptz
  status             text: pendiente | confirmada | pagada | anulada
  amount_cents       integer, centavos (la comisión)
  base_amount_cents  integer, centavos (sobre cuánto se calculó)
  rate_bps           integer, puntos básicos (1200 = 12%)
  nombre             text, el vendedor
`.trim()

const REGLAS_DE_FORMA = `
- Devuelve EXACTAMENTE dos columnas, con estos nombres: "etiqueta" y "valor".
  etiqueta es texto (la categoría, la fecha, el nombre); valor es numérico.
- Una sola sentencia SELECT. Sin punto y coma al final. Se permite WITH.
- Para series de tiempo agrupa con date_trunc y devuelve la etiqueta con
  to_char: día 'YYYY-MM-DD', mes 'YYYY-MM'. Ordena por la fecha ascendente.
- Para rankings ordena por valor descendente y pon un LIMIT razonable.
- Los montos están en centavos: devuélvelos en centavos, sin dividir.
`.trim()

/** Las reglas que la consulta tiene que cumplir para poder ejecutarse. */
export const REGLAS_SQL = `
${REGLAS_DE_FORMA}
- Solo las cinco vistas de arriba. Nombrar una tabla real corta la consulta.
- Los pedidos cancelados no son ventas: exclúyelos salvo que pregunten por
  ellos. Las comisiones anuladas tampoco cuentan.
`.trim()

/**
 * Lo mismo para el promotor, que no tiene tienda.
 *
 * Sus vistas cruzan todos los negocios donde vende y ya están acotadas a él:
 * tampoco acá hace falta que el modelo filtre por nadie.
 */
export const ESQUEMA_PROMOTOR = `
promotor_ventas — un pedido que trajo con su enlace por fila, de cualquier negocio
  created_at   timestamptz
  status       text: pendiente | pagado | enviado | entregado | en_disputa | cancelado
  total_cents  integer, centavos (lo que pagó el comprador, NO lo que ganó el promotor)
  negocio      text, el negocio que vendió
  comprador    text, identificador anónimo del comprador: sirve para contar distintos

promotor_items — una línea de esos pedidos por fila (qué producto se vendió)
  order_id          uuid
  product_name      text
  quantity          integer
  unit_price_cents  integer, centavos
  total_cents       integer, centavos (quantity * unit_price_cents)
  created_at        timestamptz, del pedido
  status            text, del pedido
  negocio           text

promotor_comisiones — lo que ganó el promotor, una comisión por fila
  created_at         timestamptz
  status             text: pendiente (pago retenido) | confirmada (por cobrar) | pagada (cobrada) | anulada
  tipo               text: directa (vendió con su enlace) | indirecta (volvió a comprar alguien que trajo)
  amount_cents       integer, centavos (su ganancia)
  base_amount_cents  integer, centavos (sobre cuánto se calculó)
  rate_bps           integer, puntos básicos (1200 = 12%)
  negocio            text

promotor_enlaces — los productos que tomó para promocionar, hoy
  producto        text
  categoria       text, puede ser nulo
  negocio         text
  price_cents     integer, centavos, el precio publicado
  ganancia_cents  integer, centavos, lo que gana por cada unidad vendida
  stock           integer
  disponible      boolean, si hoy se puede comprar
  taken_at        timestamptz, cuándo lo tomó
`.trim()

export const REGLAS_SQL_PROMOTOR = `
${REGLAS_DE_FORMA}
- Solo las cuatro vistas de arriba. Nombrar una tabla real corta la consulta.
- "Cuánto gané" se responde con promotor_comisiones.amount_cents, nunca con
  total_cents de las ventas: eso es lo que pagó el comprador.
- Los pedidos cancelados no son ventas y las comisiones anuladas no son
  ganancia: exclúyelos salvo que pregunten por ellos.
`.trim()
