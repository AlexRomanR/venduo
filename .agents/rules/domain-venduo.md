# Reglas de negocio

El modelo vigente está en `docs/modelo-de-negocio.md` y la especificación en `VENDUO.md`.
Acá van las reglas que, si se ignoran, producen código que parece correcto y no lo es.

> **Buena parte de lo construido responde al modelo anterior**, donde cada negocio tenía su
> tienda online con plantilla, fijaba el precio y ofrecía su propio porcentaje de comisión.
> Cada sección de abajo dice qué manda hoy y qué hay en el repositorio. Lo que sigue en pie,
> lo que hay que rehacer y en qué orden está en `docs/estado-del-proyecto.md`.

## El precio se construye, no se fija

> **precio final = costo base + comisión del vendedor + take-rate**

- **El negocio declara `base_cost_cents` y nada más.** Ninguna pantalla puede dejarle
  escribir el precio final ni un porcentaje. Si aparece un formulario con "precio de
  venta", el modelo se rompió.
- **Los dos porcentajes salen de la tabla de rangos**, por el costo base del producto, y
  son iguales para todos los negocios. No hay `commission_bps` por negocio.
- **Los tres componentes se congelan en el pedido**: costo base, porcentajes y montos.
  Cambiar la tabla mañana no reescribe una venta de hoy.
- **La suma de los tres es exactamente el total.** Cada componente se redondea al centavo y
  el total es su suma; redondear el total aparte deja el reparto descuadrado por centavos y
  la dispersión falla.
- Centavos enteros y puntos básicos enteros, como todo el resto. Nunca punto flotante.

**Construido.** `products.base_cost_cents` es lo que escribe el negocio; `price_cents`,
`commission_bps` y `take_bps` los deriva el disparador `producto_precio` desde
`pricing_tiers`. Para mostrar un desglose antes de guardar está `construirPrecio()` en
`lib/precio.ts`, que recibe los tramos leídos de la base: no hay una copia de los
porcentajes en el código.

**Falta:** congelar los tres componentes en el pedido. `create_order` todavía calcula la
comisión con `stores.commission_bps`, del modelo anterior.

## La asimetría que define el modelo

> Una persona tiene **un solo negocio**. Un joven vende productos de **muchos**.

Lo primero está impuesto en la base con un índice único parcial sobre `owner_id`. Por eso
`my_store_id()` devuelve un identificador y no una lista, y por eso las consultas del
negocio son una comparación directa.

Lo segundo es donde vive toda la dificultad real: los productos que cada joven tomó y sus
comisiones cruzan tenants por naturaleza.

**Multi-negocio por usuario está fuera de alcance.** No escribir código que lo anticipe.

## Quién cobra la comisión

El componente de comisión **siempre está dentro del precio**; lo que cambia es a quién le
toca:

| Cómo llegó la venta                                       | Quién cobra                |
| --------------------------------------------------------- | -------------------------- |
| Por el enlace de un joven                                 | Él, comisión **directa**   |
| Compra directa, comprador con promotor asociado y vigente | Él, comisión **indirecta** |
| Compra directa, sin promotor o con la atribución vencida  | Vuelve al negocio          |

**Quién cobra lo decide el servidor, nunca el navegador.** `create_order` resuelve primero
el código de referido; si no hay, busca la atribución vigente del comprador.

**El comprador paga lo mismo en los tres casos.** Nunca descontar el componente de comisión
del precio cuando no hay vendedor: eso daría dos precios para el mismo producto.

### La atribución del comprador

- Se crea con la **primera** compra que trae un joven, y **vence por tiempo**.
- **El primero manda**: una atribución vigente no se reemplaza por otra.
- **El comprador se reconoce por su teléfono**, normalizado, mientras no tenga cuenta: ya
  es obligatorio para la entrega y es el dato que se repite igual entre compras. La llave
  se normaliza en un solo lugar; dos formas de escribir el mismo número son dos
  compradores distintos, y eso le roba la comisión a alguien.

