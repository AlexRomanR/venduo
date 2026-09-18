# Venduo

**Documento maestro del proyecto** — hackathon de 48 horas
Desafío: empleabilidad juvenil · Enfoque: triple impacto

---

## 1. Qué es Venduo

Un Marketplace donde un negocio publica lo que produce declarando **solo su costo base**, y una red de jóvenes sin capital lo vende por sus redes a cambio de una comisión automática. El negocio no fija precios ni contrata a nadie: la plataforma construye el precio final sumando al costo base la comisión del vendedor y su propio take-rate, los dos escalados según el rango de precio del producto.

El joven que trae por primera vez a un comprador **se queda asociado a él**: si ese comprador vuelve y compra por su cuenta en el Marketplace, el joven cobra igual, una comisión indirecta.

**En una frase:** el negocio pone el producto, el joven pone la venta, y el precio, la comisión y el reparto los calcula la plataforma.

> **El modelo de negocio completo está en `docs/modelo-de-negocio.md`**: los porcentajes, la atribución del comprador y lo que queda por decidir. Este documento cubre el producto y su construcción.

---

## 2. El problema

**Lado joven.** En Bolivia el 96,2% de los jóvenes que trabajan lo hacen en la informalidad, la tasa más alta de la región. El desempleo juvenil duplica al general (6% contra 3,1%) y siete de cada diez ganan menos de Bs 2.500 al mes. El problema no es que falte trabajo: es que el trabajo disponible no paga, no forma y no deja historial que puedan mostrar después.

**Lado del negocio.** Un volumen enorme del comercio boliviano ocurre informalmente por Facebook Marketplace, WhatsApp y TikTok, sin plataforma detrás. Menos del 30% de las pymes bolivianas tiene sitio web. Ese negocio no tiene canal digital, no tiene números, promociona a mano en cinco redes y no puede contratar a nadie porque no le alcanza para un sueldo fijo ni para pagar publicidad por adelantado.

**La conexión:** cada problema es la solución del otro. Nadie los había conectado.

---

## 3. Cómo funciona

### Para el negocio

1. Se registra y carga sus productos con foto, stock y condición —nuevo, de segunda mano o reacondicionado—, declarando de cada uno **su costo base**: lo que quiere recibir por él.
2. No fija precio final ni porcentajes. El sistema arma el precio sumando la comisión del vendedor y el take-rate, y le muestra a cuánto queda publicado.
3. El producto entra al Marketplace y queda disponible para que cualquier joven lo elija. No aprueba vendedores ni negocia con ellos.
4. Cobra por PagoFácil: el dinero queda retenido hasta que el comprador recibe el pedido, y recibe su costo base completo.
5. Consulta sus números preguntando en lenguaje natural y genera piezas de promoción con IA.

**Lo que paga es 100% variable**: no hay publicidad por adelantado ni cuota mensual. Si la venta la trajo un joven, la comisión sale del precio; si el comprador llegó solo al Marketplace, ese componente le vuelve.

### Para el vendedor

1. Se registra y recorre el catálogo del Marketplace. **Elige los productos que quiere vender, sin pedirle permiso a nadie** y sin poner un peso.
2. Recibe un enlace y un QR propios por producto, más los materiales de promoción que la IA generó.
3. Vende por sus redes, en su barrio o cara a cara.
4. Cada venta que entra por su enlace le genera comisión automática, calculada según el rango de precio del producto, que cobra directo de PagoFácil cuando el comprador recibe el pedido.
5. **El comprador que trajo queda asociado a él.** Si vuelve al Marketplace y compra por su cuenta dentro de la ventana de atribución, el joven cobra una comisión indirecta sin hacer nada.
6. Acumula un historial de ventas verificable: su primer antecedente laboral real.

### El historial laboral verificable

Es la promesa central de la plataforma hacia el vendedor, y funciona así:

Cada vendedor tiene un **perfil público y permanente** en una URL estable. Reúne sus ventas confirmadas, el monto total que generó, para cuántos negocios vendió, en qué rubros, la fecha de su primera venta y su antigüedad activa. Se puede exportar para adjuntar a una postulación.

Tres propiedades lo hacen creíble como antecedente laboral:

- **No lo edita el vendedor.** Se construye solo, a partir de comisiones confirmadas.
- **Sobrevive al negocio.** Si un negocio abandona la plataforma y sus datos se eliminan, el historial del vendedor queda intacto. Esto no es una aspiración: está garantizado por el diseño de la base de datos (ver sección 8).
- **Es verificable por un tercero.** La URL es pública y estable; quien recibe el currículum puede abrirla y comprobarlo.

