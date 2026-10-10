# Estado del proyecto

Qué está construido en Venduo y qué falta, contra el alcance del MVP de `VENDUO.md` §6.
Actualizado el 9 de octubre de 2026.

**Leyenda:** ✅ hecho · 🟡 hecho con un flujo provisorio o a medias · ❌ falta

---

## Resumen

| #   | Punto del MVP (`VENDUO.md` §6)                               | Estado |
| --- | ------------------------------------------------------------ | ------ |
| 1   | Registro e ingreso del emprendedor                           | ✅     |
| 2   | Selección de plantilla según rubro, con WhatsApp obligatorio | ✅     |
| 3   | Edición de la tienda asistida por IA                         | ✅     |
| 4   | Tienda pública real, navegable en móvil, con URL propia      | ✅     |
| 5   | Productos con imagen, stock y categoría                      | ✅     |
| 6   | Carrito que manda el pedido al WhatsApp de la tienda         | ✅     |
| 7   | Panel de pedidos que descuenta stock al marcarse pagado      | ✅     |
| 8   | Estadísticas en lenguaje natural                             | ✅     |
| 9   | Copys de marketing y publicación en Facebook y WhatsApp      | ❌     |
| 10  | Catálogos en PDF editables, para descargar o compartir       | ✅     |

> **6 de octubre:** se quitaron la red de vendedores, el cobro dentro de la plataforma
> (PagoFácil, la custodia, el QR de pago y el comprobante) y los estados de envío. La
> compra se cierra por WhatsApp. La migración `20261006120000_compra_por_whatsapp.sql`
> ya está aplicada en producción.
>
> **8 y 9 de octubre:** cinco plantillas nuevas y una revisión general en producción,
> con sus arreglos (abajo, "Revisión general"). Venduo deja de ser un proyecto de
> hackathon y pasa a ser una startup: lo que existía solo para la demostración se va
> quitando, empezando por la segunda mano.
>
> **9 de octubre:** la administración de Venduo (`/admin`) y las visitas por tienda,
> las siete fases de `docs/plan-administracion.md`.

---

## Lo que está hecho

### Mensaje y portada

- Venduo se presenta como **tienda online, inventario y ventas en uno, listo en un
  minuto**, con lo que viene además: plantillas editables, pedidos que llegan por
  WhatsApp, catálogos en PDF y estadísticas.
- La portada (`/`) está ordenada en ese sentido: titular, el problema, por qué no es
  solo una tienda online, cómo funciona en tres pasos, lo que incluye, para quién es,
  cómo llegan los pedidos por WhatsApp, preguntas frecuentes y llamado final.
- Los ejemplos son de quien vende por redes —ropa, zapatillas, belleza, tecnología,
  segunda mano—, no de comida casera. Cómo se le habla al cliente está en
  `ui-styling.md`.

### La marca

- El logo es la feria en el celular: el toldo a rayas de un puesto dentro de la pantalla.
  Va en la portada, el ingreso, el alta y la barra lateral
  —plegada, el símbolo solo—, y es el favicon, el ícono del celular y la tarjeta al
  compartir la portada. Se regenera con `npm run marca`. Todo en
  `.agents/rules/marca.md`.

### Catálogos en PDF (`/panel/catalogos`)

- Doce plantillas —grilla, revista, lookbook, lista de precios, una foto por hoja,
  vitrina de lujo, historia 9:16, mayorista, feria, packs, ofertas y flyer— hechas de
  siete bloques con 25 variantes. Cualquier bloque sirve en cualquier plantilla.
- Constructor: elegir productos con búsqueda y filtros (o pedirle el catálogo a la IA
  en una frase), elegir la plantilla viéndola con los propios productos y editar hoja
  por hoja con la vista previa al lado. Packs con su precio, estilo de la tienda o
  propio, fondo oscuro, A4 o 9:16, y el contraste controlado antes de descargar.
