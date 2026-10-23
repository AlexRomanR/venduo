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

**La venta directa tampoco se inserta: es `registrar_venta(p_items)`**, solo para
autenticados. Toma la tienda de `my_store_id()`, acepta un precio por línea —lo que se
cobró de verdad— y deja el pedido pagado en la misma transacción, para que el stock lo
mueva el disparador de siempre. Lleva `origen = 'directa'`.

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

**La baja de un catálogo es `dar_de_baja_catalogo`, no un UPDATE.** Postgres rechaza
el UPDATE que deja la fila invisible para quien la cambia, y la política de lectura pide
`deleted_at is null`: poner `deleted_at` desde el cliente falla siempre con "new row
violates row-level security policy". Lo mismo con los gráficos del tablero
(`insights`), que se quitan con `quitar_grafico`. Una tabla nueva con borrado lógico y
el filtro en su lectura necesita su función de baja.

El enlace compartido lo abre cualquiera, sin cuenta, por
`catalogo_compartido(p_token)`: `security definer`, un catálogo por su token y
solo si `store_is_live`. No se abre la tabla con una política para anónimos:
expondría los catálogos de todas las tiendas.

## Las variantes

`product_variants` tiene una sola política, de lectura: quien compra lee las de un
producto que también puede ver —activo, sin moderar, en una tienda que se sirve— y el
dueño lee las suyas. **No tiene políticas de escritura**: se
escriben con `guardar_variantes(p_producto, p_opciones, p_variantes)`, que valida cada
combinación contra las opciones, arma su nombre, deja solo fotos que son del producto y
hace todo en una transacción, y con `ajustar_stock_de_variante(p_variante, p_stock)`.

| Disparador                 | Qué hace                                                     |
| -------------------------- | ------------------------------------------------------------ |
| `variante_de_producto`     | Pone la tienda de la variante desde su producto              |
| `sumar_stock_de_variantes` | Lleva `products.stock` a la suma de sus variantes vivas      |
| `stock_de_producto`        | Rechaza cambiar a mano el stock de un producto con variantes |

`sumar_stock_de_variantes` marca la transacción con `venduo.stock_de_variantes` para que
`stock_de_producto` lo deje pasar. Sin variantes vivas, el producto vuelve a llevar su
propio stock, el que sumaban.

`create_order`, `registrar_venta` y `handle_order_status_change` saben de variantes: el
pedido de un producto con variantes la exige, el precio es el suyo si tiene, y al cobrar
o cancelar se mueve el stock de la variante. Las vistas de la IA suman `variante` a
`mis_items` y una vista `mis_variantes`; `product_variants` está en la lista de tablas que
`run_insight_sql` no deja nombrar.

## El costo de los productos

`product_costs` guarda lo que cada producto le cuesta a la tienda, **aparte de
`products`**, porque `products` lo lee cualquiera que mire una tienda publicada: una
columna de costo ahí se la mostraría a quien compra. Lee y escribe solo el dueño, con
`store_id = my_store_id()`; la tienda de cada fila la pone el disparador
`costo_de_producto` desde el producto, así nadie cuelga un costo de un producto ajeno.
No tiene política de DELETE: quitar un costo es dejarlo en null.

`handle_order_status_change` copia el costo a `order_items.unit_cost_cents` al pasar a
pagado. Las vistas de la IA lo exponen —`cost_cents` en `mis_productos`,
`unit_cost_cents` y `ganancia_cents` en `mis_items`—, y `product_costs` está en la lista
de tablas que `run_insight_sql` no deja nombrar.

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

## La administración

`/admin` lee y escribe con la clave de servicio, así que sus tablas **no tienen
políticas** —`platform_admins`, `admin_audit_log`, `platform_settings`,
`store_notes`, `invitations`, `ai_requests`, `visit_salts`, `store_visits`— o solo una
de lectura acotada. La puerta es `exigirAdmin()` (`lib/admin.ts`), y ninguna pantalla
ni acción del administrador usa `createAdminClient()` sin pasar antes por ella. Toda
escritura deja su fila en `admin_audit_log` con `registrarCambio`.

| Función                              | Qué hace                                                   | La llama         |
| ------------------------------------ | ---------------------------------------------------------- | ---------------- |
| `is_platform_admin()`                | Si la sesión es de un administrador                        | Autenticados     |
| `funcion_de_tienda(store, clave)`    | El estado de una función: la tienda manda sobre lo general | Solo servidor    |
| `funciones_de_mi_tienda()`           | Todas las de la tienda de la sesión, en un jsonb           | Autenticados     |
| `funcion_activa(clave)`              | Para políticas y vistas: si está activa en mi tienda       | Autenticados     |
| `estado_del_registro()`              | Abierto, cerrado o con invitación                          | Anónimos también |
| `registrar_visita(...)`              | Anota una visita y su resumen diario                       | Solo servidor    |
| `admin_resumen()`, `admin_tiendas()` | Las cifras del panel del administrador                     | Solo servidor    |

**Las visitas del emprendedor se cortan en la política**, no en la pantalla:
`store_visits_daily` se lee con `store_id = my_store_id()` **y**
`funcion_activa('visitas')`. Lo mismo `mis_visitas`, la vista de la IA.