**Hoy en el repositorio:** la atribución no existe. El código de referido solo vale para la
venta en la que se usó.

## Comisiones: el congelamiento

El punto más fácil de hacer mal de todo el sistema.

- **La tasa se congela al momento de la venta**, en `orders.commission_bps` y
  `commissions.rate_bps`. Quien vendió con 20% cobra 20%, aunque hoy ese rango pague 15%.
- **Una comisión por pedido**, garantizado por índice único sobre `order_id`. Sin eso, un
  pedido que va y vuelve entre estados genera comisiones duplicadas.
- **La comisión directa y la indirecta son la misma tabla** con distinto `kind` y distinto
  porcentaje. No duplicar el circuito.
- Ciclo: `pendiente` → `confirmada` → `pagada`, más `anulada`, **atado a la custodia del
  pago**. Un pedido cancelado **anula** la comisión; nunca la borra.
- La crea un disparador cuando el pedido pasa a `pagado`. **No insertarla desde código.**
- **El historial laboral cuenta solo `confirmada` y `pagada`**, y muestra por separado lo
  vendido y lo generado por compradores traídos.

### El estado del pedido mueve la comisión

El panel cambia un estado y **nada más**: todo lo que se sigue lo hace el disparador
`handle_order_status_change`.

| El pedido pasa a | Qué pasó con el dinero                    | La comisión      |
| ---------------- | ----------------------------------------- | ---------------- |
| `pagado`         | PagoFácil lo cobró y lo retiene           | Nace `pendiente` |
| `enviado`        | Sigue retenido                            | `pendiente`      |
| `entregado`      | Se ordena liberar y repartir              | `confirmada`     |
| —                | PagoFácil confirmó la transferencia       | `pagada`         |
| `en_disputa`     | Congelado mientras Venduo revisa          | `pendiente`      |
| `cancelado`      | Devuelto al comprador, si llegó a pagarse | `anulada`        |

Cancelar además **devuelve el stock** al catálogo. Nunca duplicar esto desde la aplicación:
escribir en `commissions` o ajustar `products.stock` a mano da comisiones dobles y stock
inventado el día que alguien cambie dos veces de estado.

> **Hoy el disparador no sigue esta tabla.** Crea la comisión directamente `confirmada` al
> pasar a `pagado`, porque se escribió para el flujo provisorio sin custodia. Al construir
> la pasarela hay que cambiarlo, sumar `en_disputa` al enum y sumar `kind` a la comisión.

## El historial laboral del vendedor

Es la promesa central de la plataforma y está sostenida por dos decisiones del esquema que
**no se tocan**:

- `commissions.store_id` es **anulable, no cascada**.
- `commissions.store_name` guarda **una copia** del nombre del negocio.

Cuando se purga un negocio, la comisión sobrevive con el nombre del comercio y el historial
del joven queda intacto. Si eso fuera cascada, el día que un negocio abandona la plataforma
se borraría el antecedente laboral de todos los que vendieron para él — exactamente lo que
la plataforma promete no hacer.

`seller_profiles` vive **fuera de todo negocio** por la misma razón.

## Cuentas y roles

**Correo y contraseña, sin verificación.** Quien se registra entra al instante. No hay
enlace mágico ni ingreso con Google: el proveedor no está habilitado.

Al registrarse se elige `primary_role`: `emprendedor` (el negocio) o `vendedor` (el
promotor). Se guarda en `profiles` y el disparador de alta lo lee de los metadatos del
usuario.

**En pantalla se dice promotor.** El valor `vendedor` se queda en la base y en las rutas
—`/vendedor`, `seller_id`, `store_sellers`— porque renombrarlo es migrar datos y romper
enlaces; el texto que lee una persona no.

**`primary_role` NO es un permiso.** Es una intención, para saber a dónde llevar a una
cuenta recién creada. Los permisos derivan de los datos:

