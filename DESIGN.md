---
name: Venduo
description: Editorial impreso sobre papel cálido, con un solo color de señal que manda cuando aparece. El panel es el diario; la portada, el cuaderno de ventas pasado en limpio.
colors:
  papel: "#f7f5f0"
  tinta: "#1d1c1a"
  senal: "#d0216a"
  senal-alta: "#b01a59"
  toldo: "#d0216a"
  accion: "#1d1c1a"
  accion-alta: "#3b3936"
  plata: "#b8bcc0"
  blanco: "#ffffff"
  hoja: "#fdfcf9"
  frambuesa-suave: "#fce4ee"
  frambuesa-clara: "#ff7aa8"
  resaltador: "#fff1a6"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 8vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 0.97
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 5vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  numeral:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 3.25rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  body-lead:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.12em"
  mano:
    fontFamily: "Kalam, cursive"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  none: "0px"
  sm: "0.375rem"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  gutter: "20px"
  md: "24px"
  lg: "36px"
  xl: "48px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.accion}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.accion-alta}"
    textColor: "{colors.blanco}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    typography: "{typography.body}"
  button-outline-hover:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.blanco}"
  button-outline-sobre-senal:
    backgroundColor: "transparent"
    textColor: "{colors.blanco}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  button-outline-sobre-senal-hover:
    backgroundColor: "{colors.blanco}"
    textColor: "{colors.senal}"
  panel:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
    padding: "16px"
  chip-estado:
    backgroundColor: "transparent"
    textColor: "{colors.senal}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    typography: "{typography.label}"
  section-label:
    backgroundColor: "transparent"
    textColor: "{colors.senal}"
    typography: "{typography.label}"
---

# Design System: Venduo

## Overview

**Creative North Star: "El diario del mercado", y su cuaderno de ventas**

Venduo se ve como una página impresa: papel cálido, tinta casi negra, reglas de un
píxel que separan las secciones y un solo color de señal —el bolígrafo del cuaderno de
ventas— que aparece poco y manda cuando aparece. El color no baña la pantalla; marca.

Hay **un solo mundo de color y de letra** —papel, tinta, frambuesa, Archivo y Geist— y
**dos registros**, según lo que la persona vino a hacer:

- **El diario (el panel, la cuenta, el ingreso, el alta de la tienda y `/admin`).**
  Lo que estructura la pantalla es la retícula y la línea, no la caja. No hay
  degradados, ni tarjetas flotando, ni sombras, ni un teléfono en ángulo. La densidad
  es alta y el peso visual lo cargan la tipografía y el espacio, porque se usa todos
  los días, casi siempre en el celular. Rige todo este documento
  salvo la sección "La portada".
- **El cuaderno de ventas pasado en limpio (la portada pública, `/`).** Tiene que
  convencer, así que se permite lo que el panel no: el celular en 3D, las escenas que
  cuentan un pedido, los productos recortados, la letra a mano y el movimiento con el
  scroll. Comparte la paleta, las letras y el logo; sus excepciones están medidas en
  "La portada".

**Una tienda `/t/{slug}` usa el mundo de su plantilla; el panel de su dueño, este.** La
tienda queda reconocible en el panel por su sello, un recuadro con su papel, su letra y su
color de acción. Las plantillas redefinen estos mismos tokens —papel, tinta, señal, titular,
cuerpo, radio— y traen sus propios componentes; sus valores están en
`lib/plantillas` y el sistema entero en `docs/store-templates.md`. Este documento
es además **la base editorial**: la plantilla de respaldo con la que se dibuja
toda tienda cuya plantilla se retiró. El `toldo` no lo redefine ninguna plantilla:
es solo del logo de Venduo.

Los tokens por defecto de shadcn (`--background`, `--foreground`, `--primary`…)
siguen declarados en `app/globals.css` porque los componentes generados los
usan, pero **ninguna pantalla se diseña con ellos**: los controles se visten con
las clases de `lib/estilos.ts`.

**Key Characteristics:**

- Campo de papel cálido `#f7f5f0`, nunca blanco puro, en toda superficie de Venduo.
- Un solo acento: la frambuesa de señal. En la portada lo acompañan, a dosis medidas, su
  versión clara sobre oscuro y el resaltador amarillo de los titulares.
