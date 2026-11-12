---
name: Venduo
description: El cuaderno de ventas pasado en limpio sobre papel impreso, con un solo color de señal que manda cuando aparece. En escenas en la portada y el Resumen, quieto en las pantallas de trabajo y sobrio, como un diario, en /admin.
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

**Creative North Star: "El cuaderno de ventas pasado en limpio"**

Venduo se ve como el cuaderno de quien vende, pasado en limpio sobre papel impreso: papel
cálido, tinta casi negra, titulares de imprenta y un solo bolígrafo de color —la
frambuesa— que aparece poco y manda cuando aparece. Sobre el papel van las cosas de un
mostrador: el ticket con su sello, la nota pegada, la polaroid del producto, el
resaltador sobre lo que importa y la letra a mano de quien anota rápido. El color no
baña la pantalla; marca.

Hay **un solo mundo** —papel, tinta, frambuesa, resaltador, Archivo, Geist y Kalam— y
**tres registros**, según lo que la persona vino a hacer. Se decidió el 7 de noviembre de
2026, mirando la misma pantalla dibujada de tres formas:

| Registro                   | Dónde                                                                                             | Cómo                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **El cuaderno en escenas** | La portada (`/`), el Resumen (`/panel`), el final del alta (`/crear/listo`) y el Inicio de la app | Se mira. Cada sección es una escena que se arma con el scroll y vuelve a empezar al salir: el celular en 3D, las notas que caen, la cifra que cuenta.                                                |
| **El cuaderno de trabajo** | Las demás pantallas del panel y de la app, el ingreso y el alta de la tienda                      | Se trabaja. El mismo vocabulario —tickets con sello, notas, números que cuentan, tarjetas con radio y sombra teñida, titulares con resaltador—, quieto mientras se desliza: lo mueve lo que se toca. |
| **El diario**              | `/admin`                                                                                          | Se completa o se administra. Reglas de un píxel, esquina viva y nada de sombras: la sobriedad de un formulario impreso.                                                                              |

**La regla para elegir.** Si la pantalla se abre para ver cómo va el negocio, va en
escenas. Si se abre para hacer algo —buscar, filtrar, cobrar, cambiar un precio, veinte
veces al día—, va en el cuaderno de trabajo, porque nada puede esperar a que se deslice.
Si es la operación de Venduo, va en el diario. El ingreso y el alta pasaron al cuaderno
de trabajo el 9 de noviembre: son la puerta del panel y se visten como él. El final del
alta es una escena que cabe en una pantalla: **se arma una vez al llegar** y no vuelve a
empezar, sin scroll. **Una pantalla nueva del panel
es del cuaderno de trabajo**, salvo que se decida otra cosa.

Este documento describe primero lo común —color, letra, ritmo— y lo del diario, que es
además la base editorial de las tiendas. Después vienen "El cuaderno de ventas", con lo
que agregan los dos registros del cuaderno, y "La portada", "El Resumen" y "Las pantallas
de trabajo".

**Una tienda `/t/{slug}` usa el mundo de su plantilla; el panel de su dueño, este.** La
tienda queda reconocible en el panel por su sello, un recuadro con su papel, su letra y su
color de acción. Las plantillas redefinen estos mismos tokens —papel, tinta, señal, titular,
cuerpo, radio— y traen sus propios componentes; sus valores están en
`lib/plantillas` y el sistema entero en `docs/store-templates.md`. Este documento
es además **la base editorial**: la plantilla de respaldo con la que se dibuja
toda tienda cuya plantilla se retiró. Sus letras y sus reglas son las de este
documento, pero **sus colores no siguieron a la marca**: la base editorial
(`lib/plantillas/clasica.ts`) conserva el papel `#f1f0ee`, la tinta `#16171a` y el rojo
`#d62d12`, porque es una plantilla de tienda y cambiarla le cambiaría la cara a las
tiendas que la usan. El `toldo` no lo redefine ninguna plantilla: es solo del logo de
Venduo.

Los tokens por defecto de shadcn (`--background`, `--foreground`, `--primary`…)
siguen declarados en `app/globals.css` porque los componentes generados los
usan, pero **ninguna pantalla se diseña con ellos**: los controles se visten con
las clases de `lib/estilos.ts`.

**Key Characteristics:**

- Campo de papel cálido `#f7f5f0`, nunca blanco puro como fondo de página.
- Un solo acento: la frambuesa de señal, para lo que pide algo. Los botones y lo elegido
  van en tinta. El resaltador amarillo va detrás de una frase del titular y de lo que
  acaba de cambiar.