---

## 4. Los módulos

| Módulo                      | Qué hace                                                                                                                       | Para quién |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| **Marketplace**             | Un solo catálogo: el comprador busca y compra, y el joven elige de ahí lo que va a vender                                      | Ambos      |
| **Motor de precio**         | Del costo base al precio publicado: calcula comisión y take-rate por rango, y los congela en cada venta                        | Ambos      |
| **Atribución y comisiones** | Enlaces de referido, comprador asociado a su promotor, comisión directa e indirecta, calculadas automáticamente                | Ambos      |
| **Cobro con custodia**      | El comprador paga en PagoFácil, el dinero queda retenido y se reparte entre negocio, joven y plataforma cuando llega el pedido | Ambos      |
| **Inteligencia de negocio** | Preguntas en lenguaje natural que devuelven gráficos y estadísticas                                                            | Negocio    |
| **Marketing con IA**        | Genera copys y piezas adaptadas a cada red social, listos para publicar en Facebook y WhatsApp                                 | Ambos      |
| **Segunda mano**            | Filtro del catálogo que reúne los productos usados y reacondicionados, con los descuentos destacados                           | Comprador  |

**Sobre la segunda mano:** no es una sección aparte que se genera sola. Es un **filtro dentro del catálogo**. Lo que define que un producto sea de segunda mano es un campo que el negocio elige al cargarlo, junto con un precio de comparación opcional que produce el descuento destacado.

> **El editor de tienda con IA y las plantillas por rubro quedaron fuera del modelo** cuando el canal pasó a ser un solo Marketplace. El código construido sigue en el repositorio y funciona; qué se hace con él es una decisión pendiente. Está documentado en `docs/store-templates.md`.

---

## 5. Modelo de negocio

- **Único ingreso: el take-rate.** Un porcentaje escalonado por rango de precio, **sumado** al costo base al construir el precio final. No se descuenta de una venta ya fijada: se agrega antes de publicarla.
- **Sin suscripción.** El negocio no paga nada por estar: si no vende, no paga.
- **La comisión del vendedor no es ingreso de la plataforma.** Es un costo que pasa del negocio al joven a través del sistema. Contarla como facturación sería inflarla con plata ajena.
- **La comisión de PagoFácil sale de la parte del negocio**, nunca de la del joven: lo que le toca al joven lo cobra completo.
- **El vendedor no paga nunca nada.** Cero barrera de entrada.
- **Costos:** infraestructura que escala con el uso e IA solo en momentos de alto valor. El costo marginal por negocio nuevo es de centavos.

### El precio se construye

```
precio final  =  costo base  +  comisión del vendedor  +  take-rate
```

Los dos porcentajes se escalan según el rango de precio: más altos en productos baratos, donde un porcentaje chico no paga el esfuerzo de la venta, y más bajos en los caros, donde uno alto dejaría el producto fuera de mercado.

Cuando la compra es directa en el Marketplace, el componente de comisión **no desaparece del precio**: va al promotor asociado al comprador como comisión indirecta, o vuelve al negocio si no hay ninguno vigente. El comprador paga lo mismo por cualquier camino.

**La tabla de rangos, la ventana de atribución y sus porcentajes están en `docs/modelo-de-negocio.md`**, con una propuesta pendiente de confirmar.

### Quién retiene el dinero

El flujo de venta reparte un pago entre tres destinatarios: el negocio, el joven que la generó y la propia plataforma. **Quién es titular de esos fondos mientras están en tránsito es una decisión con peso regulatorio**, no un detalle técnico.

El reglamento boliviano de servicios de pago regula la figura de Administradora de Pasarela de Pagos y responsabiliza a las entidades financieras y empresas de servicios de pago por el cumplimiento de las pasarelas que contratan. Retener fondos de terceros y redistribuirlos es intermediación de pagos, y requiere autorización.

Hay dos arquitecturas posibles y **solo una resuelve el problema**:

| Arquitectura                                                                                                                                                                                                                 | ¿Resuelve?                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| El comprador paga a la pasarela, y **la pasarela dispersa** directo al negocio, al joven y a Venduo. Venduo solo instruye el reparto, y de los fondos ajenos nunca es titular: recibe su take-rate como un beneficiario más. | **Sí.** Venduo queda como plataforma tecnológica; la actividad regulada la ejerce el sujeto autorizado. |
| El comprador paga a una cuenta de Venduo, y después Venduo transfiere a cada parte.                                                                                                                                          | **No.** Es intermediación de pagos, por más que el cobro entre por una pasarela autorizada.             |

