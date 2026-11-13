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
| 9   | Imagen y texto para publicar un producto en redes            | ✅     |
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
- La portada (`/`, en `components/portada/`) se rehizo el 30 de octubre: "el cuaderno de
  ventas pasado en limpio". Va en este orden: titular con el celular en 3D (en
  escritorio, los productos caen al celular con el scroll), el problema, cómo funciona en
  tres pasos con su escena, el pedido por WhatsApp de punta a punta, por qué no es solo
  una tienda online (las plantillas vistiendo la tienda, el catálogo, la publicación y
  las estadísticas), para quién es (rubro y plantilla), lo que incluye, preguntas y
  llamado final. Cada escena tiene su versión para el celular, legible a 360 px. Se
  revisó dos veces con `/impeccable critique` (25/36 y 26/36) y se corrigió lo que
  marcaron. Los prototipos `/noche`, `/diario` y `/libreta` se borraron.
- Los ejemplos son de quien vende por redes —ropa, zapatillas, belleza, tecnología,
  segunda mano—, no de comida casera. Cómo se le habla al cliente está en
  `ui-styling.md`.

### La marca

- **Desde el 7 de noviembre: Venduo es el cuaderno de ventas, en tres registros**
  (`DESIGN.md`, "Overview"). La portada, el Resumen y el Inicio de la app van **en
  escenas** con el scroll. Las pantallas de trabajo —Pedidos, Productos, Catálogos,
  Estadísticas, Publicar en redes, Apariencia, Compartir, la cuenta— van en **el cuaderno
  quieto**: tarjetas con radio y sombra teñida, notas pegadas, tickets con sello,
  titulares con resaltador; se mueven solo al tocar. El ingreso, el alta y `/admin` siguen
  en **el diario**. Se eligió mirando Pedidos dibujado de tres formas. El mismo día se
  quitó el principio de "Android de gama baja": el movimiento no se limita por equipos
  lentos, solo con "Reducir movimiento". Qué pantallas faltan pasar, en "Lo que falta",
  1.c.
- El logo es la feria en el celular: el toldo a rayas de un puesto dentro de la pantalla.
  Va en la portada, el ingreso, el alta y la barra lateral
  —plegada, el símbolo solo—, y es el favicon, el ícono del celular y la tarjeta al
  compartir la portada. Se regenera con `npm run marca`. Todo en
  `.agents/rules/marca.md`.
- **Desde el 31 de octubre: la tinta trabaja, la frambuesa avisa.** El papel pasó al
  cálido `#f7f5f0` y la tinta a `#1d1c1a`. Los botones y lo elegido van en tinta (token
  `accion`, que en una tienda vale el color de su plantilla), y la señal es frambuesa
  `#d0216a`: solo lo que pide algo, los errores y el logo. El vino del 30/10 se probó y no
  encajó en el panel (contra la tinta daba 1,35:1); la frambuesa se eligió comparando
  cuatro tonos en el panel de verdad. Los gráficos van en tinta con la señal en el punto
  activo, el foco de los campos en tinta, y el resaltador `#fff1a6` es un color del
  sistema para lo que acaba de cambiar. Íconos y tarjeta regenerados. Brief:
  `docs/briefs/2026-10-31-productos-vivo-y-color.md`.
- **El Resumen, en escenas (31 de octubre).** `/panel` se rehízo con la filosofía de la
  portada: la tienda en un celular en 3D que sigue al puntero, lo que espera en notas
  pegadas, las ventas en una escena oscura con la cifra que cuenta y el gráfico que
  crece, los pedidos como tickets con sello al cobrarlos, lo más vendido como polaroids,
  las visitas en un embudo y el enlace para copiar al final. GSAP y Lenis; cada escena
  se arma al aparecer y vuelve a empezar al salir. Mismos datos y acciones que antes
  (cobrar, reponer, vacaciones, compartir). En `components/panel/resumen/`; las piezas
  viejas del tablero se borraron. La app tiene el mismo Inicio en escenas, con
  Reanimated (`src/components/inicio/escenas/`).