**El registro lo hace cumplir `handle_new_user`**: con el registro cerrado, o con
invitación y un código que no sirve, levanta un error y Auth no crea la cuenta. El
formulario lo lee del mensaje genérico que devuelve Auth.

## Los avisos de la app

La app móvil recibe avisos —pedido nuevo, cobros pendientes, stock bajo— y **los manda
la base**, no un servidor: el hecho que los dispara ocurre acá.

| Qué                               | Cuándo                                                         |
| --------------------------------- | -------------------------------------------------------------- |
| `on_order_created_notify`         | Al confirmarse un pedido nuevo. Diferido: lee el total final   |
| `on_product_stock_low_notify`     | Cuando una venta deja un producto agotado o bajo su umbral     |
| `enviar_recordatorios()` (`cron`) | A las 9:00 de Bolivia, si hay pedidos de más de 12 h sin pagar |

Los tres pasan por `enviar_aviso`, que arma el mensaje para cada celular de la persona y
lo manda a Expo con `pg_net`, **después de confirmada la transacción y sin esperar la
respuesta**. Todo va dentro de un bloque que atrapa cualquier error: un aviso que no sale
no puede hacer fallar la compra de nadie. Al tocar `create_order` o
`handle_order_status_change`, esa garantía no se rompe.

- **`push_tokens` no se escribe desde la app.** Registrar y olvidar un celular son
  `registrar_dispositivo` y `olvidar_dispositivo`: el mismo celular puede pasar de una
  cuenta a otra, y esa fila es de otra persona.
- **El aviso de stock solo sale cuando lo movió una venta.** Lo sabe por la marca
  `venduo.por_venta`, que pone `handle_order_status_change` al cobrar: la profundidad de
  disparadores ya no lo distingue, porque con variantes una corrección a mano también
  llega anidada. Si la persona cambió el número a mano, ya lo sabe. Una variante que se
  agota avisa sola ("Se agotó Polera · M"); el producto con variantes avisa cuando el
  total cruza su umbral.
- `notification_preferences` es una fila por persona. Sin fila, quiere todos los avisos.

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

## Probar una función o una política

Con pgTAP, en `supabase/tests/*.test.sql`, sobre la base local que Docker arma desde las
migraciones. Una función, un disparador o una política nueva o cambiada lleva su test
(`code-quality.md`), y se corre antes de `db push`:

```bash
npm run test:db   # rearma la base local y corre los tests
```

- **Siempre `--local`, nunca `--linked`.** Esta máquina tiene el CLI enlazado a
  producción: `supabase db reset --linked` la borraría entera. Los scripts llevan
  `--local` escrito a propósito.
- Cada archivo empieza con `begin;` y termina con `rollback;`: no deja nada.
- Las tiendas se crean como las crea la aplicación: un usuario en `auth.users` y
  `create_store` con su identidad. Para actuar como alguien:
  `set local role authenticated;` y
  `set local request.jwt.claims = '{"sub":"<uuid>","role":"authenticated"}';`. Quien
  compra es `anon`; `reset role` vuelve a ver todo.
- Una migración que cambia una función se prueba así: primero el test contra la función
  vieja —tiene que fallar—, después `npx supabase migration up --local` y el test en
  verde.

## La vista de la tienda

`stores.vista_url` es una captura real de la portada en el celular, para el Inicio de la
app y el Resumen en el celular; `stores.vista_escritorio_url`, la misma portada en una
computadora (1280 × 800), para el Resumen en una pantalla ancha. Se sacan juntas. **Cuándo
quedó vieja lo decide la base**: `vista_cambio_at` lo mueven disparadores sobre `stores`,
`store_blocks`, `store_pages` y `products` cada vez que cambia algo que se ve —el stock,
solo al agotarse o volver—. Si es más nueva que `vista_at`, hace falta otra. La captura la
saca la web (`lib/vista.ts`) con la clave de servicio; `vista_pedida_at` es el candado
para no sacar dos a la vez. Un cambio nuevo que se vea en la portada —una columna, una
tabla— se suma a esos disparadores, o la app muestra una vista vieja.

## Las cuentas dadas de baja

`stores.closed_at` y `profiles.closed_at` marcan una cuenta dada de baja: **una tienda
con `closed_at` no es de nadie** —`my_store_id()` la excluye— **ni se sirve** —
`store_is_live` tampoco—. Una función o una consulta nueva que busque "la tienda de la
persona" pasa por `my_store_id()`, o tiene que filtrar `closed_at is null` ella misma.

`account_closures` anota cada baja y cuándo se borra; no tiene políticas, como las
tablas de la administración. `dar_de_baja_mi_cuenta()` la llama la persona;
`aplicar_bajas_de_cuenta()` es interna y la corre `pg_cron` todos los días. El detalle
de negocio está en `domain-venduo.md`.

## Tablas sin políticas

`social_connections` tiene RLS activo y **cero políticas**, a propósito. No agregarle.
Lo mismo las tablas de la administración (arriba): se leen con la clave de servicio,
detrás de `exigirAdmin()`.

`social_connections` guarda los tokens de las conexiones de la tienda —Meta, Canva y
TikTok— y solo se accede con la clave de servicio. Los de Canva y TikTok llegan además
cifrados por la aplicación (`lib/canva.ts`, `lib/cifrado.ts`): leer la fila no da acceso
a la cuenta de nadie.
