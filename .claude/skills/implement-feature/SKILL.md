---
name: implement-feature
description: >-
  Use this skill when implementing a new feature in Venduo end-to-end, from
  database schema and backend logic to UI components, Server Actions, and
  verification.
---

# Implementar una feature de punta a punta

El orden importa: de la base hacia arriba. Empezar por la interfaz obliga a rehacerla
cuando el esquema no da lo que se supuso.

---

## Paso 0 — Antes de escribir nada

1. **¿Está dentro de alcance?** `VENDUO.md` §7 tiene la lista de lo que no se construye:
   multi-tienda por usuario, gestión de envíos, cobro de suscripción, notificaciones por
   correo, app nativa y tests automatizados. Si la tarea pide algo de ahí, frenar y
   preguntar.
2. **¿Ya existe?** Buscar en `lib/` antes de escribir. Formato de moneda, slugs, QR,
   clientes de Supabase y validación ya están resueltos.
3. **¿Qué rol la usa?** Emprendedor en `/panel`, vendedor en `/vendedor`, o pública en
   `/t/{slug}` y `/v/{slug}`. Eso decide dónde vive y qué política RLS la cubre.

---

## Paso 1 — Base de datos

Si hace falta tabla o columna nueva, seguir la skill `database-migration`. En resumen:
migración con marca de tiempo, SQL idempotente, RLS en su propio archivo, `store_id` en
toda tabla de negocio, `deleted_at` salvo en `orders`, `order_items` y `commissions`.

```bash
npx supabase db push
npm run db:types
```

Regenerar los tipos **siempre** después de aplicar. Si no, TypeScript sigue creyendo en el
esquema viejo y el error aparece recién en ejecución.

---

## Paso 2 — Tipos

`types/database.ts` es generado: no se toca. Los alias van en `types/index.ts`:

```ts
export type Pedido = Tables<"orders">
```

Importar desde `@/types`, nunca desde `@/types/database`.

---

## Paso 3 — Capa de datos

Las lecturas van en `lib/data/`. El patrón del proyecto:

```ts
export async function getPedidos(): Promise<PedidosResult> {
  const supabase = await createClient()
  if (!supabase) return demo // modo demo: sin credenciales

  // La tienda del dueño, con memoria por pedido: la barra y la página la
  // comparten. Sin sesión o sin tienda, null.
  const tienda = await getMiTienda()
  if (!tienda) return demo

  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", tienda.id)
    .order("created_at", { ascending: false })

  return { pedidos: data ?? [], isDemo: false }
}
```

Lo que se repite en todas:

- **El `null` del cliente es el modo demo**, no un caso imposible.
- **`.is("deleted_at", null)`** en toda tabla que lo tenga.
- **La sesión sale de `getUsuario()` y la tienda de `getMiTienda()`**, nunca de
  `supabase.auth.getUser()`, que es un viaje a Supabase cada vez.
- **Lo que no depende de otra consulta va en el mismo `Promise.all`.** Cada consulta en
  fila es un viaje más que la pantalla espera. Todo esto está en `performance.md`.

Las escrituras sensibles no van acá: el checkout pasa por `create_order`, el alta de
vendedor por `join_store`. Ver la skill `sales-and-commissions`.

---

## Paso 4 — Interfaz

La página es un componente de servidor que llama a la capa de datos y pasa los datos
abajo. `"use client"` solo donde hay interactividad, y lo más abajo posible del árbol.

Formularios con `react-hook-form` y `zodResolver`, con el esquema en `lib/validation/`
compartido entre el formulario y lo que lo procesa.

Escribir los tres estados: con datos, vacío y cargando. Una tienda recién creada y un
vendedor sin ventas son el estado normal durante la demostración.

**Una pantalla del panel se arma con las piezas de `components/panel/piezas.tsx`**:
`Cabecera` arriba y una columna de `Seccion`, cada una con su ícono, un título que dice
para qué sirve y su estado vacío con `SinDatos`. Nada de cifras o listas sueltas bajo un
rótulo: el porqué está en `ui-styling.md`, "Las pantallas del panel".

**Una sección nueva del panel lleva su `loading.tsx`**, con `EsqueletoDePantalla` de
`components/panel/esqueleto.tsx`: sin él, mientras carga se ve el esqueleto del Resumen.
Si la barra lateral la enlaza, el enlace lleva `prefetch`.

Montos siempre por `formatMoney`. Textos en español neutro boliviano, tratando de "tú".
Arrancar el diseño en 375 px.

**Decidir si la pantalla lleva la barra lateral**, con la tabla de `ui-styling.md`
("Cuándo aparece la barra"). Una pantalla de la cuenta va dentro de `app/(privado)` o se
envuelve en `MarcoDeCuenta`; si la barra enlaza a ella, tiene que mostrarla. Una pantalla
sin barra ofrece una salida visible al panel.

---

## Paso 5 — Verificar

```bash
npm run check
```

Y además, a mano: correr el flujo en el navegador, mirarlo angosto, y probarlo en modo
demo. La skill `qa-verification` tiene la lista completa.

---

## Errores que ya nos pasaron

| Error                                  | Qué produce                                            |
| -------------------------------------- | ------------------------------------------------------ |
| Insertar en `orders` desde el cliente  | Falla en silencio: no hay política de INSERT           |
| Olvidar `.is("deleted_at", null)`      | Aparecen filas borradas en la tienda pública           |
| Recalcular la comisión al mostrarla    | Reescribe el historial cuando la tienda cambia su tasa |
| Editar `types/database.ts` a mano      | El próximo `db:types` lo borra                         |
| Dividir por 100 en el JSX              | Rompe cuando la moneda cambie de formato               |
| Usar `primary_role` para permitir algo | Los permisos los decide RLS, no el perfil              |