- Cuatro estilos sacados de la tienda —tal cual, su color a toda hoja, en oscuro y en
  tonos de su acento—, cada uno con la plantilla que mejor lo luce. Se calculan de la
  tienda: si cambia sus colores, cambian con ella.
- La vista previa sigue a la hoja que se edita, también en el celular.
- El PDF se arma en el servidor con las mismas variantes de la vista previa. Se
  descarga —la descarga la hace el navegador, con su nombre y en Descargas—, se pasa a
  la hoja de compartir del teléfono o se manda un enlace (`/c/{token}`) que abre siempre
  con los precios y el stock del día.
- **Editar en Canva**: con la integración configurada, el catálogo se abre en Canva como
  un diseño editable, y la aprobación se pide una sola vez por tienda (se desconecta
  desde `/cuenta`); sin ella, se baja el PDF y se abre el editor de PDF de Canva para
  subirlo.
- Funciona en modo demo, salvo guardar. Todo en `docs/catalogos-pdf.md`.

### Cuentas y altas

- Registro e ingreso con correo y contraseña. Toda cuenta que sale del registro es de
  emprendedor y va a crear su tienda. La de administrador de Venduo se da de alta a mano
  (`platform_admins`) y entra a `/admin`.
- El registro puede estar **abierto, cerrado o con invitación**; lo decide el
  administrador y lo hace cumplir el disparador `handle_new_user`.
- `/auth/destino` decide a dónde entra cada cuenta según sus datos.
- Alta de la tienda en tres pasos (`/crear`): elegir plantilla, contar el negocio con su
  **WhatsApp obligatorio** y, en `/crear/listo`, la oferta de personalizarla en el editor
  o hacerlo más tarde. Nace con suscripción de prueba y su versión inicial de diseño.

### Plantillas de tienda

- Siete plantillas con identidad propia: **Pasarela** (moda), **Calle** (ropa urbana),
  **Atelier** (carteras y accesorios), **Pisada** (zapatillas y calzado), **Esencia**
  (perfumería), **Fórmula** (perfumería de autor) y **Bazar** (de todo un poco, rubro
  "Variedades"). Cada una con su letra, su paleta medida y su kit; las cinco nuevas se
  dan de alta con `20261008120000_plantillas_nuevas.sql`.
- La identidad llega a toda la tienda pública. El panel es de Venduo, igual para
  todas; la tienda aparece en su sello y en su tarjeta de la barra lateral.
- Cambio de plantilla desde `/panel/apariencia` sin perder productos ni pedidos, con
  historial de versiones que se pueden **restaurar**.
- Todo documentado en `docs/store-templates.md`.

### Revisión general (8 y 9 de octubre)

Un recorrido completo en producción con una cuenta nueva —registro, alta, productos,
pedido por WhatsApp, pago y cancelación, catálogo, apariencia, editor y cuenta— y lo
que se arregló:

- **La IA ya no se cuelga.** Cada pedido al modelo tiene un tope de tiempo, reintentos
  incluidos; las pantallas con IA fijan `maxDuration` y atrapan el corte con un aviso.
- **El número de pedido es de cada tienda**, no de una secuencia global.
- "Lo que más se vende" cuenta por la fecha del pedido, y los gráficos guardados cuentan
  solo pedidos pagados.
- Las confirmaciones son un diálogo propio (`useConfirmacion`), nunca `window.confirm`.
- La IA no propone lo que la tienda ya tiene, y los colores se dicen en palabras.
- Botones del catálogo en una grilla pareja en el celular, botones de cantidad con la
  forma de la plantilla y textos corregidos.

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
- **Catálogo:** foto cuadrada o vertical y columnas.
- **Producto:** ficha **dividida** o **vitrina**, botón de compra que sigue al pulgar en el
  celular, enlace para preguntar por WhatsApp y productos parecidos. Las tres plantillas
  dibujan cada forma con su estilo.
- **Carrito:** en **dos columnas**, como **boleta** o **por pasos**; sugerencias para sumar
  al pedido y pedir o no el correo.
