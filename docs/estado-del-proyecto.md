# Estado del proyecto

Qué está construido y qué falta, medido contra el **modelo vigente**
(`docs/modelo-de-negocio.md`) y el alcance del MVP de `VENDUO.md` §6.
Actualizado el 18 de septiembre de 2026: Marketplace público, referido por producto y
flujo simulado de pago con custodia. Las migraciones nuevas están preparadas, no aplicadas
a producción.

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
| 3   | Precio calculado por rango: costo base + comisión + take-rate     | ✅     |
| 4   | Marketplace navegable en móvil                                    | ✅     |
| 5   | El joven elige productos y obtiene su enlace y su QR              | ✅     |
| 6   | Carrito y checkout con datos del comprador                        | ✅     |
| 7   | Pago por PagoFácil con custodia, sobre una pasarela simulada      | ✅     |
| 8   | Reparto a tres: negocio, joven y plataforma                       | ✅     |
| 9   | Atribución del comprador al promotor, con su ventana              | ✅     |
| 10  | Comisión indirecta y retorno al negocio                           | ✅     |
| 11  | Panel del joven: ventas, comisiones, materiales                   | ✅     |
| 12  | Estadísticas en lenguaje natural                                  | ✅     |
| 13  | Copys de marketing y publicación en redes                         | ❌     |
| 14  | Entrega por WhatsApp con confirmación de envío y recepción        | ✅     |

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
- **El primer ingreso del negocio es una guía en carrusel** de cinco pasos: cargar lo
  que vende, agruparlo en categorías, y los tres que resuelve Venduo —los promotores
  eligen, avisamos la venta, la entrega va por WhatsApp—. La decide
  `stores.onboarded_at`, no el catálogo; "Finalizar" la marca y lleva al panel con
  cifras, catálogo con stock editable y acceso a las estadísticas. Se vuelve a abrir
  desde "Cómo funciona Venduo" en la barra lateral (`/panel?guia=1`).
- **Carga desde Excel** (`/panel/productos/importar`): plantilla descargable en
  `public/plantillas/productos-venduo.xlsx`, revisión fila por fila con el precio
  publicado antes de cargar, y las categorías nuevas se crean solas. Hasta 200 filas.
- **Se dice "promotor"** en el panel, la portada y el registro.
- **El promotor elige productos, no tiendas.** `seller_products` registra qué tomó cada
  uno; `take_product` ya no mira si la tienda "acepta vendedores" ni espera aprobación, y
  `release_product` lo saca de su lista sin invalidar el enlace que ya circula.
- **La atribución del comprador existe.** `buyer_attributions`, por teléfono normalizado
  (`normalizar_telefono`) y 90 días (`ventana_de_atribucion()`). Nace cuando se cobra el
  primer pedido que trajo un promotor; el primero manda. Se reconstruyó desde los pedidos
  cobrados que ya había. Sin políticas: el promotor la lee censurada por
  `mis_compradores()`.
- **`create_order` congela los tres componentes** (`orders.base_cost_cents`,
  `take_cents`, `commission_cents`) y resuelve quién cobra: el promotor del enlace, el
  asociado al comprador (comisión **indirecta**, con `commissions.kind`) o nadie, y vuelve
  al negocio. Los pedidos anteriores conservan lo que se congeló entonces.
- **El panel del promotor** (`/vendedor`): sin productos es una bienvenida con
  un carrusel de tres pasos que lo lleva del filtro a su primer enlace; con productos, sus
  cifras, la ganancia por semana, un próximo paso calculado, sus enlaces y sus compradores.
  El catálogo filtra por búsqueda, categoría, condición, precio y fecha de publicación,
  permite ordenar, y cada ficha compara ganancia, precio, stock y antigüedad antes de crear
  el referido. Secciones: Catálogo, Mis enlaces (con WhatsApp, copiar y QR), Compradores,
  Ganancias y Estadísticas.
- **`/sumarme` y `/explorar/*` redirigen** al panel del promotor. Unirse a una tienda y
  las invitaciones ya no tienen pantalla.
- **La pantalla de Promotores del negocio** muestra quién promociona qué y cuánto vendió,
  con ranking interactivo y filtros para comparar el desempeño en el propio negocio y en
  toda la red Venduo; ya no hay invitación ni aprobación. `/cuenta` dejó de ofrecer "acepto
  vendedores" y el porcentaje de comisión.
- **La barra lateral** perdió Marketing, Apariencia y "Gana extra".
- **El Marketplace público vive en `/`.** Tiene búsqueda, rubros, condición, ciudad,
  orden, fichas de producto y negocio, carrito con productos de varios negocios y un
  lateral útil para visitantes anónimos. La portada institucional pasó a `/unirse` y se
  enlaza desde el pie del catálogo.
