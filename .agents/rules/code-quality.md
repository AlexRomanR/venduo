# Calidad y seguridad

## Antes de cada push

```bash
npm run check
```

Corre tipos, lint y formato **en secuencia**: si los tipos fallan, el resto no se ejecuta.
Es lo mismo que corre el CI en cada push y cada PR, así que si pasa acá pasa allá.

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
// No poner lógica entre createServerClient y getUser: rompe el refresh.
```

No comentar lo evidente, ni dejar rastros de la tarea que originó el cambio ("agregado
para el flujo X", "arregla el issue 123"). Eso envejece y pertenece al mensaje del commit.

## Commits

Mensaje en español, explicando **por qué** y no solo qué. Si el cambio corrige algo sutil,
que el mensaje diga qué se rompía.

No commitear si `npm run check` está en rojo.

## Lo que no se hace

**No se escriben tests automatizados.** Está fuera de alcance según `VENDUO.md` §7. La
verificación es manual y está descrita en la skill `qa-verification`: correr el flujo,
mirarlo en 375 px, probar el modo demo.

No agregar dependencias sin necesidad. Todo lo que hace falta para el MVP ya está
instalado; una biblioteca nueva es peso que alguien tiene que entender a las tres de la
mañana.

La única que se sumó después del arranque es **`@react-pdf/renderer`**, para el informe
del tablero: el PDF tiene que ser un archivo de verdad —que se abra en su pestaña, se
guarde y se mande por WhatsApp— y eso no lo da imprimir la pantalla. Corre solo en el
servidor y está declarada en `serverExternalPackages`. Arrastra un `postcss` con un aviso
de seguridad por escapado de CSS; acá el CSS lo escribe el propio documento y la salida es
un PDF, así que no aplica.

No construir para requisitos hipotéticos. Si algo está en la lista de lo que no entra, no
se escribe el andamiaje "por si acaso".
