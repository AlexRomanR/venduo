# Interfaz

## El sistema visual vive en DESIGN.md

**`DESIGN.md` en la raíz es la fuente del mundo visual**: paleta con sus valores, escala
tipográfica, ritmo de espaciado, pesos de regla, patrones de componente y gramática de
movimiento. Se derivó de las pantallas ya construidas, no de intenciones, y es lo que hereda
cada superficie nueva.

Leerlo antes de diseñar una pantalla. Esta regla cubre lo que no se negocia; `DESIGN.md`
cubre cómo se ve.

### El mundo de Venduo y el de cada tienda

**Venduo es el cuaderno de ventas de `DESIGN.md`**: papel cálido, tinta para todo lo que
se lee y se toca, una frambuesa de señal para lo que pide algo, el resaltador y la letra a
mano. Un solo mundo en **tres registros**, que se eligen por lo que la persona vino a
hacer (decisión del 7 de noviembre de 2026, `DESIGN.md`, "Overview"):

| Registro                   | Pantallas                                                                                                                                    | Regla                                                                                                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **El cuaderno en escenas** | La portada, el Resumen (`components/panel/resumen/`) y el Inicio de la app                                                                   | Escenas que se arman con el scroll y vuelven a empezar al salir.                                                                                                                                                                   |
| **El cuaderno de trabajo** | Pedidos, Productos, Catálogos, Estadísticas, Publicar en redes, Apariencia, Compartir, Datos de la tienda y Tus datos, en la web y en la app | Las mismas piezas —tarjetas con radio y sombra teñida, notas, tickets con sello, titulares con resaltador, letra a mano en las pistas—, **quietas al deslizar**: lo mueve lo que se toca. `DESIGN.md`, "Las pantallas de trabajo". |
| **El diario**              | El ingreso, el alta de la tienda y `/admin`                                                                                                  | Reglas de un píxel, esquina viva, sin sombras.                                                                                                                                                                                     |

**Una pantalla nueva del panel va en el cuaderno de trabajo.** Nunca en escenas: quien
busca un pedido entre ochenta no espera a que aparezca. Las que todavía van en paneles con
borde se pasan **enteras**, cuando se tocan, primero en la web y después en la app; la
lista de lo que falta está en `docs/estado-del-proyecto.md`.

**El botón principal y lo elegido van en tinta** (`BOTON_PRIMARIO`, `bg-accion`); la
frambuesa queda para lo que pide algo y para los errores. En una tienda, `--accion` vale
el color de acción de su plantilla: un botón de compra no sale negro.

**Una tienda usa el de su plantilla.** La plantilla redefine los mismos tokens —`papel`,
`tinta`, `senal`, `font-titular`, el radio— y trae su propio kit de componentes para la
tienda pública. Cómo funciona, y cómo se agrega una, está en `docs/store-templates.md`.

**El panel de quien tiene tienda es de Venduo**, igual para todas. Antes tomaba la
plantilla, y una letra o un color elegidos para vender —una condensada en mayúsculas, el
azul de un botón de compra, una antigua fina para las cifras— terminaban en cada rótulo de
una pantalla de trabajo. La tienda sigue reconocible donde se la nombra: su tarjeta en el
menú lateral, con su papel y su color de acción en un recuadro —el nombre en la letra de
Venduo, como en la app—, y su portada en el Resumen.

Tres reglas que se desprenden:

- **Nunca preguntar por la plantilla en un componente.** Ni `if (plantilla === …)` ni
  clases por clave. Lo que cambia entre plantillas vive en su kit
  (`components/plantillas/{clave}`) o en sus tokens (`lib/plantillas/{clave}.ts`).
- **Lo compartido se escribe con tokens y queda bien en todas**: carrito, checkout, pago y
  filtros. Un `#1d1c1a` o un `rounded-sm` fijos ya no responden a la plantilla: usar
  `text-tinta` y `rounded-plantilla`.
- **Nada en `app/(privado)` pinta la plantilla.** Ni `EstiloDePlantilla` en el layout ni
  variables de la tienda en `:root`: lo que muestra su identidad lo hace dentro de un
  recuadro, con sus valores en línea, como el sello.

**El editor de la tienda (`/editor`) sigue la misma idea:** sus controles van en el mundo
de Venduo y solo la vista previa lleva la identidad de la tienda. Si los controles tomaran los colores del borrador, cambiarían bajo el dedo de
quien está eligiendo un color.

**Todo lo que se toca en una plantilla usa `rounded-plantilla`**: botones, filtros,
buscador. Es lo que hace cumplir "Forma de los botones" en el editor; un botón con su
radio fijo, o sin radio, ignora lo que eligió la persona.

Esto reemplaza la regla anterior, en la que el panel se teñía con la plantilla. Lo que se
mantiene: quien compra ve la identidad de la tienda en cada pantalla, y quien trabaja la
reconoce en su sello, dentro de una herramienta que se aprende una sola vez.

**Editorial no quiere decir _landing_.** Un diario también es denso. Lo que cambia entre
una portada y un panel no es la paleta ni la tipografía, es el ritmo:

|               | Portada y tienda          | Paneles                                    |
| ------------- | ------------------------- | ------------------------------------------ |
| Aire vertical | `80px` entre secciones    | `40–48px`; el contenido manda              |
| Titular       | Display, uno por pantalla | El nombre de la tienda o de la persona     |
| Señal         | La acción de conversión   | Solo lo que pide una acción: un pendiente  |
| Barra         | Anclas de navegación      | Navegación persistente, siempre a la vista |