- Una tienda sin productos ve todo —portada incluida— con **productos de ejemplo** de su
  rubro, avisados como tales; la foto de la portada sigue siendo la real. Una sección sin
  contenido se ve como un recuadro que dice qué le falta, y las partes fijas de la
  plantilla ("Sobre la tienda") explican de dónde salen al tocarlas.
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
- Filtros de ofertas y categorías.
- **Carrito que manda el pedido por WhatsApp**: quien compra ve sus productos y el total,
  y un botón abre el chat con la tienda y el pedido escrito —líneas, total y número—. No
  deja ningún dato. El pedido queda en el panel; al volver del chat ve su número y puede
  reabrirlo. Mandar otra vez el mismo carrito en la siguiente media hora reabre ese
  pedido en vez de crear otro.
- **Pedidos no concretados**: a los siete días un pendiente sale de "Por cobrar" y de
  los avisos, y queda en su filtro. No se cancela: se puede marcar pagado igual.
- Pantallas de carga, error y "no encontrado".
- Enlace propio por tienda, con subdominio listo detrás de un interruptor
  (`NEXT_PUBLIC_DOMINIO_TIENDAS`).
- Tarjeta para WhatsApp al compartir la tienda o un producto.

### Panel del emprendedor (`/panel`)

- **Resumen** con el estilo de Venduo, igual para toda tienda, y la tienda reconocible en
  su sello. Cada sección en su panel: **Para hoy** (lo que espera respuesta, con los
  mismos números de la barra), **Primeros pasos** mientras falten, **Cómo te va** (cifras
  contra el período anterior y un gráfico de 7, 30 o 90 días que se recorre con el dedo o
  el teclado), **Últimos pedidos**, **Lo que más se vende** y **Se está acabando**.
  Si la tienda no tiene WhatsApp, es lo primero que pide. Compartir la tienda abre el enlace, el QR para descargar y
  un mensaje listo para WhatsApp.
- **Productos**: alta y edición con fotos, stock, umbral de aviso, precio
  anterior, código y destacado. Categorías propias.
- **Pedidos**: lista y detalle con el mismo número que llegó por WhatsApp. Tres estados:
  pendiente, pagado y cancelado. Marcar pagado descuenta el stock; cancelar un pagado lo
  devuelve.
- **Estadísticas**: preguntas en lenguaje natural, gráficos guardados, edición del gráfico
  por texto e informe en PDF (completo o de un gráfico).
- **Apariencia**: la puerta al editor, la plantilla, cambiarla y el historial, con
  **Restaurar** en cada versión. El resumen también lleva al editor, y pide darle estilo
  mientras la tienda luzca igual a la plantilla.
- Todas las pantallas se arman como el Resumen: cada cosa en su panel con borde, un
  título que dice para qué sirve y su estado vacío dentro.
- Barra lateral con contadores de lo que pide atención; se puede plegar y recuerda cómo
  quedó.

### Administración (`/admin`)

- Solo para la cuenta de administrador; para cualquier otra, con sesión o sin ella, 404.
  Todo cambio queda en `admin_audit_log` y se ve en "Cambios".
- **Resumen:** tiendas y su suscripción, ventas, pedidos y visitas de la plataforma, el
  embudo de activación, las más visitadas y la salud del sistema.
- **Tiendas:** lista con búsqueda, filtros —trabadas, sin publicar, en prueba,
  bloqueadas, pausadas— y orden; exportación a CSV. La ficha de cada una trae sus
  visitas, la suscripción (extender, marcar activa, bloquear), pausarla con motivo, sus
  funciones, ocultar productos y notas internas, con un enlace a su WhatsApp.
- **Plantillas:** cuáles se ofrecen, en qué orden y cuáles van marcadas como nuevas o
  recomendadas, de tienda y de catálogo.
- **Funciones:** diez, cada una activa, desactivada u oculta, para todas o por tienda; el
  interruptor que apaga toda la IA y el tope diario de pedidos a la IA por tienda.
