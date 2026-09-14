---
name: Venduo
description: Editorial impreso sobre papel claro, con un solo rojo de señal que manda cuando aparece.
colors:
  papel: "#f1f0ee"
  tinta: "#16171a"
  senal: "#d62d12"
  senal-alta: "#ee3a1c"
  plata: "#b8bcc0"
  blanco: "#ffffff"
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
    backgroundColor: "{colors.senal}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.senal-alta}"
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

**Creative North Star: "El diario del mercado"**

Venduo se ve como una página impresa: papel claro, tinta casi negra, reglas de un
píxel que separan las secciones y un solo rojo de señal que aparece poco y manda
cuando aparece. No hay degradados, ni tarjetas flotando, ni un teléfono en ángulo.
Lo que estructura la página es la retícula y la línea, no la caja.

La densidad es alta arriba y respira abajo: bloques de texto acotados en medida
(`ch`), titulares grandes con tracking cerrado, y cuerpos de texto a opacidad
reducida para que el titular mande sin necesidad de un segundo color. El sistema
está hecho para un Android de gama baja con datos móviles, así que el peso visual
lo cargan la tipografía y el espacio, no los efectos.

Este mundo rige las **superficies públicas**: la portada, el ingreso `/login`, la
tienda `/t/{slug}` y el perfil del vendedor `/v/{slug}`. El ingreso entra acá
porque es la continuación directa de la portada: quien viene de elegir «Crear mi
tienda» no debería cambiar de mundo al llegar. Los paneles privados
(`/panel`, `/vendedor`)
siguen con los tokens por defecto de shadcn (`--background`, `--foreground`,
`--primary`…), que conviven en `app/globals.css` a propósito. Esa división es
deliberada y está descrita en `Layout`.

**Key Characteristics:**

- Campo de papel `#f1f0ee`, nunca blanco puro, en toda superficie pública.
- Un solo acento: el rojo de señal. Sin paleta secundaria.
- Separación por regla de un píxel; cero tarjetas y cero sombras.
- Archivo extrabold con tracking negativo para titulares y cifras; Geist para leer.
- Fotografía en blanco y negro que recupera color al pasar el cursor.
- Un solo gesto de movimiento: entrar al viewport.

## Colors

Una paleta de tres voces —papel, tinta y señal— más un gris de apoyo; el color no
baña la pantalla, marca.

### Primary

- **Rojo de Señal** (`--senal`): la acción principal, las cifras, las etiquetas de
  sección, el bloque de cierre, el cursor de texto, la selección y el anillo de la
  barra de desplazamiento. Pasa 4,5:1 contra el papel, así que sirve para texto y
  no solo para fondos. Como fondo se usa en **un solo bloque por página**.
- **Rojo Encendido** (`--senal-alta`): existe únicamente como estado `hover` del
  botón primario. Nunca es un color de reposo.

### Neutral

- **Papel Frío** (`--papel`): el campo de toda superficie pública. Reemplaza al
  blanco; el blanco puro solo aparece como texto o borde sobre el rojo.
- **Tinta** (`--tinta`): todo el texto de lectura, los bordes plenos y el relleno
  del botón secundario en `hover`.
- **Plata** (`--plata`): gris de apoyo declarado en los tokens, disponible para
  bordes y estados apagados.

Las jerarquías intermedias **no son colores nuevos**: son tinta con opacidad.
La escala en uso es `70%` para texto secundario, `60%` para pie de página,
`55%` para pies de foto y notas, `45–50%` para descargos, `40%` para numerales
ordinales, y `15%` para reglas divisorias.

### Named Rules

**La regla de la voz única.** El rojo ocupa menos del 10% de cualquier pantalla.
Si aparece en más de dos lugares en un viewport, uno de ellos no era importante.

**La regla del papel.** Ninguna superficie pública usa `#fff` como fondo. El blanco
es un color de texto sobre rojo, no un campo.

**La regla de la opacidad.** La jerarquía de texto se construye bajando opacidad
sobre tinta, nunca introduciendo un gris nuevo.

## Typography

**Display Font:** Archivo (pesos 600/700/800), servida por `next/font` en
`--font-titular`, subconjunto latino.
**Body Font:** Geist, en `--font-sans`.

**Character:** Un grotesco industrial apretado contra una cara de interfaz neutra.
Archivo grita; Geist explica. No hay una tercera voz.

### Hierarchy

- **Display** (800, `clamp(2.5rem, 8vw, 4.5rem)`, `0.97`, `-0.035em`): el titular
  de apertura y el de cierre de una superficie. Uno por pantalla, con `text-balance`
  y medida acotada (`12–13ch`).