| Sos…     | Si…                                          |
| -------- | -------------------------------------------- |
| Negocio  | Tienes una fila viva en `stores`             |
| Vendedor | Tomaste al menos un producto del Marketplace |

Una misma persona puede ser las dos cosas. Nunca escribir una condición del estilo
`if (profile.primary_role === "vendedor")` para decidir si alguien **puede** algo; eso lo
decide RLS. Sirve solo para elegir qué pantalla mostrar primero.

## El joven elige, nadie lo aprueba

- **Toma productos del catálogo del Marketplace**, uno por uno, y por cada uno recibe un
  enlace y un QR con su código.
- **No hay aprobación, ni invitaciones, ni vínculo con un negocio entero.** Publicar un
  producto en el Marketplace ya es el consentimiento del negocio a que se venda.
- `products.seller_enabled` sigue mandando sobre si un producto se puede tomar. Nace en
  `true`.

**Hoy en el repositorio:** está el modelo anterior completo —`store_sellers` con
`pendiente`/`activo`, `seller_join_mode`, `store_invites`, `join_store()` y
`take_product()`—. `take_product` es lo más cercano a lo vigente. Mientras siga ahí, sus
reglas valen: el vínculo lo escriben esas funciones y no el cliente, y `store_invites`
sigue sin políticas.

### El código de referido se propaga, no se valida en el navegador

Quien compra es **anónimo**, así que el catálogo no puede comprobar si un código existe.

1. **El código viaja tal como vino** por todo el Marketplace —del producto al carrito—
   después de una limpieza de forma. Propagar solo el código ya resuelto parecía más
   prudente y era justo lo contrario: para un comprador real nunca resolvía, así que el
   referido se perdía al primer clic y con él la comisión del joven.
2. **El árbitro es `create_order`.** Vuelve a resolver el código antes de congelar la
   comisión. Un código inventado se ignora ahí, y la venta pasa a resolverse como compra
   directa.

El cartel de "te trajo Ana" es otra cosa: solo se muestra, sale de una función
`security definer` y que falle no cambia a quién se le paga.

El código usa un alfabeto sin caracteres ambiguos —nada de `0/O` ni `1/I/L`— porque se
dicta por teléfono y se tipea cuando el QR no escanea.

## El catálogo

Un producto lleva **su costo base**, las fotos en `images` —la primera es la portada—, la
condición, un código interno opcional, el umbral de aviso de stock y si va destacado.

Las categorías son **una tabla por negocio**, `product_categories`, y no texto suelto.
`products.category` es **una copia derivada** de `category_id` que mantiene la base, igual
que `image_url` lo es de `images[1]`. Está explicado en `database-rls.md`.

## Segunda mano

No es una sección aparte: es un **filtro del catálogo**. Lo define `products.condition`
(`nuevo`, `segunda_mano`, `reacondicionado`), que elige el negocio al cargar el producto.

`compare_at_price_cents` es el precio anterior y es lo que produce el descuento destacado.
Se compara contra el **precio publicado**, no contra el costo base.

## La compra de quien no tiene cuenta

Todo el flujo del comprador es anónimo. Y `orders` se lee solo `to authenticated`. **No se
abre la tabla con una política**: eso expondría los pedidos de todos los negocios. Se abren
funciones `security definer` acotadas, y la llave es el identificador del pedido, que es un
uuid y no se adivina:

| Función                | Para qué                                            |
| ---------------------- | --------------------------------------------------- |
| `pedido_publico`       | El pedido y los datos de pago                       |
| `adjuntar_comprobante` | Provisorio: el comprobante, mientras siga pendiente |

`pedido_publico` nunca devuelve la comisión, el vendedor ni el neto del negocio: eso es del
negocio, no del comprador.

**El carrito vive en el navegador.** En la base obligaría a identificar a alguien que
todavía no dio ningún dato. Lo que el carrito diga de los montos es solo para mostrar:
`create_order` vuelve a construir cada precio desde el costo base.

