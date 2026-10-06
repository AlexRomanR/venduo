# Base de datos y aislamiento

El modelo de datos completo está en `VENDUO.md` §8. Esta regla cubre cómo se escribe
contra él sin romperlo.

## Dinero

**Centavos enteros. Puntos básicos enteros. Nunca punto flotante.**

| Concepto   | Columna       | Ejemplo                 |
| ---------- | ------------- | ----------------------- |
| Precio     | `price_cents` | `8500` son Bs 85        |
| Porcentaje | `*_bps`       | `1500` es 15%           |
| Cálculo    | —             | `(monto * bps) / 10000` |

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
3. **Dos tablas no llevan `deleted_at`:** `orders` y `order_items`. Un pedido se cancela
   cambiando su estado. Nunca se borra.

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
| `public.store_is_live(uuid)` | Si la tienda se sirve al público                 |

```sql
-- El dueño ve lo suyo
using (store_id = public.my_store_id())

```

### Dos trampas

**Recursión.** Una política sobre una tabla que consulte esa misma tabla cuelga la
consulta. Por eso los auxiliares son `security definer`: saltan la política.

**Rendimiento.** Envolver siempre la identidad como subconsulta, para que Postgres la
evalúe una vez por consulta y no una vez por fila:

```sql
using (owner_id = (select auth.uid()))   -- sí
using (owner_id = auth.uid())            -- no
```

## El pedido no es una inserción del cliente

**`orders` no tiene política de INSERT, a propósito.** Un comprador anónimo que pudiera
insertar ahí declararía el total que quisiera.

El pedido se crea llamando a la función del servidor:

```ts
const { data, error } = await supabase.rpc("create_order", {
  p_store_id: storeId,
  p_items: [{ product_id: id, quantity: 2 }],
})
// data: { id, numero, total_cents, whatsapp, items: [{ nombre, cantidad, ... }] }
```

Esa función recalcula cada precio desde el catálogo, comprueba que haya stock y que la
tienda tenga WhatsApp, y devuelve con qué armar el mensaje. **No pide datos de quien
compra y no descuenta stock**: eso pasa al marcarlo pagado. Lo que devuelve llega como
`Json` y se valida con zod antes de usarlo.

**Si alguna vez escribes `supabase.from("orders").insert(...)`, está mal.** Y el stock
no se toca desde la aplicación: lo mueve el disparador `handle_order_status_change` al
cambiar de estado. Qué hace en cada caso está en `domain-venduo.md`.

Las otras funciones del servidor son `apply_template(p_store_id, p_template_key)`,
`change_store_template(p_template_key, p_keep_sections)`,
`publicar_diseno(p_theme_overrides, p_logo_url, p_bloques)`, `restaurar_version(p_version_id)`,
`create_store(p_name, p_description, p_template_key, p_whatsapp)` y la del catálogo
compartido, `catalogo_compartido(p_token)`.

**`run_insight_sql` es la única que ejecuta SQL que no escribió una persona.** Es la
excepción a todo lo demás y se sostiene en tres cosas que impone Postgres: corre con
`security invoker` —RLS activa—, en una transacción de **solo lectura** que rechaza
cualquier escritura, y solo contra las vistas `mis_*`, que ya están acotadas a
`my_store_id()` y donde `store_id` ni siquiera aparece. Está explicado en `ai-layer.md`.

**La tienda tampoco se inserta desde el cliente.** `create_store` exige el WhatsApp
de la tienda —sin él no puede recibir pedidos— y resuelve tres cosas que no se pueden
repartir: el slug único —comprobarlo desde el navegador es
una carrera perdida, y ese slug es el que se imprime en el QR—, la suscripción de
prueba —que no tiene política de INSERT a propósito, así que la tienda nacería sin
ella— y la siembra de la plantilla. En llamadas separadas, que falle la segunda
deja una tienda a medio crear.

## Los catálogos en PDF

