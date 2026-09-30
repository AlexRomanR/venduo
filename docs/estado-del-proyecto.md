# Estado del proyecto

Qué está construido en Venduo y qué falta, contra el alcance del MVP de `VENDUO.md` §6.
Actualizado el 29 de septiembre de 2026.

**Leyenda:** ✅ hecho · 🟡 hecho con un flujo provisorio o a medias · ❌ falta

---

## Resumen

| #   | Punto del MVP (`VENDUO.md` §6)                           | Estado |
| --- | -------------------------------------------------------- | ------ |
| 1   | Registro e ingreso del emprendedor                       | ✅     |
| 2   | Selección de plantilla según rubro                       | ✅     |
| 3   | Edición de la tienda asistida por IA                     | ✅     |
| 4   | Tienda pública real, navegable en móvil, con URL propia  | ✅     |
| 5   | Productos con imagen, stock y condición                  | ✅     |
| 6   | Carrito y checkout con datos del cliente                 | ✅     |
| 7   | Pago por PagoFácil con custodia (simulada)               | 🟡     |
| 8   | Alta de vendedor, con código y enlace propios            | ✅     |
| 9   | Atribución de la venta al vendedor por el enlace         | ✅     |
| 10  | Cálculo automático de comisión                           | ✅     |
| 11  | Panel del vendedor: ventas, comisiones, materiales       | ✅     |
| 12  | Estadísticas en lenguaje natural                         | ✅     |
| 13  | Copys de marketing y publicación en Facebook y WhatsApp  | ❌     |
| 14  | Entrega por WhatsApp y confirmación de envío y recepción | 🟡     |

---

## Lo que está hecho

### Cuentas y altas

- Registro e ingreso con correo y contraseña, eligiendo el rol: emprendedor o vendedor.
- `/auth/destino` decide a dónde entra cada cuenta según sus datos, no según el rol.
- Alta de la tienda en tres pasos (`/crear`): elegir plantilla, contar el negocio y, en
  `/crear/listo`, la oferta de personalizarla en el editor o hacerlo más tarde. Nace con
  suscripción de prueba, invitación para vendedores y su versión inicial de diseño.
- Alta del vendedor (`/sumarme`) por tres caminos: sumarse a una tienda, entrar con un
  código de invitación o tomar un producto suelto.

### Plantillas de tienda

- Dos plantillas con identidad propia: **Pasarela** (moda) y **Esencia** (perfumería).
- La identidad llega a toda la tienda pública **y al panel del emprendedor**.
- Cambio de plantilla desde `/panel/apariencia` sin perder productos, pedidos ni
  vendedores, con historial de versiones que se pueden **restaurar**.
- Todo documentado en `docs/store-templates.md`.

### Editor de la tienda (`/editor`)

- Pantalla completa, en seis pasos: **Tu marca**, **Portada**, **Catálogo**, **Producto**,
  **Carrito** y **Publicar**, en una barra arriba (abajo en el celular). Se puede saltar a
  cualquiera.
- **Vista previa real** en un `iframe`: la tienda con el kit de su plantilla y sus
  productos. En la computadora se mira como celular (390 px) o como computadora; en el
  celular, la vista previa es la pantalla. Tocar una sección la abre para editarla y
  soltar una foto encima la usa.
- **Tu marca:** logo (se sube comprimido a `store-assets`), diez paletas que se leen,
  colores propios con medidor de contraste y el tono legible más cercano, seis
  combinaciones de letra, mayúsculas y forma de los botones.
- **Portada:** secciones que se arrastran con el dedo o el teclado (`@dnd-kit`), se
  ocultan, se quitan y se agregan desde una galería. Formulario de cada sección armado
  desde su definición, con fotos subidas o de la biblioteca (lo subido y las fotos de los
  productos).
- **Catálogo:** foto cuadrada o vertical y columnas. **Producto** y **Carrito** muestran
  cómo quedan con un producto real y un carrito de muestra. Una tienda sin productos los
  ve con **productos de ejemplo** de su rubro, avisados como tales.
- **Forma de los botones:** rectos, suaves o redondos, en todos los botones y controles de
  las tres plantillas, filtros y buscador del catálogo incluidos.
- **Borrador en el navegador** con deshacer y rehacer (Ctrl+Z), guardado en el
  dispositivo y recuperable al volver. Nada llega al comprador hasta publicar.
- **Publicar:** los cambios contados en palabras, antes y después, y `publicar_diseno`,
  que guarda una versión y escribe todo en una transacción. Lo que no se lee o quedó vacío
  no se publica, y se dice dónde se arregla.
- **La IA:** una barra con sugerencias por paso. Devuelve operaciones que se validan todas
  o ninguna, con un segundo intento si fallan; la propuesta se ve marcada en la vista
  previa y se aplica o se descarta. "Que la IA escriba tu portada" usa la descripción del
  alta. Funciona con el modo demo.

### Tienda pública (`/t/{slug}`)

- Portada armada con bloques, catálogo con filtros, búsqueda y orden, ficha de producto
  con galería y sugerencias.
- Filtro de segunda mano, reacondicionado y ofertas.
- Carrito en el navegador y checkout con nombre, WhatsApp y correo opcional.
- Pantallas de carga, error y "no encontrado".
- Enlace propio por tienda, con subdominio listo detrás de un interruptor
  (`NEXT_PUBLIC_DOMINIO_TIENDAS`).
- Tarjeta para WhatsApp al compartir la tienda o un producto.

### Panel del emprendedor (`/panel`)

