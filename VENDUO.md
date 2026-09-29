# Venduo

**Documento maestro del proyecto** — hackathon de 48 horas
Desafío: empleabilidad juvenil · Enfoque: triple impacto

---

## 1. Qué es Venduo

Una plataforma donde cualquier emprendedor elige una plantilla, describe su negocio en texto y obtiene una tienda online funcionando, con herramientas de cobro, análisis y marketing incluidas. La inteligencia artificial no escribe la tienda desde cero: trabaja sobre la plantilla elegida agregando, quitando y ajustando bloques visuales hasta que la tienda represente al negocio. Y como esa tienda ya tiene catálogo digital, puede activar con un clic una red de vendedores jóvenes que colocan sus productos a comisión.

**En una frase:** convertimos a cualquier emprendedor que vende por TikTok en una tienda online en dos minutos, y le damos una red de vendedores que vende por él.

---

## 2. El problema

**Lado joven.** En Bolivia el 96,2% de los jóvenes que trabajan lo hacen en la informalidad, la tasa más alta de la región. El desempleo juvenil duplica al general (6% contra 3,1%) y siete de cada diez ganan menos de Bs 2.500 al mes. El problema no es que falte trabajo: es que el trabajo disponible no paga, no forma y no deja historial que puedan mostrar después.

**Lado emprendedor.** Un volumen enorme del comercio boliviano ocurre informalmente por Facebook Marketplace, WhatsApp y TikTok, sin plataforma detrás. Menos del 30% de las pymes bolivianas tiene sitio web. Ese emprendedor no tiene tienda, no tiene números, promociona a mano en cinco redes y no puede contratar a nadie porque no le alcanza para un sueldo fijo.

**La conexión:** cada problema es la solución del otro. Nadie los había conectado.

---

## 3. Cómo funciona

### Para el emprendedor

1. Elige una plantilla según su rubro. Cada una tiene su propia identidad —letra, colores, cómo muestra los productos— y la puede cambiar después sin perder nada.
2. Describe su negocio en un párrafo de texto. La IA ajusta la plantilla: agrega y quita bloques, reordena secciones, adapta textos y colores.
3. Carga sus productos, marcando cuáles son nuevos y cuáles de segunda mano o reacondicionados.
4. Publica. Obtiene una URL propia y un código QR de su tienda.
5. Cobra por PagoFácil —el dinero queda retenido hasta que el comprador recibe su pedido—, consulta sus estadísticas preguntando en lenguaje natural y genera piezas de promoción con IA.
6. Si quiere, activa la red de vendedores y define el porcentaje de comisión.

### Para el vendedor

1. Se suma a una o varias tiendas, o toma productos sueltos de una vitrina pública que reúne lo que cada emprendedor marcó como disponible para vendedores. Sumarse a una tienda entera puede quedar a la espera de aprobación; tomar un producto marcado no, porque marcarlo ya fue el consentimiento del dueño.
2. Recibe un enlace y un QR propios, más los materiales de promoción que la IA generó.
3. Vende por sus redes, en su barrio o cara a cara.
4. Cada venta que entra por su enlace queda trazada y le genera comisión automática, que cobra directo de PagoFácil cuando el comprador recibe el pedido.
5. Acumula un historial de ventas verificable: su primer antecedente laboral real.

### El historial laboral verificable

Es la promesa central de la plataforma hacia el vendedor, y funciona así:

Cada vendedor tiene un **perfil público y permanente** en una URL estable. Reúne sus ventas confirmadas, el monto total que generó, cuántas tiendas lo tuvieron vendiendo, en qué rubros, la fecha de su primera venta y su antigüedad activa. Se puede exportar para adjuntar a una postulación.

Tres propiedades lo hacen creíble como antecedente laboral:

- **No lo edita el vendedor.** Se construye solo, a partir de comisiones confirmadas.
- **Sobrevive a la tienda.** Si un emprendedor abandona la plataforma y sus datos se eliminan, el historial del vendedor queda intacto. Esto no es una aspiración: está garantizado por el diseño de la base de datos (ver sección 8).
- **Es verificable por un tercero.** La URL es pública y estable; quien recibe el currículum puede abrirla y comprobarlo.

---

## 4. Los módulos

