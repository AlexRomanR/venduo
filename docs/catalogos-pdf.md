# Catálogos en PDF

Qué son, cómo se dibujan, dónde vive cada parte y qué hay que saber antes de tocarlos.
Lo que está acá se aprendió armándolos: varias de estas reglas existen porque lo
contrario salió mal en un PDF de verdad.

---

## Índice

1. [La idea](#1-la-idea)
2. [Lo que se guarda y lo que se lee](#2-lo-que-se-guarda-y-lo-que-se-lee)
3. [Bloques, variantes y plantillas](#3-bloques-variantes-y-plantillas)
4. [Dos salidas, un solo dibujo](#4-dos-salidas-un-solo-dibujo)
5. [Las trampas de @react-pdf](#5-las-trampas-de-react-pdf)
6. [El estilo](#6-el-estilo)
7. [El editor](#7-el-editor)
8. [La IA](#8-la-ia)
9. [Descargar y compartir](#9-descargar-y-compartir)
10. [Agregar una variante o una plantilla](#10-agregar-una-variante-o-una-plantilla)
11. [Límites conocidos](#11-límites-conocidos)

---

## 1. La idea

Quien vende por redes manda catálogos por WhatsApp todo el tiempo, y los arma a mano.
Venduo los arma con los productos de la tienda: se eligen los productos —o se le pide el
catálogo a la IA en una frase—, una de doce plantillas, se ajusta hoja por hoja viendo
cómo queda, y se descarga en PDF o se manda un enlace.

**El enlace abre siempre con los precios y el stock del día.** Esa es la diferencia con
un PDF hecho a mano: un catálogo reenviado tres veces sigue diciendo lo de hoy.

---

## 2. Lo que se guarda y lo que se lee

| Qué                           | Dónde                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------- |
| La configuración              | `catalogs.config`, validada por `catalogoSchema` (`lib/catalogos/modelo.ts`) |
| Los productos, precio y stock | Se leen al dibujar: `getMaterialDelCatalogo()` (`lib/data/catalogos.ts`)     |
| El enlace público             | `catalogs.share_token`, leído por `catalogo_compartido(p_token)`             |

**Nunca se guardan precios ni stock**: solo ids. Un producto borrado de la tienda
desaparece del catálogo sin aviso —mostrarlo sería vender algo que ya no existe— y uno
sin stock sale con la etiqueta "Agotado".

La tabla es del dueño: leer, crear y editar con `my_store_id()`, y **sin política de
DELETE**: un catálogo se da de baja con `deleted_at`. El enlace compartido lo abre
cualquiera, sin cuenta, por `catalogo_compartido`, que es `security definer`, devuelve un
solo catálogo por su token y solo si la tienda se sirve al público. Los productos y la
tienda los lee después la ruta pública con las políticas de siempre.

---

## 3. Bloques, variantes y plantillas

Un catálogo es una lista de **bloques**. Cada tipo tiene variantes, y todas las variantes
de un tipo leen los mismos campos: se cambia de variante sin perder lo escrito.
**Cualquier bloque sirve en cualquier plantilla.**

| Bloque        | Variantes                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Portada       | Foto completa · Solo letra · Foto y texto · Mosaico de fotos · Con marco                                                            |
| Productos     | Grilla · Lista con detalle · Lista de precios · Tabla · Uno por página · Lookbook · Vitrina · Historia · Etiquetas de feria · Flyer |
| Separador     | Título grande · Con foto                                                                                                            |
| Pack          | Tarjeta · Lista                                                                                                                     |
| Oferta        | Página completa · Franja                                                                                                            |
| Contraportada | Contacto · QR grande                                                                                                                |
| Texto         | Texto · Cita                                                                                                                        |

**Una plantilla no es un dibujo cerrado**: es la composición con la que arranca un
catálogo —qué bloques, con qué variantes—, la hoja (A4 o historia 9:16) y si arranca con
los colores invertidos. Están en `lib/catalogos/plantillas.ts`.

**Las hojas se cuentan antes de dibujar** (`hojasDe`), en vez de dejar que el PDF corte
donde caiga: así la vista previa y el archivo tienen las mismas hojas y el pie dice "3 /
8" desde la primera. Un bloque de productos se reparte de a `porPagina`; uno que no
tiene productos no ocupa hoja. Si el bloque entra entero en una hoja, se reparte con los
productos que tiene —dos productos en una grilla de seis son dos fotos grandes—; si
ocupa varias, con `porPagina`, para que la última se vea igual que las demás.

---

## 4. Dos salidas, un solo dibujo

Cada variante se escribe **una sola vez**, contra cinco piezas —`Hoja`, `Caja`, `Texto`,
`Tramo` y `Foto`— y un subconjunto cerrado de CSS (`EstiloDibujo`), en
`components/catalogos/primitivas.ts`. Las piezas tienen dos implementaciones:

| Salida       | Archivo                         | Con qué                                 |
| ------------ | ------------------------------- | --------------------------------------- |
| Vista previa | `components/catalogos/html.tsx` | `<div>` y `next/image`, en el navegador |
| PDF          | `lib/catalogos/pdf.tsx`         | `@react-pdf`, en el servidor            |

En HTML un punto es un píxel: la hoja se dibuja a su medida real y se escala entera, así
el reparto, los cortes de renglón y los tamaños son los del PDF.

Tres reglas para escribir una variante:

1. **Sin hooks ni contexto.** El PDF la dibuja con otro reconciliador.
2. **Sin `flexShrink: 0`.** `@react-pdf` lo convierte en 1. Lo que no se tiene que
   achicar lleva su medida.
3. **Las medidas se calculan, no se adivinan.** `repartir()` elige columnas y alto de
   foto; las filas de una lista o una tabla se dividen el alto disponible. Lo que no
   entra no se dibuja (ver la sección siguiente).

---

## 5. Las trampas de @react-pdf

Cada una rompió un PDF antes de tener su arreglo.

1. **`wrap={false}` en la página la hace del alto de su contenido** (`@react-pdf/layout`
   5.2). Las hojas salían de 390, 772 y 533 puntos. Cada hoja va dentro de una caja
   absoluta de su medida exacta: una caja absoluta no se pagina, y lo que no entra se
   recorta igual que en la vista previa.
2. **Un texto que no entra en su caja no se dibuja**: ni el primer renglón, ni con
   `maxLines`. Por eso lo que va en grande se mide antes con `tamanoQueEntra()` y
   `tamanoDeTitular()`, y la lista de precios y la tabla achican la letra si sus
   renglones no alcanzan. Las medidas salen de `ANCHOS`, en `lib/catalogos/estilo.ts`.
3. **La línea de base no cae donde la pone el navegador.** El navegador centra la letra
   en el alto del renglón; `@react-pdf` la apoya arriba. Con un interlineado apretado el
   titular se salía por debajo y pisaba lo siguiente. `corrimiento()` corre cada párrafo
   la mitad de la diferencia sin cambiar lo que ocupa, con las métricas reales de cada
   letra (`METRICAS`).
4. **No parte palabras.** Una palabra más ancha que su caja se sale de ella. El
   navegador sí la partía —«DEPORTE» arriba, «S» abajo—, así que la vista previa tampoco
   parte, y los titulares se achican hasta que entre su palabra más larga.
5. **No lee WebP**, que es como se guardan las fotos de la tienda. El servidor las
   convierte a JPEG con `sharp`, achicadas a 1000 px: un catálogo de catorce fotos pesa
   medio mega. Una foto que no baja deja su campo vacío en vez de tumbar el PDF.

   **En Vercel, `sharp` necesita binarios que el rastreo no ve.** En Linux carga
   libvips desde otro paquete con el enlazador del sistema, y su versión WebAssembly
   lee el `.wasm` de al lado: ninguno pasa por un `require`, y el primer despliegue
   dio 500 con "Could not load the sharp module". `binariosDeSharp()` nombra esas
   carpetas con `process.cwd()`, que es lo que Turbopack sí sigue —como las
   letras—, y `sharp` se carga recién al usarlo: si igual falla, el PDF sale con las
   fotos JPEG y PNG tal como vienen. Al subir de versión `sharp`, mirar que
   `.next/server/app/c/[token]/route.js.nft.json` siga nombrando el `.wasm`.

6. **Las letras salen del disco**, de `public/fuentes`, con los mismos pesos que
   `lib/fuentes.ts` (`PESOS`). Un peso que no está lo inventaría el lector. La única
   cursiva es la de Cormorant: la cita usa cursiva solo con esa letra.
7. **Emojis**: las letras no los traen y saldrían como cuadros vacíos. `limpiarTexto()`
   los quita en las dos salidas.

---

## 6. El estilo

Arranca con el de la tienda (`estiloDeTienda`): su papel, su tinta, su señal como
acento, su letra y sus esquinas. Se cambia sin tocar la tienda, con las mismas paletas y
parejas de letra del editor de la tienda.

`resolverEstilo()` calcula el resto: el campo de los paneles, las reglas, el texto
secundario y el color que va sobre el acento. Con **fondo oscuro** se invierten papel y
tinta, y si el acento no se lee sobre el fondo nuevo se busca la luz más cercana del
mismo tono que sí se lea: el rojo de la tienda pasa a un rojo más claro.

**Un catálogo que no se lee no se descarga ni se guarda.** `problemasDeEstilo()` pide lo
mismo que el editor de la tienda —texto 7:1, acento 4,5:1, letra sobre el acento 4,5:1—
y `acentoCercano()` es el arreglo de un toque.

---

## 7. El editor

| Pantalla                 | Qué hace                                                        |
| ------------------------ | --------------------------------------------------------------- |
| `/panel/catalogos`       | Los guardados y las doce plantillas dibujadas con tus productos |
| `/panel/catalogos/nuevo` | Productos (o la IA) → plantilla → editar, en la misma pantalla  |
| `/panel/catalogos/{id}`  | Uno guardado, con los productos de hoy                          |

Todo pasa en el navegador hasta que se guarda. Las operaciones son funciones puras en
`lib/catalogos/operaciones.ts`; la más importante es `ponerProductos()`: un producto que
sale del catálogo sale también de las hojas que lo nombran y de los packs, y un pack que
queda con menos de dos productos se quita con sus hojas.

Las miniaturas de la lista se dibujan **en el servidor** (`MiniaturaDeCatalogo`): al
teléfono llega HTML y no el catálogo con todos los productos.

En el celular no entran las dos columnas: una barra abajo alterna entre editar y ver las
hojas. Tocar una hoja abre su formulario.

El editor importa constantes y no esquemas: `lib/catalogos/constantes.ts` y
`lib/plantillas/color.ts` no traen zod (`performance.md`).

En modo demo funciona todo menos guardar: el PDF se descarga igual.

---

## 8. La IA

`proponerCatalogo` (`lib/ai/tasks.ts`) recibe una frase y los productos de la tienda
—nombre, categoría, precio, descuento, condición, stock y si es destacado— y devuelve qué
productos van, en qué orden, con qué plantilla, un nombre, una bajada para la portada y
por qué. El servidor descarta los ids que no son de esa tienda —o que no están en el
catálogo abierto, si se pidió un orden— y la persona decide si la usa. Queda en
`ai_generations` como `marketing`.

En modo demo responde `lib/ai/providers/mock-catalogo.ts`, que lee la frase por palabras
clave —oferta, segunda mano, mayorista, una categoría nombrada— y elige entre los
productos reales.

---

## 9. Descargar y compartir

- **Descargar**: el editor manda su borrador, guardado o no, a `POST
/panel/catalogos/pdf`. Se valida con el mismo esquema que al guardar, y los productos
  se leen con la sesión: el PDF no puede mostrar un producto de otra tienda aunque el
  borrador nombre su id.
- **Mandar el PDF**: la hoja de compartir del sistema, con el archivo. Ahí está
  WhatsApp.
- **Mandar el enlace**: `/c/{token}`, solo de un catálogo guardado. Abre el PDF en el
  visor del teléfono, armado en ese momento.

**El precio de un pack se muestra en el catálogo y nada más.** La tienda online cobra
cada producto por separado; quien quiere el pack escribe por WhatsApp.

---

## 10. Agregar una variante o una plantilla

**Una variante**: su clave y su nombre en `VARIANTES` (`lib/catalogos/constantes.ts`),
su componente en `components/catalogos/variantes/{tipo}.tsx` y su entrada en el registro
de ese archivo. El esquema y el editor la toman de `VARIANTES`.

**Una plantilla**: su clave en `CLAVES_PLANTILLA`, su ficha en `PLANTILLAS_DE_CATALOGO`
y su composición en `COMPOSICIONES`. La galería y la IA la ven solas.

**Verificarla en las dos salidas**: en la vista previa a 375 y a 1280 px, y en el PDF
descargado, en A4 y en la hoja de historia, con los colores invertidos y con una
plantilla de letra condensada y otra de letra fina. Lo que se ve bien en una y mal en la
otra casi siempre es una de las trampas de la sección 5.

---

## 11. Límites conocidos

- `config` es la versión 1 del esquema. Un cambio que no sea aditivo pide migrar el JSON
  o subir la versión; mientras tanto, la lista esconde los que no validan en vez de
  romperse.
- Las medidas de texto son un promedio por clase de letra: un titular muy raro todavía
  podría salirse un poco de su caja.
- El enlace abre la versión guardada: los cambios sin guardar no están en él.
- Con fotos nuevas el PDF tarda de uno a cuatro segundos; después, la conversión queda
  en memoria mientras viva la función.
- Un pack no se puede comprar como pack en la tienda online.