- Archivo extrabold con tracking negativo para titulares y cifras; Geist para leer;
  Kalam, a mano, para las notas, las pistas y los vacíos del cuaderno, nunca para lo que
  hay que leer de corrido.
- En el cuaderno, tarjetas de hoja (`#fdfcf9`) con radio y una sola sombra teñida de tinta. En el
  diario, separación por regla de un píxel, cero tarjetas y cero sombras.
- El movimiento tiene un porqué: en las escenas va con el scroll, en el cuaderno de
  trabajo responde a lo que se toca y en el diario hay un solo gesto, entrar. Con
  "Reducir movimiento", todo queda quieto.

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
- **Resaltador** (`--resaltador`, `#fff1a6`): **lo que espera o acaba de cambiar**
  —«Cambios sin guardar», la cifra de hojas, el catálogo recién guardado— y, en el
  cuaderno, una frase por titular. **Siempre detrás de un texto en
  tinta** (16:1): la frambuesa sobre el amarillo da 4,48:1 y no pasa. Nunca es el
  relleno de un control ni la única señal de algo.

### Neutral

- **Papel** (`--papel`, `#f7f5f0`): el campo de toda superficie de Venduo. Reemplaza
  al blanco; el blanco puro solo aparece como texto o borde sobre la señal, y como
  superficie de una tarjeta del cuaderno.
- **Tinta** (`--tinta`, `#1d1c1a`): todo el texto de lectura, los bordes plenos, los
  botones, lo elegido y el campo de las escenas oscuras de la portada y el Resumen.
- **Plata** (`--plata`): gris de apoyo declarado en los tokens, disponible para
  bordes y estados apagados.

### Solo en el cuaderno

Declarados en `components/portada/portada.module.css` y
`components/panel/resumen/resumen.module.css` —en la app, en `src/theme/index.ts`—, no
en los tokens de Tailwind:

- **Hoja** (`#fdfcf9`): el campo un punto más claro de una sección o del talón de un
  ticket.
- **Frambuesa suave** (`#fce4ee`): el fondo de lo marcado sobre papel.
- **Frambuesa clara** (`#ff7aa8`): la señal sobre la tinta —rótulos, barras de avance,
  la etiqueta del stock, el mejor día del gráfico— en las escenas oscuras (7:1).

Las jerarquías intermedias **no son colores nuevos**: son tinta con opacidad.
La escala en uso es `70%` para texto secundario, `60%` para pie de página,
`55%` para pies de foto y notas, `45–50%` para descargos, `40%` para numerales
ordinales, y `15%` para reglas divisorias. Un texto que se tiene que leer no baja de
`65%` (5,3:1): al `55%` da 3,7:1 contra el papel y no pasa 4,5:1. Lo de menos de 65% es
decoración o letra grande.

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

**La regla del papel.** Ninguna superficie de Venduo usa `#fff` como fondo de página
ni de tarjeta. El blanco es un color de texto sobre la señal, no un campo. Lo que se apoya
sobre el papel (`#f7f5f0`) es de hoja (`#fdfcf9`): una tarjeta, una nota, un diálogo, una
celda. El blanco puro al lado del papel lo hacía ver amarillento, y una cabecera blanca
sobre un cuerpo de papel partía la tarjeta en dos.

**La regla de la opacidad.** La jerarquía de texto se construye bajando opacidad
sobre tinta, nunca introduciendo un gris nuevo.

## Typography

**Display Font:** Archivo (pesos 600/700/800), servida por `next/font` en
`--font-titular`, subconjunto latino.
**Body Font:** Geist, en `--font-sans`.

**Hand Font:** Kalam (400 y 700), en `--fuente-mano`, servida desde
`components/portada/letras.ts` y cargada por las pantallas del cuaderno. En la app,
`@expo-google-fonts/kalam` (`fuentes.mano`).

**Character:** Un grotesco industrial apretado contra una cara de interfaz neutra.
Archivo grita; Geist explica. En el diario no hay una tercera voz. En el cuaderno,
Kalam es la letra de quien vende —"¿pagó?", "este espera tu cobro", "tu mejor día"— y
solo escribe notas sueltas, pistas y estados vacíos; nunca un titular, un botón ni un
texto que haya que leer de corrido. El cuaderno usa además Archivo con su eje de ancho
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
  tinta; en la señal solo si pide algo): cifras destacadas. Siempre con `.tabular` y siempre con un detalle debajo
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
`md`; la acción principal nunca se esconde.