| Módulo                      | Qué hace                                                                                                                 | Para quién  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------- |
| **Editor de tienda con IA** | Sobre una plantilla del rubro, la IA agrega, elimina y edita bloques visuales según lo que el emprendedor pide en texto  | Emprendedor |
| **Cobro con custodia**      | El comprador paga en PagoFácil, el dinero queda retenido y se libera al emprendedor y al vendedor cuando llega el pedido | Ambos       |
| **Inteligencia de negocio** | Preguntas en lenguaje natural que devuelven gráficos y estadísticas                                                      | Emprendedor |
| **Marketing con IA**        | Genera copys y piezas adaptadas a cada red social, listos para publicar en Facebook y WhatsApp                           | Emprendedor |
| **Red de vendedores**       | Alta de vendedores, enlaces de referido, comisiones automáticas                                                          | Ambos       |
| **Segunda mano**            | Filtro del catálogo que reúne los productos usados y reacondicionados, con los descuentos destacados                     | Emprendedor |

**Sobre la segunda mano:** no es una sección aparte que se genera sola. Es un **filtro dentro del catálogo** de cada tienda. Lo que define que un producto sea de segunda mano es un campo que el emprendedor elige al cargarlo, junto con un precio de comparación opcional que produce el descuento destacado.

---

## 5. Modelo de negocio

- **Único ingreso:** suscripción mensual del emprendedor, con período de prueba. Paga porque la tienda, el análisis y el marketing le sirven aunque nunca active vendedores.
- **Venduo no cobra comisión por venta.** Ni al emprendedor ni al vendedor. El porcentaje que se descuenta de cada venta referida va íntegro al vendedor que la generó.
- **La comisión de PagoFácil la absorbe el emprendedor.** Sale de su parte, nunca de la del vendedor: el porcentaje que la tienda ofreció es lo que el vendedor cobra, completo.
- **El vendedor no paga nunca nada.** Cero barrera de entrada.
- **Costos:** infraestructura que escala con el uso, plantillas por sector que se reutilizan entre tiendas, e IA solo en momentos de alto valor. El costo marginal por tienda nueva es de centavos.

### Planes y prueba

El sistema contempla un **catálogo de planes** desde el inicio, aunque el MVP arranque con uno solo: la estructura admite sumar niveles más adelante sin migrar datos. Cada tienda tiene una suscripción asociada, que nace en período de prueba.

**Los precios no son parte de este documento.** No afectan al desarrollo: lo que el software necesita conocer es el estado de la suscripción, no su monto.

### Qué pasa cuando vence la prueba

El vencimiento **bloquea la plataforma**, no la borra:

1. La tienda pública deja de servirse.
2. El panel queda en solo lectura, con un aviso de que debe suscribirse.
3. Se habilita una única acción: **exportar los datos** en CSV — catálogo de productos, pedidos con sus líneas, vendedores vinculados e historial de comisiones. CSV porque es lo que el emprendedor puede abrir sin instalar nada.
4. Se le informa que **sus datos se eliminarán a los 90 días** del bloqueo si no se suscribe. Es tiempo suficiente para volver de un mal mes, sin que la plataforma cargue datos muertos indefinidamente.

Esa eliminación a los 90 días es **el único caso en toda la plataforma donde se borran datos físicamente** (ver sección 8). Y aun en ese caso, el historial de los vendedores que trabajaron para esa tienda sobrevive.

### Quién retiene el dinero

El flujo de venta reparte un pago entre dos destinatarios: el emprendedor y el vendedor que la generó. **Quién es titular de esos fondos mientras están en tránsito es una decisión con peso regulatorio**, no un detalle técnico.

El reglamento boliviano de servicios de pago regula la figura de Administradora de Pasarela de Pagos y responsabiliza a las entidades financieras y empresas de servicios de pago por el cumplimiento de las pasarelas que contratan. Retener fondos de terceros y redistribuirlos es intermediación de pagos, y requiere autorización.

Hay dos arquitecturas posibles y **solo una resuelve el problema**:

| Arquitectura                                                                                                                                                        | ¿Resuelve?                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| El comprador paga a la pasarela, y **la pasarela dispersa** directo al emprendedor y al vendedor. Venduo solo instruye el reparto y nunca es titular de los fondos. | **Sí.** Venduo queda como plataforma tecnológica; la actividad regulada la ejerce el sujeto autorizado. |
| El comprador paga a una cuenta de Venduo, y después Venduo transfiere a cada parte.                                                                                 | **No.** Es intermediación de pagos, por más que el cobro entre por una pasarela autorizada.             |

**Decisión: la primera.** La pasarela es **PagoFácil**, que está en proceso de adecuación para operar como Entidad Tecnológica Financiera bajo supervisión de ASFI, mediante la razón social ETF PAYIN & PAYOUT SRL, y publicita dispersión automática de pagos, que es exactamente el reparto que Venduo necesita.