**Decisión: la primera.** La pasarela es **PagoFácil**, que está en proceso de adecuación para operar como Entidad Tecnológica Financiera bajo supervisión de ASFI, mediante la razón social ETF PAYIN & PAYOUT SRL, y publicita dispersión automática de pagos, que es exactamente el reparto que Venduo necesita.

### El pago queda en custodia hasta la entrega

El comprador no le paga al negocio: le paga a PagoFácil, y **el dinero queda retenido** hasta que el pedido llega. Recién ahí se libera y se reparte. Es el mismo trato que da Binance entre dos personas que no se conocen, y resuelve la desconfianza de comprarle a un negocio de TikTok: quien paga sabe que no pierde su plata si el producto no aparece.

**La custodia la ejerce PagoFácil, no Venduo.** Venduo nunca recibe ni guarda fondos: solo le da a PagoFácil la orden de liberar o de devolver. Si el dinero pasara por una cuenta de Venduo, aunque fuera un día, sería la segunda arquitectura de la tabla.

El circuito de un pedido:

| Paso | Qué pasa                                                                      | Estado del pedido | Comisión del vendedor |
| ---- | ----------------------------------------------------------------------------- | ----------------- | --------------------- |
| 1    | El comprador confirma su carrito. El pedido nace con los precios recalculados | `pendiente`       | —                     |
| 2    | Paga en PagoFácil. PagoFácil avisa a Venduo, y **el dinero queda retenido**   | `pagado`          | `pendiente`           |
| 3    | El negocio coordina la entrega por WhatsApp y **marca el pedido enviado**     | `enviado`         | `pendiente`           |
| 4    | El comprador **confirma que lo recibió**, o vence el plazo sin que responda   | `entregado`       | `confirmada`          |
| 5    | Venduo ordena la liberación. PagoFácil dispersa a cada parte                  | `entregado`       | `pagada`              |

**Qué recibe cada uno** cuando se libera:

| Quién      | Cuánto                                                                           |
| ---------- | -------------------------------------------------------------------------------- |
| El negocio | Su costo base, menos el costo de PagoFácil                                       |
| El joven   | Su comisión completa: directa si vendió él, indirecta si solo trajo al comprador |
| Venduo     | El take-rate                                                                     |

Si la compra fue directa y no hay promotor vigente, el componente de comisión se suma a lo que recibe el negocio.

**La liberación automática** existe para que un comprador que no vuelve a entrar no deje el dinero retenido para siempre. Corre desde que el pedido se marca enviado.

**Si el comprador reclama** —no le llegó, llegó mal— antes de la liberación, el pedido pasa a `en_disputa` y **el pago queda congelado**. Venduo revisa el caso con las dos partes y decide:

- **A favor del negocio:** el pedido pasa a `entregado` y se libera como en el paso 5.
- **A favor del comprador:** el pedido pasa a `cancelado`, Venduo ordena a PagoFácil **devolver** el pago, y la comisión del vendedor se anula.

Una vez liberado el pago ya no hay reclamo posible dentro de la plataforma: el dinero ya salió de la custodia.

Un pedido cancelado antes de pagar no mueve dinero. Uno cancelado después de pagar y antes de enviar se **devuelve** entero.

### Lo que falta confirmar

Con PagoFácil, antes de comprometer la arquitectura:

1. Si la dispersión admite **tres beneficiarios en un mismo cobro** —el negocio, el joven y Venduo— y si uno de ellos puede ser un tercero que no es el comercio.
2. Qué requisitos de identificación se le exigen a ese beneficiario. Si exigen alta formal de cada vendedor, choca de frente con la promesa de cero barrera de entrada y hay que replantear el circuito de la comisión.
3. Si su servicio admite **retener un cobro y liberarlo por orden de Venduo**, y devolverlo por la misma vía. Todo el modelo de custodia depende de esto.

Del lado del producto:

4. **El plazo de liberación automática.** Se propone 7 días desde que el pedido se marca enviado.
5. **Qué pasa si el negocio nunca marca el envío.** Sin una regla, el pago del comprador quedaría retenido sin fecha. Lo razonable es devolverlo pasado un plazo, pero no está decidido.

