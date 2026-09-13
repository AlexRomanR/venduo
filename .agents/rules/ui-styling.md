# Interfaz

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

**Todo en español rioplatense**, que es el registro del resto del producto: "Ingresá",
"Escribí tu contraseña", "¿No tenés cuenta?".

Los mensajes de error dicen qué hacer, no qué falló internamente:

```
"Email o contraseña incorrectos."          sí
"AuthApiError: invalid_credentials"        no
```

## Dinero y fechas

Siempre por `lib/format.ts`:

```ts
formatMoney(850000) // "Bs 8.500"
formatNumber(1234)
formatDate(fecha)
```

Nunca dividir por 100 en el JSX ni armar el símbolo de moneda a mano. Si `formatMoney` no
alcanza para un caso, se extiende ahí y no en el componente.

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
- **Español rioplatense** en todo texto de interfaz.
- **`formatMoney`** para todo monto.
- **Sonner** para los avisos. No instalar otra biblioteca de notificaciones.

Lo que sí conviene tomar de ellas: ritmo de espaciado, escala tipográfica, jerarquía
visual, curvas y duraciones de animación, y qué **no** animar.

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