### El pago queda en custodia hasta la entrega

El comprador no le paga al emprendedor: le paga a PagoFácil, y **el dinero queda retenido** hasta que el pedido llega. Recién ahí se libera y se reparte. Es el mismo trato que da Binance entre dos personas que no se conocen, y resuelve la desconfianza de comprarle a un negocio de TikTok: quien paga sabe que no pierde su plata si el producto no aparece.

**La custodia la ejerce PagoFácil, no Venduo.** Venduo nunca recibe ni guarda fondos: solo le da a PagoFácil la orden de liberar o de devolver. Si el dinero pasara por una cuenta de Venduo, aunque fuera un día, sería la segunda arquitectura de la tabla.

El circuito de un pedido:

| Paso | Qué pasa                                                                      | Estado del pedido | Comisión del vendedor |
| ---- | ----------------------------------------------------------------------------- | ----------------- | --------------------- |
| 1    | El comprador confirma su carrito. El pedido nace con los precios recalculados | `pendiente`       | —                     |
| 2    | Paga en PagoFácil. PagoFácil avisa a Venduo, y **el dinero queda retenido**   | `pagado`          | `pendiente`           |
| 3    | El emprendedor coordina la entrega por WhatsApp y **marca el pedido enviado** | `enviado`         | `pendiente`           |
| 4    | El comprador **confirma que lo recibió**, o vence el plazo sin que responda   | `entregado`       | `confirmada`          |
| 5    | Venduo ordena la liberación. PagoFácil dispersa a cada parte                  | `entregado`       | `pagada`              |

**Qué recibe cada uno** cuando se libera: el vendedor, su comisión completa; el emprendedor, el total menos esa comisión y menos el costo de PagoFácil.

**La liberación automática** existe para que un comprador que no vuelve a entrar no deje el dinero retenido para siempre. Corre desde que el pedido se marca enviado.

**Si el comprador reclama** —no le llegó, llegó mal— antes de la liberación, el pedido pasa a `en_disputa` y **el pago queda congelado**. Venduo revisa el caso con las dos partes y decide:

- **A favor del emprendedor:** el pedido pasa a `entregado` y se libera como en el paso 5.
- **A favor del comprador:** el pedido pasa a `cancelado`, Venduo ordena a PagoFácil **devolver** el pago, y la comisión del vendedor se anula.

Una vez liberado el pago ya no hay reclamo posible dentro de la plataforma: el dinero ya salió de la custodia.

Un pedido cancelado antes de pagar no mueve dinero. Uno cancelado después de pagar y antes de enviar se **devuelve** entero.

### Lo que falta confirmar

Con PagoFácil, antes de comprometer la arquitectura:

1. Si la dispersión admite como beneficiario a un tercero que no es el comercio, es decir al vendedor.
2. Qué requisitos de identificación se le exigen a ese beneficiario. Si exigen alta formal de cada vendedor, choca de frente con la promesa de cero barrera de entrada y hay que replantear el circuito de la comisión.
3. Si su servicio admite **retener un cobro y liberarlo por orden de Venduo**, y devolverlo por la misma vía. Todo el modelo de custodia depende de esto.

Del lado del producto:

4. **El plazo de liberación automática.** Se propone 7 días desde que el pedido se marca enviado.
5. **Qué pasa si el emprendedor nunca marca el envío.** Sin una regla, el pago del comprador quedaría retenido sin fecha. Lo razonable es devolverlo pasado un plazo, pero no está decidido.

> Esto no es asesoramiento legal y requiere confirmación profesional antes de operar con dinero real.

### En el MVP

**La pasarela es simulada**, así que la decisión no bloquea el desarrollo: el circuito y sus estados se construyen igual, contra una PagoFácil falsa.

**Lo que hoy está construido no sigue este modelo** y hay que reemplazarlo. La pantalla de pago muestra el QR bancario que subió el emprendedor, el comprador sube una captura de su transferencia, y el emprendedor confirma el pago a mano. En ese flujo el dinero va directo del comprador al comercio, sin custodia: es un arreglo provisorio que se hizo antes de esta decisión, no una base sobre la cual construir.

---

## 6. Alcance del MVP

Flujo de demostración completo:

