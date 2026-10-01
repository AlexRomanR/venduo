# Reglas de negocio

La especificación completa está en `VENDUO.md`. Acá van las que, si se ignoran, producen
código que parece correcto y no lo es.

## La asimetría que define el modelo

> Un emprendedor tiene **una sola tienda**. Un vendedor pertenece a **varias**.

Lo primero está impuesto en la base con un índice único parcial sobre `owner_id`. Por eso
`my_store_id()` devuelve un identificador y no una lista, y por eso las consultas del
emprendedor son una comparación directa.

Lo segundo es donde vive toda la dificultad real: `store_sellers` y `commissions` cruzan
tenants por naturaleza. Cualquier consulta del panel del vendedor abarca varias tiendas.

**Multi-tienda por usuario está fuera de alcance.** No escribir código que lo anticipe.

## Comisiones: el congelamiento

El punto más fácil de hacer mal de todo el sistema.

- **La tasa se congela al momento de la venta.** Queda copiada en `orders.commission_bps`
  y en `commissions.rate_bps`. Cambiar el porcentaje de la tienda después no reescribe la
  historia: quien vendió con 15% cobra 15%, aunque hoy la tienda pague 10%.
- `commission_bps` vive en **`stores`**, no en el vínculo del vendedor.
- **Una comisión por pedido**, garantizado por índice único sobre `order_id`. Sin eso, un
  pedido que va y vuelve entre estados genera comisiones duplicadas.
- Ciclo: `pendiente` → `confirmada` → `pagada`, más `anulada`, **atado a la custodia del
  pago** (ver abajo). Un pedido cancelado **anula** la comisión; nunca la borra.
- La crea un disparador cuando el pedido pasa a `pagado`. **No insertarla desde código.**

### El estado del pedido mueve la comisión

El pago lo cobra **PagoFácil y lo retiene** hasta que el pedido llega; recién ahí se
libera y se reparte. El modelo completo está en `VENDUO.md` §5. La comisión sigue a esa
custodia:

| El pedido pasa a | Qué pasó con el dinero                    | La comisión      |
| ---------------- | ----------------------------------------- | ---------------- |
| `pagado`         | PagoFácil lo cobró y lo retiene           | Nace `pendiente` |
| `enviado`        | Sigue retenido                            | `pendiente`      |
| `entregado`      | Se ordena liberarlo                       | `confirmada`     |
| —                | PagoFácil confirmó la transferencia       | `pagada`         |
| `en_disputa`     | Congelado mientras Venduo revisa          | `pendiente`      |
| `cancelado`      | Devuelto al comprador, si llegó a pagarse | `anulada`        |

Todo lo que se sigue de un cambio de estado lo hace el disparador
`handle_order_status_change`, y cancelar además **devuelve el stock** al catálogo. Nunca
duplicarlo desde la aplicación: escribir en `commissions` o ajustar `products.stock` a mano
daría comisiones dobles y stock inventado el día que alguien cambie dos veces de estado.

**Una comisión `pendiente` no es trabajo hecho.** El pago puede terminar devuelto, así que
el historial laboral y lo que el vendedor ve como ganado cuentan solo `confirmada` y
`pagada`.

> **Hoy el disparador no sigue esta tabla.** Crea la comisión directamente `confirmada` al
> pasar a `pagado`, porque se escribió para el flujo provisorio sin custodia. Al construir
> la pasarela hay que cambiarlo para que nazca `pendiente` y se confirme en `entregado`, y
> sumar el estado `en_disputa` al enum.

## El historial laboral del vendedor

Es la promesa central de la plataforma y está sostenida por dos decisiones del esquema
que **no se tocan**:

- `commissions.store_id` es **anulable, no cascada**.
- `commissions.store_name` guarda **una copia** del nombre de la tienda.

Cuando se purga una tienda que no se suscribió, la comisión sobrevive con el nombre del
comercio y el historial del vendedor queda intacto. Si eso fuera cascada, el día que un
emprendedor abandona la plataforma se borraría el antecedente laboral de todos sus
vendedores — exactamente lo que la plataforma promete no hacer.

`seller_profiles` vive **fuera de toda tienda** por la misma razón.

## Cuentas y roles

**Correo y contraseña, sin verificación.** Quien se registra entra al instante. No hay
enlace mágico ni ingreso con Google: el proveedor no está habilitado.

Al registrarse se elige `primary_role`: `emprendedor` o `vendedor`. Se guarda en
`profiles` y el disparador de alta lo lee de los metadatos del usuario.

**`primary_role` NO es un permiso.** Es una intención, para saber a dónde llevar a una
cuenta recién creada. Los permisos derivan de los datos:

| Sos…     | Si…                                        |
| -------- | ------------------------------------------ |
| Dueño    | Tenés una fila viva en `stores`            |
| Vendedor | Tenés un vínculo activo en `store_sellers` |

Una misma persona puede ser las dos cosas. Nunca escribir una condición del estilo
`if (profile.primary_role === "vendedor")` para decidir si alguien **puede** algo; eso lo
decide RLS. Sirve solo para elegir qué pantalla mostrar primero.