### Named Rules

**La regla del mundo único.** Toda pantalla usa los tokens de este documento, sin
excepción: el mismo papel, la misma tinta, el misma frambuesa y las mismas letras. Lo que
separa las pantallas del diario entre sí es el **ritmo**, no el sistema: secciones de
`40–48px` en vez de `80px`, el nombre de la tienda en lugar de un display,
navegación persistente, y la frambuesa reservada a lo que pide una acción.

Los tres registros comparten los tokens. Quien llega de la portada al panel reconoce el
mismo cuaderno —el papel, la frambuesa, el ticket, la letra a mano— y encuentra una
herramienta, no otra página de venta: lo que cambia de la portada a Pedidos es el
movimiento con el scroll, no el mundo.

**La regla del contenedor único.** En el diario, todo alinea a `max-w-6xl`. La
portada usa `max-w-[1280px]`, porque sus escenas necesitan el ancho.

Si algo necesita
romper esa línea, lo que sale a sangre es el fondo, nunca el texto.

## Elevation & Depth

**El diario no tiene sombras.** Ni una. La profundidad se construye con tres
recursos: la regla de un píxel, el cambio de campo (un bloque a sangre en la señal
contra el resto en papel) y la opacidad del texto. Una tarjeta con sombra
introduce una fuente de luz que este mundo no tiene.

La única superposición real es el encabezado adherido, y se resuelve con
translucidez y desenfoque de fondo, no con sombra.

**El cuaderno tiene una sola sombra**, teñida de tinta, para lo que está apoyado sobre
el papel —una tarjeta, una nota, un ticket, una polaroid—:
`0 1px 2px rgb(29 28 26 / 0.05), 0 22px 44px -26px rgb(29 28 26 / 0.38)`. El celular de
muestra lleva una más honda, `0 40px 100px -30px rgb(29 28 26 / 0.45)`. Nunca un halo
de color ni una sombra gris neutra: la luz es la de una mesa, no la de una pantalla.

### Named Rules

**La regla sin sombra.** Ningún elemento del diario lleva
`box-shadow`. Si algo necesita separarse del fondo, se le pone una regla o se le
cambia el campo.

**La regla del campo.** Un cambio de sección se anuncia con una regla de un píxel;
un cambio de tono se anuncia cambiando el campo entero. No hay estado intermedio.

## Shapes

En el diario todo es rectangular. El radio por defecto es `0`: los paneles, las fotos,
las celdas de producto y las bandas de sección tienen esquina viva.

En el cuaderno, el radio dice qué se puede levantar de la mesa: tarjetas y tickets
`16–20px`, la foto dentro de una tarjeta `10–12px`, botones y fichas en píldora, el
celular de muestra `34px` y la polaroid casi recta (`4px`). Las bandas a sangre y las
escenas oscuras no se redondean en el celular; en una pantalla ancha, `28px`.

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

**La regla de la esquina viva.** En el diario, un contenedor no se redondea. El redondeo se
reserva para lo que se toca.

**La regla de la lista sobre la tarjeta.** En el diario, una colección se rinde como
lista o retícula de ítems separados por regla superior, no como tarjetas. La caja no es
andamiaje.

## Components

Los controles se componen sobre shadcn/ui envolviéndolos o con `asChild`; los
archivos de `components/ui/` se generan y no se editan a mano. Lo que sigue es
cómo se visten en el diario y en la base editorial de las tiendas; el cuaderno tiene
los suyos en "El cuaderno de ventas".

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

