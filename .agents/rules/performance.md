# Rendimiento

Lo que hace lenta una pantalla de Venduo casi nunca es lo que pesa: es **cuántas veces
espera a la base, una detrás de otra**. Cada viaje a Supabase cuesta lo mismo pida una
fila o cien, así que la cuenta que importa es la de viajes en fila, no la de consultas.

## La función y la base, en la misma ciudad

Supabase está en São Paulo (`sa-east-1`) y las funciones de Vercel corren en São Paulo
(`gru1`), fijado en `vercel.json`. Antes corrían en Washington, que es la región de
fábrica: cada consulta cruzaba el continente ida y vuelta, unos 120 ms, y la tienda
pública tardaba 1,7 s en empezar a responder.

- **La región de las funciones sigue a la de la base.** Si algún día Supabase se muda,
  `vercel.json` se muda con ella.
- Para comprobarlo, el encabezado `x-vercel-id` de cualquier respuesta dice dónde entró
  y dónde corrió: `gru1::gru1::…` es lo correcto.

## Quién es la persona: una vez por pedido, sin viajar

La identidad sale de **`getUsuario()`**, en `lib/supabase/server.ts`. Verifica la firma
del token con `getClaims` y la clave pública del proyecto, que queda en memoria: no va a
Supabase. Tiene memoria por pedido, así que la barra, la página y cada consulta
comparten una sola verificación.

**No llamar `supabase.auth.getUser()`** en el código de la app. Pregunta al servidor de
Auth cada vez, y era la primera línea de cada función de `lib/data/`: una pantalla del
panel esperaba seis de esos viajes antes de pedir un solo dato. `getClaims` da la misma
garantía que RLS, que también confía en la firma del token. El middleware usa
`getClaims` por la misma razón.

La tienda del dueño sale de **`getMiTienda()`**, también con memoria por pedido. Una
función nueva que necesita la tienda la pide ahí, no con su propio `select` a `stores`.

## Las consultas van a la vez, no en fila

- **Lo que no depende de nada va en el mismo `Promise.all`.** Una consulta que espera a
  otra solo porque estaba escrita debajo es un viaje regalado. Pasó en `/vendedor` (tres
  lecturas independientes, una detrás de otra) y en estadísticas.
- **Lo que depende va en una segunda tanda**, y casi siempre depende de lo mismo: el id
  de la tienda. Tres tandas en una pantalla son una señal de que algo se puede juntar.
- **Si hay una relación declarada, se embebe.** La portada de la tienda trae sus
  secciones dentro de la página (`store_pages` con `store_blocks`) en vez de pedirlas
  después.
- **Un `Suspense` empieza a pedir cuando el padre terminó.** Si sus datos no dependen
  del padre, la promesa se arranca arriba y se le pasa: así lo hace el tablero del
  Resumen en `app/(privado)/panel/page.tsx`.
- Una consulta de más **en paralelo** cuesta casi nada. Si saber si hace falta exige
  otro viaje, conviene pedirla igual: la barra lateral trae las comisiones aunque la
  persona no venda.

## El toque responde en el acto

**Toda sección del panel tiene su `loading.tsx`**, con `EsqueletoDePantalla` o
`EsqueletoDelResumen` (`components/panel/esqueleto.tsx`). Se ve el más cercano a la
página: una sección sin el suyo mostraría el del Resumen. Una pantalla nueva del panel
lleva el suyo, con la forma de lo que viene.

**Los enlaces de la barra lateral llevan `prefetch`**, completo: en producción la
pantalla ya está en el navegador cuando se la toca. Si igual tarda, `Abriendo` hace
latir el trazo del enlace (`useLinkStatus`) a partir de los 120 ms. Un enlace a una
pantalla que haga algo caro o con efectos al dibujarse —llamar a la IA, escribir— no
lleva `prefetch`. Hoy ninguna lo hace.

**El navegador guarda las pantallas un rato** (`staleTimes` en `next.config.ts`): 30 s
lo visitado y 60 s lo traído de antemano. De ahí una regla que no se puede olvidar:
**toda escritura termina vaciando esa memoria**. Una Server Action llama a
`revalidatePath`; una escritura desde el cliente, a `router.refresh()`. Sin eso, la
persona vuelve a una pantalla y la ve como estaba antes de su propio cambio.

## Lo que viaja al navegador

Un componente de cliente que importa un módulo con zod se lleva zod entero: así se
sumaron 97 kB a cada pantalla del panel, por una función de `lib/plantillas/apariencia.ts`
que usaba la barra. Lo que el cliente necesita vive en un módulo sin zod
(`lib/plantillas/fuentes.ts`, `lib/plantillas/color.ts`,
`lib/catalogos/constantes.ts`) o se calcula en el servidor y llega como prop. Ojo con
`lib/tienda.ts`, que lee `lib/env.ts`.

Lo que solo se usa al tocar algo —el QR de compartir— se carga con `import()`.

## Medir

**`npm run dev` no sirve para cronometrar.** Compila cada pantalla la primera vez, no
hace `prefetch`, y en esta máquina cada pedido arranca con unos 130 ms propios. Además,
la primera consulta después de unos segundos quieta abre una conexión nueva, que tarda
el triple. Sirve para **contar viajes**, que es lo que se corrige en el código.

Para contarlos, el cliente de `lib/supabase/server.ts` acepta `global: { fetch }`: un
`fetch` que anote ruta, inicio y duración dibuja la cascada de una pantalla. Es
temporal y no se commitea.

En producción, `curl -w "%{time_starttransfer}"` contra la página publicada da el tiempo
hasta el primer byte, y `x-vercel-id` confirma la región.