- En el panel, separación por regla de un píxel; cero tarjetas y cero sombras.
- Archivo extrabold con tracking negativo para titulares y cifras; Geist para leer;
  Kalam, a mano, solo en las notas de la portada.
- En el panel, un solo gesto de movimiento: entrar al viewport. En la portada, una
  escena por sección, que arranca a la vista y vuelve a empezar al salir.

## Colors

Una paleta de tres voces —papel, tinta y señal— más el resaltador y un gris de apoyo;
el color no baña la pantalla, marca. Los valores viven en `app/globals.css` y en
`COLORES_DE_MARCA` de `lib/marca.ts` (los archivos del logo).

**Hasta el 30 de octubre de 2026 la señal fue roja; después, por un día, vino.** El vino
`#5a1f2b` contra la tinta daba 1,35:1: en el panel se confundía con ella y los avisos
dejaban de avisar. Se reemplazó por la frambuesa, comparando cuatro tonos en el panel
de verdad (`docs/briefs/2026-10-31-productos-vivo-y-color.md`).

### La tinta hace el trabajo; la señal avisa

- **Acción** (`--accion`, la tinta `#1d1c1a`): el botón principal y lo elegido —una
  pestaña, una ficha, la plantilla probada—. Va por `BOTON_PRIMARIO` (`bg-accion`).
  **Dentro de una tienda, `--accion` vale el color de acción de su plantilla**
  (`cssDeApariencia` y `variablesEnLinea` lo emiten), así los botones de compra no
  salen negros. `--accion-alta` (`#3b3936`) es su estado al pasar el puntero.
- **Frambuesa de Señal** (`--senal`, `#d0216a`): **lo que pide algo** —un pedido por
  cobrar, un producto agotado, «2 agotados» en un catálogo, el punto de lo que espera—,
  los errores con su mensaje y la marca. Pasa 4,7:1 contra el papel, así que sirve
  para texto, y 3,3:1 contra la tinta, así que se distingue de ella de un vistazo.
- **Frambuesa Encendida** (`--senal-alta`, `#b01a59`): solo su estado al pasar el
  puntero. Sobre el fondo suave, el texto en señal va en este tono (`#fce4ee` con la
  frambuesa da 4,25:1 y no pasa).
- **Toldo** (`--toldo`, `#d0216a`): las rayas del logo y el color con el que el editor
  marca lo que se toca sobre una tienda. Igual a la señal: la frambuesa sí se ve contra
  el cuerpo del celular.
- **Resaltador** (`--resaltador`, `#fff1a6`): **lo que espera o acaba de cambiar** —la
  hoja que se editó, «Cambios sin guardar», la cifra de hojas, el catálogo recién
  guardado— y, en la portada, una frase por titular. **Siempre detrás de un texto en
  tinta** (16:1): la frambuesa sobre el amarillo da 4,48:1 y no pasa. Nunca es el
  relleno de un control ni la única señal de algo.

### Neutral

- **Papel** (`--papel`, `#f7f5f0`): el campo de toda superficie de Venduo. Reemplaza
  al blanco; el blanco puro solo aparece como texto o borde sobre la señal, y como
  superficie de una tarjeta de la portada.
- **Tinta** (`--tinta`, `#1d1c1a`): todo el texto de lectura, los bordes plenos, los
  botones, lo elegido y el campo de la sección oscura de la portada.
- **Plata** (`--plata`): gris de apoyo declarado en los tokens, disponible para
  bordes y estados apagados.

### Solo en la portada

Declarados en `components/portada/portada.module.css`, no en el sistema:

- **Hoja** (`#fdfcf9`): el campo un punto más claro de una sección que se separa.
- **Frambuesa suave** (`#fce4ee`): el fondo de lo marcado sobre papel.
- **Frambuesa clara** (`#ff7aa8`): la señal sobre la tinta —rótulos, barras de avance,
  la etiqueta del stock— en la sección oscura (7:1).

Las jerarquías intermedias **no son colores nuevos**: son tinta con opacidad.
La escala en uso es `70%` para texto secundario, `60%` para pie de página,
`55%` para pies de foto y notas, `45–50%` para descargos, `40%` para numerales
ordinales, y `15%` para reglas divisorias. Un texto que se tiene que leer no baja de
`55%`: más claro no pasa 4,5:1 contra el papel.