- **Catálogos responde (31 de octubre).** Al elegir los productos, el catálogo se arma al
  lado ("Así va quedando") y cada foto elegida vuela hasta él. La plantilla se elige en un
  probador: tu catálogo en grande y las plantillas en miniatura, que se prueban tocándolas.
  En el editor, la hoja que cambió se marca con el resaltador, las cifras cuentan, una luz
  recorre las hojas mientras sale el PDF y "Enlace" y "Verlo" guardan solos. En la lista,
  mandar por WhatsApp está a la vista, «N agotados» avisa y lo recién editado se marca; si
  la lectura falla, se dice. Todo con CSS y la API de animaciones del navegador. La app
  usa el mismo probador y la vista previa con `vivo`, y al elegir un producto su foto
  vuela hasta el botón que arma el catálogo.

### Catálogos en PDF (`/panel/catalogos`)

- Doce plantillas —grilla, revista, lookbook, lista de precios, una foto por hoja,
  vitrina de lujo, historia 9:16, mayorista, feria, packs, ofertas y flyer— hechas de
  siete bloques con 25 variantes. Cualquier bloque sirve en cualquier plantilla.
- **La lista y el editor son los mismos que en la app.** La lista: la IA plegada en una
  fila —arma el catálogo y lo abre en el editor—, los guardados si hay, las plantillas
  con el estilo de la tienda y las doce, y "Nuevo catálogo" flotando. Tocar una
  plantilla empieza un catálogo con ella. El editor en el celular: las hojas en
  pantalla y el panel que sube desde abajo con Hojas, Productos, Packs, Estilo, IA y
  Listo, con deshacer y rehacer. Los productos se eligen por sus fotos.
- Packs con su precio, estilo de la tienda o propio, fondo oscuro, A4 o 9:16, y el
  contraste controlado antes de descargar.
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
- Noviembre: **Quilate** (joyas y accesorios, rubro nuevo "Joyas") y **Probador** (ropa
  de mujer, boutique), la primera tanda de siete (`docs/briefs/2026-11-11-plantillas-nuevas.md`).
  Traen dos letras nuevas, Marcellus y Gloock, las tallas en la tarjeta
  (`OpcionesDeVitrina`) y un plegable en la ficha. Migración
  `20261112120000_quilate_y_probador.sql`, **probada en local y sin aplicar en
  producción**.
- Noviembre, segunda tanda: **Ámbar** (perfumes árabes y decants), **Correa** (carteras
  de color), **Taco** (zapatos de mujer), **Tocador** (maquillaje y skincare) y
  **Crayón** (ropa de niños y bebés, rubro nuevo "Niños"). Cuatro letras más: Reem
  Kufi, Syne, Fraunces y Fredoka. Migración `20261113120000_cinco_plantillas.sql`,
  **probada en local y sin aplicar en producción**. Con esto hay catorce plantillas.
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

### Textos y letras (29 y 30 de octubre)

Una revisión de los unos 5.300 textos de la web y la app: cada uno con su voz —Venduo
y la tienda en plural, las cosas no hablan, sin género fijo, cada pantalla con su
nombre de hoy—, escrita como regla en `ui-styling.md`. Las semillas de las plantillas
perdieron su texto de relleno ("Cuenta aquí…", "Escribe acá…") y su tercera persona,
en la base y en las tiendas que los habían copiado, y las secciones nuevas del editor
nacen vacías, con pistas grises en vez de un testimonio o un horario inventados. De vacaciones, la franja y el
"Cómo comprar" de cada plantilla se ocultan con `SiRecibePedidos`. Las letras se
sirven desde `lib/fuentes/` con `next/font/local`: el build ya no las baja de Google.

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

- **Resumen en escenas**, como la portada. La tienda en un celular en 3D que abre el
  editor, con una frase de lo vendido hoy y lo que espera el cobro. **Para hoy** en notas
  pegadas que llevan a la lista filtrada, **Primeros pasos** que se tachan solos, **Cómo
  te va** en la escena oscura con la cifra que cuenta y el gráfico que crece, **Últimos
  pedidos** como tickets con el botón **Marcar pagado** ahí mismo, **Lo más vendido**
  como polaroids, **Se está acabando** con más y menos para reponer sin salir, las
  visitas si están activas y el enlace para copiar al final. Lo que no pide nada no
  aparece. Si la tienda no tiene WhatsApp, es lo primero que pide.
- **Productos**: alta y edición con fotos, stock, umbral de aviso, precio
  anterior, código y destacado. Categorías propias.