Y del modelo, en `docs/modelo-de-negocio.md` §8: la tabla de rangos, la ventana de atribución, cómo se reconoce a un comprador entre compras sin pedirle cuenta, y el costo base mínimo.

> Esto no es asesoramiento legal y requiere confirmación profesional antes de operar con dinero real.

### En el MVP

**La pasarela es simulada**, así que la decisión no bloquea el desarrollo: el circuito y sus estados se construyen igual, contra una PagoFácil falsa.

**Lo que hoy está construido no sigue este modelo** y hay que reemplazarlo. La pantalla de pago muestra el QR bancario que subió el negocio, el comprador sube una captura de su transferencia, y el negocio confirma el pago a mano. En ese flujo el dinero va directo del comprador al comercio, sin custodia ni reparto: es un arreglo provisorio que se hizo antes de esta decisión, no una base sobre la cual construir.

---

## 6. Alcance del MVP

Flujo de demostración completo:

1. Registro y login de los dos lados: negocio y joven
2. Carga de productos con imagen, stock y condición, declarando **solo el costo base**
3. Cálculo automático del precio publicado: costo base más comisión más take-rate, por rango
4. Marketplace navegable en móvil: catálogo, búsqueda, filtros y ficha de producto
5. El joven elige productos del catálogo y obtiene su enlace y su QR por producto
6. Carrito y checkout con datos del comprador
7. Pago por PagoFácil con custodia, sobre una pasarela simulada: se retiene y se reparte al confirmarse la entrega
8. Reparto a tres: costo base al negocio, comisión al joven, take-rate a la plataforma
9. Atribución del comprador al promotor que lo trajo, con su ventana de vigencia
10. Comisión indirecta en la compra directa del comprador atribuido, y retorno al negocio si no lo está
11. Panel del joven: sus ventas, sus comisiones directas e indirectas, sus materiales
12. Inteligencia de negocio: estadísticas consultadas en lenguaje natural
13. Generador de copys de marketing y publicación en Facebook y WhatsApp
14. Coordinación de entrega por WhatsApp con el detalle del pedido armado por la plataforma, y confirmación de envío y recepción que libera el pago

### Publicación en redes: plan A y plan B

El punto 13 es el de mayor riesgo de alcance, porque no depende solo de nosotros.

- **Plan A — publicación real por API.** Requiere revisión de la aplicación y verificación de negocio por parte de Meta, con plazos que pueden no entrar en 48 horas.
- **Plan B — compartir por intent.** Enlaces de compartir de WhatsApp y Facebook, más copiar al portapapeles. El negocio publica con un toque y la demostración se sostiene igual.

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

| Ruta        | Qué es                                                          |
| ----------- | --------------------------------------------------------------- |
| `/`         | El Marketplace: catálogo, búsqueda y filtros                    |
| `/p/{slug}` | Ficha de producto. Con `?ref={codigo}` es el enlace de un joven |
| `/n/{slug}` | Página del negocio dentro del Marketplace                       |
| `/v/{slug}` | Perfil público del vendedor y su historial laboral              |
| `/panel`    | Panel del negocio                                               |
| `/vendedor` | Panel del joven                                                 |

Se usa el slug y no el identificador interno porque estas URLs **se imprimen en códigos QR y se mandan por WhatsApp**: tienen que ser legibles y compartibles.

> Las rutas de hoy son las del modelo anterior, con `/t/{slug}` para la tienda de cada negocio. Las de esta tabla son el destino; el estado real está en `.agents/rules/architecture.md` y en `docs/estado-del-proyecto.md`.

### Lo que no entra

Tan importante como la lista de lo que sí:

- **Multi-negocio por usuario.** Una persona, un negocio.
- **Que el negocio fije el precio final o sus porcentajes.** Declara su costo base; el resto lo calcula la plataforma.
- **Tienda online propia por negocio, con plantillas.** El canal es el Marketplace. Lo construido queda en el repositorio, fuera del modelo.
- **Suscripción.** El único ingreso es el take-rate.
- **Aprobación de vendedores, invitaciones y vínculo con una tienda.** El joven elige del catálogo sin pedir permiso.
- **Gestión de envíos.** La entrega se coordina por WhatsApp directamente entre el negocio y el comprador: no hay couriers, guías ni seguimiento. Lo que sí hace la plataforma es **armar ese mensaje** con el detalle del pedido y abrir la conversación, y registrar dos marcas —el negocio dice _enviado_, el comprador dice _recibido_— porque son las que liberan el pago.
- **Procesar el cobro.** Lo hace PagoFácil. Venduo instruye la liberación, la devolución y el reparto; nunca recibe ni guarda el dinero de las otras dos partes.
- **Notificaciones por email.**
- **Aplicación móvil nativa.** El Marketplace es responsive; con eso alcanza.
- **Tests automatizados.**