Los errores usan la señal, siempre con su mensaje escrito al lado del campo: un error
nunca es solo color. El foco de un campo va en tinta (una línea más gruesa y un fondo
apenas marcado), nunca en la señal: se leía como un error.

**Los gráficos van en tinta**: la serie entera en tinta y la señal solo en la barra o
el punto que se está mirando.

### Named Rules

**La regla de la voz única.** La frambuesa ocupa menos del 10% de cualquier pantalla.
Si aparece en más de dos lugares en un viewport, uno de ellos no pedía nada.

**La regla de la tinta que trabaja.** Un botón, una pestaña elegida, una ficha
elegida: tinta. Si algo está en frambuesa, tiene que poder decirse qué pide.

**La regla del papel.** Ninguna superficie de Venduo usa `#fff` como fondo de página.
El blanco es un color de texto sobre la señal, no un campo.

**La regla de la opacidad.** La jerarquía de texto se construye bajando opacidad
sobre tinta, nunca introduciendo un gris nuevo.

## Typography

**Display Font:** Archivo (pesos 600/700/800), servida por `next/font` en
`--font-titular`, subconjunto latino.
**Body Font:** Geist, en `--font-sans`.

**Hand Font:** Kalam (400 y 700), en `--fuente-mano`, servida desde
`components/portada/` y cargada solo por la portada.

**Character:** Un grotesco industrial apretado contra una cara de interfaz neutra.
Archivo grita; Geist explica. En el panel no hay una tercera voz. En la portada,
Kalam es la letra de quien vende —"¿pagó?", "quedan 3… ¿o 2?"— y solo escribe notas
sueltas y el cuaderno de la escena de carga; nunca un titular, un botón ni un texto
que haya que leer de corrido. La portada usa además Archivo con su eje de ancho
(`--fuente-ancha`) para sus titulares.

### Hierarchy

- **Display** (800, `clamp(2.5rem, 8vw, 4.5rem)`, `0.97`, `-0.035em`): el titular
  de apertura y el de cierre de una superficie. Uno por pantalla, con `text-balance`
  y medida acotada (`12–13ch`).
- **Headline** (800, `clamp(1.9rem, 5vw, 2.75rem)`, `1.04`, `-0.03em`): el titular
  de cada sección, a `16–18ch`. Su variante angosta para columnas pareadas es
  `clamp(1.75rem, 4.5vw, 2.4rem)`; sobre el bloque de señal crece a
  `clamp(2rem, 6vw, 3.5rem)` con interlínea `1.02`.
- **Numeral** (800, `clamp(2.5rem, 7vw, 3.25rem)`, `1`, `-0.04em`, tabular, en
  rojo): cifras destacadas. Siempre con `.tabular` y siempre con un detalle debajo
  en versalita apagada.
- **Title** (700, `1.125–1.25rem`, `-0.02em`): el nombre de un ítem dentro de una
  lista o de una retícula.
- **Body** (400, `1rem`, `1.625`, opacidad `70%`): el texto corriente, a `46–48ch`.
  La entradilla bajo el titular de apertura sube a `1.125rem` y `52ch`. Una
  respuesta larga puede llegar a `68ch` y no más.
- **Label** (600, `0.75rem`, `0.12em`, versalita, en la señal): el nombre de la
  sección.

### Named Rules

**La regla de las dos caras.** Archivo solo para titulares, cifras y nombres de
ítem; Geist para todo lo que se lee en párrafo. Un número que representa dinero va
en Archivo con `.tabular`, sin excepción.

**La regla de la medida.** Ningún párrafo supera los `68ch`. Un texto de 1280 px de
ancho no se lee, y el contenedor por sí solo no lo impide.

**La regla del dinero.** Todo monto pasa por `formatMoney` de `lib/format.ts` y se
muestra con `.tabular`, para que las columnas no bailen al cambiar. Nunca se divide
por 100 en el JSX ni se arma el símbolo a mano.

## Layout

Contenedor único de `max-w-6xl` (72rem) centrado, con canaleta de `20px` en todo
ancho de pantalla. No hay un segundo ancho: una sección que quiere ser más ancha
lleva su fondo a sangre y mantiene el contenido dentro del mismo contenedor.

**Ritmo vertical.** La sección estándar es `80px` arriba y abajo; la banda de
cifras usa `48px`; el bloque de señal crece a `96px` en pantalla grande. Dentro de una
sección la escala es `8 / 12 / 20 / 24 / 36 / 48`: `20px` entre el label y el
titular, `24–36px` del titular al cuerpo, `36px` antes de la acción final.

