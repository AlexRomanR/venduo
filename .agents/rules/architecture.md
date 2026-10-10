# Arquitectura

La especificación del producto vive en `VENDUO.md`. Esta regla cubre solo cómo se
organiza el código.

## Next.js 15, App Router

**Todo componente es de servidor salvo que diga lo contrario.** `"use client"` va solo
donde hace falta interactividad real: estado, eventos, formularios. Un componente de
servidor puede hacer `await` a la base directamente en el cuerpo, sin capa intermedia.

La marca `"use client"` es contagiosa hacia abajo: todo lo que importa un componente de
cliente viaja al navegador. Ponerla lo más abajo posible del árbol.

## Rutas

| Ruta                           | Qué es                                                 | Acceso          |
| ------------------------------ | ------------------------------------------------------ | --------------- |
| `/`                            | Portada pública                                        | Público         |
| `/login`                       | Registro e ingreso                                     | Público         |
| `/t/{slug}`                    | Tienda pública del emprendedor                         | Público         |
| `/t/{slug}/catalogo`           | Catálogo completo: filtros, búsqueda y orden por URL   | Público         |
| `/t/{slug}/p/{id}`             | Ficha de producto, con selector de cantidad            | Público         |
| `/t/{slug}/carrito`            | Carrito: el total y el pedido por WhatsApp             | Público         |
| `/crear`                       | Alta de la tienda, paso 1: elegir plantilla            | Requiere sesión |
| `/crear/negocio`               | Alta de la tienda, paso 2: nombre, rubro y WhatsApp    | Requiere sesión |
| `/crear/listo`                 | Alta de la tienda, paso 3: ofrece el editor            | Requiere sesión |
| `/editor`                      | Editor de la tienda, a pantalla completa. `?paso=`     | Requiere sesión |
| `/editor/vista-previa`         | La tienda del dueño con su borrador, para el `iframe`  | Requiere sesión |
| `/panel`                       | Resumen del emprendedor                                | Requiere sesión |
| `/panel/{seccion}`             | Productos, pedidos, estadísticas, marketing            | Requiere sesión |
| `/panel/pedidos/{id}`          | Un pedido: detalle y estados                           | Requiere sesión |
| `/panel/productos/nuevo`       | Alta de un producto                                    | Requiere sesión |
| `/panel/productos/{id}`        | Edición de un producto                                 | Requiere sesión |
| `/panel/productos/categorias`  | Las categorías del catálogo                            | Requiere sesión |
| `/panel/apariencia`            | La puerta al editor, la plantilla y el historial       | Requiere sesión |
| `/panel/estadisticas/pdf`      | El informe del tablero en PDF. `?g={id}` para uno solo | Requiere sesión |
| `/panel/catalogos`             | Catálogos en PDF: los guardados y las doce plantillas  | Requiere sesión |
| `/panel/catalogos/nuevo`       | Armar uno: productos, plantilla y edición              | Requiere sesión |
| `/panel/catalogos/{id}`        | Editar un catálogo guardado                            | Requiere sesión |
| `/panel/catalogos/pdf`         | El PDF del borrador del editor, por POST               | Requiere sesión |
| `/panel/catalogos/{id}/pdf`    | El PDF de uno guardado, con los precios del día        | Requiere sesión |
| `/panel/catalogos/{id}/canva`  | Llevar uno a Canva: pide el permiso                    | Requiere sesión |
| `/panel/catalogos/canva`       | La vuelta de Canva: importa el PDF y abre el diseño    | Requiere sesión |
| `/c/{token}`                   | Un catálogo compartido, en PDF                         | Público         |
| `/cuenta`                      | Datos de la persona y de su tienda, con su WhatsApp    | Requiere sesión |
| `/auth/destino`                | Resuelve a dónde entra la cuenta y redirige            | Requiere sesión |
| `/auth/*`                      | Callback y cierre de sesión                            | —               |
| `/api/health`                  | Estado del servidor y sus capas                        | Público         |
| `/api/visita`                  | Anota una visita a una tienda, sin identificar a nadie | Público         |
| `/api/v1/resumen`              | La app: todo lo del Inicio, en un viaje                | Token de la app |
| `/api/v1/plantillas`           | La app: las plantillas del alta, con su miniatura      | Token de la app |
| `/api/v1/catalogos/{id}/pdf`   | La app: el PDF de un catálogo guardado                 | Token de la app |
| `/api/v1/ia/catalogo`          | La app: un catálogo desde una frase, ya guardado       | Token de la app |
| `/api/v1/ia/estadisticas`      | La app: una pregunta en palabras, un gráfico           | Token de la app |
| `/api/v1/estadisticas`         | La app: el tablero guardado; guardar y borrar gráficos | Token de la app |
| `/api/v1/apariencia`           | La app: logo, colores, letra y secciones; publicarlos  | Token de la app |
| `/api/v1/apariencia/plantilla` | La app: cambiar la plantilla de la tienda              | Token de la app |
| `/admin`                       | Resumen de la plataforma: tiendas, embudo, salud       | Administrador   |
| `/admin/tiendas`               | Todas las tiendas, con filtros y orden                 | Administrador   |
| `/admin/tiendas/{id}`          | La ficha de una tienda: visitas, suscripción, notas    | Administrador   |
| `/admin/tiendas/exportar`      | Las tiendas con sus métricas, en CSV                   | Administrador   |
| `/admin/plantillas`            | Qué plantillas se ofrecen y en qué orden               | Administrador   |
| `/admin/funciones`             | Funciones por tienda, la IA y su tope diario           | Administrador   |
| `/admin/ia`                    | Uso, fallas y demoras de la IA                         | Administrador   |
| `/admin/registro`              | Registro abierto, cerrado o con invitación             | Administrador   |
| `/admin/cambios`               | Todo lo que se cambió desde la administración          | Administrador   |