**La señal** es la frambuesa en Venduo; en una tienda, el color de su plantilla —azul en
Pasarela, oro viejo en Esencia—. La regla de usarla poco no cambia con el color. Los
errores también van en la señal, siempre con su mensaje escrito: un error nunca es solo
color.

### El celular es uno solo

**El panel de la web abierto en un celular y la app (`venduo-app`) son la misma
pantalla**: la misma barra de arriba (`BarraLateralMovil`, el cuadro de rayitas), el
mismo menú lateral, las mismas pestañas de abajo (`Pestanas`), la misma cabecera, los
mismos nombres y el mismo orden. Quien vende usa las dos y no tiene por qué aprender dos.

- **Todo cambio a algo que existe en las dos termina en los dos repositorios, en orden:
  primero la web, después la app.** Se construye la web —y se mira en el celular—, la
  persona la aprueba, y recién entonces se pasa a la app tal cual quedó. Así un ajuste
  sobre lo que no convence se hace una vez y no dos. Mientras tanto la app queda como
  estaba; lo que no se hace es dejarla atrás para siempre.
- **Se mira lado a lado antes de darlo por hecho**: el emulador y el navegador a 375 px.
- **La barra de arriba dice dónde estás**, como en la app: en una sección, su nombre con
  el menú al lado; en un detalle, la flecha para volver y el nombre de lo que se mira
  —"Pedido #291"—. Lo general sale de la ruta (`tituloDeRuta`, en
  `components/panel/titulo-de-barra.tsx`); una página que sabe más lo dice con
  `TituloDeLaBarra`. Por eso en el celular la pantalla no repite su titular ni su
  "Volver": `Volver` se esconde solo, y la `Cabecera` va en `max-lg:sr-only`.
- **Lo único distinto es lo que es de una sola plataforma**: los avisos al teléfono y
  "Venduo en la computadora" son de la app; la barra de escritorio, su riel plegado, los
  atajos de teclado y el atajo "Nuevo producto" de la pantalla ancha son de la web.
  Publicar directo en TikTok también es de la web por ahora: en la app se publica en
  TikTok desde la hoja de compartir del teléfono.

### El panel se mira, no se lee

El panel de la web sigue la misma idea que la app (`venduo-app`, "Se mira, no se lee" en
su `AGENTS.md`): quien vende lo abre entre dos mensajes y no va a leer un párrafo.

- **Cada pantalla lleva su titular y una descripción corta, y cada panel un subtítulo
  de una línea.** El titular nombra lo que es de la persona —"Tus pedidos.", "Tus
  catálogos."— y se ve también en el celular, debajo de la barra. La descripción es
  una sola frase corta (`Cabecera`, `bajada`): "Llegan a tu WhatsApp. Márcalos pagados
  y se descuentan del stock." El panel, en pocas palabras, qué conviene saber de él
  (`Seccion`, `bajada`): "Siempre salen con los precios de hoy." Un panel no repite el
  titular de la pantalla —"Los que llegaron", no otra vez "Tus pedidos"—. Nunca dos
  frases largas, nunca repetir el título con otras palabras, nada que explique cómo
  funciona la pantalla. La app lleva los mismos textos.
- **Lo que espera algo es un número grande que se toca** y lleva a la lista ya
  filtrada (las notas de `ParaHoy` en el Resumen). Los números suben al aparecer.
- **Fotos antes que nombres**: un pedido por las fotos de lo que pidieron, un producto
  por la suya, en carruseles que se deslizan en el celular.
- **La tienda se muestra, no se nombra**: en el Resumen, su portada en un celular en 3D
  al lado del nombre. Tocarla abre el editor, y para verla está "Ver tienda". Sin
  captura todavía, va su plantilla vista en un celular (`public/plantillas/celular/`), y
  lo dice.
- **En una pantalla ancha nada queda a medio llenar**: cada escena del Resumen va en dos
  columnas —el titular a la izquierda, lo suyo a la derecha— y en una sola en el
  celular. Los paneles de las demás pantallas se acomodan al lugar que les toca
  (`@container`), no al ancho de la pantalla.
- **Lo que no pide nada no ocupa lugar**: sin ventas no hay "lo más vendido"; sin
  pendientes, "Para hoy" dice "Estás al día" con un visto a mano.
- **Lo de todos los días se hace donde se ve**: cobrar un pedido y reponer stock desde
  el Resumen, con el festejo de la app al cobrar (`useFestejo`).