**Retícula.** Dos puntos de control, 375 px y 1280 px, con `flex-wrap` y `grid`
en el medio en vez de saltos intermedios. Los patrones en uso son
`sm:grid-cols-2` para audiencias pareadas, `sm:grid-cols-2 lg:grid-cols-3` para
listas de módulos, `sm:grid-cols-3` para el tríptico de fotos y
`lg:grid-cols-[1.05fr_0.95fr]` para el par titular/demostración de apertura. La
retícula de listas separa con `gap-x-10 gap-y-2`: la regla superior de cada ítem
hace el resto de la separación.

**Móvil primero, en serio.** Se resuelve a 375 px y se deja crecer. Objetivos
táctiles de 44 px mínimo, nada de tablas anchas sin `overflow-x-auto`, y cero
desplazamiento horizontal en las dos anchuras.

**La barra fija.** Encabezado adherido con `backdrop-blur`, fondo papel al 90% y
una regla inferior de tinta al 15%. Las anclas de navegación se esconden bajo
`md`; la acción en la señal nunca se esconde.

### Named Rules

**La regla del mundo único.** Toda pantalla usa los tokens de este documento, sin
excepción: el mismo papel, la misma tinta, el misma frambuesa y las mismas letras. Lo que
separa las pantallas del diario entre sí es el **ritmo**, no el sistema: secciones de
`40–48px` en vez de `80px`, el nombre de la tienda en lugar de un display,
navegación persistente, y la frambuesa reservado a lo que pide una acción.

La portada comparte los tokens pero no el registro: sus excepciones están medidas en
"La portada" y no se trasladan al panel. Quien llega de la portada al panel reconoce
la marca —el papel, la frambuesa, el logo— y encuentra una herramienta, no otra página de
venta.

**La regla del contenedor único.** En el diario, todo alinea a `max-w-6xl`. La
portada usa `max-w-[1280px]`, porque sus escenas necesitan el ancho.

Si algo necesita
romper esa línea, lo que sale a sangre es el fondo, nunca el texto.

## Elevation & Depth

**Este sistema no tiene sombras.** Ni una. La profundidad se construye con tres
recursos: la regla de un píxel, el cambio de campo (un bloque a sangre en la señal
contra el resto en papel) y la opacidad del texto. Una tarjeta con sombra
introduce una fuente de luz que este mundo no tiene.

La única superposición real es el encabezado adherido, y se resuelve con
translucidez y desenfoque de fondo, no con sombra.

### Named Rules

**La regla sin sombra.** Ningún elemento del diario lleva
`box-shadow`. Si algo necesita separarse del fondo, se le pone una regla o se le
cambia el campo.

**La regla del campo.** Un cambio de sección se anuncia con una regla de un píxel;
un cambio de tono se anuncia cambiando el campo entero. No hay estado intermedio.

## Shapes

Todo es rectangular. El radio por defecto es `0`: los paneles, las fotos, las
celdas de producto y las bandas de sección tienen esquina viva.

Las dos excepciones están medidas:

- **Botones**: radio `sm` (0.375rem), apenas suficiente para leerse como control.
- **Chip de estado**: radio completo, solo para una etiqueta de estado corta
  («Abierta»).

**Pesos de regla.** Tres, y solo tres:

- **Divisoria** (1 px, tinta al 15%): separa secciones y separa ítems de una lista.
- **Estructural** (1 px, tinta plena): encierra un panel de demostración o su
  cabecera y su pie.
- **Apertura** (2 px, tinta plena): corona un bloque que abre un tema, y también
  es el trazo del botón secundario.

### Named Rules

**La regla de la esquina viva.** Un contenedor no se redondea. El redondeo se
reserva para lo que se toca.

**La regla de la lista sobre la tarjeta.** Una colección se rinde como lista o
retícula de ítems separados por regla superior, no como tarjetas. La caja no es
andamiaje.

## Components

Los controles se componen sobre shadcn/ui envolviéndolos o con `asChild`; los
archivos de `components/ui/` se generan y no se editan a mano. Lo que sigue es
cómo se visten en el diario; la portada tiene los suyos en "La portada".

### Buttons