**`/admin` es un 404 para cualquier otra cuenta, y también sin sesión**: por eso no
está en `PROTECTED_PREFIXES` del middleware, que mandaría al ingreso y contaría que hay
algo detrás. Cada página y cada acción vuelve a pedir `exigirAdmin()`.

**Qué pantallas llevan la barra lateral** está en `ui-styling.md`, "Cuándo aparece la
barra": en corto, toda pantalla de la cuenta de quien ya tiene panel.

## A dónde entra cada cuenta

Para la cuenta de un emprendedor, el destino lo decide el estado de sus datos. Lo
resuelve un `redirect()` en el componente de servidor:

| Situación                              | Va a     |
| -------------------------------------- | -------- |
| Sin tienda, o con tienda sin plantilla | `/crear` |
| Con plantilla elegida                  | `/panel` |

La comprobación es sobre `stores.template_key` y no sobre la existencia de la fila:
es lo que marca que el alta terminó.

La cuenta de administrador de Venduo opera la plataforma desde `/admin`: no pasa por
esta tabla, `/auth/destino` la manda ahí. Ver `domain-venduo.md`.

**El ingreso no adivina el destino: manda a `/auth/destino`.** Ese route handler
resuelve en el servidor y redirige una sola vez. Antes empujaba a `/panel` y esa
pantalla rebotaba, así que se veía el panel un instante antes de salir de él.

## El enlace de la tienda

Se usa el slug y no el identificador porque estas URLs se imprimen en códigos QR y se
mandan por WhatsApp.

**Nadie arma ese enlace a mano.** Sale de `urlDeTienda` y `urlDeProducto`, en
`lib/tienda.ts`. Antes lo concatenaban siete archivos y cambiar la
forma obligaba a encontrarlos todos.

Hay **dos formas y un interruptor**, `NEXT_PUBLIC_DOMINIO_TIENDAS`:

| El interruptor | El enlace                    |
| -------------- | ---------------------------- |
| Vacío          | `venduo.app/t/rosa-deportes` |
| `venduo.com`   | `rosa-deportes.venduo.com`   |