---

## 8. Estructura de la aplicación

### Pantallas

- **Marketplace** — el catálogo de todos los negocios, con búsqueda, filtros y el de segunda mano; ficha de producto; carrito, checkout, pago y seguimiento del pedido, donde el comprador confirma que lo recibió o reclama
- **Página del negocio** — quién es y qué vende, dentro del Marketplace
- **Alta del negocio** — registro y carga del primer producto con su costo base
- **Alta del joven** — registro y recorrido del catálogo para elegir qué vender
- **Panel del negocio** — resumen, productos con su costo base y su precio publicado, pedidos, estadísticas, marketing
- **Panel del joven** — sus productos elegidos, sus ventas, sus comisiones directas e indirectas, sus materiales
- **Perfil público del vendedor** — su historial laboral verificable

### Estrategia de multi-tenancy

**Esquema compartido con aislamiento por Row Level Security.** Toda tabla de negocio lleva el identificador del negocio, y Postgres impide en la propia base que un negocio vea datos de otro. El catálogo del Marketplace es público: lo que se aísla son los pedidos, las comisiones y los datos de cobro. Se descartan esquema por tienda y base por tienda: rompen la ergonomía de Supabase y son desproporcionados para el proyecto.

**La asimetría que define todo el modelo:**

> Una persona tiene **un solo negocio**. Un joven vende productos de **muchos**.

El lado del negocio es el aislamiento fácil: una comparación directa. Toda la dificultad real está en las comisiones y en los productos que cada joven tomó, que cruzan tenants por naturaleza.

Que sea un negocio por usuario simplifica mucho las políticas de seguridad: la función auxiliar devuelve **un identificador**, no una lista.

**Principio rector:** el identificador de la tienda se repite incluso donde podría deducirse — por ejemplo en los bloques, que ya pertenecen a una página que pertenece a una tienda. Esa redundancia deliberada permite que cada política de seguridad sea una comparación sobre una sola tabla, sin joins ni riesgo de recursión.

### Borrado lógico

**Nada se borra físicamente en la operación normal.** Todas las tablas de negocio llevan una marca de borrado y las consultas filtran por ella.

Tres consecuencias que hay que respetar, porque son las que se olvidan y rompen cosas:

- **Los índices únicos son parciales.** El slug de la tienda, el código de referido y el par tienda-vendedor son únicos **solo entre las filas vivas**. Si no, un registro borrado bloquea para siempre reutilizar ese código.
- **El filtro va en la política de seguridad, no solo en la consulta.** Si se deja únicamente en la capa de datos, cualquier consulta nueva se olvida de excluir lo borrado.
- **Los pedidos no se borran nunca**, ni siquiera lógicamente: se cancelan cambiando su estado.

Las cláusulas de borrado en cascada quedan declaradas en el esquema, pero **solo se disparan en la purga**: la eliminación definitiva de un negocio que se dio de baja. Con qué plazo y con qué disparador es una decisión abierta: al quitarse la suscripción desapareció el vencimiento de la prueba, que era lo que la activaba. Aun así, **el historial de los jóvenes que vendieron para ese negocio sobrevive**.

### Las tablas

#### Identidad

| Tabla             | Qué guarda                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `profiles`        | Perfil del usuario y con qué intención se registró. Se crea solo al darse de alta, mediante un disparador sobre la tabla de usuarios de Supabase |
| `seller_profiles` | Identidad del vendedor: nombre visible, slug público, ciudad. **Vive fuera de todo negocio** — es lo que sostiene el historial laboral           |

#### Tenant

**`stores`** — el negocio es el tenant. La tabla conserva su nombre en inglés; lo que representa ahora es el negocio, no una tienda con vitrina propia.

| Columna                                              | Tipo        | Nota                                                                        |
| ---------------------------------------------------- | ----------- | --------------------------------------------------------------------------- |
| `id`                                                 | uuid        |                                                                             |
| `owner_id`                                           | uuid        | **Único.** Un negocio por usuario                                           |
| `name`, `slug`, `tagline`, `description`, `logo_url` | text        | `slug` con índice único parcial. Es la página del negocio en el Marketplace |
| `is_published`                                       | boolean     | Si su catálogo se sirve                                                     |
| `created_at`, `updated_at`, `deleted_at`             | timestamptz |                                                                             |

