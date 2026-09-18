# Estado del proyecto

Qué está construido y qué falta, medido contra el **modelo vigente**
(`docs/modelo-de-negocio.md`) y el alcance del MVP de `VENDUO.md` §6.
Actualizado el 17 de septiembre de 2026, con el cambio de enfoque a Marketplace.

**Leyenda:** ✅ sirve tal cual · 🟡 existe pero hay que rehacerlo · ❌ falta · ⛔ fuera del
modelo

---

## Lo primero que hay que entender

El producto cambió de modelo después de construir buena parte del MVP. Lo que hay en el
repositorio responde al modelo anterior:

| Antes                                           | Ahora                                               |
| ----------------------------------------------- | --------------------------------------------------- |
| Cada negocio tenía su tienda online             | Un solo **Marketplace**                             |
| El negocio fijaba el precio                     | Declara **costo base**; el precio se construye      |
| Cada negocio ofrecía su porcentaje de comisión  | Comisión **escalonada por rango**, igual para todos |
| El ingreso era la suscripción                   | El ingreso es el **take-rate**                      |
| El joven se sumaba a una tienda, con aprobación | Toma productos del catálogo, sin permiso            |
| El referido valía para esa venta                | El comprador **queda asociado** por una ventana     |

**Nada de lo construido está roto**: el flujo de compra completo funciona hoy. Lo que pasa
es que responde a otras reglas. Abajo, qué se salva, qué se rehace y en qué orden.

---

## Resumen contra el alcance del MVP

| #   | Punto del MVP (`VENDUO.md` §6)                                    | Estado |
| --- | ----------------------------------------------------------------- | ------ |
| 1   | Registro y login de los dos lados                                 | ✅     |
| 2   | Productos con imagen, stock y condición, declarando el costo base | ✅     |
| 3   | Precio calculado por rango: costo base + comisión + take-rate     | 🟡     |
| 4   | Marketplace navegable en móvil                                    | 🟡     |
| 5   | El joven elige productos y obtiene su enlace y su QR              | 🟡     |
| 6   | Carrito y checkout con datos del comprador                        | ✅     |
| 7   | Pago por PagoFácil con custodia, sobre una pasarela simulada      | 🟡     |
| 8   | Reparto a tres: negocio, joven y plataforma                       | ❌     |
| 9   | Atribución del comprador al promotor, con su ventana              | ❌     |
| 10  | Comisión indirecta y retorno al negocio                           | ❌     |
| 11  | Panel del joven: ventas, comisiones, materiales                   | 🟡     |
| 12  | Estadísticas en lenguaje natural                                  | ✅     |
| 13  | Copys de marketing y publicación en redes                         | ❌     |
| 14  | Entrega por WhatsApp con confirmación de envío y recepción        | 🟡     |

---

## Hecho con el cambio de enfoque

- **El precio se construye.** `pricing_tiers` sembrada, `products.base_cost_cents` como
  única cifra que escribe el negocio, y `price_cents`, `commission_bps` y `take_bps`
  derivados por el disparador `producto_precio`. Los productos que ya existían conservaron
  su precio publicado.
- **El formulario de producto pide costo base** y muestra en vivo el desglose: cuánto
  recibes, cuánto gana el promotor, cuánto Venduo y a cuánto se publica.
- **La portada** cuenta el modelo nuevo, con la cuenta hecha y los porcentajes reales.
- **El alta del negocio es una sola pantalla**: ya no se elige plantilla.
- **La entrada del panel tiene dos caras**: guía de primeros pasos sin productos, y el
  catálogo con su stock cuando ya hay.
- **Se dice "promotor"** en el panel, la portada y el registro.

---

## Lo que sirve tal cual

- **Cuentas.** Registro e ingreso con correo y contraseña; el destino de cada cuenta lo
  deciden los datos, no el rol.
- **Catálogo por negocio.** Alta y edición de productos con fotos, stock, umbral de aviso,
  condición, precio anterior, código y destacado. Categorías propias por negocio.
- **Carrito y checkout.** El carrito vive en el navegador y el pedido solo lo crea
  `create_order` en el servidor, que recalcula todo.
- **Pedidos.** Lista, detalle, cambio de estado y el botón que abre WhatsApp con el pedido
  ya armado.
- **Estadísticas en lenguaje natural**, con gráficos guardados e informe en PDF.
- **Historial laboral del vendedor**, con su perfil público, y el diseño de base que lo hace
  sobrevivir a la baja de un negocio.
- **Base y seguridad.** RLS en todas las tablas, borrado lógico, la IA de estadísticas
  acotada a vistas de solo lectura de la propia tienda.
- **Modo demo**, que funciona sin credenciales.

---

## Lo que hay que rehacer

### 1. Congelar el precio en la venta — prioridad alta

El motor de precio **ya está construido** (ver más abajo). Lo que falta es que el pedido
se quede con una copia:

- Congelar los tres componentes en `orders` y en `order_items`: costo base, comisión y
  take-rate, con sus porcentajes.