El subdominio es la forma deseable —se dicta por teléfono sin explicar una barra— pero
necesita tres cosas que no se resuelven desde el código: el dominio propio, un registro
DNS comodín `*.dominio`, y ese comodín dado de alta en el proveedor. Hasta que existan,
el interruptor queda vacío y todo sale por ruta.

El middleware **reescribe**, no redirige: `rosa-deportes.venduo.com` sirve `/t/rosa-deportes`
sin cambiar la barra de direcciones. La ruta `/t/{slug}` sigue existiendo siempre, así que
un QR ya impreso no deja de funcionar el día que se enciende el dominio.
`SUBDOMINIOS_RESERVADOS` protege `www`, `app`, `api` y compañía de ser tomados por una
tienda.

**No se usa `/dashboard`.** Es la única ruta que estuvo en inglés y ya se renombró.

## Estructura real del proyecto

Esto es lo que existe hoy. No inventar carpetas: si hace falta una nueva, crearla y
actualizar esta lista.

```
app/
  (privado)/          Grupo de rutas: no aparece en la URL
    layout.tsx        Shell compartido de las áreas privadas
    panel/            Resumen del emprendedor y sus secciones
    cuenta/           Ajustes de la persona y de su tienda
  t/[slug]/           Tienda pública: portada, catálogo, producto y carrito, que
                      manda el pedido por WhatsApp. Compone el kit de la
                      plantilla; no sabe cuál es
  crear/              Alta de la tienda (layout propio)
    negocio/
    listo/            El último paso: ofrece el editor
  editor/             El editor de la tienda, a pantalla completa, y sus acciones
    vista-previa/     La tienda con el borrador, dentro del iframe del editor
  c/[token]/          El PDF de un catálogo compartido: público, por su token
  login/
  auth/callback/      Intercambio de código por sesión
  auth/destino/       Resuelve a dónde entra la cuenta
  auth/sign-out/
  api/health/
  api/v1/             La API de la app móvil: entra con el token de la sesión
  api/visita/         Recibe las visitas de la tienda pública y las anota
  admin/              La administración de Venduo: su armazón, sus pantallas y
                      `acciones.ts`, que escribe con la clave de servicio

components/
  ui/                 shadcn/ui. No editar a mano: se regeneran
  auth/               Ingreso y registro
  onboarding/         El alta de la tienda: marco, pasos, formulario y galería
  editor/             El editor: pasos, vista previa, secciones, imágenes y la IA
  cuenta/             Formularios de ajustes, foto de perfil y la conexión con Canva
  insights/           Cuaderno, tablero y gráficos SVG
  pedidos/            Lista, detalle y estados de un pedido
  productos/          Catálogo: lista, filtros, formulario, fotos y categorías
  plantillas/         Un kit de componentes por plantilla, su registro y el tema
    clasica/          La base editorial. Los demás kits heredan de esta
    fashion/          Pasarela
    perfume/          Esencia
    calle/            Calle: ropa urbana
    atelier/          Atelier: carteras y accesorios
    pisada/           Pisada: zapatillas y calzado
    formula/          Fórmula: perfumería de autor
    bazar/            Bazar: de todo un poco
    comunes/          Portada, catálogo y ficha armados con las piezas de un kit
  tienda/             Lo compartido por todas las plantillas: carrito, el pedido
                      por WhatsApp, agregar, barra de compra, filtros, buscador y
                      `visita.tsx`, que anota las visitas
  catalogos/          Catálogos en PDF. `primitivas.ts` es el contrato de dibujo,
                      `html.tsx` su versión para la pantalla y `documento.tsx`
                      las hojas; el PDF usa las mismas variantes
    variantes/        Cómo se dibuja cada bloque: portada, productos, separador,
                      pack, oferta, contraportada y texto
    editor/           El constructor: productos, plantillas, hojas, packs,
                      estilo, vista previa, IA, exportar y Canva
  panel/              Shell y piezas del panel. `piezas.tsx` son los
                      paneles, cifras y estados vacíos de toda pantalla;
                      `armazon.tsx` es la barra con su contenido y decide cuándo va;
                      `funcion.tsx` apaga lo que Venduo desactivó y `visitas.tsx`
                      es el panel de visitas, el mismo en `/admin`
    tablero/          El Resumen: sus secciones, el gráfico de ventas, el sello de
                      la tienda y compartirla
  admin/              El armazón de `/admin`, su navegación y los controles de
                      cada pantalla: funciones, plantillas, tiendas, ficha, registro
  landing/            Piezas de la portada
  marca/              `Logo` y `Simbolo`: la marca de Venduo, desde `lib/marca.ts`
  config-status.tsx   Checklist de capas configuradas
  theme-provider.tsx

lib/
  supabase/           Clientes de navegador, servidor y administración
  api/                Las respuestas y la puerta de `/api/v1`. Solo servidor
  data/               Consultas de lectura
  validation/         Esquemas zod compartidos
  ai/                 Capa de IA
  insights/           Lo que se puede preguntar, la lectura y el documento PDF
  editor/             Del editor, sin dependencias de servidor: el protocolo con la
                      vista previa, las paletas y letras sugeridas, los pasos, los
                      productos de ejemplo y las imágenes (comprimir y subir, solo
                      navegador)
  plantillas/         La base de cada plantilla: tokens, esquema de la apariencia,
                      registro, qué significa cada bloque, los campos de cada
                      sección y el borrador del editor con sus operaciones.
                      `color.ts` son las cuentas de color, sin zod
  catalogos/          El catálogo en PDF: modelo y esquema, constantes sin zod,
                      estilo, datos, las doce plantillas, las operaciones del
                      editor y `pdf.tsx`, que lo arma en el servidor
  canva.ts            Llevar un catálogo a Canva: el permiso con PKCE y la
                      importación del PDF. Solo servidor
  marca.ts            La geometría y los colores del logo: la fuente de todo archivo
  demo-data.ts        Datos de ejemplo del modo demo
  estilos.ts          Clases del vestido editorial de los controles
  tienda.ts           El enlace de una tienda, sus rutas internas y el slug de un subdominio
  catalogo.ts         Filtrar y ordenar el catálogo público, sin dependencias de servidor
  tablero.ts          El tablero del Resumen: sus tipos y las cuentas de los períodos,
                      sin dependencias de servidor
  fuentes.ts          Todas las tipografías, con next/font
  format.ts           Moneda, fechas, slugs
  pedidos.ts          Los estados de un pedido y el mensaje de WhatsApp, sin
                      dependencias de servidor
  qr.ts               Códigos QR
  admin.ts            La puerta de `/admin` y el registro de cambios. Solo servidor
  funciones.ts        Las funciones que se apagan, sus estados y el aviso, sin
                      dependencias de servidor
  visitas.ts          De dónde viene una visita y la marca `?o=` de los enlaces
  visitas-resumen.ts  Las cuentas de las visitas, las mismas para los dos paneles
  env.ts              Entorno validado con zod

types/
  database.ts         GENERADO. No editar a mano
  index.ts            Alias escritos a mano

supabase/migrations/  SQL con marca de tiempo en el nombre

public/marca/         Íconos del manifiesto y la tarjeta de compartir. Generados
public/portada/       La foto y la captura de la tienda del primer bloque de la portada
public/plantillas/    La miniatura de cada plantilla como imagen, para la app

scripts/marca.mjs     Genera todos los archivos del logo: `npm run marca`

docs/
  store-templates.md  El sistema de plantillas: capas, base de datos, cómo agregar una
```