- **Pedidos**: lista y detalle con el mismo número que llegó por WhatsApp. Tres estados:
  pendiente, pagado y cancelado. Marcar pagado descuenta el stock; cancelar un pagado lo
  devuelve.
- **Estadísticas** (rehecha el 8 de noviembre, brief `docs/briefs/2026-11-08-estadisticas.md`):
  abre con un tablero fijo que va más a fondo que el Resumen —cada cifra contra el
  período anterior (7, 30 o 90 días), cuántos pedidos se cobran, lo que más deja, lo que
  no se mueve y los días fuertes— y la IA en una columna fija a la derecha desde 1280 px
  (por debajo, una bandeja que abre la conversación en una hoja). Lo que arma la IA se
  agrega a "Tu tablero", que sigue con su PDF. Una tienda sin ventas ve qué falta y
  tarjetas de ejemplo sin cifras. Las acciones respetan que el administrador apague la
  pantalla, y lo guardado se valida con zod. La IA se probó de punta a punta con la
  tienda de Rosa, y la app tiene el mismo tablero fijo (`GET /api/v1/estadisticas?dias=`
  suma `estadisticas` a lo guardado). Riesgo anotado: el tope
  de 1000 filas de PostgREST recortaría las ventas de una tienda con mucho movimiento,
  igual que en el Resumen.
- **Apariencia** (rehecha el 8 de noviembre, `docs/briefs/2026-11-08-apariencia.md`): tu
  plantilla y las otras en una sola pasarela, una a la vez al medio y con la tienda de la
  persona adentro de cada dibujo: la suya con «Abrir el editor» y «Ver tienda», las otras
  con «Usar X» —que pregunta en una hoja— y el historial con las tres
  últimas a la vista y **Restaurar** en cada versión. Pasó de 5.700 a 1.500 px de alto
  en el celular. El resumen también lleva al editor, y pide darle estilo
  mientras la tienda luzca igual a la plantilla.
- Las pantallas de trabajo todavía se arman en paneles: cada cosa en su panel con
  borde, un título que dice para qué sirve y su estado vacío dentro. Pasan al cuaderno
  quieto de a una ("Lo que falta", 1.c). **Pedidos y Productos son
  las pantallas de la app**: números grandes que filtran, fichas que se deslizan, los
  pedidos por día con su foto y "Cobrado", el detalle con "Marcar pagado" fijo abajo, y
  los productos con su marca sobre la foto y más y menos de stock. Cada pantalla lleva
  una descripción corta y cada panel un subtítulo de una línea, como Catálogos.
  Apariencia, Catálogos, Estadísticas, Cuenta y el formulario del producto son la
  fase 3.
- **Nueva venta** (`/panel/pedidos/nueva` y la app): lo vendido en el chat o en persona
  se registra como un pedido pagado con `origen = 'directa'`, descuenta el stock en el
  acto y cuenta en las estadísticas. Se elige con fotos, cada línea lleva el precio al que
  se vendió, y si el stock dice que no alcanza la línea lo avisa con "Corregir el stock".
  En Pedidos va como botón flotante, y la fila dice "Venta directa".
- **Costo y ganancia**: cada producto puede llevar lo que le cuesta a la tienda
  (`product_costs`, solo del dueño), con la ganancia por unidad en vivo en el formulario.
  "Cómo te va" muestra la ganancia del período —y avisa si falta el costo de algún
  producto— y Estadísticas la contesta ("¿Cuánto gané este mes?").
- **Variantes de talla, color y número** (web y app): hasta dos opciones por producto,
  con las combinaciones que se arman solas, el stock y el precio de cada una y una foto
  por color. Quien compra elige en la ficha —lo agotado tachado, la foto del color—, la
  variante viaja en el carrito, el pedido y el mensaje, y el stock lo lleva la base. La
  venta directa pregunta cuál se vendió, "Se está acabando" avisa la talla agotada y el
  catálogo en PDF puede decir las tallas. En el formulario no se escribe: se elige el
  tipo —talla, número, color, tamaño u otra— y se marcan sus valores, ya escritos
  (`TIPOS_DE_OPCION` en `lib/variantes.ts`); cada color lleva su punto y su foto. La
  categoría sugiere el tipo (`tipoSugerido`: "Buzos" abre en Talla, "Botines" en
  Número), y el precio de cada una solo aparece con "Alguna cuesta distinto".
