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