## Plantillas de tienda

Una tienda se dibuja con **el kit de su plantilla**. Las páginas de `app/t/[slug]` piden
`kitDePlantilla(tienda.plantilla)` y componen sus piezas; nunca preguntan qué plantilla es.
El layout de la tienda pinta la apariencia —base más personalización— como variables CSS
en `:root`. El panel no: es de Venduo para todos, y la tienda aparece en su sello.

Dos trampas:

- **Nada que dependa de la plantilla va en `components/tienda/`.** Esa carpeta es lo
  compartido; lo propio va en el kit.
- **No pasar la tienda entera a un componente de cliente.** `TiendaPublica` trae el
  catálogo completo: a la cabecera se le pasa `marcoDeTienda(tienda)`.

Todo el sistema está en `docs/store-templates.md`.

## Los tres clientes de Supabase

| Función                                        | Dónde se usa                             |
| ---------------------------------------------- | ---------------------------------------- |
| `createClient()` de `lib/supabase/client`      | Componentes de cliente, en el navegador  |
| `createClient()` de `lib/supabase/server`      | Componentes de servidor y route handlers |
| `createAdminClient()` de `lib/supabase/server` | Solo servidor. **Salta RLS**             |

Los tres devuelven `null` si faltan credenciales. **Siempre comprobar antes de usar:**