- **Shape:** rectángulo de esquina apenas suavizada (radio 0.375rem).
- **Primary:** relleno de acción —tinta en Venduo, el color de la plantilla en una
  tienda—, texto blanco, `12px 20px`, peso 600. Es la
  acción de conversión; hay una sola por bloque.
- **Hover / Focus:** el relleno pasa a `accion-alta` con `transition-colors`. No
  hay desplazamiento, ni escala, ni sombra al pasar el cursor.
- **Secondary:** trazo de 2 px de tinta sobre papel, sin relleno; en `hover` se
  invierte a campo tinta con texto blanco.
- **Sobre el bloque de señal:** el secundario cambia a trazo blanco y en `hover` se
  invierte a campo blanco con texto en la señal. El primario en la señal no existe ahí.
- **Foco sobre la señal:** el contenedor lleva `.campo-senal`, que dibuja un contorno
  blanco de 3 px con 3 px de separación. Un anillo de color no se vería.

### Cards / Containers

No hay tarjetas. Lo que cumple ese papel es el **panel de demostración**: campo
papel encerrado por una regla estructural de 1 px, esquina viva, `16px` de relleno
interno, y cabecera y pie separados por la misma regla. Sin sombra y sin radio. En el
panel, cada cosa de cada pantalla es uno de estos —sus cifras, su lista, cada bloque
de un formulario—, con un ícono, un título que dice para qué sirve y, si hace falta,
un pie que lleva adonde se sigue.

### Navigation

Encabezado adherido, papel al 90% con desenfoque, regla inferior al 15%. La marca
es `<Logo />`: el símbolo de la feria en el celular y el nombre en Archivo extrabold
`1.125rem` con tracking `-0.02em` (`.agents/rules/marca.md`). Los enlaces son Geist
`0.875rem` a opacidad `70%` que suben a `100%` en `hover`; no hay subrayado ni
color de estado activo. La acción en la señal cierra la barra a la derecha y sobrevive al
colapso móvil.

### Section Header

El patrón que abre casi toda sección: un **label** en la señal en versalita con tracking
`0.12em`, `20px` de aire, y debajo el **headline** en Archivo extrabold a medida
acotada. El label nombra la sección —y es el mismo texto que el ancla de
navegación—; no repite el titular ni le agrega adjetivos. En los paneles el label va
en tinta: ahí la frambuesa queda para lo que pide una acción.

### Listas separadas por regla

El patrón que reemplaza a la tarjeta. Cada ítem lleva regla superior de 1 px al
15%, `24px` de aire vertical, título en Archivo 700 y detalle en Geist a opacidad
`70%`. En una lista ordenada, el ordinal va en Archivo `0.875rem` con `.tabular` a
opacidad `40%`, en una columna angosta a la izquierda. En `hover`, el ítem entero
mueve su regla a la señal y su título a la señal con `transition-colors`.

### Fotografía

Las fotos de productos van a color, como las subió quien vende: son su mercadería.
Mientras cargan, un fondo de tinta al 10%; sin radio en el diario, en relación `4/5` o
`3/4`, con pie en Geist `0.75rem` a opacidad `55%` cuando lo lleva. El pie describe la
escena; nunca le pone nombre a quien aparece. La portada usa productos recortados sin
fondo ("La portada").

### Acordeón

`<details>` nativo, sin JavaScript y sin dependencia. Cada pregunta es una fila con
regla superior de 1 px, título en Archivo 700 que pasa a la señal en `hover`, y la
respuesta en Geist a `70%` de opacidad con medida `68ch`. El marcador nativo se
oculta.

### Cifra que cuenta

Numeral en la señal tabular que cuenta hasta su valor al entrar en pantalla, en 900 ms con
salida cúbica, y un detalle debajo en versalita a opacidad `60%`. Renderiza el
valor final de entrada: si el JavaScript no corre o la persona pidió menos
movimiento, el número ya está ahí. Toda cifra ilustrativa lleva su descargo al pie
de la banda.

### Motion

El gesto de fondo es **entrar**. El elemento sube `14px` y aparece en 500 ms con
`cubic-bezier(0.16, 1, 0.3, 1)`. Los elementos hermanos se escalonan de 70 a 90 ms
entre uno y el siguiente, con un tope práctico de tres pasos. Los cambios de estado
(`hover`, foco) son solo de color, con la transición corta por defecto; la foto y
el llenado de la demostración usan 500 ms `ease-out`.

