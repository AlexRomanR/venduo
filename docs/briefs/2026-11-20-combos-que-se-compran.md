# Combos que se compran

**Pedido**: "Un combo del catálogo no se puede comprar como combo en la tienda; se arma
por WhatsApp. Hagámoslo." Que se pida solo desde el catálogo. Que no se pueda pedir si un
producto está agotado. Que la talla o el color se elijan al pedirlo. Que el precio sea el
del catálogo, "pero tiene que ser un link que tenga esa información, no simplemente leer
el PDF, porque pueden editar el precio".

**Para quién**: quien compra y recibe el catálogo por WhatsApp, y la tienda que armó el
combo.

**Problema**: el catálogo en PDF y su enlace muestran combos con su precio, pero no hay
forma de pedirlos: quien compra escribe a mano, la tienda arma la venta y el stock no
baja solo.

**Sale bien si**:

- En el **enlace del catálogo** (`/c/{token}` o el que corresponda), cada combo lleva
  **"Pedir este combo"**, que lo suma al carrito de la tienda como **una sola línea** con
  su nombre, sus productos y su precio de combo.
- **El precio sale del catálogo guardado en la base**, nunca del carrito, del PDF ni de
  la página: `create_order` lo lee del catálogo en el servidor. Si la tienda edita el
  precio del combo y guarda el catálogo, desde ahí vale el nuevo; lo que diga un PDF
  viejo no cuenta.
- **Si algún producto del combo está agotado** (o le falta stock para la cantidad), el
  combo dice "Agotado" y no se suma. `create_order` lo vuelve a comprobar.
- **Los productos con tallas o colores** piden elegir la variante al tocar "Pedir este
  combo", en una hoja, una por producto.
- El **mensaje de WhatsApp** y el **pedido en el panel** muestran el combo como una
  línea con su precio y debajo lo que lleva (con la talla elegida).
- **Al marcar el pedido pagado**, baja el stock de cada producto del combo (y de su
  variante), por el mismo disparador de siempre: la aplicación no toca el stock.
- Un combo de un catálogo borrado, o un combo que ya no existe, no se puede pedir: el
  carrito lo avisa y lo quita.

**Dónde**: web primero (enlace del catálogo, carrito, `create_order`, pedido en el
panel); después la app (el pedido en Pedidos). Quien compra no usa la app.

**No tiene que romper**:

- Los pedidos de productos sueltos, su cálculo en el servidor y el mensaje de WhatsApp.
- Que quien compra no deje datos.
- El stock que baja al marcar pagado, por el disparador.
- Los pedidos que ya existen y su forma en el panel y en la app.
- El catálogo en PDF, que sigue igual.

**Fuera de alcance** (anotado para después):

- **Combos en la tienda por sí misma**: una sección "Combos" que se agrega o no desde el
  editor de la tienda, con combos que se crean y editan ahí.
- **Un lugar en el panel para crear y editar combos**, aparte de los catálogos.
- Cobrar dentro de la plataforma: el pago se sigue acordando por WhatsApp.

## Decisiones de la pausa (20 de noviembre)

- "Pedir este combo" es un botón **dentro del PDF**, que abre la página del combo en la
  tienda (`/t/{slug}/combo/{token}/{combo}`). `/c/{token}` sigue abriendo el PDF.
- Las tallas y colores se eligen **en la misma página del combo**, no en una hoja.
- Si un producto del combo se borró, se ocultó o se moderó, **el combo deja de pedirse**.
- Se pueden pedir **varios del mismo combo**, hasta el stock del producto que menos tiene.
- Los combos tienen **su propia función en `/admin`**: `combos`.

## Tareas

- [x] Tests de la base que fallan con la función de hoy (`supabase/tests/combos.test.sql`,
      `estado_y_stock`, `rls_entre_tiendas`). Comprobación: `npm run test:db` los marca.
- [x] Migración: función `combos`, columnas `catalog_id`/`combo_id` en `order_items`, tabla
      `order_item_components` con su RLS, `create_order` con la rama de combo,
      `handle_order_status_change` con los componentes, `run_insight_sql`. Comprobación:
      `npm run test:db` en verde, también los 18 casos de `create_order` sin tocarlos.
- [x] Tipos (`db:types`) y `lib/funciones.ts` con `combos`.
- [x] `lib/combos.ts` (clave, tope, agotado, partes) y `mensajeDePedido` con partes, con sus
      tests. Comprobación: `npm test`.
- [x] Datos y acciones: `getComboCompartido`, `crearPedido` con líneas de combo,
      `revisarCombos`. Comprobación: tipos y un pedido de punta a punta en la base local.
- [x] Página del combo, con datos, agotado, de vacaciones y ya no disponible. Comprobación:
      375 y 1280 px.
- [x] Carrito y resumen con la línea de combo; enviar el pedido. Comprobación: el pedido en
      la base local con su componente y el mensaje de WhatsApp.
- [x] Pedido en el panel con los productos del combo; marcar pagado baja el stock de cada
      uno. Comprobación: en la base local.
- [x] Botón "Pedir este combo" en el PDF (Tarjeta y Lista, A4 e historia). Comprobación: el
      PDF tiene el enlace y lleva a la página.
- [ ] Probar el enlace del PDF en un teléfono real, abriéndolo desde WhatsApp (Android y
      iPhone).
- [x] Documentación: `VENDUO.md`, `domain-venduo.md`, `database-rls.md`,
      `docs/catalogos-pdf.md`, `architecture.md`, `estado-del-proyecto.md`.
- [ ] La app, después de que el dueño apruebe la web.