- **Headline** (800, `clamp(1.9rem, 5vw, 2.75rem)`, `1.04`, `-0.03em`): el titular
  de cada sección, a `16–18ch`. Su variante angosta para columnas pareadas es
  `clamp(1.75rem, 4.5vw, 2.4rem)`; sobre el bloque rojo crece a
  `clamp(2rem, 6vw, 3.5rem)` con interlínea `1.02`.
- **Numeral** (800, `clamp(2.5rem, 7vw, 3.25rem)`, `1`, `-0.04em`, tabular, en
  rojo): cifras destacadas. Siempre con `.tabular` y siempre con un detalle debajo
  en versalita apagada.
- **Title** (700, `1.125–1.25rem`, `-0.02em`): el nombre de un ítem dentro de una
  lista o de una retícula.
- **Body** (400, `1rem`, `1.625`, opacidad `70%`): el texto corriente, a `46–48ch`.
  La entradilla bajo el titular de apertura sube a `1.125rem` y `52ch`. Una
  respuesta larga puede llegar a `68ch` y no más.
- **Label** (600, `0.75rem`, `0.12em`, versalita, en rojo): el nombre de la
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
cifras usa `48px`; el bloque rojo crece a `96px` en pantalla grande. Dentro de una
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
`md`; la acción roja nunca se esconde.

### Named Rules

**La regla de los dos mundos.** Las superficies públicas —portada, `/login`,
`/t/{slug}`, `/v/{slug}`— usan los tokens de este documento. Los paneles privados usan los
tokens semánticos de shadcn (`bg-background`, `text-muted-foreground`) tal como
vienen. No se mezclan en una misma pantalla y no se migra uno al otro sin decisión
explícita: el esfuerzo de diseño se gasta donde miran el comprador y el jurado.

**La regla del contenedor único.** Todo alinea a `max-w-6xl`. Si algo necesita
romper esa línea, lo que sale a sangre es el fondo, nunca el texto.

## Elevation & Depth

**Este sistema no tiene sombras.** Ni una. La profundidad se construye con tres
recursos: la regla de un píxel, el cambio de campo (un bloque a sangre en rojo
contra el resto en papel) y la opacidad del texto. Una tarjeta con sombra
introduce una fuente de luz que este mundo no tiene.

La única superposición real es el encabezado adherido, y se resuelve con
translucidez y desenfoque de fondo, no con sombra.

### Named Rules

**La regla sin sombra.** Ningún elemento de una superficie pública lleva
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
cómo se visten en el mundo público.

### Buttons

- **Shape:** rectángulo de esquina apenas suavizada (radio 0.375rem).
- **Primary:** relleno rojo de señal, texto blanco, `12px 20px`, peso 600. Es la
  acción de conversión; hay una sola por bloque.
- **Hover / Focus:** el relleno pasa a rojo encendido con `transition-colors`. No
  hay desplazamiento, ni escala, ni sombra al pasar el cursor.
- **Secondary:** trazo de 2 px de tinta sobre papel, sin relleno; en `hover` se
  invierte a campo tinta con texto blanco.
- **Sobre el bloque rojo:** el secundario cambia a trazo blanco y en `hover` se
  invierte a campo blanco con texto rojo. El primario rojo no existe ahí.
- **Foco sobre rojo:** el contenedor lleva `.campo-senal`, que dibuja un contorno
  blanco de 3 px con 3 px de separación. Un anillo de color no se vería.

### Cards / Containers

No hay tarjetas. Lo que cumple ese papel es el **panel de demostración**: campo
papel encerrado por una regla estructural de 1 px, esquina viva, `16px` de relleno
interno, y cabecera y pie separados por la misma regla. Sin sombra y sin radio.

### Navigation

Encabezado adherido, papel al 90% con desenfoque, regla inferior al 15%. La marca
va en Archivo extrabold `1.125rem` con tracking `-0.02em`. Los enlaces son Geist
`0.875rem` a opacidad `70%` que suben a `100%` en `hover`; no hay subrayado ni
color de estado activo. La acción roja cierra la barra a la derecha y sobrevive al
colapso móvil.

### Section Header

El patrón que abre casi toda sección: un **label** rojo en versalita con tracking
`0.12em`, `20px` de aire, y debajo el **headline** en Archivo extrabold a medida
acotada. El label nombra la sección —y es el mismo texto que el ancla de
navegación—; no repite el titular ni le agrega adjetivos.