- **El formulario de producto es una pantalla por filas** (web y app):
  arriba fotos, nombre y precio, grandes y escritos ahí mismo; lo demás —unidades,
  tallas, categoría, oferta, costo, visible, destacado, aviso, descripción— una fila
  con su valor a la vista que abre una hoja. Las piezas (`components/panel/ajustes.tsx`)
  y la receta (`ui-styling.md`, skill `pantalla-por-filas`) son para toda pantalla de
  crear o editar algo.
- **Nueva venta, por filas** (web y app; brief en
  `docs/briefs/2026-10-23-nueva-venta-por-filas.md`): arriba lo vendido —foto, nombre,
  "1 × Bs 240" y más y menos—, "Agregar producto" abre la grilla en una hoja, donde se
  marcan varios productos y tallas (la talla es un segundo paso de la misma hoja) y se
  suman con "Agregar N productos", y tocar una línea abre su precio y "Quitar de la
  venta". En la web, la venta a medio armar sobrevive a "Corregir el
  stock" (`sessionStorage`); en la app la pantalla queda debajo y no se pierde, salvo
  que se salga de ella.
- **Ningún grupo de fichas baja de renglón a su ancho** (23 de octubre, web y app):
  columnas iguales (`GRILLA_DE_FICHAS`, y `GRILLA_DE_FICHAS_LARGAS` para las de dos o
  tres palabras) o una franja que se desliza, en catálogos, el alta, el Resumen, la
  tienda pública y `/admin`.
- **Nota interna del pedido** (23 de octubre): en el detalle, en Nueva venta y una
  línea en la lista. Solo la ve la tienda.
- **Descargar en Excel** (23 de octubre): pedidos (dos hojas, por período) y productos
  (una fila por talla), escritos sin dependencias (`lib/planilla.ts`). También desde el
  aviso de tienda bloqueada.
- **De vacaciones** (23 de octubre): panel en `/cuenta`, franja en el Resumen, banda en
  la tienda, sin pedidos —lo rechaza la base— y vuelta sola el día de la fecha.
- **Cargar varios productos** (23 de octubre, `/panel/productos/cargar`): fotos, una
  planilla con sus columnas o una lista escrita; la IA arma borradores, la persona los
  revisa y los crea juntos. La planilla anda sin IA. Función `ia_productos`. La capa de
  IA ya manda fotos. Antes de armar los productos se ve "Así leímos tu planilla": la
  tabla con lo que es cada columna, lo dudoso preguntado de a una y una casilla por
  fila. Web y app.
- **La suspensión del administrador se impone en la base** (23 de octubre): el dueño ya
  no puede quitársela por la API.
- **`/idea`**: de una idea en palabras a un cambio probado, con entrevista, brief en
  `docs/briefs/` y los agentes `investigador-de-producto`, `analista-tecnico`,
  `disenador` y `verificador` (skill `de-idea-a-pantalla`).
- **Mandar por WhatsApp** desde cada producto a la vista: su nombre, su precio y el
  enlace a su ficha, para contestar "¿precio?" en un toque. Web y app.
- Barra lateral con contadores de lo que pide atención; se puede plegar y recuerda cómo
  quedó. **En el celular el panel es la app**: la misma barra de arriba con el cuadro de
  rayitas, el mismo menú lateral —la persona, la tarjeta de la tienda y tres grupos—, las
  mismas pestañas de abajo y la misma cabecera del Resumen. Lo que cambia en una cambia
  en la otra.

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

### La app del emprendedor (repositorio `venduo-app`)

- Una app nativa para Android, con Expo, que entra con la misma cuenta y maneja la misma
  tienda: Inicio con "Para hoy" y las ventas, pedidos —deslizar para marcar pagado o
  cancelar—, productos con la cámara y el stock con más y menos, compartir el enlace, el
  QR y los catálogos en PDF, estadísticas con preguntas a la IA, la apariencia en versión
  liviana y el alta de la tienda. Con el mismo diseño de Venduo.
- **Sin conexión** muestra lo último que cargó y guarda los cambios de stock y de estado
  de un pedido para mandarlos cuando vuelve la señal.
- Un enlace del panel abre su pantalla en la app, y el ícono tiene atajos a "Nuevo
  producto" y "Ver pedidos".