En el diario no hay tarjetas. Lo que cumple ese papel es el **panel de demostración**: campo
papel encerrado por una regla estructural de 1 px, esquina viva, `16px` de relleno
interno, y cabecera y pie separados por la misma regla. Sin sombra y sin radio. En el
diario, cada cosa de cada pantalla es uno de estos —sus cifras, su lista, cada bloque
de un formulario—, con un ícono, un título que dice para qué sirve y, si hace falta,
un pie que lleva adonde se sigue. En el cuaderno de trabajo es una tarjeta (ver "Las
pantallas de trabajo").

### Navigation

Encabezado adherido, papel al 90% con desenfoque, regla inferior al 15%. La marca
es `<Logo />`: el símbolo de la feria en el celular y el nombre en Archivo extrabold
`1.125rem` con tracking `-0.02em` (`.agents/rules/marca.md`). Los enlaces son Geist
`0.875rem` a opacidad `70%` que suben a `100%` en `hover`; no hay subrayado ni
color de estado activo. La acción principal, en tinta, cierra la barra a la derecha y sobrevive al
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

Numeral tabular, en tinta —en la señal si pide algo—, que cuenta hasta su valor al
entrar en pantalla, en 900 ms con
salida cúbica, y un detalle debajo en versalita a opacidad `60%`. Renderiza el
valor final de entrada: si el JavaScript no corre o la persona pidió menos
movimiento, el número ya está ahí. Toda cifra ilustrativa lleva su descargo al pie
de la banda.

### Motion

En el diario, el gesto de fondo es **entrar**. El elemento sube `14px` y aparece en 500 ms con
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

**El panel responde a lo que se toca.** Es el movimiento del cuaderno de trabajo. Desde
el rediseño de Catálogos (31/10/2026), lo que se elige o se cambia se ve en el momento, con movimiento que tiene un porqué. Todo
arranca por un toque —nunca solo al cargar— y va en CSS o con la API de animaciones del
navegador, sin librerías: GSAP queda en la portada y en el Resumen. Las piezas, en
`app/globals.css`:

- **Lo que acaba de cambiar** (`.texto-recien`, `Recien` y `useRecien` de
  `components/panel/recien.tsx`): un trazo de resaltador entra detrás del texto de
  izquierda a derecha y se retira hacia abajo en 1,7 s. Para la cifra de hojas, el
  nombre de la plantilla probada, «Cambios sin guardar», el catálogo recién guardado.
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

**La regla del pliegue.** En el diario, lo que se ve sin desplazar se rinde quieto. El revelado
se usa solo debajo del pliegue, para que en un equipo lento la primera pantalla se
lea de inmediato.

## El cuaderno de ventas

Lo que comparten la portada, el Resumen, el Inicio de la app y las pantallas de trabajo.
Es el mismo cuaderno en los tres lugares; lo que cambia es el movimiento: con el scroll
en la portada y el Resumen, con el toque en las pantallas de trabajo.

### Lo que el cuaderno se permite y el diario no

- **Sombras** para despegar lo que está apoyado sobre el papel, siempre la misma y
  teñida de tinta ("Elevation & Depth"). Nunca un halo de color.
- **Radios**: tarjetas y tickets `16–20px`, botones y fichas en píldora ("Shapes").
- **La letra a mano** (Kalam, en la señal): notas sueltas, pistas y vacíos.
- **El resaltador** detrás de una frase de cada titular.
- **Tarjetas de hoja** sobre el papel, con borde de tinta al 12%.
- **Movimiento rico**: piezas que caen, se estampan, vuelan o cuentan. No se limita
  pensando en un equipo lento; se limita con "Reducir movimiento".

### Vocabulario

Las piezas del cuaderno y dónde están. En la web, los trazos en
`components/portada/trazos.tsx` y lo demás en `components/panel/resumen/`; en la app,
`src/components/inicio/escenas/`.

- **La tarjeta** (`.nota` en `resumen.module.css`, `NOTA` en la app): de hoja, borde de
  tinta al 12%, radio `16–20px`, la sombra del cuaderno. Es el panel del cuaderno.
- **La nota pegada**: una tarjeta chica, torcida 1–3°, con un número grande en Archivo y
  dos palabras. Lo urgente va en la señal y encerrado con un círculo a mano. Al tocarla
  sube y se endereza.
- **El ticket**: la foto de lo que pidieron, `#148 · hace 26 min`, qué pidió y, separado
  por una línea punteada, el talón en el campo hoja con el total y su estado.
- **El sello**: el estado de un ticket como un sello de goma —versalita en Archivo ancha,
  borde de 2,5 px, torcido −8°—. "Pagado" en tinta, "Cancelado" apagado.
- **La polaroid**: la foto de un producto con marco blanco, el nombre a mano debajo y su
  número en un círculo; el primero, en la señal.
- **Los trazos a mano**: `Subrayado` bajo una frase, `Circulo` alrededor de lo urgente,
  `Flecha` hacia lo que se señala, `Visto` cuando algo está al día y `Tachon` sobre lo
  hecho. Se dibujan al entrar, de a uno.
- **La cifra que cuenta** hasta su valor, y **el número que salta** al cambiar (`.numero-entra`).
- **La escena oscura**: una banda en tinta con su rótulo en frambuesa clara, para lo que
  se mira en grande, como las ventas.

### El movimiento del cuaderno

- **En escenas** (la portada, el Resumen y el Inicio de la app): cada sección se arma
  cuando aparece y vuelve a empezar cuando sale entera de la pantalla. Web: GSAP con
  ScrollTrigger y Lenis (`useEscena` de `components/panel/resumen/escena.ts`). App:
  Reanimated, una línea de tiempo por escena que corre en el hilo de la interfaz
  (`Escena` y `Pieza` de `src/components/inicio/escenas/escena.tsx`).
- **Al tocar** (las pantallas de trabajo): al llegar, una entrada corta; al deslizar,
  nada; al tocar, la respuesta —el sello que se estampa, el número que salta, la foto que
  vuela, el resaltador sobre lo que cambió—. Las piezas están en "El panel responde a lo
  que se toca".

### Named Rules

**La regla de la nota que sobra.** Lo que dice una nota a mano también está dicho en
otro lado, o no hace falta. Si se borra la nota, la pantalla se sigue entendiendo.

**La regla del sello verdadero.** El sello se estampa cuando la base confirmó, no al
tocar. Sin conexión, el pedido queda esperando y se dice.

**La regla de lo quieto al deslizar.** En una pantalla de trabajo nada se arma con el
scroll: quien busca un pedido entre ochenta no espera a que aparezca.

**La regla de la escena entera.** Una escena se arma o no se arma: nunca queda una pieza
a medio camino. Con "Reducir movimiento", todo está en su lugar desde el principio.

## La portada

**El cuaderno de ventas pasado en limpio.** La portada pública (`/`, en
`components/portada/`) cuenta Venduo con lo que la persona ya conoce: su celular, su
WhatsApp, sus productos y sus dudas escritas a mano. Usa el vocabulario de "El cuaderno de
ventas"; lo que sigue es lo que agrega ella sola. La estrategia de la superficie está en
`.impeccable/surfaces/app-page-tsx.md`.

### Lo que agrega la portada

- **Productos a color**, recortados sin fondo (`productos.ts`, fotos de Pexels con
  licencia libre). Son los de Rosa Deportes, la tienda de ejemplo, y el pie lo dice.
- **Movimiento en la primera pantalla**: el titular entra por renglones y el celular
  sube al cargar. El estado final se lee igual sin JavaScript y con movimiento
  reducido.
- **Un celular en 3D**, inclinado, que sigue al puntero en escritorio.
- **Sombras más hondas** para el celular y las tarjetas de una escena
  (`0 24px 50px -28px rgb(29 28 26 / 0.45)`).

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
es la pantalla del panel que se cuenta en escenas, con el registro de la portada:
Archivo ancha, la letra a mano en el bolígrafo, el resaltador bajo una frase del
titular, tarjetas que flotan con sombra teñida, GSAP con ScrollTrigger y Lenis. Se
eligió así porque es la pantalla que se abre todos los días: tiene que dar ganas de
abrirla. Las demás pantallas del panel son del cuaderno de trabajo ("Las pantallas de
trabajo").

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

**En la app, el Inicio es la misma pantalla** (`src/components/inicio/escenas/`), escena
por escena, con Reanimated en vez de GSAP: la línea de tiempo de cada escena lee el
desplazamiento en el hilo de la interfaz, sin pasar por JavaScript en cada cuadro. Lo
que cambia es solo lo de una pantalla táctil: el celular en 3D no sigue al puntero, se
endereza al bajar; las polaroids van en una franja que se desliza; tocar una barra del
gráfico dice su día.

## Las pantallas de trabajo

**El cuaderno, quieto al deslizar.** Pedidos, Productos, Catálogos, Estadísticas,
Publicar en redes, Apariencia, Compartir, Datos de la tienda y Tus datos, en la web y en
la app, usan el vocabulario de "El cuaderno de ventas" sin escenas atadas al scroll. Se
eligió así el 7 de noviembre de 2026: Venduo se siente una sola app, del Resumen a la
última pantalla, y lo que se usa veinte veces al día no hace esperar.

Pieza por pieza, lo que antes era el panel del diario:

- **La cabecera**: el titular nombra lo que es de la persona, con la frase que elige la
  pantalla resaltada —"Tus _pedidos_.", "Publica _tus productos_."—, y una bajada de una
  frase debajo. Una pantalla de detalle no resalta nada.
- **Lo que filtra una lista** son notas pegadas con su número —"1 Por cobrar", "2 Sin
  stock"—, en columnas iguales; lo urgente, en la señal y encerrado a mano. La elegida se
  endereza y lleva el borde en tinta.
- **Cada panel es una tarjeta del cuaderno**, con su título en Archivo y su bajada; las
  filas de adentro siguen separadas por una regla.
- **Un pedido es un ticket** con su talón: el total y el sello. El sello "Por cobrar" se
  toca —pregunta y marca pagado—; solo late el pendiente más viejo, que se levanta y
  golpea el papel cada tanto; y el sello "Pagado" se estampa recién cuando la base lo
  confirma. Sin píldora aparte: el talón no se desarma.
- **Lo fijo abajo en el celular** es una bandeja que flota sobre la lista, con radio y
  sombra, nunca una regla de tinta de lado a lado.
- **Mientras carga**, la pantalla ya tiene su titular de verdad y, debajo, la forma de lo
  que viene —las notas, la tarjeta, los tickets— con huesos en píldora donde van los
  datos.
- **Un producto se reconoce por su foto**, con radio, y repone su stock con más y menos
  redondos: el número salta al cambiar.
- **Un vacío** dice qué va a aparecer, con una nota a mano y una sola acción.
- **Los botones** son píldoras: el principal en tinta, el secundario con borde.
- **Un formulario** sigue siendo una pantalla por filas (skill `pantalla-por-filas`), con
  las filas dentro de una tarjeta y lo opcional en hojas.
- **El movimiento**: una entrada corta al llegar y después solo lo que responde a un
  toque ("El panel responde a lo que se toca").

**Cómo está hecho.** Las piezas no deciden su traje. El armazón del panel
(`components/panel/armazon.tsx`) marca su contenido con `data-registro="cuaderno"` y
carga las letras del cuaderno; las piezas llevan una clase `pieza-*` —`pieza-tarjeta`,
`pieza-titular`, `pieza-resaltado`, `pieza-vacio`, `pieza-ficha`, `pieza-foto`,
`pieza-miniatura`, `pieza-insignia`, `pieza-sello`, `pieza-celda`, `pieza-campo`,
`pieza-bandeja`, `pieza-hueso`— que `app/globals.css` viste como el
cuaderno solo adentro de esa marca. Sin la marca, la misma pieza es el diario: así
`/admin` y el alta usan `Seccion` y `Cabecera` sin cambiar, y las tiendas conservan el
radio de su plantilla. Adentro del panel, `--radio` vale píldora —también en los
diálogos— y los botones de `lib/estilos.ts` salen redondos sin tocarlos.

**Una caja nueva lleva su clase.** Un contenedor con borde que no es `Seccion` —una
lista de filas, el bloque de una nota— lleva `pieza-tarjeta`; un buscador o un control
con forma, `pieza-ficha`. Sin la clase queda cuadrado, como el diario. Lo que falta pasar
está en `docs/estado-del-proyecto.md`.

## Do's and Don'ts

### Do:

- **Do** usar papel `#f7f5f0` como campo de toda superficie de Venduo y tinta
  `#1d1c1a` para el texto.
- **Do** reservar la frambuesa para lo que pide algo —un pendiente, un agotado, un
  error— y para el logo. Los botones y lo elegido van en tinta.
- **Do** separar con reglas de 1 px a tinta 15% en el diario y dentro de una tarjeta, y
  usar el trazo de 2 px solo para coronar un bloque de apertura o trazar el botón
  secundario.
- **Do** dejar quieta una pantalla de trabajo mientras se desliza, y mover solo lo que
  responde a un toque.
- **Do** elegir el registro por lo que la persona vino a hacer: mirar (escenas),
  trabajar (el cuaderno quieto) o completar un trámite (el diario).
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

- **Don't** usar sombras en el diario. En el cuaderno hay una sola, teñida de tinta,
  para lo que está apoyado sobre el papel.
- **Don't** rendir una colección como tarjetas en el diario: va como lista o retícula
  separada por reglas.
- **Don't** redondear un contenedor en el diario. El radio es para lo que se toca.
- **Don't** introducir un segundo acento de color, ni un degradado, ni un gris que
  no sea tinta con opacidad o la plata ya declarada.
- **Don't** usar blanco puro como fondo de página.
- **Don't** mezclar los tokens de este mundo con los tokens de shadcn en una misma
  pantalla.
- **Don't** atar al scroll una pantalla de trabajo, ni animar el primer viewport del
  diario. La portada y el Resumen sí se arman al cargar.
- **Don't** mover, escalar o ensombrecer un botón al pasar el cursor en el diario: el
  `hover` es cambio de color.
- **Don't** mostrar una cifra ilustrativa sin su descargo al pie.
- **Don't** concatenar clases a mano: las condicionales van por `cn()`.