**Las pantallas donde se elige algo llevan más movimiento**, porque ahí la
respuesta del sistema es parte de la decisión. Tres gestos sancionados, y no más:

- **Deslizar.** Una colección que se recorre —la galería de plantillas— va en
  carrusel arrastrable, con flechas rectangulares de 44 px y un contador tabular
  `01 / 10`. Las flechas se apagan al llegar al extremo; no se esconden.
- **Revelar.** Un campo que depende de una elección anterior aparece con una
  transición de altura de 300 ms `ease-out` (`grid-rows-[0fr]` a `[1fr]`) en vez
  de estar deshabilitado ocupando lugar. Lo mismo la barra de continuación, que
  entra desde abajo al elegir.
- **Acercar.** Una vista previa seleccionable escala a `1.02` en 500 ms `ease-out`
  al pasar el cursor, heredando el gesto de la fotografía. **Sigue valiendo que un
  botón no se mueve ni escala en `hover`:** esto es para el contenido que se elige,
  no para el control que se pulsa.

Todo esto respeta `prefers-reduced-motion`, y el estado final se lee sin JavaScript.

**El panel responde a lo que se toca.** Desde el rediseño de Catálogos (31/10/2026), lo
que se elige o se cambia se ve en el momento, con movimiento que tiene un porqué. Todo
arranca por un toque —nunca solo al cargar— y va en CSS o con la API de animaciones del
navegador, sin librerías: GSAP queda en la portada y en el Resumen. Las piezas, en
`app/globals.css`:

- **Lo que acaba de cambiar** (`.texto-recien`, `Recien` y `useRecien` de
  `components/panel/recien.tsx`): un trazo de resaltador entra detrás del texto de
  izquierda a derecha y se retira hacia abajo en 1,7 s. Para la cifra de hojas, el
  nombre de la plantilla probada, «Cambios sin guardar», el catálogo recién guardado.
- **Una hoja que cambió** (`.marca-recien`): un velo de resaltador barre la hoja y se va;
  si cambian más de tres a la vez (un color nuevo), no se marca ninguna.
- **Una hoja que llega** (`.hoja-entra`): sube, se enfoca y se endereza; la primera tanda
  entra en fila, lo que llega después entra en el acto.
- **Lo que reemplaza a lo de antes** (`.cambio-entra`): la plantilla nueva en el probador,
  la hoja chica que se actualiza.
- **Un número que aparece** (`.numero-entra`): el lugar del producto sobre su foto, con un
  salto corto.
- **Un objeto que viaja** (`volarAlCatalogo` de `components/catalogos/editor/vuelo.ts`): la
  foto del producto elegido vuela en arco hasta "Así va quedando", y el destino late al
  recibirla.
- **Algo que tarda** (`.armando-barrido`): mientras se arma el PDF, una luz recorre cada
  hoja, una tras otra. Sin porcentajes inventados.
- **Las cifras cuentan** con `Contador`.

Con "Reducir movimiento" no vuela ni barre nada, y cada estado se ve en su forma final.

**La regla del estado final.** Toda animación parte de un estado ya legible: la
clase que oculta se agrega recién al montar, y con `prefers-reduced-motion: reduce`
o sin JavaScript todo queda en su posición final. Una animación nunca es requisito
para leer la página.

**La regla del pliegue.** Lo que se ve sin desplazar se rinde quieto. El revelado
se usa solo debajo del pliegue, para que en un equipo lento la primera pantalla se
lea de inmediato.

## La portada

**El cuaderno de ventas pasado en limpio.** La portada pública (`/`, en
`components/portada/`) cuenta Venduo con lo que la persona ya conoce: su celular, su
WhatsApp, sus productos y sus dudas escritas a mano. Comparte con el panel la paleta,
las letras y el logo; lo que sigue es lo que agrega. **Desde el 31 de octubre de 2026
también lo usa el Resumen del panel** (ver "El Resumen", abajo); ninguna otra pantalla.
La estrategia de la superficie está en `.impeccable/surfaces/app-page-tsx.md`.

### Lo que la portada se permite y el panel no

- **Sombras** para despegar lo que flota: el celular, las tarjetas de una escena, las
  notas. Siempre con desplazamiento y desenfoque teñidos de tinta
  (`0 24px 50px -28px rgb(29 28 26 / 0.45)`), nunca un halo de color.