- **Se mira, no se lee**: el Inicio muestra la tienda con la captura real de su
  portada —la saca la web y se renueva sola con cada edición— y lo que espera en
  números grandes que se tocan. Pedidos va por día y con la foto de lo que pidieron,
  con "Cobrado" en la fila; Productos filtra con sus números —sin stock, queda poco,
  cuánto vale el stock—; Catálogos tiene su propia pestaña; Compartir tiene un botón
  por red, tarjetas para historias con los colores de la tienda y el QR a pantalla
  completa.
- **Barra de abajo y menú lateral**: la barra con lo de todos los días, también en las
  pantallas de ajustes, y un menú con todo lo demás y su estado, que se abre con un
  cuadro de tres rayitas. Abre con el logo de Venduo que se arma.
- **Los editores de la tienda y de catálogos, completos en la app**: la vista previa es
  la web real en un WebView y la app manda cambios; publicar, versiones, la IA, guardar,
  mandar el PDF y Canva, todo desde el celular. Cada opción señala en la tienda lo que
  cambia, la vista previa se mira como en un celular o en una computadora, y las letras
  se eligen escritas con ellas mismas: la app las baja de la web, así que una letra
  nueva aparece sola.
- **Formularios que se ven como lo que editan**: producto, tienda, cuenta, apariencia,
  categorías y plantillas, con guardar fijo abajo y la pregunta antes de salir sin
  guardar.
- De este repositorio usa la API `/api/v1` y las rutas de `/.well-known/`. Las reglas
  las siguen imponiendo la base y la API: la app no puede hacer nada que el panel no
  deje.
- Probada en un emulador de Android y en el navegador. Falta publicarla: ver abajo.

### Base y seguridad

- Supabase con RLS en todas las tablas y borrado lógico.
- El pedido solo se crea en el servidor (`create_order`), que recalcula los precios y
  comprueba el stock. El stock lo mueve un disparador al cambiar de estado.
- La IA de estadísticas solo lee, en una transacción de solo lectura y contra vistas de la
  propia tienda.
- Modo demo que funciona sin credenciales.
- **Tests automatizados** (23 de octubre): Vitest para la lógica de `lib/` —dinero,
  ofertas, variantes, WhatsApp, tablero, funciones— dentro de `npm run check`, y pgTAP
  para la base sobre una copia local en Docker —`create_order`, el stock al pagar y
  cancelar, `registrar_venta`, las variantes, RLS entre tiendas— con `npm run test:db` y
  un job propio en el CI. Salieron dos errores, ya arreglados en
  `20261023120000_devolver_stock_a_la_variante.sql`: cancelar un pedido con dos líneas
  del mismo producto devolvía una sola, y una talla quitada y vuelta a crear no recibía
  su unidad. Y las tallas de un producto oculto se podían leer desde afuera
  (`20261023120100_variantes_de_productos_ocultos_rls.sql`). `aCentavos` quedó en `lib/format.ts`, en vez de tres copias. La app, cuando
  se apruebe la web.

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

### 1. Publicar la app del emprendedor — prioridad alta

La app está construida (arriba) y la base ya tiene lo que necesita: los avisos y la baja
de la cuenta están aplicados, y la política de privacidad, los términos y la página para
borrar la cuenta están publicados. Falta lo que es de quien publica: las cuentas de Expo,
Firebase y Play Console, y probarla en un teléfono de verdad. La lista está en
**`docs/plan-app-movil.md`**, "Lo que falta". iPhone viene después.

### 1.b. Capturas de la portada

El color, Catálogos y el Inicio en escenas ya están en la app (noviembre). Quedan de la
portada nueva: reemplazar la captura de la plantilla Fórmula, que muestra un frasco de
una marca real, y la de Calle, que dice "lo cerramos por WhatsApp".

### 1.c. Pasar las pantallas de trabajo al cuaderno — decidido el 7 de noviembre

La regla está en `DESIGN.md`, "Las pantallas de trabajo". **La web está pasada** (7 de
noviembre), por etapas y vista a 375 y 1280 px en modo demo:

- [x] Las piezas (`components/panel/piezas.tsx`, `lib/estilos.ts`): tarjetas, titular
      con su palabra resaltada, vacíos, fichas y botones en píldora. Se visten solas
      adentro del armazón (`data-registro="cuaderno"`); `/admin` y el alta siguen igual.