1. Registro y login del emprendedor
2. Selección de plantilla según rubro
3. Edición de la tienda asistida por IA sobre el catálogo de bloques
4. Tienda pública real, navegable en móvil, con URL propia
5. Gestión de productos con imagen y stock, marcables como nuevos, de segunda mano o reacondicionados
6. Carrito y checkout con datos del cliente
7. Pago por PagoFácil con custodia, sobre una pasarela simulada: el pago se retiene y se libera al confirmarse la entrega
8. Alta de vendedor, con código y enlace propios
9. Atribución de la venta al vendedor mediante el enlace
10. Cálculo automático de comisión
11. Panel del vendedor: sus ventas, sus comisiones, sus materiales
12. Inteligencia de negocio: estadísticas consultadas en lenguaje natural
13. Generador de copys de marketing y publicación en Facebook y WhatsApp
14. Coordinación de entrega por WhatsApp con el detalle del pedido armado por la plataforma, y confirmación de envío y recepción que libera el pago

### Publicación en redes: plan A y plan B

El punto 13 es el de mayor riesgo de alcance, porque no depende solo de nosotros.

- **Plan A — publicación real por API.** Requiere revisión de la aplicación y verificación de negocio por parte de Meta, con plazos que pueden no entrar en 48 horas.
- **Plan B — compartir por intent.** Enlaces de compartir de WhatsApp y Facebook, más copiar al portapapeles. El emprendedor publica con un toque y la demostración se sostiene igual.

Se intenta el plan A; si no llega, entra el plan B. **El modelo de datos soporta los dos sin cambios:** el registro del posteo distingue si fue publicado por API o compartido manualmente.

---

## 7. Decisiones técnicas

### Stack

| Capa                  | Tecnología                                                 |
| --------------------- | ---------------------------------------------------------- |
| Framework             | Next.js 15 (App Router) y TypeScript                       |
| Base de datos         | Supabase, PostgreSQL con Row Level Security                |
| Autenticación         | Supabase Auth                                              |
| Archivos              | Supabase Storage                                           |
| Estilos y componentes | Tailwind CSS y shadcn/ui                                   |
| IA                    | Capa propia con proveedor intercambiable por configuración |
| Hosting               | Vercel                                                     |

### Cuentas y acceso

**Correo y contraseña, sin verificación.** Quien se registra entra al instante: no hay enlace por correo ni código que esperar. La fricción de verificar un correo es exactamente la barrera que la plataforma promete no ponerle a un joven que se suma desde el celular.

El correo **se guarda igual**, así que exigir verificación más adelante es cambiar un ajuste del proyecto, sin migrar datos ni rehacer el formulario.

**Al registrarse se elige con qué intención se entra:** tener un negocio o vender para otros. Esa elección decide qué ve la persona a continuación y, en el caso del vendedor, le crea de una su identidad y su URL pública.

Lo que **no** hace es gobernar permisos. Los permisos siguen derivando de los datos: sos dueño si tenés una tienda, y sos vendedor si tenés un vínculo activo con alguna. Una misma persona puede ser las dos cosas, y la elección del registro no se lo impide — solo dice por dónde empezó.

> El ingreso con Google queda para después: el proveedor no está habilitado y hacerlo exige credenciales de Google Cloud.

### Moneda

**Boliviano, único.** No hay moneda configurable por tienda: es una constante del sistema. Los montos se guardan **en centavos, como enteros**. Nunca se usa punto flotante para dinero.

### URLs

Ruteo **por path, no por subdominio**:

| Ruta        | Qué es                                                                  |
| ----------- | ----------------------------------------------------------------------- |
| `/t/{slug}` | Tienda pública del emprendedor, con su catálogo en `/t/{slug}/catalogo` |
| `/v/{slug}` | Perfil público del vendedor y su enlace de referido                     |
| `/crear`    | Alta de la tienda: plantilla y descripción                              |
| `/sumarme`  | Alta del vendedor: cómo sumarse a una tienda                            |
| `/panel`    | Panel del emprendedor                                                   |
| `/vendedor` | Panel del vendedor                                                      |

Se usa el slug y no el identificador interno porque estas URLs **se imprimen en códigos QR y se mandan por WhatsApp**: tienen que ser legibles y compartibles.

### Lo que no entra

Tan importante como la lista de lo que sí:

- **Multi-tienda por usuario.** Un emprendedor, una tienda.
- **Gestión de envíos.** La entrega se coordina por WhatsApp directamente entre el emprendedor y el comprador: no hay couriers, guías ni seguimiento. Lo que sí hace la plataforma es **armar ese mensaje** con el detalle del pedido y abrir la conversación, y registrar dos marcas —el emprendedor dice _enviado_, el comprador dice _recibido_— porque son las que liberan el pago.
- **Procesar el cobro.** Lo hace PagoFácil. Venduo instruye la liberación, la devolución y el reparto; nunca recibe ni guarda el dinero.
- **Cobro de la suscripción.** Se modela el estado de la suscripción, no el cobro.
- **Notificaciones por email.**
- **Aplicación móvil nativa.** La tienda es responsive; con eso alcanza.
- **Tests automatizados.**