No hay columna de moneda: es constante del sistema. Y **no hay porcentaje de comisión por negocio**: lo define la tabla de rangos, igual para todos.

Quedan de la etapa anterior, fuera del modelo vigente: `template_key` y `theme_overrides` —la plantilla de su tienda—, `commission_bps`, `seller_network_enabled` y `seller_join_mode` —la red de vendedores por tienda—, y las columnas del cobro provisorio por QR.

**`plans` y `subscriptions` — fuera del modelo vigente.** Sostenían la suscripción mensual, que dejó de ser el ingreso. Siguen en la base hasta decidir si se retiran.

**`subscriptions`** — una por negocio, mientras exista.

| Columna         | Nota                                                                    |
| --------------- | ----------------------------------------------------------------------- |
| `store_id`      | Único                                                                   |
| `plan_key`      |                                                                         |
| `status`        | `prueba`, `activa`, `bloqueada`, `cancelada`                            |
| `trial_ends_at` | Vencimiento de la prueba                                                |
| `blocked_at`    | Cuándo se bloqueó                                                       |
| `purge_at`      | `blocked_at` más 90 días. Marca la única eliminación física del sistema |

#### Catálogo

**`products`** — el cambio más importante del modelo vigente, y **ya construido**: el negocio declara el costo base y la plataforma calcula el precio, con `pricing_tiers` y el disparador `producto_precio`.

| Columna                      | Nota                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `base_cost_cents`            | **Lo declara el negocio.** Es lo que recibe por el producto, y la única cifra que escribe                           |
| `price_cents`                | El precio publicado. **Derivado**: costo base más comisión más take-rate. Lo recalcula la base, nunca la aplicación |
| `commission_bps`, `take_bps` | Los porcentajes del rango que le tocó, copiados para poder mostrar el desglose sin recalcular                       |

Lo que ya existía y sigue igual:

| Columna                  | Nota                                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `condition`              | `nuevo`, `segunda_mano` o `reacondicionado`. **Lo elige el negocio al cargar el producto** y es lo que alimenta el filtro de segunda mano |
| `condition_note`         | Descripción del estado, para usados                                                                                                       |
| `compare_at_price_cents` | Precio anterior, opcional. Debe ser mayor o igual al precio. Es lo que produce el descuento destacado                                     |
| `seller_enabled`         | Si este producto se puede vender por jóvenes. Nace en `true`. Apagarlo lo saca de lo que se puede tomar, no del Marketplace               |
| `deleted_at`             | Borrado lógico                                                                                                                            |

#### Venta

**`orders`**

| Columna                              | Nota                                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `order_number`                       | Correlativo legible, para que el negocio pueda nombrar un pedido                                                              |
| `buyer_name`                         | Obligatorio                                                                                                                   |
| `buyer_phone`                        | **Obligatorio.** Es el canal por el que se coordina la entrega                                                                |
| `buyer_email`                        | Opcional                                                                                                                      |
| `seller_id`                          | **Anulable.** Con valor, la venta entró por el enlace de un joven; vacío, es compra directa del Marketplace                   |
| `attributed_seller_id`               | **Anulable.** En una compra directa, el promotor al que estaba asociado el comprador y que cobra la comisión indirecta        |
| `referral_code`                      | Copia textual del código usado, sobrevive al borrado del vínculo                                                              |
| `subtotal_cents`, `total_cents`      |                                                                                                                               |
| `commission_bps`, `commission_cents` | **Congelados al momento de la venta**                                                                                         |
| `commission_base_cents`              | Sobre cuánto se calculó la comisión: solo los productos con `seller_enabled`. También congelado                               |
| `base_cost_cents`, `take_cents`      | Los otros dos componentes del precio, **congelados** igual que la comisión. Los tres suman exactamente el total               |
| `net_to_store_cents`                 | Lo que le corresponde al negocio: su costo base, más el componente de comisión si nadie lo cobra, menos el costo de PagoFácil |
| `status`                             | `pendiente`, `pagado`, `enviado`, `entregado`, `en_disputa`, `cancelado`. El circuito está en la sección 5                    |
| `payment_reference`                  | El identificador del cobro en PagoFácil. Es con lo que se le ordena liberar o devolver                                        |
| `paid_at`                            | Cuándo PagoFácil confirmó el pago y empezó la custodia                                                                        |
| `shipped_at`, `delivered_at`         | Las dos marcas que liberan el pago: el envío del negocio y la recepción del comprador                                         |
| `release_due_at`                     | Cuándo se libera solo si el comprador no confirma                                                                             |
| `released_at`, `refunded_at`         | Cuándo se ordenó a PagoFácil repartir o devolver. Son excluyentes                                                             |
| `disputed_at`, `dispute_reason`      | El reclamo del comprador, que congela el pago hasta que Venduo resuelve                                                       |

