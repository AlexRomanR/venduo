# Plan: la app de Venduo para el emprendedor

Una app nativa donde el emprendedor entra a su cuenta y maneja su negocio desde el
celular: pedidos, productos, stock, compartir y números. **Quien compra sigue usando la
tienda web**: la app es para quien vende.

Estado: **planificada, no empezada.** Al terminar cada fase se marca acá y en
`docs/estado-del-proyecto.md`.

| Fase | Qué                                                  | Estado    |
| ---- | ---------------------------------------------------- | --------- |
| 0    | Cimientos: repositorio, API v1, diseño, tiendas      | Pendiente |
| 1    | Entrar y cobrar: ingreso, Inicio y Pedidos           | Pendiente |
| 2    | Avisos: pedido nuevo, cobros pendientes y stock bajo | Pendiente |
| 3    | Productos: alta con la cámara, stock y categorías    | Pendiente |
| 4    | Compartir y alta de la tienda desde la app           | Pendiente |
| 5    | Números e IA, y la apariencia en versión liviana     | Pendiente |
| 6    | Sin conexión, enlaces universales y Play Store       | Pendiente |
| 7    | iPhone: cuentas de Apple, revisión y App Store       | Pendiente |

---

## Decisiones tomadas

- **Se construye una app nativa de verdad.** La exclusión de `VENDUO.md` §7 era para la
  hackathon y se levantó el 10 de octubre de 2026.
- **Repositorio aparte para la app.** Este repositorio sigue siendo la web, la base y la
  API; la app consume la API y Supabase.
- **Android primero, con los cimientos listos para iPhone.** Nada de lo que se escriba
  puede depender de Android: rutas, permisos, notificaciones y almacenamiento se escriben
  para las dos plataformas aunque se publique en una.
- **Misma base, mismas reglas.** La app usa el mismo Supabase con la sesión del usuario:
  RLS, los disparadores y las funciones del servidor hacen cumplir lo mismo que en la web.
- **Las claves nunca viajan al celular.** Ni la de la IA ni la de servicio. Lo que las
  necesita pasa por la API de la web.
- **Lo que sigue fuera de alcance, sigue fuera:** cobrar dentro de la plataforma, envíos y
  pedirle datos a quien compra. En iPhone, además, **ningún botón para pagar la
  suscripción**: Apple exigiría su propio sistema de pagos.

- **Expo (React Native) con TypeScript.** Se evaluó Flutter y se descartó; la comparación
  está abajo, en "Tecnología".

## Pendiente de decidir

- El identificador de la app (`bo.venduo.app` propuesto) y su nombre en las tiendas.

---

## Tecnología

|                          | Expo (React Native, TypeScript)                                      | Flutter (Dart)                                                          |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Lenguaje                 | El mismo de la web                                                   | Uno nuevo para el equipo                                                |
| Supabase                 | Cliente oficial y **tipos generados** de la base, como en la web     | Cliente oficial; tipos de la base a mano o con herramientas de terceros |
| Lo ya escrito            | Se puede copiar tal cual: formato de dinero, estados del pedido, zod | Hay que reescribirlo en Dart                                            |
| Actualizar sin revisión  | Sí, con EAS Update, incluido                                         | Con Shorebird, servicio pago aparte                                     |
| Rendimiento en gama baja | Bueno con Hermes y la arquitectura nueva                             | Muy bueno y parejo; dibuja todo él mismo                                |
| Diseño a medida          | Bien; los componentes nativos se visten                              | Muy bien; control total de cada píxel                                   |
| iPhone después           | El mismo código                                                      | El mismo código                                                         |

**Se eligió Expo.** Con un solo desarrollador y la web en TypeScript, reutilizar los
tipos de la base, los esquemas zod y las reglas ya escritas evita que la app y la web
calculen distinto un total o un estado. Flutter gana en control visual y en rendimiento
parejo, pero cobra un lenguaje nuevo y la reescritura de todo lo compartido.

### Lo que se comparte con la web, con repositorios separados

Sin un paquete común, lo compartido se mantiene así:

- **Tipos de la base:** la app los genera con `supabase gen types` contra el mismo
  proyecto, igual que `npm run db:types` acá.
