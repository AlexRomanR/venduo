# Reglas de negocio

La especificación completa está en `VENDUO.md`. Acá van las que, si se ignoran, producen
código que parece correcto y no lo es.

## Una tienda por emprendedor

> Un emprendedor tiene **una sola tienda**.

Está impuesto en la base con un índice único parcial sobre `owner_id`. Por eso
`my_store_id()` devuelve un identificador y no una lista, y por eso toda consulta del
panel es una comparación directa.

**Multi-tienda por usuario está fuera de alcance.** No escribir código que lo anticipe.

## Cuentas

**Correo y contraseña, sin verificación.** Quien se registra entra al instante. No hay
enlace mágico ni ingreso con Google: el proveedor no está habilitado.

**Hay un solo tipo de cuenta: la de quien tiene una tienda.** El registro no pregunta
rol; toda cuenta nueva va a `/crear`. Los permisos derivan de los datos: sos dueño si
tenés una fila viva en `stores`, y eso lo decide RLS.

## El pedido sale por WhatsApp

**Quien compra no deja datos.** Ve su carrito, el total y un botón: "Enviar pedido por
WhatsApp". Su nombre y su teléfono ya van en el chat; pedirlos era un formulario más
entre la decisión y la compra.

Al tocar el botón:

1. **`create_order(p_store_id, p_items)`** crea el pedido en el servidor: recalcula cada
   precio desde el catálogo, comprueba el stock y devuelve el número, las líneas, el
   total y el WhatsApp de la tienda. No guarda nada de quien compra.
2. El mensaje se arma **con lo que devolvió el servidor**, no con el carrito del
   navegador (`mensajeDePedido` en `lib/pedidos.ts`), y se abre `wa.me` con el número de
   la tienda (`enlaceDeWhatsApp`, que le pone el 591 a un celular de 8 cifras).
3. El carrito se vacía y queda un aviso con el número del pedido y un enlace para volver
   a abrir el chat, por si el navegador no lo abrió o la persona vuelve atrás.

**WhatsApp se abre en una pestaña nueva**, y la tienda queda con el aviso del pedido.
La pestaña se abre vacía en el toque y recibe el enlace cuando responde el servidor:
abrirla después de esperar no sirve, porque el navegador ya no lo considera un toque y
la bloquea. Si no se pudo abrir, se navega en la misma.

### El WhatsApp de la tienda es obligatorio

Es a donde llega cada pedido. `create_store` lo exige en el alta (`/crear/negocio`) y
`/cuenta` no deja borrarlo. Se guardan **solo las cifras**.

No hay `not null` en la columna, a propósito: las tiendas creadas antes pueden no
tenerlo, y una restricción haría fallar cualquier cambio que se les haga. Por eso:

- `create_order` rechaza el pedido de una tienda sin número.
- El carrito no ofrece el botón y dice que la tienda todavía no recibe pedidos.
- El Resumen del panel lo pide primero, antes incluso que publicar.

Todo enlace a WhatsApp pasa por **`numeroDeWhatsApp`**: un `wa.me/70123456` sin el 591
abre un chat con nadie.

### Los estados del pedido

| Estado      | Qué significa                                     | El stock                 |
| ----------- | ------------------------------------------------- | ------------------------ |
| `pendiente` | Se mandó por WhatsApp; la tienda todavía no cobró | No se toca               |
| `pagado`    | La tienda cobró en el chat y lo marcó             | **Se descuenta**         |
| `cancelado` | No se concretó                                    | Vuelve, si estaba pagado |

**El stock baja al pagar, no al pedir.** Un pedido sin datos cuesta un toque y muchos
carritos se mandan y no se concretan. Si bajara al tocar el botón, cualquiera podría
vaciar una tienda tocándolo en bucle. El pedido solo **comprueba** que haya stock.

Todo lo que se sigue de un cambio de estado lo hace el disparador
**`handle_order_status_change`**: descuenta el stock al pagar —y rechaza el cambio si
ya no alcanza—, lo devuelve al cancelar un pagado, fecha el pago, y no deja que un
cancelado reviva ni que un pagado vuelva a pendiente. **Nunca duplicarlo desde la
aplicación**: ajustar `products.stock` a mano daría stock inventado el día que alguien
cambie dos veces de estado.

