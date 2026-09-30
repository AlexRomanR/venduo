# Interfaz

## El sistema visual vive en DESIGN.md

**`DESIGN.md` en la raíz es la fuente del mundo visual**: paleta con sus valores, escala
tipográfica, ritmo de espaciado, pesos de regla, patrones de componente y gramática de
movimiento. Se derivó de la portada ya construida, no de intenciones, y es lo que hereda
cada superficie nueva.

Leerlo antes de diseñar una pantalla. Esta regla cubre lo que no se negocia; `DESIGN.md`
cubre cómo se ve.

### El mundo de Venduo y el de cada tienda

**Venduo usa el mundo editorial de `DESIGN.md`**: papel, tinta y un rojo de señal. Portada,
ingreso, altas, vitrinas del vendedor y su perfil público.

**Una tienda usa el de su plantilla**, y su dueño también, en su panel. La plantilla
redefine los mismos tokens —`papel`, `tinta`, `senal`, `font-titular`, el radio— y trae su
propio kit de componentes para la tienda pública. Cómo funciona, y cómo se agrega una, está
en `docs/store-templates.md`.

Tres reglas que se desprenden:

- **Nunca preguntar por la plantilla en un componente.** Ni `if (plantilla === …)` ni
  clases por clave. Lo que cambia entre plantillas vive en su kit
  (`components/plantillas/{clave}`) o en sus tokens (`lib/plantillas/{clave}.ts`).
- **Lo compartido se escribe con tokens y queda bien en todas**: carrito, checkout, pago,
  filtros, y todas las pantallas del panel. Un `#16171a` o un `rounded-sm` fijos ya no
  responden a la plantilla: usar `text-tinta` y `rounded-plantilla`.
- **El panel cambia la piel, no la estructura.** Las pantallas de trabajo son las mismas
  en todas las plantillas.

**El editor de la tienda (`/editor`) es la excepción que confirma la regla:** sus
controles van en el mundo de Venduo y solo la vista previa lleva la identidad de la
tienda. Si los controles tomaran los colores del borrador, cambiarían bajo el dedo de
quien está eligiendo un color.

**Todo lo que se toca en una plantilla usa `rounded-plantilla`**: botones, filtros,
buscador. Es lo que hace cumplir "Forma de los botones" en el editor; un botón con su
radio fijo, o sin radio, ignora lo que eligió la persona.

Esto reemplaza la regla anterior de "un solo mundo", que a su vez había reemplazado la de
"dos mundos". Lo que se mantiene de las dos: quien trabaja y quien compra en la misma
tienda ven la misma identidad, sin costuras entre pantallas.

**Editorial no quiere decir _landing_.** Un diario también es denso. Lo que cambia entre
una portada y un panel no es la paleta ni la tipografía, es el ritmo:

|               | Portada y tienda          | Paneles                                    |
| ------------- | ------------------------- | ------------------------------------------ |
| Aire vertical | `80px` entre secciones    | `40–48px`; el contenido manda              |
| Titular       | Display, uno por pantalla | El nombre de la tienda o de la persona     |
| Señal         | La acción de conversión   | Solo lo que pide una acción: un pendiente  |
| Barra         | Anclas de navegación      | Navegación persistente, siempre a la vista |

"Rojo" en esta regla quiere decir **la señal**: en Venduo es rojo, en Pasarela azul y en
Esencia oro viejo. La regla de usarla poco no cambia con el color.

### La barra lateral de los paneles

`/panel`, `/vendedor` y `/cuenta` comparten una barra lateral fija desde `lg` y un cajón
por debajo: una columna de 272 px en una pantalla de 375 deja 100 px para trabajar. El
cajón es el `Sheet` de shadcn con `showCloseButton={false}` y `shadow-none` —el suyo mide
28 px y dice "Close"— y un cierre propio de 44 px.

Las secciones las deciden los datos (`lib/data/barra.ts`), no `primary_role`: quien tiene
tienda ve "Tu tienda", quien vende para otras ve "Como vendedor", y quien hace las dos
ve las dos.

Los contadores siguen la regla del rojo: **rojo solo si pide una acción** —un pedido que
ya trajo comprobante, un producto sin stock, una solicitud de vendedor—; en tinta si solo
informa. El atajo "Nuevo producto" va con trazo y no relleno rojo por lo mismo: vive en
todas las pantallas y competiría con el botón principal de cada una. En el móvil, el botón
del menú lleva un punto rojo si adentro hay algo urgente.

**Los componentes de `components/ui/` se siguen usando.** Se visten con las clases de
`lib/estilos.ts` en vez de reemplazarse: lo que aportan es el cableado de accesibilidad
de los formularios, que no se regala por una cuestión de color.

## Móvil primero, en serio

El usuario real de Venduo vende por TikTok desde el celular y compra desde el celular.
**El diseño arranca en 375 px de ancho** y crece hacia arriba con `sm:`, `md:`, `lg:`.

No es una preferencia estética: una tienda que no se puede usar con el pulgar no sirve
para nada en este producto.

- Objetivos táctiles de **44 px** como mínimo. Los tamaños `sm` de shadcn ya lo cumplen.
- Nada de tablas anchas sin `overflow-x-auto` alrededor.
- Probar cada pantalla angosta antes de darla por hecha.

## Tailwind v4

La configuración vive en `app/globals.css`, no en un `tailwind.config`. Los colores se
usan **siempre por su token** —`bg-papel`, `text-tinta`, `text-senal`, `border-tinta/15`—
y nunca con un valor fijo: un `#16171a` escrito a mano es un color que ya no responde a
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

Los errores se muestran con `toast` de `sonner`, traducidos al español. Nunca volcar el
mensaje crudo de Supabase: decir qué pasó en términos del usuario.

## Textos

**Español neutro boliviano, tratando de "tú":** "Ingresa", "Escribe tu contraseña", "¿No
tienes cuenta?". Funciona en todo el país, en el altiplano y en el oriente.

**Nada de voseo rioplatense.** "Ingresá", "Escribí", "tenés" son argentinos: le hablan a
un boliviano con acento extranjero, y un jurado local lo nota.

Preferir **"correo"** sobre "email", que es la palabra que usa la gente.

Los mensajes de error dicen qué hacer, no qué falló internamente:

```
"Correo o contraseña incorrectos."         sí
"AuthApiError: invalid_credentials"        no
```

Lo mismo aplica a los textos que **genera la IA**: la instrucción de sistema en
`lib/ai/tasks.ts` fija el registro para todo lo que el modelo devuelva.

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
tienda recién creada, un vendedor sin ventas y un panel sin pedidos son **el estado
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

**Toda serie va en el rojo de señal, una sola por gráfico.** No es solo por la regla del
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

| Superficie                           | Criterio                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| Tienda pública y perfil del vendedor | **Acá sí.** Es lo que ve un comprador desde el celular y lo que ve un jurado   |
| Paneles (`/panel`, `/vendedor`)      | El mismo mundo, con menos aire. Sirven para trabajar, y trabajar también se ve |

Para animación, los tres lugares donde cambia la percepción del producto: aplicar una
propuesta de la IA en el editor de bloques, el carrito, y los avisos.

**Animar de menos es mejor que animar de más.** Una animación que se interpone entre la
persona y lo que quiere hacer es peor que ninguna.