- **Reglas puras** (formato de dinero y fechas, estados del pedido, mensaje de WhatsApp,
  funciones y sus estados): se copian a la app desde `lib/format.ts`, `lib/pedidos.ts` y
  `lib/funciones.ts`, con una línea que diga de qué archivo y de qué versión salieron.
  Cuando una cambia acá, se cambia allá en el mismo día.
- **La fuente de verdad de una regla de negocio es siempre la base o la API**, nunca la
  app: si la app y el servidor no coinciden, gana el servidor.

### Lo que la app hace directo y lo que pide a la API

| Qué                                                               | Cómo                                                                  |
| ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| Leer pedidos, productos, categorías; marcar pagado; ajustar stock | Directo a Supabase con la sesión: RLS y los disparadores ya lo cubren |
| Crear la tienda, cambiar de plantilla                             | Las funciones de la base: `create_store`, `change_store_template`     |
| IA, PDF de catálogos, publicar el diseño, visitas, funciones      | `/api/v1/...` en la web, con el token de la sesión                    |

---

## Qué tiene la app

### Entrar y empezar

- Ingreso y registro con correo y contraseña, respetando el registro abierto, cerrado o
  con invitación (`estado_del_registro()`). La sesión no se cierra sola.
- Alta de la tienda en los mismos tres pasos de la web: plantilla con su miniatura,
  negocio con el WhatsApp obligatorio, y listo.
- Un recorrido corto la primera vez: cargar el primer producto y compartir la tienda.

### Barra inferior: cinco pestañas

1. **Inicio:** "Para hoy" (pedidos por cobrar, agotados, lo que falta configurar), "Cómo
   te va" con ventas de hoy, la semana y el mes, el sello de la tienda con su estado
   —publicada, borrador, pausada— y las visitas si Venduo se las activó.
2. **Pedidos:** filtros por cobrar, pagados, cancelados y no concretados; deslizar para
   marcar pagado o cancelar, con confirmación; abrir el chat de WhatsApp con un toque; el
   detalle con líneas, total e historial.
3. **Productos:** alta desde la cámara —fotos, nombre, precio, stock en una pantalla— con
   la foto comprimida en el celular antes de subirla; stock con más y menos desde la
   lista; filtros de agotados, por acabarse, ocultos, destacados y "muy vistos, poco
   vendidos"; categorías, precio anterior y destacado; "Oculto por Venduo" cuando el
   administrador lo moderó.
4. **Compartir:** enlace y QR con la hoja de compartir del celular; catálogos guardados,
   el PDF con los precios del día como archivo o enlace; pedirle un catálogo a la IA.
5. **Más:** estadísticas y preguntas a la IA; apariencia liviana —logo, colores, textos
   de la portada, secciones y plantilla— con "Editar en la computadora" para el editor
   completo; cuenta, WhatsApp de la tienda, estado de la suscripción, cerrar sesión y
   **borrar la cuenta**, que exigen Apple y Google.

### Lo que la hace valer más que la web

- **Notificaciones:** pedido nuevo al instante ("Nuevo pedido #104 · Bs 240"), cobros
  pendientes una vez al día y stock bajo. Cada una se puede apagar.
- **Sin conexión:** muestra lo último cargado y guarda los cambios de stock y estado para
  mandarlos cuando vuelve la señal.
- **Enlaces que abren la app:** un enlace al panel o una notificación abren esa pantalla.
- **Atajos desde el ícono:** "Nuevo producto" y "Ver pedidos".
- **Lo que Venduo apaga en `/admin` se apaga también en la app**: la pantalla lo oculta o
  lo atenúa, y la API lo rechaza.

### Lo que no va

- El panel de administración: sigue solo en la web.
- El editor completo de la tienda y el constructor de catálogos hoja por hoja: se abren
  en la web.

---

## Diseño

- **El mismo mundo de Venduo** (`DESIGN.md`): papel, tinta y la señal; Archivo y Geist.
  Los tokens se copian de `app/globals.css` a un archivo de tema de la app; si la paleta
  cambia acá, cambia allá.