- **Resumen** con cifras y pendientes.
- **Productos**: alta y edición con fotos, stock, umbral de aviso, condición, precio
  anterior, código y destacado. Categorías propias.
- **Pedidos**: lista, detalle, cambio de estado, comprobante, y un botón que abre WhatsApp
  con el pedido ya armado.
- **Vendedores**: la red, sus solicitudes y la invitación.
- **Estadísticas**: preguntas en lenguaje natural, gráficos guardados, edición del gráfico
  por texto e informe en PDF (completo o de un gráfico).
- **Apariencia**: la puerta al editor, la plantilla, cambiarla y el historial, con
  **Restaurar** en cada versión. El resumen también lleva al editor, y pide darle estilo
  mientras la tienda luzca igual a la plantilla.
- Barra lateral con contadores de lo que pide atención; se puede plegar y recuerda cómo
  quedó.

### Vendedores

- Panel del vendedor (`/vendedor`) con sus tiendas, ventas y comisiones.
- Vitrinas para buscar tiendas y productos (`/explorar`).
- Enlace de referido por tienda: la venta se le atribuye aunque el comprador navegue sin
  el código.
- Comisión congelada al momento de la venta, una por pedido.
- Perfil público con historial laboral verificable (`/v/{slug}`).

### Base y seguridad

- Supabase con RLS en todas las tablas y borrado lógico.
- El pedido solo se crea en el servidor (`create_order`), que recalcula los precios.
- La IA de estadísticas solo lee, en una transacción de solo lectura y contra vistas de la
  propia tienda.
- Modo demo que funciona sin credenciales.

---

## Lo que falta

### 1. El cobro con PagoFácil y la custodia — prioridad alta

Es lo que más cambia el producto. El modelo está decidido y documentado en `VENDUO.md` §5,
pero **lo que está construido es provisorio**: el comprador transfiere al QR del comercio,
sube una captura y el emprendedor confirma a mano. El dinero va directo, sin custodia.

Falta:

- La pasarela simulada de PagoFácil: cobrar, retener, liberar y devolver.
- Estados nuevos del pedido: marca de enviado, confirmación de recibido por el comprador y
  `en_disputa`, con sus columnas (`shipped_at`, `delivered_at`, `release_due_at`…).
- Cambiar el disparador de comisiones: hoy nace `confirmada` al pagar; tiene que nacer
  `pendiente` y confirmarse en la entrega.
- Pantalla de seguimiento del pedido para el comprador, con "lo recibí" y "tengo un
  problema".
- Liberación automática pasado un plazo.
- Retirar el QR y el comprobante, y actualizar el texto de "Cómo te pagan" en `/cuenta`.

**Decisiones pendientes antes de construirlo:**

- Con PagoFácil: si admite retener y liberar por orden de Venduo, si puede pagarle al
  vendedor como tercero y qué identificación le exige.
- Del producto: el plazo de liberación automática (se propone 7 días) y qué pasa si el
  emprendedor nunca marca el envío.

### 2. Marketing — prioridad media

`/panel/marketing` es un marcador "Pronto". La tarea `generateCampaign` existe en la capa
de IA pero no se usa.

Falta:

- Generar copys para Facebook y WhatsApp desde un producto.
- Publicar: plan A por API de Meta, plan B con enlaces de compartir y copiar. Se recomienda
  ir directo al plan B por el tiempo de revisión de Meta.

### 3. Plantillas — prioridad baja

- Más plantillas para los rubros que quedaron en la base editorial (tecnología, hogar,
  comida).
- Atributos por rubro: talla y color en moda, mililitros o familia olfativa en
  perfumería. Piden variantes en el carrito y en `create_order`.

### 4. Suscripción — prioridad baja

Se modela el estado, no el cobro. Falta el bloqueo real al vencer la prueba (panel en
solo lectura con exportación a CSV) y la purga a los 90 días.

### 5. Pendientes chicos

- **La plantilla editorial no dibuja las grillas de productos de su portada**: muestra
  su catálogo completo. El editor lo avisa en esas tiendas, pero editar una grilla ahí no
  se ve.
- **Una propuesta de la IA puede tardar** entre 6 y 45 segundos: si la primera no pasa la
  validación, hay un segundo intento. El editor lo dice mientras espera.
- **`generateStoreBlueprint` sigue sin usarse**: inventa una tienda entera, con slug y
  productos. "Que la IA escriba tu portada" se resolvió con la tarea del editor.

- **Fotos en los datos de ejemplo.** Casi ningún producto tiene foto, y las plantillas se
  lucen con ellas. Importante antes de la demostración.
- **Textos de ejemplo visibles** en tiendas con plantillas retiradas (p. ej. "Cuenta aquí
  de dónde salen tus piezas" en Casa Illimani). Reemplazarlos o pasar esas tiendas a una
  plantilla nueva.
- **`.env.example`** no tiene `NEXT_PUBLIC_DOMINIO_TIENDAS`.
- **Dominio propio** para las tiendas con subdominio: comprar el dominio, crear el
  registro DNS comodín y darlo de alta en Vercel.
- **El rojo de Venduo** está a 4,35:1 contra el papel, un poco por debajo del mínimo AA
  para texto chico.
- **Avisos de Next.js** por `quality="90"` en imágenes de la portada: hace falta
  configurar `images.qualities` antes de pasar a Next 16.
- 191 avisos de lint, en su mayoría variables sin usar.

---

## Fuera de alcance

No se construye, según `VENDUO.md` §7: multi-tienda por usuario, gestión de envíos,
recibir o guardar el dinero de una venta, cobro de la suscripción, notificaciones por
correo, app móvil nativa y tests automatizados.