## Alta de vendedores

La decide la tienda, no quien se suma: `stores.seller_join_mode` es `abierta` (entra
`activo` al instante) o `con_aprobacion` (entra `pendiente`). Eso lo resuelve
`join_store()`; no replicar la lógica en el cliente.

### Dos caminos, un solo vínculo

Un vendedor llega de dos maneras y hay que tener clara la diferencia:

| Camino                | Qué habilita               | Función                    | Espera aprobación        |
| --------------------- | -------------------------- | -------------------------- | ------------------------ |
| Sumarse a la tienda   | El catálogo completo       | `join_store`               | Según `seller_join_mode` |
| Entrar por invitación | El catálogo completo       | `join_store` con el código | **No**                   |
| Tomar un producto     | Ese producto de la vitrina | `take_product`             | **No**                   |

### El código de referido se propaga, no se valida en la tienda

Quien compra es **anónimo**, y `store_sellers` solo se lee `to authenticated`. Así que la
tienda pública no puede comprobar si un código existe.

De ahí dos reglas:

1. **El código viaja tal como vino** por toda la tienda —de la portada al producto—
   después de una limpieza de forma. Propagar solo el código ya resuelto parecía más
   prudente y era justo lo contrario: para un comprador real nunca resolvía, así que el
   referido se perdía al primer clic y con él la comisión del vendedor.
2. **El árbitro es `create_order`.** Vuelve a resolver el código contra esa tienda antes
   de congelar la comisión. Un código inventado se ignora ahí y la venta queda sin
   vendedor, que es lo correcto.

El cartel de "te trajo Ana" es otra cosa: solo se muestra, y sale de `referido_publico`,
una función `security definer` que confirma que el código pertenece a un vínculo activo
de esa tienda y devuelve el nombre público del vendedor. Que falle no cambia a quién se
le paga.

### La invitación no es el enlace de la tienda

`venduo.../t/{slug}` es **público**: está impreso en el código QR y se manda por
WhatsApp a cualquiera. Si tenerlo bastara para entrar sin aprobación,
`con_aprobacion` sería decorativo.

La invitación es un código aparte que vive en **`store_invites`**, una tabla con
RLS activo y **cero políticas** —como `social_connections`—: ni el dueño la lee
con un `select`. Llega a su código por `my_seller_invite()` y lo cambia con
`rotate_seller_invite()`, las dos `security definer`.

Nunca ponerlo como columna de `stores`: la política de lectura de esa tabla
expone toda tienda publicada a cualquiera, así que sería un código de invitación
consultable.

El enlace lleva **la tienda y el código juntos** (`/sumarme?t={slug}&inv={codigo}`).
No hay ni debe haber un endpoint que traduzca código a tienda: sería justo la
herramienta para averiguar por descarte qué códigos valen.

Un vínculo `pendiente` que después recibe la invitación pasa a `activo`: la
invitación **es** la aprobación, y dejarlo esperando contradiría al dueño.

**Marcar un producto es el consentimiento.** Por eso tomar un producto entra `activo`
aunque la tienda sea `con_aprobacion`: ese modo gobierna el acceso al catálogo entero,
no al producto que el dueño ya publicó como disponible. Un vínculo pendiente que toma
un producto marcado pasa a activo, porque dejarlo esperando contradiría al dueño.

Los dos caminos escriben **el mismo vínculo** en `store_sellers`, con un solo código de
referido por tienda. No hay códigos por producto, y no debe haberlos: `orders.seller_id`
apunta a un vínculo y el índice único sobre `commissions.order_id` es lo que garantiza
una comisión por pedido. Un código por producto obliga a rehacer las dos cosas.

### Qué producto acepta vendedores

Dos interruptores, y los dos tienen que estar encendidos:

- `stores.seller_network_enabled` — si la tienda acepta vendedores. Se elige al crearla.
- `products.seller_enabled` — si ese producto en particular se puede vender. Nace en
  `true`: el interruptor que manda es el de la tienda, y lo razonable es que al
  encenderla el catálogo entero esté disponible y el dueño apague las excepciones.

**La comisión se calcula solo sobre los productos habilitados.** Si un pedido mezcla
productos marcados con otros que no lo están, pagar sobre el total le cobraría al
emprendedor una comisión que nunca ofreció. `orders.commission_base_cents` guarda esa
base y se congela igual que la tasa: cambiar después qué productos aceptan vendedores
no reescribe la historia.

El código de referido usa un alfabeto sin caracteres ambiguos — nada de `0/O` ni `1/I/L` —
porque se dicta por teléfono y se tipea cuando el QR no escanea.

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

## La compra de quien no tiene cuenta

Todo el flujo público —catálogo, carrito, pedido, pago— lo hace un comprador anónimo. Y
`orders` se lee solo `to authenticated`. **No se abre la tabla con una política**: eso
expondría los pedidos de todas las tiendas. Se abren dos funciones `security definer`
acotadas, y la llave es el identificador del pedido, que es un uuid y no se adivina:

