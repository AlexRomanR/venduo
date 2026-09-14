# Interfaz

## El sistema visual vive en DESIGN.md

**`DESIGN.md` en la raíz es la fuente del mundo visual**: paleta con sus valores, escala
tipográfica, ritmo de espaciado, pesos de regla, patrones de componente y gramática de
movimiento. Se derivó de la portada ya construida, no de intenciones, y es lo que hereda
cada superficie nueva.

Leerlo antes de diseñar una pantalla. Esta regla cubre lo que no se negocia; `DESIGN.md`
cubre cómo se ve.

### Dos mundos, a propósito

| Superficie                                              | Sistema                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| Portada, tienda pública `/t/{slug}`, perfil `/v/{slug}` | El mundo editorial de `DESIGN.md`: papel, tinta y un rojo de señal |
| Paneles `/panel` y `/vendedor`                          | Los tokens de shadcn sin tocar                                     |

No es descuido: en 48 horas el diseño se gasta donde lo ve un comprador y un jurado. Los
paneles sirven para trabajar, no para impresionar. **No mezclar los dos sistemas en una
misma pantalla.**

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
usan por sus variables semánticas —`bg-background`, `text-muted-foreground`,
`border-primary`— y no con valores fijos, para que el tema claro y oscuro funcionen solos.

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
`DESIGN.md`.** Una skill de diseño no lo vuelve a abrir. Se usa para ejecutar mejor dentro
de él, nunca para proponer otra paleta o tipografía.

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

| Superficie                           | Criterio                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| Tienda pública y perfil del vendedor | **Acá sí.** Es lo que ve un comprador desde el celular y lo que ve un jurado     |
| Paneles (`/panel`, `/vendedor`)      | shadcn por defecto, rápido y aburrido. Sirven para trabajar, no para impresionar |

Para animación, los tres lugares donde cambia la percepción del producto: aplicar una
propuesta de la IA en el editor de bloques, el carrito, y los avisos.

**Animar de menos es mejor que animar de más.** Una animación que se interpone entre la
persona y lo que quiere hacer es peor que ninguna.
