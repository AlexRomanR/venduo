# Base de datos y aislamiento

El modelo de datos completo está en `VENDUO.md` §8. Esta regla cubre cómo se escribe
contra él sin romperlo.

## Dinero

**Centavos enteros. Puntos básicos enteros. Nunca punto flotante.**

| Concepto | Columna          | Ejemplo                 |
| -------- | ---------------- | ----------------------- |
| Precio   | `price_cents`    | `8500` son Bs 85        |
| Comisión | `commission_bps` | `1500` es 15%           |
| Cálculo  | —                | `(monto * bps) / 10000` |

La moneda es el boliviano y es **constante del sistema**: no hay columna de moneda en
ninguna tabla. Para mostrar montos se usa `formatMoney` de `lib/format.ts`, que ya conoce
`CURRENCY` y `LOCALE`. Nunca dividir por 100 a mano en la interfaz.

## Borrado lógico

**Nada se borra físicamente en la operación normal.** Las tablas de negocio llevan
`deleted_at` y toda consulta filtra por él:

```ts
.is("deleted_at", null)
```

Tres cosas que se olvidan y rompen:

1. **Los índices únicos son parciales** (`where deleted_at is null`). Si se declara un
   único común, una fila dada de baja bloquea para siempre reutilizar ese slug o código.
2. **El filtro va también en la política RLS**, no solo en la consulta. Si vive únicamente
   en la capa de datos, la próxima consulta que alguien escriba se olvida de ponerlo.
3. **Tres tablas no llevan `deleted_at`:** `orders`, `order_items` y `commissions`. Un
   pedido se cancela cambiando su estado; una comisión se anula. Nunca se borran.

El borrado físico existe en un solo flujo: la purga de una tienda que venció su prueba,
a los 90 días del bloqueo.

## Row Level Security

Cada tabla de negocio lleva `store_id`, **incluso donde podría deducirse** — por ejemplo
`store_blocks`, que ya pertenece a una página que pertenece a una tienda. Esa redundancia
es deliberada: permite que cada política sea una comparación sobre una sola tabla.

### Auxiliares

Usar siempre estos, nunca subconsultas `exists` escritas a mano:

| Función                      | Devuelve                                         |
| ---------------------------- | ------------------------------------------------ |
| `public.my_store_id()`       | La tienda del usuario. **Un uuid, no una lista** |
| `public.my_seller_ids()`     | `uuid[]` con sus vínculos activos como vendedor  |
| `public.store_is_live(uuid)` | Si la tienda se sirve al público                 |

```sql
-- El dueño ve lo suyo
using (store_id = public.my_store_id())

-- El vendedor ve lo suyo, en todas las tiendas donde trabaja
using (seller_id = any (public.my_seller_ids()))
```

### Dos trampas

**Recursión.** Una política sobre `store_sellers` que consulte `store_sellers` cuelga la
consulta. Por eso los auxiliares son `security definer`: saltan la política.

**Rendimiento.** Envolver siempre la identidad como subconsulta, para que Postgres la
evalúe una vez por consulta y no una vez por fila:

```sql
using (seller_user_id = (select auth.uid()))   -- sí
using (seller_user_id = auth.uid())            -- no
```

## El checkout no es una inserción del cliente

**`orders` no tiene política de INSERT, a propósito.** Un comprador anónimo que pudiera
insertar ahí declararía el total que quisiera.

El pedido se crea llamando a la función del servidor:

```ts
const { data: orderId, error } = await supabase.rpc("create_order", {
  p_store_id: storeId,
  p_buyer_name: nombre,
  p_buyer_phone: telefono, // obligatorio: es el canal de entrega
  p_buyer_email: email ?? null,
  p_referral_code: codigo ?? null,
  p_items: [{ product_id: id, quantity: 2 }],
})
```

Esa función recalcula cada precio desde el catálogo, valida el stock, resuelve el código
de referido comprobando que pertenezca a **esa** tienda y esté activo, congela la comisión
y descuenta stock. Nada de eso puede quedar en manos del cliente.

**Si alguna vez escribís `supabase.from("orders").insert(...)`, está mal.** Lo mismo para
`commissions`: las crea un disparador cuando el pedido pasa a `pagado`.

Las otras funciones del servidor son `join_store(p_store_slug)` y
`apply_template(p_store_id, p_template_key)`.

## Migraciones

Van en `supabase/migrations/` con **marca de tiempo** en el nombre:
`20260913090100_base.sql`. Ese formato es el que la CLI usa para rastrear qué aplicó.

```bash
npx supabase db push      # aplica las pendientes
npm run db:types          # regenera types/database.ts
```

Nunca editar una migración ya aplicada: no se vuelve a ejecutar. Los cambios van en una
migración nueva.

Escribir SQL **idempotente**: `create table if not exists`, `drop policy if exists` antes
de cada `create policy`. Así el archivo se puede volver a correr sin romper nada.

Las políticas RLS van juntas en su propio archivo, para poder auditarlas de una lectura.

## Tablas sin políticas

`social_connections` tiene RLS activo y **cero políticas**, a propósito: guarda tokens de
Meta y solo se accede con la clave de servicio. No agregarle políticas.