---

## 8. Estructura de la aplicación

### Pantallas

- **Inicio** — presentación del producto
- **Crear** — elección de plantilla y onboarding conversacional
- **Empezar a vender** — el equivalente del vendedor: cómo sumarse a una tienda
- **Panel del emprendedor** — resumen, y desde ahí productos, pedidos, vendedores, estadísticas, apariencia, marketing. Toma la identidad de la plantilla de su tienda
- **Panel del vendedor** — ventas, comisiones, materiales de promoción
- **Tienda pública** — portada, catálogo con filtro de segunda mano, ficha de producto, carrito, checkout, pago y seguimiento del pedido, donde el comprador confirma que lo recibió o reclama. Se dibuja con el kit de su plantilla
- **Perfil público del vendedor** — su historial laboral verificable

### Estrategia de multi-tenancy

**Esquema compartido con aislamiento por Row Level Security.** Toda tabla de negocio lleva el identificador de la tienda, y Postgres impide en la propia base que una tienda vea datos de otra. Se descartan esquema por tienda y base por tienda: rompen la ergonomía de Supabase y son desproporcionados para el proyecto.

**La asimetría que define todo el modelo:**

> Un emprendedor tiene **una sola tienda**. Un vendedor pertenece a **varias**.

El lado del emprendedor es el aislamiento fácil: una comparación directa. Toda la dificultad real está en la tabla que vincula vendedores con tiendas y en las comisiones, que cruzan tenants por naturaleza.

Que sea una tienda por usuario simplifica mucho las políticas de seguridad: la función auxiliar devuelve **un identificador**, no una lista.

**Principio rector:** el identificador de la tienda se repite incluso donde podría deducirse — por ejemplo en los bloques, que ya pertenecen a una página que pertenece a una tienda. Esa redundancia deliberada permite que cada política de seguridad sea una comparación sobre una sola tabla, sin joins ni riesgo de recursión.

### Borrado lógico

**Nada se borra físicamente en la operación normal.** Todas las tablas de negocio llevan una marca de borrado y las consultas filtran por ella.

Tres consecuencias que hay que respetar, porque son las que se olvidan y rompen cosas:

- **Los índices únicos son parciales.** El slug de la tienda, el código de referido y el par tienda-vendedor son únicos **solo entre las filas vivas**. Si no, un registro borrado bloquea para siempre reutilizar ese código.
- **El filtro va en la política de seguridad, no solo en la consulta.** Si se deja únicamente en la capa de datos, cualquier consulta nueva se olvida de excluir lo borrado.
- **Los pedidos no se borran nunca**, ni siquiera lógicamente: se cancelan cambiando su estado.

Las cláusulas de borrado en cascada quedan declaradas en el esquema, pero **solo se disparan en la purga**: la eliminación de una tienda que venció su prueba y no se suscribió, a los 90 días del bloqueo.

### Las tablas

#### Identidad

| Tabla             | Qué guarda                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `profiles`        | Perfil del usuario y con qué intención se registró. Se crea solo al darse de alta, mediante un disparador sobre la tabla de usuarios de Supabase |
| `seller_profiles` | Identidad del vendedor: nombre visible, slug público, ciudad. **Vive fuera de toda tienda** — es lo que sostiene el historial laboral            |

#### Tenant

**`stores`** — la tienda es el tenant.

| Columna                                              | Tipo        | Nota                                                             |
| ---------------------------------------------------- | ----------- | ---------------------------------------------------------------- |
| `id`                                                 | uuid        |                                                                  |
| `owner_id`                                           | uuid        | **Único.** Una tienda por usuario                                |
| `name`, `slug`, `tagline`, `description`, `logo_url` | text        | `slug` con índice único parcial                                  |
| `template_key`                                       | text        | Referencia a la plantilla, anulable si se retira del catálogo    |
| `theme_overrides`                                    | jsonb       | Solo lo que la tienda cambia de su plantilla. `{}` es la base    |
| `commission_bps`                                     | integer     | Porcentaje de comisión en **puntos básicos** (entero, 0 a 10000) |
| `seller_network_enabled`                             | boolean     | Interruptor de la red de vendedores                              |
| `seller_join_mode`                                   | enum        | `abierta` o `con_aprobacion`                                     |
| `is_published`                                       | boolean     |                                                                  |
| `created_at`, `updated_at`, `deleted_at`             | timestamptz |                                                                  |