- **El movimiento del Resumen es el de la portada** (`components/panel/resumen/escena.ts`):
  cada escena se arma al aparecer y vuelve a empezar al salir. En las pantallas de
  trabajo, nada se arma con el scroll y lo que se toca responde con todo: el sello que se
  estampa, el número que salta, la foto que vuela (`DESIGN.md`, "El panel responde a lo
  que se toca"). Sin límite por equipos lentos; todo queda quieto con "Reducir
  movimiento" (`globals.css`).

### Cuándo aparece la barra

**Desde que una persona tiene panel —una tienda con su alta terminada—, toda pantalla de
su cuenta lleva la barra.**

| Pantalla                          | Barra                                     |
| --------------------------------- | ----------------------------------------- |
| `/panel/*`, `/cuenta`             | Siempre                                   |
| `/crear/*` (el alta de la tienda) | No. Con panel, ofrece "Volver a mi panel" |
| `/editor`                         | No: es pantalla completa, con su "Salir"  |
| Lo público: `/`, `/login`, `/t/*` | No                                        |

Quien recién se registró y no tiene nada todavía está en su alta: una barra vacía no le
sirve, y ve el marco del alta (`Marco`) hasta tener algo a qué volver.

**Nadie arma esto a mano.** El armazón con la barra es `ArmazonDelPanel`, en
`components/panel/armazon.tsx`; si la persona tiene panel lo dice `tienePanel()`. Una
pantalla nueva de la cuenta va dentro de `app/(privado)`; nunca un layout propio con otra
cabecera. Una pantalla sin barra tiene que ofrecer siempre una salida visible al panel.

### La barra lateral de los paneles

Las pantallas del panel comparten una barra lateral fija desde `lg` y un cajón por debajo: una columna de 272 px en una pantalla de 375 deja 100 px para trabajar. El
cajón es el `Sheet` de shadcn con `showCloseButton={false}` y `shadow-none` —el suyo mide
28 px y dice "Close"— y un cierre propio de 44 px.

Lo que muestra sale de `lib/data/barra.ts` y es el menú de la app: la persona arriba, la
tarjeta de su tienda con su propia cara, y tres grupos —"Tu negocio" (Inicio, Pedidos,
Productos, Catálogos, Compartir), "Tu tienda" (Estadísticas, Editar tu tienda, Datos de
la tienda) y "Tu cuenta"—, con "Cerrar sesión" al final. La elegida va en tinta llena.
En el celular, abajo, las pestañas de la app (`components/panel/pestanas.tsx`).

Los contadores siguen la regla de la señal: **en la señal solo si pide una acción** —un
pedido que espera que confirmes su pago, un producto sin stock, la tienda sin WhatsApp—;
en tinta si solo informa. El atajo "Nuevo producto", solo en la barra de escritorio, va
con trazo y sin relleno por lo mismo: competiría con el botón principal de cada pantalla.
En el celular, el botón del menú lleva un punto en la señal si adentro hay algo urgente.

### Las pantallas del panel

**Toda pantalla de trabajo se arma con las piezas del cuaderno** (`DESIGN.md`, "Las
pantallas de trabajo"): la cabecera con su titular y una frase resaltada, lo que filtra
como notas pegadas con su número, cada cosa en su tarjeta —de hoja (`bg-hoja`, `#fdfcf9`),
radio de `16–20px`, la sombra del cuaderno— con un título que dice **para qué sirve** ("Los
que llegaron", "Se está acabando"), los pedidos como tickets con su sello, los vacíos con
una nota a mano y una sola acción, y los botones en píldora. Quieta al deslizar; responde
al tocar.

**Todo lo apoyado sobre el papel es de hoja, nunca blanco.** El blanco puro al lado del
papel lo hacía ver amarillento, y una cabecera blanca sobre un cuerpo de papel partía la
tarjeta en dos. Una fila, una celda o una cabecera pegajosa adentro de una tarjeta va en
`bg-hoja` (o sin fondo), no en `bg-papel` ni en `bg-white`.

**Lo que hay que saber de cada pieza del cuaderno:**

- **El titular resalta lo que elige la pantalla**: `Cabecera` con `resaltar="pedidos"`, la
  frase tal cual está en el titular. Sin `resaltar` no se resalta nada: una pantalla de
  detalle, que nombra una cosa, no lleva.
- **El sello del pedido pendiente se toca**: "Por cobrar" es el botón que marca pagado, con
  su pregunta antes. Solo late el pendiente más viejo, y el sello "Pagado" se estampa
  recién cuando la base confirmó.
- **Lo fijo abajo en el celular es una bandeja** (`pieza-bandeja`): flota con margen, radio
  y sombra sobre la lista, nunca una regla de tinta de lado a lado. Desde 1024 px cada
  barra vuelve a sus utilidades. La que va pegada al borde, sin pestañas abajo, suma
  `bandeja-al-borde`.
- **Las rejillas de celdas no tienen hueco**: cada celda lleva `pieza-celda -mr-px -mb-px
border-r border-b border-tinta/10` y la tarjeta recorta las reglas del borde. El hueco
  de un píxel sobre un fondo de tinta dejaba un bloque gris donde faltaba una celda.
- **Mientras carga, la forma de verdad**: `EsqueletoDePantalla` con el titular de la
  pantalla —se sabe antes de que llegue nada— y su `forma` (`pedidos`, `productos`,
  `catalogos`, `publicar`, `rejilla`, `estadisticas`, `formulario`, `detalle`, `lista`);
  los datos que faltan son
  `Hueso`, una píldora de tinta al 7% que late y se queda quieta con Reducir movimiento.
- **Ninguna letra baja de 12 px**, ni la de una marca sobre una foto, ni un contador.

**Las piezas de abajo se visten solas.** Son las mismas en el panel y en `/admin`: adentro
del armazón del panel (`data-registro="cuaderno"`) salen como el cuaderno y afuera, como
el diario. Una caja propia con borde lleva `pieza-tarjeta`, y un buscador o un control
con forma, `pieza-ficha`; sin la clase, queda cuadrada. Cómo está hecho, en `DESIGN.md`,
"Las pantallas de trabajo".

**Nadie arma esto a mano.** Las piezas están en `components/panel/piezas.tsx`:

| Pieza              | Para qué                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Cabecera`         | El titular de la pantalla, su bajada, el aviso de demo y acciones                                                                                      |
| `Volver`           | La vuelta desde una pantalla de detalle                                                                                                                |
| `Seccion`          | El panel. `extra` a la derecha del título, `accion` en el pie. Con `extraEnLinea`, los botones de ícono se quedan en la línea del título en el celular |
| `Cifras` y `Cifra` | Cifras en celdas separadas por una regla, de a dos o de a cuatro                                                                                       |
| `SinDatos`         | El estado vacío dentro de un panel: qué va a aparecer y cómo                                                                                           |
| `Insignia`         | Un estado en versalita: un pedido, un producto oculto                                                                                                  |
| `Miniatura`        | La foto chica de un producto en una fila                                                                                                               |

Y las de las listas, las mismas de la app:

| Pieza                                      | Para qué                                                    |
| ------------------------------------------ | ----------------------------------------------------------- |
| `FichasDeCobro`, `FichasGrandes`           | Números grandes arriba de una lista que la filtran al tocar |
| `FranjaDeFichas`                           | Los filtros de una lista: fichas que se deslizan, en la URL |
| `ListaDePedidos` (`components/pedidos/`)   | Pedidos como tickets; el sello "Por cobrar" marca pagado    |
| `ListaProductos` (`components/productos/`) | Productos con foto, su marca encima y más y menos de stock  |

Y el ritmo, el mismo en todas —en el cuaderno, con tarjetas en vez de paneles—: la
pantalla es una columna de paneles con `gap-6
md:gap-8`. Dentro de un panel, las filas van de lado a lado con una regla arriba
(`border-t border-tinta/15 first:border-t-0`) y su propio margen interior; un
formulario o un texto usan `relleno`. Los filtros son una franja con regla abajo,
dentro del panel que filtran, con las fichas de `lib/estilos.ts`: la elegida en tinta
llena, nunca en la señal.

Los rótulos de una pantalla de trabajo van en tinta, nunca en la señal: ahí la señal es
para lo que pide una acción, y un rótulo en cada sección la gastaba en nombrar cosas. En
las escenas, el rótulo de cada una sí va en la señal, como en la portada. El texto secundario no
baja de tinta al 65% (5,3:1 contra el papel): al 55% no llega al contraste AA.

**Los componentes de `components/ui/` se siguen usando.** Se visten con las clases de
`lib/estilos.ts` en vez de reemplazarse: lo que aportan es el cableado de accesibilidad
de los formularios, que no se regala por una cuestión de color.

### Crear o editar algo: la pantalla por filas

**Una pantalla para crear o editar algo no muestra todos sus campos abiertos.** Así era
el formulario de producto: cinco paneles con título y subtítulo, cada campo con su
rótulo y una frase de ayuda, todo para escribir. Se leía, no se miraba. Ahora es la
pantalla por filas, y es la forma de toda pantalla nueva de este tipo —un producto, una
venta, los datos de la tienda, un catálogo—:

1. **Arriba, lo mínimo para que exista, escrito ahí mismo y grande.** En un producto:
   fotos, nombre y precio. Se pregunta "¿sin qué no se puede guardar?", y eso y nada más.
2. **Todo lo demás es una fila con su valor a la vista**: "Categoría · Ropa", "Oferta ·
   No", "Tallas y colores · S, M, L". La pantalla se vuelve un resumen. Lo vacío
   ("Ninguna", "Sin agregar") va en tinta al 65%; lo cargado, en negrita.
3. **Tocar una fila abre una hoja con ese ajuste solo** (`HojaDeAjuste`): sale de abajo
   en el celular y del costado en una pantalla ancha. La explicación va en la
   descripción de la hoja, nunca como frase permanente bajo un campo.
4. **Lo de todos los días se cambia en la fila**: una cantidad con más y menos
   (`Cantidad`), un sí o no con su interruptor (`Palanca`). Solo se abre una hoja si hay
   algo que elegir o escribir.
5. **Las filas van en dos o tres paneles por para qué sirven**, no por tipo de campo: en
   el producto, "lo de vender" (unidades, tallas, categoría, oferta, costo) y "cómo se
   muestra" (visible, destacado, aviso, descripción).
6. **Se sugiere en vez de preguntar**: la categoría "Ropa" abre las tallas ya en Talla.
   Abrir algo y no completarlo no es un error: se guarda como si no se hubiera abierto.
7. **La acción principal, fija sobre las pestañas en el celular**; con un error, la fila
   que lo tiene se pinta en la señal con su mensaje y un aviso dice "Revisa lo que quedó
   marcado".

Las piezas están en `components/panel/ajustes.tsx` (`Fila`, `Palanca`, `Cantidad`,
`CampoMonto`, `HojaDeAjuste`) y el ejemplo completo es `components/productos/formulario.tsx`.
El procedimiento para armar una —mirar, recortar, investigar, proponer con boceto,
construir y verificar— es la skill `pantalla-por-filas`. La app lleva la misma pantalla.

## Móvil primero, en serio

El usuario real de Venduo vende por TikTok desde el celular y compra desde el celular.
**El diseño arranca en 375 px de ancho** y crece hacia arriba con `sm:`, `md:`, `lg:`.

No es una preferencia estética: una tienda que no se puede usar con el pulgar no sirve
para nada en este producto.

- Objetivos táctiles de **44 px** como mínimo. Los tamaños `sm` de shadcn ya lo cumplen.
- Nada de tablas anchas sin `overflow-x-auto` alrededor.
- Probar cada pantalla angosta antes de darla por hecha.
- **Un grupo de fichas o de botones nunca baja de renglón a su ancho.** Fichas del ancho
  de su texto con `flex-wrap` dejan el segundo renglón con los bordes en otro lugar que
  el primero, y se ve roto. Pasó tres veces —los tipos de talla, las tallas y las
  categorías de Nueva venta—, la última por una excepción que esta regla tenía para
  "fichas de largo muy distinto". **Sin excepciones**, hay dos formas y nada más:
  - **Columnas iguales**: `GRILLA_DE_FICHAS` (`lib/estilos.ts`), que pone tantas
    columnas iguales como entren, con cada ficha `w-full justify-center` y su texto
    `truncate`. Es la de categorías, tallas, colores y tipos. Para fichas de dos o
    tres palabras —"Unidades disponibles"—, `GRILLA_DE_FICHAS_LARGAS`, de columnas
    más anchas y con el texto que baja a un segundo renglón en vez de cortarse.
  - **Una sola fila que se desliza**: la franja de filtros de una lista
    (`FranjaDeFichas`), donde la última asoma cortada a propósito.

  Antes de dar por hecha una pantalla con fichas, buscar `flex-wrap` en lo que se tocó.
  `flex-wrap` sí vale para lo que no es un grupo de botones: textos sueltos, enlaces de
  un pie, las fotos de un producto.

## Tailwind v4

La configuración vive en `app/globals.css`, no en un `tailwind.config`. Los colores se
usan **siempre por su token** —`bg-papel`, `text-tinta`, `text-senal`, `border-tinta/15`—
y nunca con un valor fijo: un `#1d1c1a` escrito a mano es un color que ya no responde a
`DESIGN.md`.

Las jerarquías intermedias son **tinta con opacidad**, no grises nuevos: `opacity-70`
para texto secundario, `opacity-55` para detalle, `border-tinta/15` para una divisoria.

Clases condicionales siempre con `cn()` de `lib/utils`, que resuelve los conflictos de
Tailwind. Nunca concatenar strings de clases a mano.

## shadcn/ui

Los componentes de `components/ui/` **se generan**: no se editan a mano. Si falta uno:

```bash
npx shadcn@latest add <componente>
```

Para composición, envolverlos o usar `asChild` en lugar de modificar el archivo generado.

## Formularios

El patrón del proyecto es `react-hook-form` con `zodResolver`, usando los componentes
`Form*` de shadcn. El esquema zod es la única fuente de las reglas de validación: no
duplicarlas en el JSX.

Cuando un formulario tiene dos modos con reglas distintas —como registro e ingreso— los
dos esquemas deben **declarar los mismos campos** y cambiar solo las reglas. Con formas
distintas el resolver no puede alternar entre ellos y TypeScript lo rechaza.

Para confirmar algo que no se deshace —cancelar un pedido, borrar— se usa
`useConfirmacion` (`components/panel/confirmar.tsx`), nunca `window.confirm`: el
navegador lo dibuja a su manera, a veces en inglés, y no se lee con el resto.

Los errores se muestran con `toast` de `sonner`, traducidos al español. Nunca volcar el
mensaje crudo de Supabase: decir qué pasó en términos del usuario.

## Textos

**Español neutro boliviano, tratando de "tú":** "Ingresa", "Escribe tu contraseña", "¿No
tienes cuenta?". Funciona en todo el país, en el altiplano y en el oriente.

**Nada de voseo rioplatense.** "Ingresá", "Escribí", "tenés" son argentinos: le hablan a
un boliviano con acento extranjero, y un jurado local lo nota.

**Se lee como una app, no como una charla.** El "tú" se queda; lo que no va es el habla
de pasillo: frases que en una conversación se entienden y en una pantalla suenan raras o
extranjeras. Cada rótulo dice qué es o qué pasa, con la palabra de siempre:

| No                                       | Sí                                                    |
| ---------------------------------------- | ----------------------------------------------------- |
| "Se nota en la computadora"              | "Solo cambia en computadora"                          |
| "Ahí se nota", "Mírala arriba"           | "Cambiamos a la vista…", "Puedes verla…"              |
| "Tirar los cambios"                      | "Descartar los cambios"                               |
| "Sale del catálogo"                      | "Se quita del catálogo"                               |
| "Dale tu estilo"                         | "Personaliza tu tienda"                               |
| "Al pie de la ficha", "Parecidos"        | "Debajo del producto", "Similares"                    |
| "Bajada", "Llamado a la acción"          | "Subtítulo", "Cierre con botón"                       |
| "Acá", "se manda", "la señal"            | "Aquí", "se enviará", "la conexión"                   |
| "Soltar", "sacar" en un error            | Lo que la persona hacía: "borrar", "guardar"          |
| "Elegir los 14 que se ven"               | "Seleccionar todos", "Quitar todos"                   |
| "Te respondemos al toque"                | "Te respondemos enseguida"                            |
| "Márcalo igual", "Cerrar sesión igual"   | "Márcalo como pagado", "Cerrar sesión de todos modos" |
| "Todo cae en un grupo"                   | "Todo queda en un grupo"                              |
| "Renombrar una arrastra a sus productos" | "Si le cambias el nombre, cambia en sus productos"    |
| "Con un toque", "si algo no te sale"     | "Y si necesitas ayuda…"                               |
| "Lo achicamos", "mira todo"              | "Ajustamos el tamaño por ti", "ve todo el catálogo"   |

Un interruptor dice qué aparece y su estado en palabras llanas. Un error nombra lo que la
persona estaba haciendo, no el paso interno que falló. Vale también para lo que la API
le manda a la app —los nombres y las ayudas de los ajustes y de las secciones—, que la
app muestra tal cual. Lo que lee quien compra en la tienda puede ser más cercano: es la
voz de la tienda, no la de Venduo.

### Quién habla en cada texto

Antes de escribir un texto se decide quién lo dice. Hay una voz por texto:

- **Venduo habla en primera persona del plural**: "No pudimos guardar", "Te avisamos",
  "Elegimos 4 productos". Nunca "no pude", "encontré", "armé". Vale para la IA: la
  instrucción de sistema de `lib/ai/tasks.ts` lo pide, y el modo demo lo cumple.
- **La tienda le habla a quien compra como dueña de su negocio**, también en plural:
  "Envíanos tu pedido", "Ahí coordinamos el pago", "Estamos de vacaciones". Nunca en
  tercera persona —"coordinas el pago con la tienda", "la tienda no recibe pedidos"—:
  suena a que la tienda es de otro. Solo Venduo habla de la tienda desde afuera, cuando
  no está disponible: "Esta tienda ya no está disponible".
- **Las cosas no hablan, y no se les habla.** El stock, el panel o la plataforma no
  "dicen", "avisan" ni "saludan": "Según tu stock, quedan 3", "Te avisamos antes de que
  algo se acabe". Y un botón no le pide a la persona que le hable a sus datos: "Ver
  estadísticas", no "Pregúntales más a tus estadísticas".
- **Las personas, sin género fijo**: "quien te compra", "quienes te compran", "Te damos
  la bienvenida". No "un cliente", "tus compradores", "el dueño", "bienvenido",
  "como vendedor".
- **Ningún texto de relleno llega a quien compra.** Lo que nace con una sección, una
  semilla de `template_pages` o una plantilla se publica como si lo hubiera escrito la
  tienda: nunca "Escribe acá…", "Cuenta aquí…", un testimonio, un horario o una
  historia inventados. Eso va como pista gris del campo (`ejemplo` en
  `lib/plantillas/secciones.ts`), y la sección nace vacía.

### Cada pantalla, con su nombre de hoy

Un texto que manda a otro lugar usa el nombre exacto de la barra lateral de la web y del
menú de la app: Inicio, Pedidos, Productos, Categorías, Catálogos, Publicar en redes,
Compartir, Estadísticas, Editar tu tienda, Datos de la tienda, Tus datos, Avisos. Un botón
citado entre «» se copia del botón real, letra por letra.

**Al renombrar una pantalla o un botón, se buscan sus menciones en la web y en la app**
(`grep -rn "Apariencia"` en los dos repositorios). Pasó dos veces: "Apariencia" y
"Cuenta" cambiaron de nombre y siguieron citadas en textos que mandaban a una pantalla
que ya no existía.

### Lo que se repite, de una sola forma

- **Reintentar**: "Inténtalo de nuevo." Después de otro verbo, con "e": "Revisa tu
  conexión e inténtalo de nuevo." No "Vuelve a intentar", "Prueba de nuevo", "Intenta de
  nuevo".
- **Un número lleva su singular**: "1 cambio", "1 producto". Ningún `${n} cambios` sin
  mirar si `n` es 1.
- **Las citas van entre «»**, no entre comillas rectas ni curvas.

Preferir **"correo"** sobre "email", que es la palabra que usa la gente.

Los mensajes de error dicen qué hacer, no qué falló internamente:

```
"Correo o contraseña incorrectos."         sí
"AuthApiError: invalid_credentials"        no
```

Lo mismo aplica a los textos que **genera la IA**: la instrucción de sistema en
`lib/ai/tasks.ts` fija el registro para todo lo que el modelo devuelva.

### Cómo le hablamos al cliente

Nuestro cliente **ya vende por TikTok, Instagram, Facebook o WhatsApp**: ropa,
zapatillas, maquillaje, perfumes, accesorios, tecnología, regalos. No se levanta
pensando "necesito una página web"; se levanta respondiendo "¿precio?" por mensaje. Por
eso Venduo es **más que una tienda online**: la tienda se nombra, pero siempre con lo
que hay detrás —el stock, los pedidos por WhatsApp, las estadísticas, los catálogos—.

| Sí                                                      | No                                                        |
| ------------------------------------------------------- | --------------------------------------------------------- |
| "Tu tienda online, tu inventario y tus ventas"          | "Crea tu página web"                                      |
| "Tu tienda online, con stock y pedidos incluidos"       | "Tu tienda online en minutos", a secas                    |
| "Compártelo en tus redes", "mándalo por WhatsApp"       | "Tu sitio", "tu dominio", "tu e-commerce"                 |
| "Tu negocio" para el panel: stock, pedidos, ventas      | "Dashboard", "backoffice"                                 |
| Ejemplos de redes: Rosa Deportes, Bella Piel, Tecno Sur | Comida casera: cuñapés, panaderías, cafés                 |
| Los dolores en su idioma: "vendí algo que ya no tenía"  | Promesas genéricas: "lleva tu negocio al siguiente nivel" |

Nunca se borra la palabra "tienda": lo que se evita es que parezca que eso es todo.

## Dinero y fechas

Siempre por `lib/format.ts`:

```ts
formatMoney(850000) // "Bs 8.500"
formatNumber(1234)
formatDate(fecha)
```

Nunca dividir por 100 en el JSX ni armar el símbolo de moneda a mano. Si `formatMoney` no
alcanza para un caso, se extiende ahí y no en el componente.

## Imágenes

Siempre por `next/image`, nunca `<img>` suelto: sin eso no hay redimensionado ni
formatos modernos, y el público está en datos móviles.

**Pedir el original grande y dejar que Next lo reduzca.** El error fácil es pedirle a la
fuente una versión ya achicada —`?w=400`— y que Next la vuelva a procesar: son dos
compresiones sobre un original chico, y en una pantalla densa se ve pixelado.

```tsx
src="https://…/foto.jpg?w=2000&q=85"   // fuente grande
sizes="(max-width: 640px) 100vw, 500px" // lo que mide en pantalla
quality={90}
```

`sizes` tiene que decir **cuánto mide el elemento en pantalla**, no cuánto pesa el
archivo. Si miente, Next elige mal la variante: de más desperdicia datos, de menos se ve
borroso.

Las fotos de terceros solo de bancos de uso libre, y **verificar que la URL resuelva**
antes de darla por buena.

## Estados vacíos y de carga

Toda lista tiene tres estados y los tres se escriben: con datos, vacía y cargando. Una
tienda recién creada, un catálogo sin productos y un panel sin pedidos son **el estado
normal** durante la demostración, no un caso raro.

Para cargas usar `Skeleton` de shadcn, con la forma aproximada del contenido real.

El estado vacío dice qué hacer a continuación, no solo que no hay nada.

## Modo demo

Cuando `createClient()` devuelve `null` la interfaz muestra datos de ejemplo de
`lib/demo-data.ts`. Ese camino tiene que verse **bien**, no roto: es lo que ve alguien que
clona el repositorio y corre `npm run dev` sin configurar nada, y es el respaldo si
Supabase falla durante la demostración.

Cuando la pantalla está en modo demo hay que decirlo, como hace `config-status.tsx`.

## Skills de diseño de terceros

El proyecto tiene instaladas skills externas de animación y diseño. **Esta regla se carga
siempre; ellas se cargan a demanda.** Cuando se contradigan, gana lo que está acá.

| Skill                      | Cuándo invocarla                                                    |
| -------------------------- | ------------------------------------------------------------------- |
| `design-taste-frontend-v1` | Diseñar una pantalla nueva: jerarquía, espaciado, tipografía        |
| `impeccable`               | Revisar lo ya construido: `/impeccable audit`, `/impeccable polish` |
| `animate`                  | Agregar una animación concreta                                      |
| `review-animations`        | Criticar una animación existente                                    |
| `ask-sonner`               | Dudas sobre los avisos, que ya usan Sonner                          |

### Qué gana cuando hay conflicto

Estas skills vienen de afuera y no conocen las restricciones de Venduo. **Lo de acá es
restricción, lo de ellas es oficio dentro de esa restricción.**

No negociable, aunque una skill proponga lo contrario:

- **shadcn/ui como base.** Se compone y se envuelve; no se reemplaza por componentes a
  medida. Media hora ganada en originalidad es media hora perdida en consistencia.
- **Tokens semánticos de color**, nunca valores fijos: si no, el tema oscuro se rompe.
- **375 px primero.** Una propuesta que solo funciona en pantalla ancha se rechaza.
- **Español neutro boliviano con "tú"** en todo texto de interfaz.
- **`formatMoney`** para todo monto.
- **Sonner** para los avisos. No instalar otra biblioteca de notificaciones.

Lo que sí conviene tomar de ellas: ritmo de espaciado, escala tipográfica, jerarquía
visual, curvas y duraciones de animación, y qué **no** animar.

Y una más, que ya está resuelta: **el mundo visual ya está elegido y documentado en
`DESIGN.md`**, y el de cada plantilla en `lib/plantillas`. Una skill de diseño no los
vuelve a abrir. Se usa para ejecutar mejor dentro de ellos; una paleta o tipografía nueva
es una plantilla nueva, con su contraste medido, no un ajuste de pantalla.

### Gráficos

Se dibujan **a mano en SVG**, sin biblioteca: el público está en datos móviles y este
mundo no tiene sombras, ni contenedores redondeados, ni una segunda paleta que una
biblioteca de gráficos da por supuesta.

**Toda serie va en tinta, una sola por gráfico; la señal, solo en la barra o el punto que se
está mirando.** No es solo por la regla del
acento único: el validador de la skill `dataviz` mostró que un ramp de un solo tono no
separa categorías ni con visión normal —ΔE 7,0 entre adyacentes—, así que la identidad
**nunca** puede venir del color.

De ahí se sigue lo demás:

- **No hay tortas ni anillos.** Una pregunta de composición va a **barras ordenadas con
  etiqueta directa**: la identidad la da el nombre y la posición.
- El eje **siempre arranca en cero**. Un eje truncado exagera la variación.
- Rejilla horizontal y recesiva (tinta al 12%), trazo de 2 px, extremos redondeados de
  4 px anclados a la base, y marcador solo en el punto activo y el último.
- Los ejes usan el monto abreviado de `lib/format.ts`; el valor completo va en el
  tooltip, que es donde alguien lo lee.
- Rotular el primero y el último del eje, no los treinta.
- El SVG lleva **`viewBox` y `max-w-full`** además del ancho medido. No es
  redundante: el navegador descarta notificaciones del observador de tamaño
  cuando sospecha un bucle —pasaba dos de cada tres veces al angostar la
  ventana—, y sin ese tope el gráfico se quedaba con el ancho de escritorio
  desbordando la pantalla. Con la medida al día escala 1:1 y no cambia nada.

#### El informe en PDF

El tablero se exporta con **`@react-pdf/renderer`**, y el documento vive en
`lib/insights/documento.tsx`. Es la única dependencia que se agregó fuera de lo
que ya estaba: el PDF tiene que ser un archivo de verdad, que se abra en su
pestaña y se pueda guardar y mandar por WhatsApp, y eso no lo da imprimir la
pantalla.

Se genera **en el servidor**, en `app/(privado)/panel/estadisticas/pdf/route.ts`,
y esa decisión no es de comodidad: la biblioteca y las cuatro tipografías juntas
pesan más que varias pantallas, y el público está en datos móviles. Así lo único
que viaja al teléfono es el PDF. La ruta además hereda la sesión, así que RLS
sigue puesta y el informe no ve nada que no vea el panel.

`?g={id}` limita el informe a un gráfico: es la descarga individual, y usa el
mismo documento con otro rótulo.

Cuatro cosas que hay que respetar si se toca:

1. **Las fuentes se leen del disco, de `public/fuentes`, nunca de una URL.** Un
   corte de red en mitad de una demostración devolvería un documento con otra
   letra. Son Archivo 700/800 y Geist 400/600, las mismas de la pantalla.
2. **Los `<Text>` dentro de un `<Svg>` no heredan la familia de la página.** Si
   se olvida el `fontFamily`, esos rótulos salen en Helvetica y se nota.
3. **Un bloque no se parte entre hojas** (`wrap={false}`): media gráfica arriba
   y media abajo no se lee. La única excepción es la tabla, que puede ser más
   larga que una página.
4. **Los colores son los de `globals.css`, copiados como constantes.** El PDF no
   ve las variables CSS: si la paleta cambia allá, hay que cambiarla acá.

El documento lleva marco a 20pt del filo, cabecera con la marca y el nombre de
la tienda, y pie con la marca, la fecha y el número de página. Marco, cabecera y
pie van `fixed`, así que se repiten en todas las hojas.

#### El catálogo en PDF

Los catálogos de `/panel/catalogos` son otra cosa que el informe: se dibujan
**dos veces con las mismas variantes**, en HTML para la vista previa y en
`@react-pdf` para el archivo, y llevan la identidad de la tienda, no la de
Venduo. Las variantes se escriben contra las piezas de
`components/catalogos/primitivas.ts`, sin hooks y sin `flexShrink: 0`.

Lo que no se negocia, porque cada punto rompió un PDF de verdad:

- **Toda hoja va en una caja absoluta de su medida.** `wrap={false}` hace la
  página del alto de su contenido.
- **Lo que no entra en su caja no se dibuja**, ni el primer renglón. Se mide
  antes (`tamanoQueEntra`, `tamanoDeTitular`) o se achica la letra.
- **Los titulares se achican hasta que entre su palabra más larga**: el PDF no
  parte palabras, y la vista previa tampoco.
- **Las fotos van a JPEG con `sharp`**: el PDF no lee WebP. Sus binarios los
  nombra `binariosDeSharp()`, porque el rastreo de Turbopack no los ve y en
  Vercel la ruta daba 500.

Los controles del editor van en el mundo de Venduo y solo las hojas llevan el de
la tienda, como en el editor de la tienda. Todo el sistema, con el porqué de
cada regla, está en `docs/catalogos-pdf.md`.

### Iconos

Se dibujan, desde `lucide-react`, con un grosor y tamaño consistentes. **Nunca un glifo de
texto ni un emoji haciendo de icono** — un `+` o una `↓` escritos como carácter heredan la
métrica de la tipografía y no alinean con nada.

### Móvil y escritorio, en ese orden

Al generar una vista, resolver **primero los 375 px** y después dejarla crecer. No al
revés: una vista pensada en escritorio y comprimida después produce pantallas donde todo
entra pero nada se lee.

Los puntos de control son **375 px** y **1280 px**. Entre medio, que el layout fluya con
`flex-wrap` y `grid` en lugar de saltos por cada tamaño intermedio.

Tres cosas que hay que verificar en las dos anchuras antes de dar una vista por hecha: que
no haya desplazamiento horizontal, que ningún objetivo táctil baje de 44 px, y que el
contenido tenga un ancho máximo en escritorio — una línea de texto de 1280 px no se lee.

### Dónde vale la pena el esfuerzo

En 48 horas el diseño no se reparte parejo:

| Superficie               | Criterio                                                                      |
| ------------------------ | ----------------------------------------------------------------------------- |
| Tienda pública y carrito | **Acá sí.** Es lo que ve un comprador desde el celular y lo que ve un jurado  |
| Panel (`/panel`)         | El mismo mundo, con menos aire. Sirve para trabajar, y trabajar también se ve |

Para animación, los tres lugares donde cambia la percepción del producto: aplicar una
propuesta de la IA en el editor de bloques, el carrito, y los avisos.

**Animar de menos es mejor que animar de más.** Una animación que se interpone entre la
persona y lo que quiere hacer es peor que ninguna.
