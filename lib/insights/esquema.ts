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
  numero       integer, el número del pedido (#104)
  created_at   timestamptz
  status       text: pendiente | pagado | cancelado
  total_cents  integer, centavos
  origen       text: tienda (llegó por la tienda) | directa (vendida en el chat o en persona y registrada por la tienda)

mis_items — una línea de pedido por fila (qué producto se vendió)
  order_id          uuid
  product_name      text
  quantity          integer
  unit_price_cents  integer, centavos
  total_cents       integer, centavos (quantity * unit_price_cents)
  created_at        timestamptz, del pedido
  status            text, del pedido
  unit_cost_cents   integer, centavos, lo que costaba el producto al cobrarse; nulo si no tenía costo
  ganancia_cents    integer, centavos, quantity * (unit_price_cents - unit_cost_cents); nulo si no tenía costo
  origen            text, del pedido: tienda | directa
  variante          text, la talla o el color que se vendió ("M · Negro"); nulo si el producto no tiene opciones

mis_productos — el catálogo de hoy, no depende de ventas
  name                    text
  category                text, puede ser nulo
  price_cents             integer, centavos
  compare_at_price_cents  integer, centavos, puede ser nulo
  stock                   integer
  low_stock_threshold     integer, debajo de esto conviene reponer
  sku                     text, código interno, puede ser nulo
  is_active               boolean, si se ve en la tienda
  is_featured             boolean, si va destacado en la portada
  created_at              timestamptz
  cost_cents              integer, centavos, lo que le cuesta a la tienda; puede ser nulo

mis_variantes — las tallas, colores o números de cada producto, hoy
  producto     text, el nombre del producto
  variante     text, "M · Negro": los valores en una línea
  valores      jsonb, {"Talla": "M", "Color": "Negro"}; se lee con valores->>'Talla'
  price_cents  integer, centavos, el precio de esa variante
  stock        integer
  category     text, del producto, puede ser nulo
  is_active    boolean, si el producto se ve en la tienda
`.trim()

/**
 * La vista de visitas. Se le muestra al modelo solo si Venduo le activó las
 * visitas a la tienda: si no, la vista no devuelve nada y la IA prometería un
 * gráfico vacío.
 */
export const ESQUEMA_DE_VISITAS = `
mis_visitas — visitas de mi tienda, una fila por día, tipo, origen y producto
  dia          date
  tipo         text: portada | catalogo | producto | carrito | pedido
  origen       text: whatsapp | tiktok | instagram | facebook | qr | catalogo | otro | directo
  producto_id  uuid, solo en tipo producto, si no nulo
  producto     text, el nombre del producto, si no nulo
  visitas      integer, aperturas
  visitantes   integer, personas distintas en ese día (no se suman entre días)
`.trim()

/** Las reglas que la consulta tiene que cumplir para poder ejecutarse. */
export const REGLAS_SQL = `
- Devuelve EXACTAMENTE dos columnas, con estos nombres: "etiqueta" y "valor".
  etiqueta es texto (la categoría, la fecha, el nombre); valor es numérico.
- Una sola sentencia SELECT. Sin punto y coma al final. Se permite WITH.
- Solo las vistas de arriba. Nombrar una tabla real corta la consulta.
- Para series de tiempo agrupa con date_trunc y devuelve la etiqueta con
  to_char: día 'YYYY-MM-DD', mes 'YYYY-MM'. Ordena por la fecha ascendente.
- Para rankings ordena por valor descendente y pon un LIMIT razonable.
- Los montos están en centavos: devuélvelos en centavos, sin dividir.
- Una venta es un pedido pagado: filtra status = 'pagado' salvo que pregunten
  por los pendientes o los cancelados. Un pendiente es un pedido que se mandó
  por WhatsApp y la tienda todavía no cobró.
- Ventas, lo más vendido, ingresos, ticket promedio y todo lo que diga
  "vendí" o "vendido" usan status = 'pagado'. Nunca status != 'cancelado':
  eso cuenta como vendido lo que todavía no se cobró.
- Para "qué talla" o "qué color se vende más", agrupa mis_items por variante
  (status = 'pagado' y variante is not null). El stock por talla está en
  mis_variantes.
- Ganancia, margen y "cuánto gané" suman ganancia_cents de mis_items con
  status = 'pagado' y ganancia_cents is not null: las líneas sin costo no
  tienen ganancia que contar.
`.trim()
