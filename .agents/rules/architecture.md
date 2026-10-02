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

| Ruta                          | Qué es                                                  | Acceso          |
| ----------------------------- | ------------------------------------------------------- | --------------- |
| `/`                           | Portada pública                                         | Público         |
| `/login`                      | Registro e ingreso                                      | Público         |
| `/t/{slug}`                   | Tienda pública del emprendedor                          | Público         |
| `/t/{slug}/catalogo`          | Catálogo completo: filtros, búsqueda y orden por URL    | Público         |
| `/t/{slug}/p/{id}`            | Ficha de producto, con selector de cantidad             | Público         |
| `/t/{slug}/carrito`           | Carrito y checkout                                      | Público         |
| `/t/{slug}/pedido/{id}`       | Pago y seguimiento del pedido (hoy, flujo provisorio)   | Público         |
| `/v/{slug}`                   | Perfil público del vendedor                             | Público         |
| `/crear`                      | Alta de la tienda, paso 1: elegir plantilla             | Requiere sesión |
| `/crear/negocio`              | Alta de la tienda, paso 2: nombre y rubro               | Requiere sesión |
| `/crear/listo`                | Alta de la tienda, paso 3: ofrece el editor             | Requiere sesión |
| `/editor`                     | Editor de la tienda, a pantalla completa. `?paso=`      | Requiere sesión |
| `/editor/vista-previa`        | La tienda del dueño con su borrador, para el `iframe`   | Requiere sesión |
| `/sumarme`                    | Alta del vendedor: reparte los tres caminos             | Requiere sesión |
| `/explorar/tiendas`           | Vitrina de tiendas que aceptan vendedores               | Requiere sesión |
| `/explorar/productos`         | Vitrina de productos abiertos a vendedores              | Requiere sesión |
| `/panel`                      | Resumen del emprendedor                                 | Requiere sesión |
| `/panel/{seccion}`            | Productos, pedidos, vendedores, estadísticas, marketing | Requiere sesión |
| `/panel/pedidos/{id}`         | Un pedido: detalle y estados                            | Requiere sesión |
| `/panel/productos/nuevo`      | Alta de un producto                                     | Requiere sesión |
| `/panel/productos/{id}`       | Edición de un producto                                  | Requiere sesión |
| `/panel/productos/categorias` | Las categorías del catálogo                             | Requiere sesión |
| `/panel/apariencia`           | La puerta al editor, la plantilla y el historial        | Requiere sesión |
| `/panel/estadisticas/pdf`     | El informe del tablero en PDF. `?g={id}` para uno solo  | Requiere sesión |
| `/panel/catalogos`            | Catálogos en PDF: los guardados y las doce plantillas   | Requiere sesión |
| `/panel/catalogos/nuevo`      | Armar uno: productos, plantilla y edición               | Requiere sesión |
| `/panel/catalogos/{id}`       | Editar un catálogo guardado                             | Requiere sesión |
| `/panel/catalogos/pdf`        | El PDF del borrador del editor, por POST                | Requiere sesión |
| `/panel/catalogos/{id}/pdf`   | El PDF de uno guardado, con los precios del día         | Requiere sesión |
| `/panel/catalogos/{id}/canva` | Llevar uno a Canva: pide el permiso                     | Requiere sesión |
| `/panel/catalogos/canva`      | La vuelta de Canva: importa el PDF y abre el diseño     | Requiere sesión |
| `/c/{token}`                  | Un catálogo compartido, en PDF                          | Público         |
| `/vendedor`                   | Panel del vendedor y su historial                       | Requiere sesión |
| `/cuenta`                     | Datos de la persona, de su tienda y de su perfil        | Requiere sesión |
| `/auth/destino`               | Resuelve a dónde entra la cuenta y redirige             | Requiere sesión |
| `/auth/*`                     | Callback y cierre de sesión                             | —               |
| `/api/health`                 | Estado del servidor y sus capas                         | Público         |

**Qué pantallas llevan la barra lateral** está en `ui-styling.md`, "Cuándo aparece la
barra": en corto, toda pantalla de la cuenta de quien ya tiene panel.

## A dónde entra cada cuenta

El destino no lo decide `primary_role`, que es solo una intención. Lo decide el
estado de los datos, y lo resuelve un `redirect()` en el componente de servidor:

| Situación                                          | Va a        |
| -------------------------------------------------- | ----------- |
| Emprendedor sin tienda, o con tienda sin plantilla | `/crear`    |
| Emprendedor con plantilla elegida                  | `/panel`    |
| Vendedor sin ningún vínculo a una tienda           | `/sumarme`  |
| Vendedor con al menos un vínculo                   | `/vendedor` |