- Cambiar `create_order`, que todavía calcula la comisión con `stores.commission_bps`, del
  modelo anterior.
- Mostrar el reparto en el detalle del pedido: cuánto va a cada parte.

### 2. Atribución del comprador y comisión indirecta — prioridad alta

- Crear `buyer_attributions` y decidir **cómo se reconoce a un comprador** entre compras
  (decisión abierta).
- Sumar `kind` a `commissions` y resolver en `create_order` quién cobra: el joven del
  enlace, el promotor asociado o el negocio.
- Mostrar las dos clases por separado en el panel del joven y en su perfil público.

### 3. El Marketplace — prioridad alta

Hoy el catálogo vive dentro de la tienda de cada negocio (`/t/{slug}`). Falta el catálogo
central: portada, búsqueda, filtros, ficha de producto y página del negocio.

Buena parte se puede reusar: los filtros, el orden, la búsqueda, las tarjetas de producto y
el carrito ya están escritos y no dependen de la tienda.

### 4. El joven elige productos — prioridad media

Reemplazar el vínculo con una tienda (`store_sellers`, aprobación, invitaciones) por
`seller_products`: tomar un producto del Marketplace y recibir enlace y QR propios.
`take_product()` es lo más parecido que ya existe.

### 5. El cobro con custodia y el reparto a tres — prioridad alta

Sigue pendiente de antes, y ahora con un destinatario más.

- Pasarela simulada de PagoFácil: cobrar, retener, liberar, devolver y **repartir entre
  tres**.
- Estados nuevos del pedido: marca de enviado, confirmación del comprador y `en_disputa`,
  con sus fechas.
- Cambiar el disparador de comisiones: hoy nace `confirmada` al pagar; tiene que nacer
  `pendiente` y confirmarse en la entrega.
- Pantalla de seguimiento para el comprador, con "lo recibí" y "tengo un problema".
- Retirar el QR bancario y el comprobante.

### 6. Marketing — prioridad baja

`/panel/marketing` sigue siendo un marcador "Pronto". La tarea `generateCampaign` existe en
la capa de IA y no se usa.

---

## Lo que quedó fuera del modelo

Está construido, funciona y **no se borró**. Qué se hace con cada cosa es una decisión
pendiente; mientras tanto, no construir encima.

| Qué                                                             | Dónde                                          |
| --------------------------------------------------------------- | ---------------------------------------------- |
| ⛔ Tienda online por negocio, con plantillas Pasarela y Esencia | `docs/store-templates.md`, `app/t/[slug]`      |
| ⛔ Cambio de plantilla e historial de diseño                    | `/panel/apariencia`, `store_design_versions`   |
| ⛔ Editor de bloques con IA (preparado, nunca implementado)     | skill `visual-block-editor`                    |
| ⛔ Suscripción, planes y bloqueo al vencer la prueba            | `plans`, `subscriptions`                       |
| ⛔ Red de vendedores por tienda, con aprobación e invitaciones  | `store_sellers`, `store_invites`, `join_store` |

Dos de esas piezas se pueden reciclar casi enteras: la **página del negocio** dentro del
Marketplace puede salir de lo que hoy es la portada de su tienda, y el patrón de
**propuestas de IA validadas contra un esquema** sirve para cualquier edición asistida que
se construya después.

---

## Decisiones abiertas

Ninguna frena empezar; todas frenan operar con dinero real. Las siete están en
`docs/modelo-de-negocio.md` §8. Las tres que bloquean más código:

1. **La tabla de rangos.** Sin los cortes y los porcentajes no se puede sembrar
   `pricing_tiers`. Hay una propuesta lista para revisar.
2. **Cómo se reconoce a un comprador** entre compras sin pedirle cuenta. Define la llave de
   `buyer_attributions`, y cambiarla después es migrar datos reales.
3. **La ventana de atribución**: se proponen 90 días. Al comprador se lo reconoce por su
   teléfono, que ya está decidido.

---

## Pendientes chicos

- **Fotos en los datos de ejemplo.** Casi ningún producto tiene foto y el catálogo se luce
  con ellas. Importante antes de la demostración.
- **Los datos de ejemplo siguen el modelo anterior** en todo lo demás: ocho tiendas con su
  plantilla y una red de vendedores por tienda. Sus precios ya se migraron a costo base.
- **El término "vendedor" sigue en pantalla** en el panel del promotor, las vitrinas de
  `/explorar` y la tienda pública. Falta la pasada completa.
- **`.env.example`** no tiene `NEXT_PUBLIC_DOMINIO_TIENDAS`.
- **El rojo de Venduo** está a 4,35:1 contra el papel, apenas por debajo del mínimo AA para
  texto chico.
- **Avisos de Next.js** por `quality="90"` en imágenes de la portada: configurar
  `images.qualities` antes de pasar a Next 16.
- 191 avisos de lint, casi todos variables sin usar.