### Listas separadas por regla

El patrón que reemplaza a la tarjeta. Cada ítem lleva regla superior de 1 px al
15%, `24px` de aire vertical, título en Archivo 700 y detalle en Geist a opacidad
`70%`. En una lista ordenada, el ordinal va en Archivo `0.875rem` con `.tabular` a
opacidad `40%`, en una columna angosta a la izquierda. En `hover`, el ítem entero
mueve su regla a rojo y su título a rojo con `transition-colors`.

### Fotografía

Toda foto va en blanco y negro (`grayscale`) sobre un fondo de tinta al 10%
mientras carga, sin radio, en relación `4/5` o `3/4`, con pie en Geist `0.75rem` a
opacidad `55%`. Al pasar el cursor recupera color y escala a `1.02` en 500 ms con
`ease-out`. El pie describe la escena; nunca le pone nombre a quien aparece.

### Acordeón

`<details>` nativo, sin JavaScript y sin dependencia. Cada pregunta es una fila con
regla superior de 1 px, título en Archivo 700 que pasa a rojo en `hover`, y la
respuesta en Geist a `70%` de opacidad con medida `68ch`. El marcador nativo se
oculta.

### Cifra que cuenta

Numeral rojo tabular que cuenta hasta su valor al entrar en pantalla, en 900 ms con
salida cúbica, y un detalle debajo en versalita a opacidad `60%`. Renderiza el
valor final de entrada: si el JavaScript no corre o la persona pidió menos
movimiento, el número ya está ahí. Toda cifra ilustrativa lleva su descargo al pie
de la banda.

### Motion

Un solo gesto: **entrar**. El elemento sube `14px` y aparece en 500 ms con
`cubic-bezier(0.16, 1, 0.3, 1)`. Los elementos hermanos se escalonan de 70 a 90 ms
entre uno y el siguiente, con un tope práctico de tres pasos. Los cambios de estado
(`hover`, foco) son solo de color, con la transición corta por defecto; la foto y
el llenado de la demostración usan 500 ms `ease-out`.

**La regla del estado final.** Toda animación parte de un estado ya legible: la
clase que oculta se agrega recién al montar, y con `prefers-reduced-motion: reduce`
o sin JavaScript todo queda en su posición final. Una animación nunca es requisito
para leer la página.

**La regla del pliegue.** Lo que se ve sin desplazar se rinde quieto. El revelado
se usa solo debajo del pliegue, para que en un equipo lento la primera pantalla se
lea de inmediato.

## Do's and Don'ts

### Do:

- **Do** usar papel `#f1f0ee` como campo de toda superficie pública y tinta
  `#16171a` para el texto.
- **Do** reservar el rojo para la acción principal, las cifras, el label de sección
  y, como campo, un solo bloque por página.
- **Do** separar con reglas de 1 px a tinta 15%, y usar el trazo de 2 px solo para
  coronar un bloque de apertura o trazar el botón secundario.
- **Do** construir la jerarquía de texto bajando opacidad sobre tinta.
- **Do** poner todo monto por `formatMoney` y con `.tabular`.
- **Do** rendir la fotografía en blanco y negro, devolviendo el color en `hover`.
- **Do** resolver a 375 px primero, con objetivos táctiles de 44 px, y recién
  después dejar crecer hasta 1280 px.
- **Do** escribir en español neutro boliviano tratando de «tú», también en los
  textos que genera la IA.
- **Do** dejar el estado final legible sin JavaScript y con movimiento reducido.
- **Do** componer sobre shadcn/ui envolviendo o con `asChild`.

### Don't:

- **Don't** usar sombras. Ninguna, de ningún tipo, en superficies públicas.
- **Don't** rendir una colección como tarjetas: va como lista o retícula separada
  por reglas.
- **Don't** redondear un contenedor. El radio es para lo que se toca.
- **Don't** introducir un segundo acento de color, ni un degradado, ni un gris que
  no sea tinta con opacidad o la plata ya declarada.
- **Don't** usar blanco puro como fondo de una superficie pública.
- **Don't** publicar una foto a color junto al rojo: le compite al único acento.
- **Don't** mezclar los tokens de este mundo con los tokens de shadcn en una misma
  pantalla.
- **Don't** animar en el primer viewport, ni mover, escalar o ensombrecer un botón
  al pasar el cursor: el `hover` es cambio de color.
- **Don't** mostrar una cifra ilustrativa sin su descargo al pie.
- **Don't** concatenar clases a mano: las condicionales van por `cn()`.