`catalogs` guarda la configuración de cada catálogo y **nunca precios ni
stock**: se leen cada vez que se arma el PDF. Es del dueño —leer, crear y editar
con `my_store_id()`— y no tiene política de DELETE: se da de baja con
`deleted_at`. Por eso la de UPDATE lleva su `with check` propio: sin él,
Postgres usaría el `using`, que pide `deleted_at is null`, y rechazaría la baja.

El enlace compartido lo abre cualquiera, sin cuenta, por
`catalogo_compartido(p_token)`: `security definer`, un catálogo por su token y
solo si `store_is_live`. No se abre la tabla con una política para anónimos:
expondría los catálogos de todas las tiendas.

## Columnas derivadas: las mantiene la base

`products` tiene dos columnas que **son copias** y no se escriben desde la
aplicación. Las pone el disparador `producto_derivados` en cada insert y update:

| Columna     | Sale de       | Por qué existe la copia                                     |
| ----------- | ------------- | ----------------------------------------------------------- |
| `image_url` | `images[1]`   | La portada. Los bloques de la tienda pública la leen        |
| `category`  | `category_id` | Los bloques filtran por nombre y las vistas `mis_*` lo leen |

**No escribirlas en un insert ni en un update.** La fuente son `images` y
`category_id`; el disparador también refresca `updated_at`. Renombrar una
categoría arrastra la copia a sus productos, y eso lo hace
`categoria_renombrada` sobre `product_categories`.

`product_categories` es por tienda, con único parcial sobre
`(store_id, lower(name))`: "Poleras" y "poleras" son la misma, y una categoría
dada de baja no bloquea su nombre para siempre. Borrarla no borra productos —
`category_id` es `on delete set null`— y quedan sin categoría, visibles y a la
venta.

## La apariencia de una tienda

`stores.theme_overrides` guarda **solo lo que la tienda cambia** respecto de la base de su
plantilla; `{}` es la plantilla tal cual. La base vive en código, así que nunca copiar
tokens a esta columna "para tenerlos a mano": sería una copia que se desactualiza.

**Se valida al leer**, con `personalizacionSchema`. Termina dentro de una etiqueta `<style>`
en la tienda pública: un valor que no sea un token cerrado es una inyección.

**Cambiar de plantilla es `change_store_template`**, no un `update` de `template_key`. La
función guarda antes un punto de restauración en `store_design_versions`, que no tiene
políticas de escritura a propósito: una versión editable desde el cliente dejaría de ser
un respaldo. Las dos auxiliares, `capture_design_version` y `seed_template_pages`, no
comprueban dueño y por eso no se exponen: tienen `revoke` para `anon` y `authenticated`.

Las páginas que siembra una plantilla nacen **`publicada`**: en borrador, la política de
lectura se las escondía al comprador anónimo mientras el dueño sí las veía.

**Lo que arma el editor se publica con `publicar_diseno`**, no con `update` sueltos sobre
`stores` y `store_blocks`: la función guarda antes una versión y escribe apariencia, logo
y secciones en una sola transacción. La validación fina la hace zod en el servidor; la
función impone dueño, tipos de bloque activos, el máximo de cada tipo y que el logo sea
de la carpeta de esa tienda. `restaurar_version` es la vuelta, y también guarda antes.
`portada_de_tienda` es interna, como `capture_design_version`.

Las imágenes de la tienda van al bucket **`store-assets`**, no a `product-images`: cada
tienda escribe y lista solo su carpeta —`{store_id}/…`— y el bucket rechaza lo que no sea
JPG, PNG o WebP o pase de 5 MB. SVG no: puede traer código.

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

`social_connections` tiene RLS activo y **cero políticas**, a propósito. No agregarle.

`social_connections` guarda los tokens de las conexiones de la tienda —Meta y Canva— y solo
se accede con la clave de servicio. El de Canva llega además cifrado por la aplicación
(`lib/canva.ts`): leer la fila no da acceso a la cuenta de nadie.