Sin marca de borrado: un pedido se cancela, no se borra.

**`stores` suma los datos para recibir la dispersión** —la cuenta donde PagoFácil deposita al negocio—, y `seller_profiles` los del joven. Qué datos exactos pide PagoFácil está en lo que falta confirmar. El QR bancario y la captura de transferencia del flujo provisorio (`stores.payment_qr_url`, `orders.payment_proof_url`) se retiran al reemplazarlo.

**`order_items`** — líneas del pedido, con el nombre y el precio del producto copiados al momento de la compra. Lleva también el identificador de la tienda por el principio de redundancia deliberada.

#### Red de vendedores

**`seller_products`** — qué productos tomó cada joven, con su código de referido. Reemplaza al vínculo `store_sellers`, que era con una tienda entera y podía quedar esperando aprobación: en el modelo vigente nadie aprueba nada.

| Columna                  | Nota                                                          |
| ------------------------ | ------------------------------------------------------------- |
| `product_id`, `user_id`  | Únicos como par, entre filas vivas                            |
| `referral_code`          | Único entre filas vivas. Es lo que va en el enlace y en el QR |
| `taken_at`, `deleted_at` | Cuándo lo tomó y cuándo lo soltó                              |

**`buyer_attributions`** — a qué promotor quedó asociado un comprador, y hasta cuándo.

| Columna                    | Nota                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| `buyer_key`                | El teléfono del comprador, normalizado: ya es obligatorio para la entrega y se repite igual entre compras |
| `seller_user_id`           | El joven que lo trajo. El primero manda: una atribución vigente no se reemplaza                           |
| `first_order_id`           | La venta con la que se creó                                                                               |
| `created_at`, `expires_at` | La ventana de vigencia. Vencida, la comisión vuelve al negocio                                            |

> Las dos tablas son del modelo vigente y **todavía no existen**: hoy están `store_sellers` y su aprobación. Ver `docs/estado-del-proyecto.md`.

**`commissions`** — el ciclo de vida del pago al vendedor.

| Columna                                         | Nota                                                                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `order_id`                                      | **Único.** Defensa contra el doble conteo si el pedido oscila entre estados                                          |
| `kind`                                          | `directa` si el joven hizo la venta, `indirecta` si solo trajo al comprador. Cambia el porcentaje, no el circuito    |
| `store_id`                                      | **Anulable, no cascada**                                                                                             |
| `store_name`                                    | **Copia del nombre del negocio**                                                                                     |
| `seller_id`                                     | Anulable                                                                                                             |
| `seller_user_id`                                | Obligatorio. Redundante a propósito, para que la política de seguridad del panel del vendedor no necesite un join    |
| `base_amount_cents`, `rate_bps`, `amount_cents` | La tasa **congelada** al momento de la venta                                                                         |
| `status`                                        | `pendiente` mientras el pago está retenido, `confirmada` al liberarse, `pagada` cuando PagoFácil dispersó, `anulada` |
| `paid_at`, `payment_reference`                  | Cuándo y con qué referencia PagoFácil le transfirió al vendedor                                                      |

**Por qué el vínculo con el negocio es anulable y el nombre va copiado.** Cuando se purga un negocio que se dio de baja, la comisión sobrevive con el nombre del comercio y el historial del vendedor queda intacto. Si la comisión se borrara en cascada, el día que un negocio abandona la plataforma se borraría el antecedente laboral de todos los jóvenes que vendieron para él — exactamente lo que la plataforma promete no hacer.

**`pricing_tiers`** — la tabla de rangos: desde qué costo base, hasta cuál, y los tres porcentajes en puntos básicos. Es catálogo global, como los planes: se lee para calcular y **cada venta se queda con una copia congelada**. Cambiarla no reescribe la historia. Todavía no existe; los valores propuestos están en `docs/modelo-de-negocio.md` §4.