No hay columna de moneda: es constante del sistema.

**`plans`** — catálogo de planes (`key`, nombre, prestaciones). Preparado para sumar niveles; sin campos de precio hasta que el cobro entre en alcance.

**`subscriptions`** — una por tienda.

| Columna         | Nota                                                                    |
| --------------- | ----------------------------------------------------------------------- |
| `store_id`      | Único                                                                   |
| `plan_key`      |                                                                         |
| `status`        | `prueba`, `activa`, `bloqueada`, `cancelada`                            |
| `trial_ends_at` | Vencimiento de la prueba                                                |
| `blocked_at`    | Cuándo se bloqueó                                                       |
| `purge_at`      | `blocked_at` más 90 días. Marca la única eliminación física del sistema |

#### Catálogo

**`products`** — suma respecto del esquema actual:

| Columna                  | Nota                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `condition`              | `nuevo`, `segunda_mano` o `reacondicionado`. **Lo elige el emprendedor al cargar el producto** y es lo que alimenta el filtro de segunda mano   |
| `condition_note`         | Descripción del estado, para usados                                                                                                             |
| `compare_at_price_cents` | Precio anterior, opcional. Debe ser mayor o igual al precio. Es lo que produce el descuento destacado                                           |
| `seller_enabled`         | Si este producto se puede vender por vendedores. Nace en `true`; el interruptor que manda es el de la tienda. Es lo que arma la vitrina pública |
| `deleted_at`             | Borrado lógico                                                                                                                                  |

#### Venta

**`orders`**

| Columna                              | Nota                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `order_number`                       | Correlativo legible, para que el emprendedor pueda nombrar un pedido                                                           |
| `buyer_name`                         | Obligatorio                                                                                                                    |
| `buyer_phone`                        | **Obligatorio.** Es el canal por el que se coordina la entrega                                                                 |
| `buyer_email`                        | Opcional                                                                                                                       |
| `seller_id`                          | **Anulable.** Vacío es venta directa por carrito; con valor es venta referida. Un solo flujo de compra, dos modelos de negocio |
| `referral_code`                      | Copia textual del código usado, sobrevive al borrado del vínculo                                                               |
| `subtotal_cents`, `total_cents`      |                                                                                                                                |
| `commission_bps`, `commission_cents` | **Congelados al momento de la venta**                                                                                          |
| `commission_base_cents`              | Sobre cuánto se calculó la comisión: solo los productos con `seller_enabled`. También congelado                                |
| `net_to_store_cents`                 | Lo que le corresponde al emprendedor: el total menos la comisión del vendedor y menos el costo de PagoFácil                    |
| `status`                             | `pendiente`, `pagado`, `enviado`, `entregado`, `en_disputa`, `cancelado`. El circuito está en la sección 5                     |
| `payment_reference`                  | El identificador del cobro en PagoFácil. Es con lo que se le ordena liberar o devolver                                         |
| `paid_at`                            | Cuándo PagoFácil confirmó el pago y empezó la custodia                                                                         |
| `shipped_at`, `delivered_at`         | Las dos marcas que liberan el pago: el envío del emprendedor y la recepción del comprador                                      |
| `release_due_at`                     | Cuándo se libera solo si el comprador no confirma                                                                              |
| `released_at`, `refunded_at`         | Cuándo se ordenó a PagoFácil repartir o devolver. Son excluyentes                                                              |
| `disputed_at`, `dispute_reason`      | El reclamo del comprador, que congela el pago hasta que Venduo resuelve                                                        |

Sin marca de borrado: un pedido se cancela, no se borra.

**`stores` suma los datos para recibir la dispersión** —la cuenta donde PagoFácil deposita al emprendedor—, y `seller_profiles` los del vendedor. Qué datos exactos pide PagoFácil está en lo que falta confirmar. El QR bancario y la captura de transferencia del flujo provisorio (`stores.payment_qr_url`, `orders.payment_proof_url`) se retiran al reemplazarlo.

**`order_items`** — líneas del pedido, con el nombre y el precio del producto copiados al momento de la compra. Lleva también el identificador de la tienda por el principio de redundancia deliberada.

#### Red de vendedores

**`store_sellers`** — el vínculo tienda-vendedor. Es el corazón del multi-tenancy cruzado.