- **IA:** pedidos, fallas y demoras, por tipo y por tienda.
- **Registro:** abierto, cerrado o con invitación, y los códigos de invitación.

### Visitas

- Se cuentan sin cookies ni datos de nadie: una huella diaria con sal que se borra. De
  dónde llega cada visita —WhatsApp, TikTok, Instagram, Facebook, QR, catálogo— sale del
  referente o de la marca `?o=` que llevan el QR y el catálogo en PDF.
- No cuentan el dueño, el administrador, los robots ni las precargas.
- El administrador las ve siempre; el emprendedor, solo si se le activa la función
  "Visitas" (oculta de fábrica): en su Resumen, en Productos —con el filtro "Muy vistos,
  poco vendidos"— y en las preguntas a sus estadísticas.

### Base y seguridad

- Supabase con RLS en todas las tablas y borrado lógico.
- El pedido solo se crea en el servidor (`create_order`), que recalcula los precios y
  comprueba el stock. El stock lo mueve un disparador al cambiar de estado.
- La IA de estadísticas solo lee, en una transacción de solo lectura y contra vistas de la
  propia tienda.
- Modo demo que funciona sin credenciales.

### Rendimiento

- Las funciones de Vercel corren en São Paulo (`gru1`), junto a la base. Antes corrían en
  Washington y cada consulta cruzaba el continente.
- La sesión se verifica sin ir a Supabase (`getUsuario()`), una vez por pedido, y las
  pantallas piden sus datos en paralelo: las del panel pasaron de unos seis viajes en
  fila a dos.
- Cada sección del panel muestra su esqueleto al instante, la barra lateral precarga sus
  pantallas y el enlace tocado late mientras se abre.
- Reglas en `.agents/rules/performance.md`.

---

## Lo que falta

### 1. La app del emprendedor — prioridad alta

Una app nativa en un repositorio aparte: Android primero, con los cimientos para iPhone.
Pedidos, productos con la cámara, stock, compartir, números y avisos de pedido nuevo. De
este repositorio necesita la API `/api/v1`, la tabla de avisos y los enlaces universales.
Plan completo y fases en **`docs/plan-app-movil.md`**. Se hace con Expo (React Native).

### 2. Funciones por plan — cuando se decida

Hoy hay un solo plan. Las funciones ya se resuelven por tienda en la base
(`funcion_de_tienda`), así que un plan sería una capa más entre la general y la de la
tienda. No se construye hasta que estén pensados los planes.

### Historia: la migración de la compra por WhatsApp (aplicada)

`supabase/migrations/20261006120000_compra_por_whatsapp.sql` cambia producción:

- Borra `store_sellers`, `commissions`, `seller_profiles` y `store_invites`, sus
  funciones y sus columnas en `stores`, `products`, `orders` y `profiles`. **No se
  recupera**: se pierden los vínculos, las comisiones y los perfiles de vendedor de la
  demostración.
- Deja los estados del pedido en `pendiente`, `pagado` y `cancelado`: los enviados,
  entregados y en disputa pasan a pagados.
- Devuelve el stock de los pedidos pendientes, porque desde ahora el stock baja al pagar.
- `create_order` pasa a recibir solo la tienda y los productos, y `create_store` exige el
  WhatsApp.

Pasos: `npx supabase db push`, `npm run db:types` (tiene que dar el mismo
`types/database.ts` que va en el commit) y recién entonces publicar el código. Entre
uno y otro, el código viejo falla contra la base nueva: conviene hacerlos seguidos.

Las tiendas de la demostración que no tengan WhatsApp no reciben pedidos hasta cargarlo
en `/cuenta`.

### 3. Marketing — prioridad media

`/panel/marketing` es un marcador "Pronto". La tarea `generateCampaign` existe en la capa
de IA pero no se usa.

Falta:

- Generar copys para Facebook y WhatsApp desde un producto.
- Publicar: plan A por API de Meta, plan B con enlaces de compartir y copiar. Se recomienda
  ir directo al plan B por el tiempo de revisión de Meta.