#### Tienda visual — fuera del modelo vigente

> Estas tablas sostienen la tienda online por negocio con sus plantillas, que salió del
> modelo cuando el canal pasó a ser un solo Marketplace. Siguen en la base y funcionando, y
> quedan documentadas acá y en `docs/store-templates.md` mientras se decide qué se hace con
> ellas. **No construir nada nuevo encima.**

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

- **Todo se congela en el momento de la venta**: el costo base, la comisión, el take-rate y sus porcentajes. Cambiar la tabla de rangos mañana no reescribe la historia: quien vendió con 20% cobra 20%, aunque hoy ese rango pague 15%.
- **La suma de las tres partes es exactamente el total del pedido.** Cada componente se redondea al centavo y el total es su suma; si se redondeara el total por separado, el reparto no cerraría por uno o dos centavos y la dispersión fallaría.
- **Montos en centavos enteros, porcentajes en puntos básicos enteros.** Nunca punto flotante.
- **Ciclo:** `pendiente` → `confirmada` → `pagada`, más `anulada`, atado a la custodia: nace `pendiente` cuando el pago entra y queda retenido, pasa a `confirmada` cuando se libera, y a `pagada` cuando PagoFácil transfirió. Un pedido cancelado o resuelto a favor del comprador **anula** la comisión; nunca la borra.
- **El historial laboral cuenta solo `confirmada` y `pagada`.** Una venta con el pago todavía retenido puede terminar en devolución, así que no es trabajo hecho hasta que se libera.
- **Una comisión indirecta también es historial**, pero se distingue: el perfil público muestra por separado lo que vendió y lo que generó por compradores que trajo.
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

**El checkout no es una inserción del cliente.** Un comprador anónimo que inserta directamente en la tabla de pedidos puede declarar el total que quiera. Por eso la tabla de pedidos **no tiene política de inserción**: el pedido se crea mediante una función del servidor que **vuelve a construir cada precio desde el costo base y la tabla de rangos**, resuelve el código de referido, y si no hay ninguno busca si el comprador está asociado a un promotor vigente. Quién cobra la comisión lo decide el servidor, nunca el navegador.

---

## 9. Los usos de la inteligencia artificial

Todos siguen el mismo patrón: se pide una respuesta estructurada, se valida antes de usarla y existe un plan alternativo si falla. **La IA nunca ejecuta nada por su cuenta: propone, el sistema valida y ejecuta.**

Las tres llamadas pasan por una capa propia que traduce el pedido al formato del proveedor elegido. Cambiar de modelo o de proveedor es cambiar una configuración, no reescribir los módulos.

### Edición de la tienda — fuera del modelo vigente

Era el editor de bloques sobre la plantilla de cada tienda. Salió del modelo con la tienda
por negocio. El mecanismo —la IA devuelve **operaciones**, el sistema las valida contra el
esquema de cada bloque y las aplica en una transacción guardando el estado previo— queda
documentado en `docs/store-templates.md` y en la skill `visual-block-editor`, porque es el
mismo patrón que va a usar cualquier edición asistida que se construya después.

### Ficha de producto asistida

El reemplazo natural en el Marketplace, todavía sin construir: el negocio escribe dos
líneas sobre su producto y la IA propone título, descripción y categoría. **Propone**: el
negocio revisa y confirma, y el costo base no lo toca nadie más que él.

### Inteligencia de negocio

Recibe la pregunta del negocio y resuelve tres cosas en orden: qué datos necesita, qué tipo de gráfico comunica mejor ese resultado, y cómo se arma la consulta con los parámetros que dio el usuario.

Las defensas, que no son opcionales:

- **La IA solo lee.** Nunca elimina, actualiza ni ejecuta nada que modifique datos. Se ejecuta con un rol de base de datos de **solo lectura**.
- **El identificador de la tienda lo impone el sistema, nunca la IA.** El filtro se inyecta del lado del servidor, después de recibir la propuesta.
- **Lista blanca de tablas**, tiempo máximo de consulta y tope de filas.

> Esto es más ambicioso que lo que existe hoy: `lib/ai/tasks.ts` resuelve `analyzeSales` recibiendo un arreglo de ventas ya calculado, sin generar consultas.

### Marketing

Recibe un producto y devuelve textos adaptados a Facebook y WhatsApp. La generación y la publicación son dos pasos separados: la IA genera, la persona revisa, y recién entonces se publica por API o se comparte manualmente según el plan que esté activo.