## El cobro: PagoFácil con custodia y reparto a tres

**Venduo nunca es titular del dinero ajeno.** El comprador le paga a PagoFácil, que lo
retiene; Venduo solo le da órdenes: liberar, devolver y cómo repartir. Su take-rate lo
recibe como un beneficiario más del reparto. Si el dinero de las otras partes pasara por
una cuenta de Venduo, aunque fuera un día, sería intermediación de pagos y exigiría
autorización de ASFI — `VENDUO.md` §5 lo explica.

- **Se libera con dos marcas:** el negocio marca el pedido _enviado_ y el comprador
  confirma que lo _recibió_. Si el comprador no responde, se libera solo pasado un plazo.
- **Al liberarse, PagoFácil dispersa directo:** costo base al negocio, comisión al joven,
  take-rate a Venduo. **El costo de PagoFácil lo absorbe el negocio**, nunca sale de la
  parte del joven.
- **Confirmar el pago no es tarea de nadie.** Lo avisa PagoFácil.
- Si el comprador reclama antes de la liberación, el pedido pasa a `en_disputa` y el pago
  queda congelado hasta que Venduo resuelve.

### Lo provisorio que hay que reemplazar

**Lo que hoy está construido no sigue este modelo.** El comprador transfiere al QR bancario
del negocio (`stores.payment_qr_url`), sube una captura (`adjuntar_comprobante`,
`orders.payment_proof_url`) y el negocio confirma el pago a mano. El dinero va directo al
comercio, **sin custodia ni reparto**.

Queda solo mientras no exista la pasarela. **No construir nada nuevo encima**: ni reportes
sobre comprobantes ni pasos que dependan de que el negocio confirme el pago.

Dos cosas de ese flujo que siguen valiendo mientras exista: el comprobante se guarda **por
ruta y no por URL** —vive en un bucket privado y firmar una URL exige un permiso de lectura
que el comprador anónimo no tiene—, y quien lo necesite ver lo firma del lado del servidor.

## Entrega por WhatsApp

**La gestión de envíos está fuera de alcance**: no hay couriers, guías ni seguimiento. La
entrega se coordina entre el negocio y el comprador por WhatsApp, y la plataforma arma ese
mensaje con el detalle del pedido usando `orders.buyer_phone` — que por eso es obligatorio.

Lo que sí registra son **las dos marcas que liberan el pago**. No son seguimiento de envío:
son la condición de la custodia.

`stores.whatsapp` es el número del comercio, para que el comprador le escriba.

## Lo que NO se construye

Esta lista es tan importante como la de lo que sí. Si una tarea pide algo de acá,
detenerse y preguntar antes de escribir código:

- **Multi-negocio por usuario**
- **Que el negocio fije el precio final o sus porcentajes**
- **Tienda online propia por negocio, con plantillas** — el canal es el Marketplace; lo
  construido queda en el repositorio, fuera del modelo
- **Suscripción** — el único ingreso es el take-rate
- **Aprobación de vendedores, invitaciones y vínculo con un negocio**
- **Gestión de envíos** — se coordina por WhatsApp; solo se registran las marcas de enviado
  y recibido
- **Recibir o guardar el dinero ajeno de una venta** — lo hace PagoFácil; Venduo solo
  instruye
- **Notificaciones por email**
- **Aplicación móvil nativa** — el Marketplace es responsive y con eso alcanza
- **Tests automatizados**

## La suscripción — fuera del modelo vigente

Sostenía el ingreso de la plataforma, que ahora es el take-rate. `plans`, `subscriptions`,
`store_is_live()` y el bloqueo al vencer la prueba siguen en la base.

Mientras estén: **usar `store_is_live()` en vez de comprobar `is_published` suelto**, para
no dejar dos formas distintas de decidir si un catálogo se sirve.
