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
| `/t/{slug}/p/{id}`            | Ficha de producto, con selector de cantidad             | Público         |
| `/t/{slug}/carrito`           | Carrito y checkout                                      | Público         |
| `/t/{slug}/pedido/{id}`       | Pago por QR, comprobante y confirmación                 | Público         |
| `/v/{slug}`                   | Perfil público del vendedor                             | Público         |
| `/crear`                      | Alta de la tienda, paso 1: elegir plantilla             | Requiere sesión |
| `/crear/negocio`              | Alta de la tienda, paso 2: nombre y rubro               | Requiere sesión |
| `/sumarme`                    | Alta del vendedor: reparte los tres caminos             | Requiere sesión |
| `/explorar/tiendas`           | Vitrina de tiendas que aceptan vendedores               | Requiere sesión |
| `/explorar/productos`         | Vitrina de productos abiertos a vendedores              | Requiere sesión |
| `/panel`                      | Resumen del emprendedor                                 | Requiere sesión |
| `/panel/{seccion}`            | Productos, pedidos, vendedores, estadísticas, marketing | Requiere sesión |
| `/panel/pedidos/{id}`         | Un pedido: detalle, estados y comprobante               | Requiere sesión |
| `/panel/productos/nuevo`      | Alta de un producto                                     | Requiere sesión |
| `/panel/productos/{id}`       | Edición de un producto                                  | Requiere sesión |
| `/panel/productos/categorias` | Las categorías del catálogo                             | Requiere sesión |
| `/panel/estadisticas/pdf`     | El informe del tablero en PDF. `?g={id}` para uno solo  | Requiere sesión |
| `/vendedor`                   | Panel del vendedor y su historial                       | Requiere sesión |
| `/cuenta`                     | Datos de la persona, de su tienda y de su perfil        | Requiere sesión |
| `/auth/destino`               | Resuelve a dónde entra la cuenta y redirige             | Requiere sesión |
| `/auth/*`                     | Callback y cierre de sesión                             | —               |
| `/api/health`                 | Estado del servidor y sus capas                         | Público         |

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
  t/[slug]/           Tienda pública: catálogo, producto, carrito y pago
  v/[slug]/           Historial laboral público del vendedor
  crear/              Alta de la tienda (layout propio)
    negocio/
  sumarme/            Alta del vendedor: reparte los tres caminos
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
  onboarding/         Altas: marco, pasos, carrusel y vista previa
  explorar/           Vitrinas: navegación, buscador, paginación y listas
  cuenta/             Formularios de ajustes y foto de perfil
  insights/           Cuaderno, tablero y gráficos SVG
  pedidos/            Lista, estados y comprobante de un pedido
  productos/          Catálogo: lista, filtros, formulario, fotos y categorías
  tienda/             La tienda pública: bloques, marco y formulario de pedido
  panel/              Shell, cifras y piezas de los dos paneles
  landing/            Piezas de la portada
  config-status.tsx   Checklist de capas configuradas
  theme-provider.tsx

lib/
  supabase/           Clientes de navegador, servidor y administración
  data/               Consultas de lectura
  validation/         Esquemas zod compartidos
  ai/                 Capa de IA
  insights/           Lo que se puede preguntar, la lectura y el documento PDF
  demo-data.ts        Datos de ejemplo del modo demo
  estilos.ts          Clases del vestido editorial de los controles
  tienda.ts           El enlace de una tienda, y el slug que pide un subdominio
  format.ts           Moneda, fechas, slugs
  pedidos.ts          Los estados de un pedido, sin dependencias de servidor
  qr.ts               Códigos QR
  env.ts              Entorno validado con zod

types/
  database.ts         GENERADO. No editar a mano
  index.ts            Alias escritos a mano

supabase/migrations/  SQL con marca de tiempo en el nombre
```

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

## Tipos de la base

`types/database.ts` lo **genera** la CLI con `npm run db:types` y se sobrescribe entero.
Nunca se edita a mano: el próximo que regenere borra el cambio.

Los alias (`Product`, `Store`, `Order`, `Commission`…) viven en `types/index.ts`, que sí
es escrito a mano. Importar desde `@/types`, no desde `@/types/database`.

## Middleware

`middleware.ts` en la raíz delega en `lib/supabase/middleware.ts`. Hace dos cosas:
refresca el token de Supabase en cada request, y redirige a `/login` a quien pida una
ruta de `PROTECTED_PREFIXES` sin sesión.

**No poner lógica entre `createServerClient` y `getUser()`:** rompe el refresco del token.

Sin credenciales configuradas el middleware deja pasar todo, para que el modo demo sea
navegable.