- **Material 3 manda en estructura y navegación en Android**; la identidad de Venduo
  entra por el tema: colores, tipografía, forma y movimiento. En iPhone se respetan sus
  garantías: márgenes seguros, volver deslizando desde el borde y "Reducir movimiento".
- **Gestos del celular:** barra inferior, hojas que suben desde abajo para acciones y
  formularios cortos, deslizar sobre filas, tirar para actualizar y vibración al
  confirmar.
- **375 px de base**, objetivos táctiles de 48 dp en Android (44 pt en iPhone), una
  acción principal por pantalla.
- Toda lista con sus tres estados: con datos, vacía —diciendo qué hacer— y cargando.
- **Rendimiento en gama baja:** listas virtualizadas, imágenes en caché, animaciones
  livianas y nada que dependa de una animación para entenderse.
- Las skills de diseño del proyecto alcanzan: `impeccable` trae guía para Android, iPhone
  y apps multiplataforma (`reference/android.md`, `ios.md`, `adapt.native.md`,
  `audit.native.md`). Para animar en Expo existe `animate-expo`, de la misma familia que
  `animate`; se instala si se elige Expo.

---

## Lo que hay que construir en este repositorio

1. **API `/api/v1`:** valida el token de Supabase y sirve la IA (las tres tareas, con
   `permisoDeIa` y `anotarUsoDeIa`), los PDF de catálogos, publicar el diseño, las
   visitas del emprendedor y sus funciones (`exigirFuncion`). Reutiliza la lógica de las
   Server Actions sin duplicarla: las acciones y la API llaman a las mismas funciones.
2. **Notificaciones:** tabla `push_tokens` (usuario, token, plataforma, borrado lógico)
   con política de cada uno a lo suyo; un disparador al crearse un pedido que avisa por
   Expo Push (o FCM y APNs si se elige Flutter); una tarea diaria con `pg_cron` para los
   cobros pendientes y el stock bajo.
3. **Enlaces universales:** `/.well-known/assetlinks.json` (Android) y
   `/.well-known/apple-app-site-association` (iPhone) servidos por la web.
4. **Borrar la cuenta:** una función que da de baja a la persona y su tienda con el
   borrado lógico de siempre, y la purga a los 90 días.
5. **Política de privacidad** publicada en la web: la piden las dos tiendas.

---

## Fases

| Fase | Entrega                                                                         | Se puede probar                            |
| ---- | ------------------------------------------------------------------------------- | ------------------------------------------ |
| 0    | Repositorio de la app, tema de diseño, API v1 con token, cuenta de Play Console | La web sigue igual                         |
| 1    | Ingreso y registro, Inicio, Pedidos con marcar pagado y abrir WhatsApp          | Primera versión interna en un celular      |
| 2    | Notificación de pedido nuevo, recordatorio de cobro, stock bajo                 | El celular avisa cuando llega un pedido    |
| 3    | Alta con la cámara, stock rápido, categorías y filtros                          | Cargar el catálogo entero desde el celular |
| 4    | QR, enlace, catálogos en PDF, alta de la tienda en la app                       | Alguien nuevo arranca solo desde la app    |
| 5    | Estadísticas, preguntas a la IA, catálogo con IA, apariencia liviana            | Paridad con lo importante del panel        |
| 6    | Sin conexión, enlaces universales, borrar cuenta, ficha de Play Store           | Publicación en Play Store                  |
| 7    | Cuenta de Apple, ajustes de iPhone, revisión                                    | Publicación en App Store                   |

La fase 1 ya sirve sola: quien solo mira sus pedidos y los marca pagados desde el
celular ya gana.

## Lo que hace falta fuera del código

- Cuenta de **Google Play Console**: USD 25, pago único.
- Cuenta de **Apple Developer**: USD 99 al año, en la fase 7.
- Un **Android de gama baja** para probar: la verificación es manual, en un equipo real.

## Riesgos

- **Que las reglas se separen entre la web y la app.** Por eso la fuente de verdad es la
  base o la API, y lo copiado lleva de dónde salió.
- **Revisión de Apple:** borrar la cuenta, política de privacidad y ningún botón de pago.
- **Dos interfaces que mantener.** La API v1 evita que sean dos productos.