La comprobación del emprendedor es sobre `stores.template_key` y no sobre la
existencia de la fila: es lo que marca que el alta terminó.

**El ingreso no adivina el destino: manda a `/auth/destino`.** Ese route handler
resuelve en el servidor y redirige una sola vez. Antes empujaba a `/panel` y esa
pantalla rebotaba, así que se veía el panel un instante antes de salir de él.

El rol **redirige pero no prohíbe**. Un vendedor que pide `/crear` va a su panel,
y encuentra ahí un enlace a `/crear?abrir=1` que lo deja pasar: `primary_role` es
una intención, y una misma persona puede terminar siendo dueña y vendedora.

## El enlace de la tienda

Se usa el slug y no el identificador porque estas URLs se imprimen en códigos QR y se
mandan por WhatsApp.

**Nadie arma ese enlace a mano.** Sale de `urlDeTienda`, `urlDeReferido` y
`urlDeProducto`, en `lib/tienda.ts`. Antes lo concatenaban siete archivos y cambiar la
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
    vendedor/         Panel del vendedor
    cuenta/           Ajustes de la persona, su tienda y su perfil
  t/[slug]/           Tienda pública: portada, catálogo, producto, carrito y pago.
                      Compone el kit de la plantilla; no sabe cuál es
  v/[slug]/           Historial laboral público del vendedor
  crear/              Alta de la tienda (layout propio)
    negocio/
    listo/            El último paso: ofrece el editor
  editor/             El editor de la tienda, a pantalla completa, y sus acciones
    vista-previa/     La tienda con el borrador, dentro del iframe del editor
  sumarme/            Alta del vendedor: reparte los tres caminos
  c/[token]/          El PDF de un catálogo compartido: público, por su token
  explorar/           Vitrinas del vendedor (layout propio)
    tiendas/
    productos/
  login/
  auth/callback/      Intercambio de código por sesión
  auth/destino/       Resuelve a dónde entra la cuenta
  auth/sign-out/
  api/health/

components/
  ui/                 shadcn/ui. No editar a mano: se regeneran
  auth/               Ingreso y registro
  onboarding/         Altas: marco, pasos y carrusel de plantillas
  explorar/           Vitrinas: navegación, buscador, paginación y listas
  editor/             El editor: pasos, vista previa, secciones, imágenes y la IA
  cuenta/             Formularios de ajustes, foto de perfil y la conexión con Canva
  insights/           Cuaderno, tablero y gráficos SVG
  pedidos/            Lista, detalle y estados de un pedido
  productos/          Catálogo: lista, filtros, formulario, fotos y categorías
  plantillas/         Un kit de componentes por plantilla, su registro y el tema
    clasica/          La base editorial. Los demás kits heredan de esta
    fashion/          Pasarela
    perfume/          Esencia
  tienda/             Lo compartido por todas las plantillas: carrito, checkout,
                      pago, agregar, barra de compra, filtros y buscador
  catalogos/          Catálogos en PDF. `primitivas.ts` es el contrato de dibujo,
                      `html.tsx` su versión para la pantalla y `documento.tsx`
                      las hojas; el PDF usa las mismas variantes
    variantes/        Cómo se dibuja cada bloque: portada, productos, separador,
                      pack, oferta, contraportada y texto
    editor/           El constructor: productos, plantillas, hojas, packs,
                      estilo, vista previa, IA, exportar y Canva
  panel/              Shell y piezas de los dos paneles. `piezas.tsx` son los
                      paneles, cifras y estados vacíos de toda pantalla;
                      `armazon.tsx` es la barra con su contenido y decide cuándo va
    tablero/          El Resumen: sus secciones, el gráfico de ventas, el sello de
                      la tienda y compartirla
  landing/            Piezas de la portada
  marca/              `Logo` y `Simbolo`: la marca de Venduo, desde `lib/marca.ts`
  config-status.tsx   Checklist de capas configuradas
  theme-provider.tsx

lib/
  supabase/           Clientes de navegador, servidor y administración
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
  pedidos.ts          Los estados de un pedido, sin dependencias de servidor
  qr.ts               Códigos QR
  env.ts              Entorno validado con zod

types/
  database.ts         GENERADO. No editar a mano
  index.ts            Alias escritos a mano

supabase/migrations/  SQL con marca de tiempo en el nombre

public/marca/         Íconos del manifiesto y la tarjeta de compartir. Generados

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