- **Radios**: el celular (`2.3–2.4rem`), las tarjetas de una escena (`rounded-2xl`),
  los botones y las fichas en píldora.
- **Productos a color**, recortados sin fondo (`productos.ts`, fotos de Pexels con
  licencia libre). Son los de Rosa Deportes, la tienda de ejemplo, y el pie lo dice.
- **Movimiento en la primera pantalla**: el titular entra por renglones y el celular
  sube al cargar. El estado final se lee igual sin JavaScript y con movimiento
  reducido.
- **Un celular en 3D**, inclinado, que sigue al puntero en escritorio.

### Vocabulario

- **El celular de muestra.** Un marco de tinta con su isla, dibujado en código
  (`telefono.tsx`, `Celular` en `pedidos.tsx`), nunca una captura con marco: así cada
  pieza de la pantalla se puede animar. Lo que muestra es una pantalla real de Venduo
  o de una tienda, con los textos de verdad: el mensaje del pedido es el de
  `mensajeDePedido`, los estados son "Pendiente" y "Pagado", y Venduo nunca sabe el
  nombre de quien compra.
- **La escena.** Lo que cuenta un paso se dibuja a un tamaño fijo (`760 × 520`, o
  `380 × 700` en columna para el celular) y se escala entero con `useEscala`
  (`escala.ts`): nunca se corta una pieza en una pantalla más angosta. Cuando la caja
  baja de ~640 px, la escena cambia a su versión en columna en vez de achicarse hasta
  no leerse.
- **Las notas a mano.** Kalam sobre papel blanco o amarillo, con una inclinación de
  pocos grados: las dudas de quien vende ("¿precio?", "¿pagó?"). Una o dos palabras;
  nunca información que haga falta para entender.
- **El resaltador.** Un trazo amarillo bajo una frase del titular, y un subrayado a
  mano en la señal (`Subrayado` de `trazos.tsx`) que se dibuja al entrar. Uno por
  titular.
- **Fichas y carruseles.** Las fichas que se eligen van en grilla de columnas iguales
  o en una franja que se desliza; nunca bajan de renglón a su ancho. Toda franja que
  se desliza lo avisa: los bordes se esfuman donde queda más, y lleva puntos (con
  zona de toque de 44 px) y "Desliza →" mientras quede algo por ver. En el celular,
  un carrusel se maneja también deslizando el dedo; un gesto más vertical que
  horizontal es scroll y no cuenta.
- **El fundido de imágenes.** Al cambiar de plantilla, la imagen nueva aparece encima
  de la anterior, que queda entera debajo (`capaDelFundido` de `rotacion.ts`). Nunca
  dos o tres imágenes a medio camino una sobre otra.

### Movimiento

GSAP con ScrollTrigger, y Lenis para el scroll suave (`components/portada/gsap.ts`).

- **Una escena por sección**, no un efecto por elemento. Arranca cuando la escena se
  ve entera, y **vuelve a empezar** cuando sale del todo de la pantalla, hacia arriba
  o hacia abajo.
- **Lo que avanza solo, para al tocar.** Las pestañas, los rubros y los carruseles
  rotan mientras están a la vista (entre 3 y 5 s) y se quedan quietos en cuanto la
  persona elige algo.
- **Lo que pasa en el tiempo deja ver su ritmo**: una barra que se llena por paso, y
  unos 3 s por paso para que se pueda leer.
- **La entrada fija con el scroll es corta**: una sola, en la portada, de menos de una
  pantalla de recorrido.
- Todo pasa por `gsap.matchMedia(CON_MOVIMIENTO)`: con `prefers-reduced-motion` no
  hay scroll suave, ni escenas, ni rotación, y se ve el estado final de cada una.

### Named Rules

**La regla de la escena que dice la verdad.** Lo que se ve en un celular de muestra
existe en Venduo hoy, se llama igual y funciona igual. Una función planeada no se
dibuja como si existiera.

**La regla del celular primero.** Quien llega desde TikTok llega en el celular. Toda
escena tiene su versión en columna, legible a 360 px, y nada se esconde "solo para
escritorio" sin un equivalente.

## El Resumen