### 4. Plantillas — prioridad baja

- Más plantillas para los rubros que quedaron en la base editorial (tecnología, hogar,
  cosmética).
- Atributos por rubro: talla y color en moda, mililitros o familia olfativa en
  perfumería. Piden variantes en el carrito y en `create_order`.

### 5. Suscripción — prioridad baja

Se modela el estado, no el cobro. Falta el bloqueo real al vencer la prueba (panel en
solo lectura con exportación a CSV) y la purga a los 90 días.

### 6. Pendientes chicos

- **Una vez, entrar a `/panel/apariencia` después de horas sin uso terminó en `/panel`**
  (revisión del 8 de octubre). El registro muestra pedidos a `/auth/destino` y `/crear`
  justo después, como si en ese instante la sesión no encontrara la tienda. No se pudo
  reproducir: si vuelve a pasar, mirar el refresco del token cuando varias precargas de
  la barra salen a la vez con un token vencido.
- **La plantilla editorial no dibuja las grillas de productos de su portada**: muestra
  su catálogo completo. El editor lo avisa en esas tiendas, pero editar una grilla ahí no
  se ve.
- **Una propuesta de la IA puede tardar** entre 6 y 55 segundos: si la primera no pasa
  la validación y queda tiempo, hay un segundo intento. Pasado el tope, la pantalla lo
  dice y se puede volver a pedir.
- **`generateStoreBlueprint` sigue sin usarse**: inventa una tienda entera, con slug y
  productos. "Que la IA escriba tu portada" se resolvió con la tarea del editor.

- **Fotos en los datos de ejemplo.** Casi ningún producto tiene foto, y las plantillas se
  lucen con ellas. Importante antes de la demostración.
- **Textos de ejemplo visibles** en tiendas con plantillas retiradas (p. ej. "Cuenta aquí
  de dónde salen tus piezas" en Casa Illimani). Reemplazarlos o pasar esas tiendas a una
  plantilla nueva.
- **Tiendas de comida sembradas en producción** (Panadería Doña Elsa y otras de la
  demostración): contradicen el mensaje nuevo, pero cambiarlas toca datos compartidos
  y se acuerda antes.
- **Un pack del catálogo no se compra como pack** en la tienda online: su precio se
  muestra en el PDF y la venta se arma por WhatsApp. Venderlo como pack toca
  `create_order`.
- **Canva directo**: crear la integración en el portal de desarrolladores de Canva,
  cargar `CANVA_CLIENT_ID` y `CANVA_CLIENT_SECRET` en Vercel y pedirle a Canva la
  revisión, sin la cual no la puede autorizar cualquier cuenta. Mientras tanto, "Editar
  en Canva" va por el camino a mano. Los pasos, en `docs/catalogos-pdf.md` §10.
- **`.env.example`** no tiene `NEXT_PUBLIC_DOMINIO_TIENDAS`, `CANVA_CLIENT_ID` ni
  `CANVA_CLIENT_SECRET`.
- **Dominio propio** para las tiendas con subdominio: comprar el dominio, crear el
  registro DNS comodín y darlo de alta en Vercel.
- **El rojo de Venduo** está a 4,35:1 contra el papel, un poco por debajo del mínimo AA
  para texto chico.
- **Avisos de Next.js** por `quality="90"` en imágenes de la portada: hace falta
  configurar `images.qualities` antes de pasar a Next 16.
- Avisos de lint en los scripts de la skill `impeccable`, que es de terceros.

---

## Fuera de alcance

No se construye, según `VENDUO.md` §7: multi-tienda por usuario, red de vendedores y
comisiones, gestión de envíos, cobrar dentro de la plataforma, pedirle datos a quien
compra, cobro de la suscripción, notificaciones por correo y tests automatizados. La
app móvil nativa salió de esta lista el 10 de octubre de 2026 (arriba, "Lo que falta").