| Columna                                   | Nota                                                       |
| ----------------------------------------- | ---------------------------------------------------------- |
| `store_id`, `user_id`                     | Únicos como par, entre filas vivas                         |
| `referral_code`                           | Único entre filas vivas. Es lo que va en el enlace y el QR |
| `status`                                  | `pendiente`, `activo`, `rechazado`, `suspendido`           |
| `joined_at`, `approved_at`, `approved_by` |                                                            |
| `deleted_at`                              |                                                            |

El estado inicial depende de `seller_join_mode` de la tienda: `activo` si el alta es abierta, `pendiente` si exige aprobación.

**`commissions`** — el ciclo de vida del pago al vendedor.

| Columna                                         | Nota                                                                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `order_id`                                      | **Único.** Defensa contra el doble conteo si el pedido oscila entre estados                                          |
| `store_id`                                      | **Anulable, no cascada**                                                                                             |
| `store_name`                                    | **Copia del nombre de la tienda**                                                                                    |
| `seller_id`                                     | Anulable                                                                                                             |
| `seller_user_id`                                | Obligatorio. Redundante a propósito, para que la política de seguridad del panel del vendedor no necesite un join    |
| `base_amount_cents`, `rate_bps`, `amount_cents` | La tasa **congelada** al momento de la venta                                                                         |
| `status`                                        | `pendiente` mientras el pago está retenido, `confirmada` al liberarse, `pagada` cuando PagoFácil dispersó, `anulada` |
| `paid_at`, `payment_reference`                  | Cuándo y con qué referencia PagoFácil le transfirió al vendedor                                                      |

**Por qué el vínculo con la tienda es anulable y el nombre va copiado.** Cuando se purga una tienda que no se suscribió, la comisión sobrevive con el nombre del comercio y el historial del vendedor queda intacto. Si la comisión se borrara en cascada, el día que un emprendedor abandona la plataforma se borraría el antecedente laboral de todos sus vendedores — exactamente lo que la plataforma promete no hacer.

#### Tienda visual

| Tabla                         | Qué guarda                                                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `block_types`                 | **Catálogo global.** Cada tipo de bloque con su esquema de propiedades y sus valores por defecto                                                     |
| `templates`, `template_pages` | **Catálogo global.** Ficha, versión y bloques sembrados de cada plantilla. Su identidad visual vive en código: ver `docs/store-templates.md`         |
| `sectors`                     | **Catálogo global.** Los rubros con su nombre visible y su orden. `templates.sector` lo referencia, y es lo que agrupa la galería del alta           |
| `store_invites`               | El código de invitación de cada tienda. **RLS activo y cero políticas**: ni el dueño la lee directamente, llega a su código por `my_seller_invite()` |
| `insights`                    | Gráficos guardados. Guarda la **especificación**, no las filas: se recalcula con los datos de cada día                                               |
| `store_pages`                 | Páginas concretas de cada tienda, con estado borrador o publicada                                                                                    |
| `store_blocks`                | Bloques concretos: tipo, posición, propiedades en JSON y visibilidad                                                                                 |
| `block_edit_proposals`        | Lo que la IA propuso, con el estado previo guardado                                                                                                  |
| `store_design_versions`       | Puntos de restauración del diseño: plantilla, personalización y páginas con bloques. Se toman antes de cada cambio; solo las escriben funciones      |

El vínculo de un bloque con su tipo **no se puede romper**: no se retira del catálogo un tipo de bloque que alguna tienda esté usando.

El filtro de segunda mano no es un tipo de bloque aparte: es una **propiedad del bloque de grilla de productos**.

#### IA y difusión