- [x] `FichasGrandes` y `FichasDeCobro`: notas pegadas que caen, lo urgente encerrado a
      mano.
- [x] Pedidos: cada pedido es un ticket con su talón; el sello "Por cobrar" se toca para
      marcar pagado, solo late el más viejo y "Pagado" se estampa al confirmarse; el
      detalle y la venta nueva, en tarjetas.
- [x] Productos: fotos con radio, más y menos redondos, el número que salta; el
      formulario, sus opciones y "cargar varios", en tarjetas.
- [x] Catálogos, Estadísticas, Publicar en redes, Apariencia y Tus datos: con las piezas.
- [x] Segunda pasada (8 de noviembre), con el diseñador, impeccable y el verificador:
      tarjetas de hoja (`#fdfcf9`) en vez de blancas; esqueletos con la forma de cada
      pantalla y su titular; el "1" de las polaroids entero; Productos aligerado (el valor
      del stock en la bajada, "Todo con stock" cuando no falta nada, botones de ícono en
      el celular); bandejas flotantes abajo; celdas sin hueco; el resaltador elegido por
      pantalla; nada por debajo de 12 px; la frambuesa solo en lo que pide algo.

**Falta:**

- [x] Probarlo con una tienda real (8 de noviembre, en la base local): cobrar con el
      sello, reponer desde el Resumen, cambiar de plantilla y deslizar la pasarela.
- [x] Los editores (8 de noviembre): el de la tienda lleva la marca del cuaderno en su
      raíz —está fuera del armazón— y los dos pasaron sus piezas: píldoras, tarjetas de
      hoja, paletas y cajas con radio, sin el rojo al pasar el cursor. La vista previa
      de la tienda vive en un `<iframe>` y no se toca.
- [x] Compartir es una pantalla (`/panel/compartir`), como en la app: el enlace que se
      copia, un botón por red, tarjetas para historias en PNG con la letra y los colores
      de la tienda (`/panel/compartir/historia`) y el QR. La barra y las pestañas llevan
      ahí; el diálogo corto queda para los atajos del Resumen y de Pedidos.
- [x] Categorías salió de la barra lateral: se entra desde Productos.
- [x] Reponer stock en el Resumen ya no vacía la escena: lo repuesto queda en su fila,
      marcado "Repuesto", hasta la próxima vez que se entra.
- [x] La app (9 de noviembre, `docs/briefs/2026-11-08-app-cuaderno.md`): las piezas
      (`Seccion`, `Tarjeta`, `SinDatos`, fichas y botones en píldora, hojas y avisos de
      hoja, esqueletos, bandejas) pasaron al cuaderno, y con ellas todas las pantallas
      de trabajo. Pedidos con tickets y el sello que cobra; Productos con una sola
      franja de filtros y más y menos redondos; Estadísticas con el tablero fijo y la IA
      en una hoja; "Editar tu tienda" es la pasarela, con los dibujos que hace la web
      (`/editor/app/apariencia`). Probado en el emulador contra la base local.
- [x] Tus datos y Datos de la tienda, unidas en la app (9 de noviembre) como `/cuenta`
      de la web: una pantalla con cada panel que se guarda por separado. "Datos de la
      tienda" del menú abre la misma, en el panel de la tienda.

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

### 3. Publicar en redes — en prueba

**Publicar en redes** (`/panel/marketing`, y en la app `mas/publicar`) está en la web y
en la app, de prueba: elegir un producto, la imagen con los colores y la letra de la tienda —historia
9:16 o cuadrada; foto grande, su color u oferta— y el texto para WhatsApp, Instagram y
TikTok, y Facebook, que escribe la IA (`escribirPublicaciones`) o se arma sin ella. Se
comparte imagen y texto juntos desde el celular, o se descarga y se copia. Desde cada
producto, "Publicar en redes" llega con él elegido.

**La app usa la misma imagen y la misma acción** (`/api/v1/publicar`, `…/imagen` y
`…/textos`): la imagen la dibuja la web y la app la baja, la muestra, la guarda en la
galería o la comparte con el texto copiado. Publicar directo por la API de Meta no se
hace: compartir desde el teléfono llega a las mismas redes sin la revisión de Meta.

