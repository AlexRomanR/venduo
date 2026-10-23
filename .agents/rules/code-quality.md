# Calidad y seguridad

## Antes de cada push

```bash
npm run check
npm run test:db   # además, si se tocó la base
```

`check` corre tipos, lint, formato y los tests de la lógica **en secuencia**: si los tipos
fallan, el resto no se ejecuta. Es lo mismo que corre el CI en cada push y cada PR, así
que si pasa acá pasa allá. `test:db` necesita Docker; el CI lo corre en su propio job.

Para arreglar el formato: `npm run format`.

## TypeScript

**`any` está prohibido.** Si no se conoce el tipo, es `unknown` y se estrecha validando.
Un `as any` para que compile es un error que se va a manifestar en la demostración.

Los tipos de la base vienen de `@/types`, no de `@/types/database`. Recordar que
`types/database.ts` se regenera y se sobrescribe entero.

Evitar `!` para silenciar nulos. Los clientes de Supabase devuelven `null` a propósito
cuando falta configuración: ese `null` es el modo demo, no un caso imposible.

## Validación en los límites

Zod valida lo que entra al sistema desde afuera: formularios, parámetros de ruta,
respuestas de la IA, variables de entorno. Adentro se confía en los tipos.

Un esquema por concepto, compartido entre el formulario y la acción que lo procesa. No
duplicar reglas entre el JSX y el esquema.

## Secretos

- `.env.local` **nunca** se commitea. Ya está en `.gitignore`; no sacarlo de ahí.
- `SUPABASE_SERVICE_ROLE_KEY` salta RLS: solo en servidor, nunca en un archivo que llegue
  al navegador, nunca en una variable `NEXT_PUBLIC_`.
- Los tokens de redes sociales viven en `social_connections`, que tiene RLS activo y cero
  políticas a propósito.
- Antes de commitear, mirar qué quedó preparado. Un archivo con nombre inocente puede
  traer credenciales.

## Comentarios

Se escriben pocos y explican **por qué**, no qué. El código ya dice qué hace.

Vale la pena comentar una restricción no obvia, una decisión que sorprendería a quien lea,
o el motivo de algo que parece innecesario:

```ts
// No poner lógica entre createServerClient y getClaims: rompe el refresh.
```

No comentar lo evidente, ni dejar rastros de la tarea que originó el cambio ("agregado
para el flujo X", "arregla el issue 123"). Eso envejece y pertenece al mensaje del commit.

## Commits

Mensaje en español, explicando **por qué** y no solo qué. Si el cambio corrige algo sutil,
que el mensaje diga qué se rompía.

No commitear si `npm run check` está en rojo.

## Tests

Se escriben para **toda lógica nueva o cambiada que toque dinero, stock, pedidos o
permisos**: una cuenta en centavos, un descuento, un estado de pedido, una función o una
política de la base. Textos, pantallas y estilos no llevan: se prueban mirándolos, como
dice la skill `qa-verification`.

| Qué                                     | Dónde                                   | Cómo se corre                      |
| --------------------------------------- | --------------------------------------- | ---------------------------------- |
| Lógica de TypeScript                    | `*.test.ts` junto a su módulo de `lib/` | `npm test`, que entra en `check`   |
| Funciones, disparadores y políticas SQL | `supabase/tests/*.test.sql`, con pgTAP  | `npm run test:db`, que pide Docker |

- **Lo que no se puede importar no se puede probar.** Una cuenta escrita dentro de un
  archivo `"use server"` o de un componente se mueve a un módulo neutral de `lib/`, como
  `aCentavos` en `lib/format.ts`.
- Un test de TypeScript no importa `lib/supabase/` ni `lib/data/`: lo que necesita la
  base va en `supabase/tests/`.
- **Los tests de la base corren solo en la base local**, la que Docker arma desde las
  migraciones. Cada archivo va entre `begin;` y `rollback;`. Detalle en
  `database-rls.md`.
- Las fechas se pasan explícitas —el `ahora`— y los tests corren en UTC
  (`vitest.config.mts`), como el servidor.
- Un error que se arregla en esa lógica deja su test, y el test tiene que fallar antes
  del arreglo: si pasa con el código viejo, no prueba nada.

La skill `ponytail` pide un test para toda lógica nueva que no sea trivial; en Venduo
manda esta regla.

## Lo que no se hace

No agregar dependencias sin necesidad. Todo lo que hace falta para el MVP ya está
instalado; una biblioteca nueva es peso que alguien tiene que entender a las tres de la
mañana.

Se sumaron cinco después del arranque. La primera es **`@react-pdf/renderer`**, para el informe
del tablero: el PDF tiene que ser un archivo de verdad —que se abra en su pestaña, se
guarde y se mande por WhatsApp— y eso no lo da imprimir la pantalla. Corre solo en el
servidor y está declarada en `serverExternalPackages`. Arrastra un `postcss` con un aviso
de seguridad por escapado de CSS; acá el CSS lo escribe el propio documento y la salida es
un PDF, así que no aplica.

La segunda es **`@dnd-kit`** (`core`, `sortable` y `utilities`), para reordenar las
secciones en el editor. El arrastre nativo del navegador no funciona con el dedo, y
hacerlo a mano con eventos de puntero es justo lo que falla en una demostración; esta
trae el dedo, el teclado y los anuncios para lector de pantalla. La cargan `/editor` y
el editor de catálogos.

La tercera es **`sharp`**, que ya venía con Next para optimizar imágenes: se declaró
porque el catálogo en PDF convierte las fotos de la tienda, que se guardan en WebP, a
JPEG —`@react-pdf` no lee WebP— y las achica para que el archivo se pueda mandar por
WhatsApp. Corre solo en el servidor.

La cuarta es **`@sparticuz/chromium` con `puppeteer-core`**, para la vista de la tienda
que muestra la app: una captura real de la portada, que ningún dibujo reemplaza. Es un
Chrome comprimido para funciones sin servidor y pesa unos 60 MB, así que **va solo en la
ruta `/api/v1/vista`** (`outputFileTracingIncludes` en `next.config.ts`); el resto del
servidor se la pide con `pedirVista`. Nunca importarla desde otra ruta.

La quinta es **`vitest`**, solo de desarrollo, para los tests de TypeScript: lee el
TypeScript y el alias `@/` sin compilar antes, que es lo que no hace el test de Node. Los
de la base no suman nada: pgTAP viene con el CLI de Supabase.

No construir para requisitos hipotéticos. Si algo está en la lista de lo que no entra, no
se escribe el andamiaje "por si acaso".