**El cuaderno de ventas del día.** El Resumen (`/panel`, en `components/panel/resumen/`)
es la única pantalla del panel que se cuenta en escenas, con el registro de la portada:
Archivo ancha, la letra a mano en el bolígrafo, el resaltador bajo una frase del
titular, tarjetas que flotan con sombra teñida, GSAP con ScrollTrigger y Lenis. Se
eligió así porque es la pantalla que se abre todos los días: tiene que dar ganas de
abrirla. Las demás pantallas del panel siguen en su registro de diario.

Cada escena hace lo que hacía su panel —nada se perdió— y se arma al aparecer:

- **La entrada.** El nombre de la tienda en grande, su estado en píldoras, una frase con
  lo vendido hoy y, resaltado, lo que espera el cobro. Al lado, la portada de la tienda
  en un celular en 3D que sigue al puntero, con su enlace y su logo flotando y "así la
  ven tus clientes" a mano. Tocar el celular abre el editor.
- **Para hoy.** Lo que impide vender, como renglones de cuaderno en el bolígrafo; lo que
  espera, en notas pegadas que caen y se enderezan al pasar. El número urgente se
  encierra con un círculo a mano. Sin nada pendiente: "Estás al día" con un visto.
- **Primeros pasos.** Números grandes en contorno; lo hecho se tacha a mano.
- **Cómo te va**, la escena oscura: la cifra del período cuenta hasta su valor, el
  gráfico crece barra por barra en tinta clara y el mejor día va en frambuesa clara con
  "tu mejor día" anotado. Cambiar el período vuelve a armar la escena.
- **Últimos pedidos**, como tickets con su talón punteado. El pendiente late; al
  marcarlo pagado se estampa un sello "Pagado" de goma, torcido.
- **Lo que más se vende**, como polaroids sobre la mesa, con el nombre a mano y el
  primero encerrado. En el celular, una franja que se desliza.
- **Se está acabando**: más y menos redondos, el número salta al cambiar.
- **Quién visita tu tienda** (si Venduo se lo activó): de dónde llegan, en barras que
  crecen, y el camino de la visita al pago, en un embudo.
- **El cierre**: el enlace de la tienda para copiar y las redes que vuelan hacia él.

Las reglas de la portada valen acá —una escena por sección, vuelve a empezar al salir
de la pantalla, todo por `gsap.matchMedia(CON_MOVIMIENTO)`, versión en columna para el
celular— y además: **los datos son los de la tienda**, nunca de ejemplo, y **lo que se
hace todos los días se sigue haciendo acá** (cobrar, reponer, compartir).

## Do's and Don'ts

### Do:

- **Do** usar papel `#f7f5f0` como campo de toda superficie de Venduo y tinta
  `#1d1c1a` para el texto.
- **Do** reservar la frambuesa para la acción principal, las cifras, el label de sección
  y, como campo, un solo bloque por página.
- **Do** separar con reglas de 1 px a tinta 15%, y usar el trazo de 2 px solo para
  coronar un bloque de apertura o trazar el botón secundario.
- **Do** construir la jerarquía de texto bajando opacidad sobre tinta.
- **Do** poner todo monto por `formatMoney` y con `.tabular`.
- **Do** mostrar los productos a color, como los subió quien vende.
- **Do** resolver a 375 px primero, con objetivos táctiles de 44 px, y recién
  después dejar crecer hasta 1280 px.
- **Do** escribir en español neutro boliviano tratando de «tú», también en los
  textos que genera la IA.
- **Do** dejar el estado final legible sin JavaScript y con movimiento reducido.
- **Do** componer sobre shadcn/ui envolviendo o con `asChild`.

### Don't:

- **Don't** usar sombras en el diario (el panel y sus pantallas). La portada las usa
  solo para despegar lo que flota: el celular, las tarjetas de las escenas.
- **Don't** rendir una colección como tarjetas: va como lista o retícula separada
  por reglas.
- **Don't** redondear un contenedor. El radio es para lo que se toca.
- **Don't** introducir un segundo acento de color, ni un degradado, ni un gris que
  no sea tinta con opacidad o la plata ya declarada.
- **Don't** usar blanco puro como fondo de página.
- **Don't** mezclar los tokens de este mundo con los tokens de shadcn en una misma
  pantalla.
- **Don't** animar en el primer viewport, ni mover, escalar o ensombrecer un botón
  al pasar el cursor: el `hover` es cambio de color.
- **Don't** mostrar una cifra ilustrativa sin su descargo al pie.
- **Don't** concatenar clases a mano: las condicionales van por `cn()`.