- **Cada producto tomado tiene su propio referido.** `seller_products.referral_code`
  identifica exactamente el producto promovido; `create_order` solo acredita comisión
  directa cuando ese código corresponde al producto comprado.
- **El checkout agrupa por negocio sin exponer esa complejidad al comprador.**
  `create_marketplace_orders` crea todos los pedidos en una sola transacción y vuelve a
  calcular precio, comisión y take-rate en la base.
- **La custodia simulada reemplaza el QR bancario en el flujo público nuevo.** El cobro
  pasa a `pagado`, la comisión queda pendiente, el negocio marca el envío, el comprador
  confirma recepción o abre disputa y solo la entrega libera y confirma el reparto.

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

### 1. Mostrar el reparto — prioridad media

El pedido ya congela costo base, comisión y take-rate. Falta mostrarlo en el detalle del
pedido del negocio: cuánto va a cada parte, y si la comisión fue directa, indirecta o
volvió a él.

### 2. Comisión indirecta en el perfil público — prioridad media

El panel del promotor ya separa lo vendido de lo generado por compradores traídos. Falta
lo mismo en `/v/{slug}`: `seller_public_stats` todavía no mira `commissions.kind`.

### 3. Aplicar y validar Marketplace/custodia en producción — prioridad alta

El código y las migraciones están preparados. Falta revisar el SQL contra una copia segura,
aplicar `20260918170000_custodia_y_referido_por_producto.sql` y
`20260918170100_checkout_marketplace_y_pago_simulado.sql`, regenerar
`types/database.ts` y hacer una compra de punta a punta con datos reales. No se hizo
`supabase db push` porque la única base enlazada es producción.

### 6. Marketing — prioridad baja

Se sacó de la barra lateral y del panel. `/panel/marketing` sigue existiendo como marcador y
la tarea `generateCampaign` de la capa de IA no se usa.

---

## Lo que quedó fuera del modelo

Está construido, funciona y **no se borró**. Qué se hace con cada cosa es una decisión
pendiente; mientras tanto, no construir encima.

| Qué                                                             | Dónde                                             |
| --------------------------------------------------------------- | ------------------------------------------------- |
| ⛔ Tienda online por negocio, con plantillas Pasarela y Esencia | `docs/store-templates.md`, `app/t/[slug]`         |
| ⛔ Cambio de plantilla e historial de diseño                    | `/panel/apariencia`, `store_design_versions`      |
| ⛔ Editor de bloques con IA (preparado, nunca implementado)     | skill `visual-block-editor`                       |
| ⛔ Suscripción, planes y bloqueo al vencer la prueba            | `plans`, `subscriptions`                          |
| ⛔ Red de vendedores por tienda, con aprobación e invitaciones  | `store_invites`, `join_store`, `seller_join_mode` |

Dos de esas piezas se pueden reciclar casi enteras: la **página del negocio** dentro del
Marketplace puede salir de lo que hoy es la portada de su tienda, y el patrón de
**propuestas de IA validadas contra un esquema** sirve para cualquier edición asistida que
se construya después.

---

## Decisiones abiertas

Ninguna frena empezar; todas frenan operar con dinero real. Las siete están en
`docs/modelo-de-negocio.md` §8. Las tres que bloquean más código:

1. **La tabla de rangos.** Está sembrada con la propuesta; confirmarla o ajustarla es
   editar `pricing_tiers`, y las ventas ya hechas no cambian.
2. **La ventana de atribución**: se usan 90 días, en `ventana_de_atribucion()`. Cambiarla
   es cambiar esa función; las atribuciones creadas conservan su vencimiento.

---

## Pendientes chicos

- **Fotos en los datos de ejemplo.** Casi ningún producto tiene foto y el catálogo se luce
  con ellas. Importante antes de la demostración.
- **Los datos de ejemplo siguen el modelo anterior** en todo lo demás: ocho tiendas con su
  plantilla y una red de vendedores por tienda. Sus precios ya se migraron a costo base.
- **El término "vendedor" sigue en pantalla** en la tienda pública y en las plantillas.
- **No se vio el panel del promotor con datos reales** en el navegador: se probó con una
  cuenta nueva. Revisarlo entrando como `ana@demo.venduo.bo`.
- **`.env.example`** no tiene `NEXT_PUBLIC_DOMINIO_TIENDAS`.
- **El rojo de Venduo** está a 4,35:1 contra el papel, apenas por debajo del mínimo AA para
  texto chico.
- **Avisos de Next.js** por `quality="90"` en imágenes de la portada: configurar
  `images.qualities` antes de pasar a Next 16.
- 191 avisos de lint, casi todos variables sin usar.