**Publicar directo en TikTok** está hecho y apagado hasta configurarlo: con
`TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET` y `TIKTOK_VERIFICACION` en Vercel aparece el
botón en Publicar en redes de la web; la app publica en TikTok desde la hoja de compartir.
Falta crear la app en TikTok for Developers y pedir su
revisión; hasta entonces todo lo publicado queda privado. Los pasos, el guion del video y
el texto de la revisión están en `docs/tiktok.md`.

### 4. Lo que sigue del plan

Hecho en la web el 23 de octubre (brief `docs/briefs/2026-10-23-lo-que-falta-del-plan.md`):
la nota interna, descargar en Excel, de vacaciones y cargar varios productos con la IA.
El 24 de octubre se llevó a la app (rama `lo-que-falta` de `venduo-app`), con las rutas
`/api/v1/carga/…` y `/api/v1/exportar/…`; la app suma `expo-document-picker` para elegir
la planilla. La carga además lee una tabla pegada como lista, deja quitar filas, recorre
cada columna la primera vez y pregunta lo dudoso desde la barra de abajo. Para otra
vuelta: "Foto y precio" en serie desde la cámara y duplicar un producto.

### 5. Plantillas — prioridad baja

- Más plantillas para los rubros que quedaron en la base editorial (tecnología, hogar,
  cosmética).

### 6. Suscripción — prioridad baja

Se modela el estado, no el cobro. Falta el bloqueo real al vencer la prueba (panel en
solo lectura con exportación a CSV) y la purga a los 90 días.

### 6.b. Lo que dejó el recorrido de punta a punta (9 de noviembre)

Se recorrió la web entera a 390 px contra la base local, con una cuenta nueva: registro,
alta con la plantilla Calle, un producto con foto, la tienda pública, el carrito y el
pedido por WhatsApp (el mensaje sale al 591 con el detalle y el total), cobrar con el
sello (el stock bajó de 5 a 3), un catálogo guardado, una venta directa (el stock llegó a
0 y la tienda dice "Agotado"), despublicar (quien compra ve "Esto no está disponible") y
volver a publicar. Todo funcionó. Se arregló un error: el festejo y la hoja de "Nueva
venta" compartían la `key` "1" al registrar una venta.

Para rediseñar o revisar:

- [x] **El alta y el ingreso, rediseñados** (11 de noviembre, brief
      `docs/briefs/2026-11-09-alta.md`): en el cuaderno, primero el negocio y después la
      plantilla en la pasarela de Apariencia con el nombre adentro, y el final en una
      escena con la tienda en vivo en el celular del Resumen. El ingreso, con el mismo
      marco y una línea de texto.
- [ ] **Hojas y confirmaciones de la web, todavía en el diario**: "Agregar producto" de
      Nueva venta, "¿Marcar pagado el pedido?" y "¿Pasar a X?" de Apariencia llevan la
      raya de tinta arriba y esquinas vivas; la app ya las tiene en hoja con radio.
- [ ] **El PDF del catálogo en el celular** no se pudo ver en el navegador automático (el
      servidor lo arma: `POST /panel/catalogos/pdf` 200). Probarlo en un teléfono.

### 7. Pendientes chicos

- **Las fotos de una carga que no se crea quedan en Storage** (`product-images/{tienda}/`):
  se suben al procesarlas. Cuestan centavos; si molestan, subirlas a una carpeta propia y
  limpiarla.
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
- **El rojo de la base editorial** (`lib/plantillas/clasica.ts`) está a 4,35:1 contra
  su papel, un poco por debajo del mínimo AA para texto chico. La marca de Venduo ya no
  tiene el problema: la frambuesa pasa con 4,7:1.
- **Avisos de Next.js** por `quality="90"` en imágenes de la portada: hace falta
  configurar `images.qualities` antes de pasar a Next 16.
- Avisos de lint en los scripts de la skill `impeccable`, que es de terceros.

---

## Fuera de alcance

No se construye, según `VENDUO.md` §7: multi-tienda por usuario, red de vendedores y
comisiones, gestión de envíos, cobrar dentro de la plataforma, pedirle datos a quien
compra, cobro de la suscripción y notificaciones por correo. La app móvil nativa salió
de esta lista el 10 de octubre de 2026 (arriba, "Lo que falta"), y los tests
automatizados el 23 de octubre.