| Función                | Para qué                                            |
| ---------------------- | --------------------------------------------------- |
| `pedido_publico`       | El pedido y los datos de pago de su tienda          |
| `adjuntar_comprobante` | Provisorio: el comprobante, mientras siga pendiente |

`pedido_publico` nunca devuelve la comisión, el vendedor ni el neto del comercio: eso es
de la tienda, no del comprador.

**El carrito vive en el navegador**, por tienda. En la base obligaría a identificar a
alguien que todavía no dio ningún dato. Lo que el carrito diga de los montos es solo para
mostrar: `create_order` recalcula cada precio desde el catálogo.

### El cobro: PagoFácil con custodia

**Venduo nunca recibe ni guarda el dinero.** El comprador le paga a PagoFácil, que lo
retiene. Venduo solo le da órdenes: liberar, devolver y cómo repartir. Si el dinero pasara
por una cuenta de Venduo, aunque fuera un día, sería intermediación de pagos y exigiría
autorización de ASFI — `VENDUO.md` §5 lo explica.

- **Se libera con dos marcas:** el emprendedor marca el pedido _enviado_ y el comprador
  confirma que lo _recibió_. Si el comprador no responde, se libera solo pasado un plazo
  que corre desde el envío.
- **Al liberarse, PagoFácil dispersa directo:** el vendedor recibe su comisión completa y
  el emprendedor el resto. **El costo de PagoFácil lo absorbe el emprendedor**, nunca sale
  de la parte del vendedor.
- **Venduo no cobra comisión por venta.**
- **Confirmar el pago ya no es tarea del emprendedor.** Lo avisa PagoFácil; nadie lo
  marca a mano.

### Reclamos

Si el comprador reclama antes de la liberación, el pedido pasa a `en_disputa` y **el pago
queda congelado**. Venduo revisa el caso con las dos partes y decide: a favor del
emprendedor, se libera; a favor del comprador, se ordena la devolución y la comisión se
anula. Liberado el pago ya no hay reclamo dentro de la plataforma, porque el dinero salió
de la custodia.

### Lo provisorio que hay que reemplazar

**Lo que hoy está construido no sigue este modelo.** La pantalla de pago muestra el QR
bancario que subió el emprendedor (`stores.payment_qr_url`, en `/cuenta`), el comprador
sube una captura (`adjuntar_comprobante`, `orders.payment_proof_url`) y el emprendedor
confirma el pago a mano. El dinero va directo del comprador al comercio, **sin custodia**.

Se hizo antes de decidir el cobro y queda solo mientras no exista la pasarela. **No
construir nada nuevo encima**: ni reportes sobre comprobantes ni pasos que dependan de que
el emprendedor confirme el pago.

Dos cosas de ese flujo que siguen valiendo mientras exista: el comprobante se guarda **por
ruta y no por URL** —vive en un bucket privado y firmar una URL exige un permiso de lectura
que el comprador anónimo no tiene—, y quien lo necesite ver lo firma del lado del servidor.

## Entrega por WhatsApp

**La gestión de envíos está fuera de alcance**: no hay couriers, guías ni seguimiento. La
entrega se coordina entre el emprendedor y el comprador por WhatsApp. Lo que sí hace la
plataforma es armar ese mensaje con el detalle del pedido y abrir la conversación, usando
`orders.buyer_phone` — que por eso es obligatorio.

Lo que sí registra son **las dos marcas que liberan el pago**: _enviado_, que pone el
emprendedor, y _recibido_, que pone el comprador. No son seguimiento de envío: son la
condición de la custodia.

`stores.whatsapp` es el número del comercio, para que el comprador le escriba desde la
tienda pública.

## Lo que NO se construye

Esta lista es tan importante como la de lo que sí. Si una tarea pide algo de acá,
detenerse y preguntar antes de escribir código:

- **Multi-tienda por usuario**
- **Gestión de envíos** — se coordina por WhatsApp; solo se registran las marcas de
  enviado y recibido
- **Recibir o guardar el dinero de una venta** — lo hace PagoFácil; Venduo solo instruye
- **Cobro de la suscripción** — se modela el estado, no el cobro
- **Notificaciones por email**
- **Aplicación móvil nativa** — la tienda es responsive y con eso alcanza
- **Tests automatizados**

## Los catálogos en PDF

- **Se leen los precios y el stock del momento**, cada vez que se arma el PDF.
  Un catálogo guardado o un enlace reenviado nunca muestran un precio viejo.
- **El precio de un pack se muestra en el catálogo y nada más.** La tienda
  online cobra cada producto por separado; quien quiere el pack escribe por
  WhatsApp. Venderlo como pack toca `create_order` y la comisión: se decide
  antes de escribirlo.
- Un producto borrado desaparece del catálogo; uno sin stock sale "Agotado".

## La suscripción

Cada tienda tiene una, que nace en prueba. Al vencer, el estado pasa a `bloqueada`: la
tienda pública deja de servirse y el panel queda en solo lectura con una única acción
habilitada, exportar los datos en CSV. A los 90 días del bloqueo se purgan.

`store_is_live()` ya combina publicación y suscripción vigente. Usarla en vez de
comprobar `is_published` suelto.