| Tabla                | Qué guarda                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai_generations`     | Historial de todo lo que generó la IA: tipo, proveedor, modelo, prompt y salida                                                                                  |
| `social_connections` | Credenciales de Facebook y WhatsApp por tienda. **Sin políticas de lectura: solo accesible desde el servidor**                                                   |
| `social_posts`       | Posteos generados. Su estado distingue `publicado` por API de `compartido` manualmente, que es lo que permite sostener el plan A y el plan B con el mismo modelo |

### Comisiones: el congelamiento

Es el punto más importante del modelo y el más fácil de hacer mal.

- **La tasa se congela en el momento de la venta.** Cambiar el porcentaje de la tienda después no reescribe la historia. Un vendedor que vendió con 15% cobra 15%, aunque hoy la tienda pague 10%.
- **Montos en centavos enteros, porcentajes en puntos básicos enteros.** Nunca punto flotante.
- **Ciclo:** `pendiente` → `confirmada` → `pagada`, más `anulada`, atado a la custodia: nace `pendiente` cuando el pago entra y queda retenido, pasa a `confirmada` cuando se libera, y a `pagada` cuando PagoFácil transfirió. Un pedido cancelado o resuelto a favor del comprador **anula** la comisión; nunca la borra.
- **El historial laboral cuenta solo `confirmada` y `pagada`.** Una venta con el pago todavía retenido puede terminar en devolución, así que no es trabajo hecho hasta que se libera.
- **Una comisión por pedido**, garantizado por índice único. Sin eso, un pedido que va y vuelve entre estados genera comisiones duplicadas.

### Cómo se hace cumplir el aislamiento

El patrón, con las trampas que hay que esquivar:

**Funciones auxiliares.** Se define una función que devuelve la tienda del usuario y otra que devuelve sus vínculos activos como vendedor. Las políticas quedan como comparaciones simples:

```sql
-- El dueño ve los pedidos de su tienda
using (store_id = public.my_store_id())

-- El vendedor ve los pedidos que él generó, en todas las tiendas donde trabaja
using (seller_id = any (public.my_seller_ids()))
```

**Trampa de recursión.** Una política sobre la tabla de vendedores que consulte esa misma tabla entra en recursión infinita. Por eso los auxiliares se declaran con permisos elevados y saltan la política.

**Trampa de rendimiento.** La identidad del usuario debe evaluarse una vez por consulta, no una vez por fila. Se logra envolviéndola como subconsulta:

```sql
using (seller_user_id = (select auth.uid()))
```

**El checkout no es una inserción del cliente.** Un comprador anónimo que inserta directamente en la tabla de pedidos puede declarar el total que quiera. Por eso la tabla de pedidos **no tiene política de inserción**: el pedido se crea mediante una función del servidor que **recalcula los precios desde el catálogo** y resuelve el código de referido validando que pertenezca a esa tienda y esté activo.

---

## 9. Los tres usos de la inteligencia artificial

Todos siguen el mismo patrón: se pide una respuesta estructurada, se valida antes de usarla y existe un plan alternativo si falla. **La IA nunca ejecuta nada por su cuenta: propone, el sistema valida y ejecuta.**

Las tres llamadas pasan por una capa propia que traduce el pedido al formato del proveedor elegido. Cambiar de modelo o de proveedor es cambiar una configuración, no reescribir los módulos.

### Edición de la tienda

Sobre la plantilla que eligió el emprendedor, se le entrega a la IA el catálogo de tipos de bloque disponibles con sus esquemas de propiedades, y el estado actual de la página. La IA devuelve una **lista de operaciones**: agregar un bloque, quitarlo, editar sus propiedades o moverlo de posición.

El sistema guarda esa propuesta junto con el estado previo, valida cada operación contra el esquema del tipo de bloque correspondiente, y recién entonces la aplica en una transacción. Guardar el estado previo habilita deshacer, que en una demostración en vivo vale mucho.

La misma lógica alcanza a la apariencia: una personalización de colores, letra o disposición sobre la plantilla se valida contra `personalizacionSchema` —incluido el contraste— y cada cambio deja una versión en `store_design_versions`. **La arquitectura y persistencia para esa edición ya están preparadas; la edición en vivo con IA todavía no está implementada.**

### Inteligencia de negocio

Recibe la pregunta del emprendedor y resuelve tres cosas en orden: qué datos necesita, qué tipo de gráfico comunica mejor ese resultado, y cómo se arma la consulta con los parámetros que dio el usuario.

Las defensas, que no son opcionales:

- **La IA solo lee.** Nunca elimina, actualiza ni ejecuta nada que modifique datos. Se ejecuta con un rol de base de datos de **solo lectura**.
- **El identificador de la tienda lo impone el sistema, nunca la IA.** El filtro se inyecta del lado del servidor, después de recibir la propuesta.
- **Lista blanca de tablas**, tiempo máximo de consulta y tope de filas.

> Esto es más ambicioso que lo que existe hoy: `lib/ai/tasks.ts` resuelve `analyzeSales` recibiendo un arreglo de ventas ya calculado, sin generar consultas.

### Marketing

Recibe un producto y devuelve textos adaptados a Facebook y WhatsApp. La generación y la publicación son dos pasos separados: la IA genera, el emprendedor revisa, y recién entonces se publica por API o se comparte manualmente según el plan que esté activo.