```ts
const supabase = await createClient()
if (!supabase) return datosDeDemostracion
```

Ese `null` es lo que sostiene el modo demo: el proyecto arranca sin `.env.local` y la
interfaz sigue teniendo qué mostrar.

`createAdminClient()` nunca se llama desde código que llegue al navegador.

**Quién es la persona lo dice `getUsuario()`**, del mismo archivo: verifica el token sin
ir a Supabase y una sola vez por pedido. `supabase.auth.getUser()` no se llama en el
código de la app; el porqué está en `performance.md`.

## La API de la app

`/api/v1` es para la app móvil, que vive en otro repositorio (`venduo-app`). No entra
con cookies: manda el token de su sesión de Supabase en `Authorization` y la cabecera
`x-venduo-app`, y con eso `createClient()` y `getUsuario()` arman la sesión igual que
con una cookie. **Cada ruta corre como esa persona**: RLS, `exigirFuncion` y
`permisoDeIa` valen lo mismo que en el panel.

- Toda ruta empieza con `exigirSesion()` (`lib/api/respuestas.ts`): sin sesión, 401.
- Un error es siempre `{ error }` con un texto en español que la app muestra tal cual.
- **Una ruta de la API no escribe su propia lógica**: llama a las mismas funciones de
  `lib/data/` y `lib/ai/` que las pantallas, o a la misma Server Action del panel
  —`preguntar`, `publicarDiseno`, `guardarCatalogo`—. Así el permiso, el tope de la IA
  y cada validación valen igual por los dos caminos, y no hay dos lugares que cambiar.
- Lo que la app puede hacer directo con RLS —leer pedidos y productos, marcar pagado,
  ajustar stock— no pasa por acá: lo hace contra Supabase con su sesión.
- Las miniaturas de `public/plantillas/` son capturas del componente `Miniatura`. Al
  cambiar la base de una plantilla o sumar una, se vuelven a capturar y se agrega su
  clave en `lib/api/miniaturas.ts`.
- **La app manda qué cambió, no un estado entero.** `PUT /api/v1/apariencia` parte de
  lo publicado, le aplica los cambios y lo pasa por `publicarDiseno`: la app no puede
  publicar algo que el editor no dejaría.

## Tipos de la base

`types/database.ts` lo **genera** la CLI con `npm run db:types` y se sobrescribe entero.
Nunca se edita a mano: el próximo que regenere borra el cambio.

Los alias (`Product`, `Store`, `Order`, `Commission`…) viven en `types/index.ts`, que sí
es escrito a mano. Importar desde `@/types`, no desde `@/types/database`.

## Middleware

`middleware.ts` en la raíz delega en `lib/supabase/middleware.ts`. Hace dos cosas:
refresca el token de Supabase en cada request, y redirige a `/login` a quien pida una
ruta de `PROTECTED_PREFIXES` sin sesión.

**No poner lógica entre `createServerClient` y `getClaims()`:** rompe el refresco del
token. Es `getClaims` y no `getUser` porque verifica la firma ahí mismo, sin un viaje a
Supabase en cada pedido.

Sin credenciales configuradas el middleware deja pasar todo, para que el modo demo sea
navegable.
