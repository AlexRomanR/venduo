# Nueva venta, por filas

**Pedido**: "apliquemos a nueva venta" la pantalla por filas que se aprobó en el
formulario de producto.

**Para quién**: quien vende, desde el panel web en el celular y desde la app. Registra
lo que vendió fuera de la tienda —en el chat o en persona— para que el stock no mienta.

**Problema**: hoy la grilla de productos ocupa la pantalla y lo vendido queda abajo,
fuera de la vista, con dos controles rotulados por producto ("Unidades", "Precio en Bs")
siempre abiertos. Para ver qué llevas sumado hay que bajar.

**Sale bien si**: una venta de uno o dos productos se registra en pocos toques: tocar
"+ Agregar producto", elegirlo (y su talla si tiene), y "Registrar venta". Lo vendido se
lee de un vistazo arriba, con su total, y cambiar un precio es tocar la fila.

**Respuestas de la entrevista**:

- Una venta suele ser de **uno o dos productos**: lo vendido va arriba, como filas, y
  agregar abre la grilla en una hoja.
- El precio se cambia **a veces**: la fila muestra "1 × Bs 240" con más y menos, y el
  precio se cambia en su hoja.
- La venta lleva **solo los productos**: no se toca la base.

**Dónde**: las dos, web (`/panel/pedidos/nueva`) y app, con la misma pantalla.

**No tiene que romper**:

- `registrar_venta(p_items)`: el pedido nace pagado, el stock lo mueve el disparador, se
  rechaza entera si no alcanza.
- Elegir la variante de un producto con tallas, y vender lo oculto por la persona (no lo
  que ocultó Venduo).
- El precio por línea, que puede ser una rebaja.
- Quien compra no deja datos: la venta no pide nada de nadie.

**Fuera de alcance**: nota interna, forma de pago, cliente; cualquier cambio en la base.