**Los pedidos que no se concretan no se cancelan solos.** Un pendiente con más de siete
días (`DIAS_PARA_CONCRETAR` en `lib/pedidos.ts`) queda **no concretado**: sale de "Por
cobrar" y de los contadores rojos, y se encuentra en su propio filtro. No se escribe
nada en la base: se decide al leer, con `noSeConcreto` en la lista y
`limiteParaConcretar` en los conteos. Y se puede marcar pagado igual, porque cancelarlo
lo dejaría bloqueado para el comprador que paga el día ocho.

**El número de pedido es de cada tienda**: el siguiente es el último de esa tienda
más uno, lo calcula `create_order` bajo un candado por tienda. Era una secuencia
global, y el primer pedido de una tienda nueva llegaba como "#261".

**El mismo carrito no crea dos pedidos.** Si quien compra vuelve atrás desde WhatsApp
y manda lo mismo en la siguiente media hora, el carrito reabre el chat del pedido que
ya existe (`components/tienda/checkout.tsx`).

**Una venta es un pedido pagado.** El panel, el tablero y las estadísticas cuentan solo
`pagado`: un pendiente puede ser un carrito que nunca se mandó.

`buyer_name` y `buyer_phone` siguen en `orders`, opcionales: los pedidos anteriores a la
compra por WhatsApp los guardan, y para esos el panel ofrece abrir el chat. Los nuevos
llegan vacíos.

## El carrito vive en el navegador

Por tienda, en `localStorage`. En la base obligaría a identificar a alguien que nunca da
ningún dato. Lo que el carrito diga de los montos es solo para mostrar: `create_order`
recalcula cada precio desde el catálogo.

## El catálogo

Las categorías son **una tabla por tienda**, `product_categories`, y no texto
suelto en cada producto. Antes lo eran, y dos productos de la misma categoría
podían escribirla distinto sin que nadie se enterara.

`products.category` sigue existiendo, pero es **una copia derivada** de
`category_id` que mantiene la base: los bloques de la tienda pública guardan un
nombre de categoría en sus propiedades y filtran por texto. Está explicado en
`database-rls.md`.

Un producto lleva además las fotos en `images` —la primera es la portada—, un
código interno opcional, el umbral de aviso de stock y si va destacado. La foto
que ve la vitrina sale siempre de `image_url`, que es la portada derivada.

## Segunda mano

No es una sección aparte ni un tipo de bloque propio: es un **filtro del catálogo**. Lo
que define la condición es `products.condition` (`nuevo`, `segunda_mano`,
`reacondicionado`), que elige el emprendedor al cargar el producto.

`compare_at_price_cents` es el precio anterior y es lo que produce el descuento destacado.

## Lo que NO se construye

Esta lista es tan importante como la de lo que sí. Si una tarea pide algo de acá,
detenerse y preguntar antes de escribir código:

- **Multi-tienda por usuario**
- **Red de vendedores, comisiones y códigos de referido** — la tienda vende sola
- **Gestión de envíos** — ni couriers ni seguimiento ni marcas de enviado o recibido: la
  entrega se acuerda por WhatsApp
- **Cobrar dentro de la plataforma** — ni pasarela, ni custodia, ni QR de pago, ni
  comprobantes: el pago se acuerda por WhatsApp y la tienda lo marca en su panel
- **Pedirle datos a quien compra** — van en el chat
- **Cobro de la suscripción** — se modela el estado, no el cobro
- **Notificaciones por email**
- **Aplicación móvil nativa** — la tienda es responsive y con eso alcanza
- **Tests automatizados**

## Los catálogos en PDF

- **Se leen los precios y el stock del momento**, cada vez que se arma el PDF.
  Un catálogo guardado o un enlace reenviado nunca muestran un precio viejo.
- **El precio de un pack se muestra en el catálogo y nada más.** La tienda
  online cobra cada producto por separado; quien quiere el pack escribe por
  WhatsApp. Venderlo como pack toca `create_order`: se decide antes de
  escribirlo.
- Un producto borrado desaparece del catálogo; uno sin stock sale "Agotado".

## La suscripción

Cada tienda tiene una, que nace en prueba. Al vencer, el estado pasa a `bloqueada`: la
tienda pública deja de servirse y el panel queda en solo lectura con una única acción
habilitada, exportar los datos en CSV. A los 90 días del bloqueo se purgan.

`store_is_live()` ya combina publicación y suscripción vigente. Usarla en vez de
comprobar `is_published` suelto.
