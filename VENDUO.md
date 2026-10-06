# Venduo

**Documento maestro del proyecto** — hackathon de 48 horas

---

## 1. Qué es Venduo

**Más que una tienda online: el sistema para vender por redes sociales.** Quien vende por TikTok, Instagram, Facebook o WhatsApp tiene en Venduo su **tienda online** —el enlace que pone en su bio y manda por chat— y, detrás de ella, todo lo que necesita su negocio: el stock controlado, los pedidos que le llegan a su WhatsApp con el número y el total, estadísticas que se preguntan en palabras y catálogos en PDF para compartir.

La tienda se arma sobre una plantilla del rubro, y la inteligencia artificial la ajusta por bloques —agrega, quita, reordena, cambia textos y colores— cuando el emprendedor se lo pide.

**En una frase:** no es solo una página: es tu tienda y el sistema que la maneja, y los pedidos te llegan por WhatsApp, donde ya vendes.

### Cómo se le habla al cliente

Quien vende por redes no se levanta pensando "necesito una página web". Se levanta respondiendo "¿precio?" por mensaje directo, vendiendo algo que ya no tenía o buscando un pedido entre cien mensajes. Venduo se presenta desde esos problemas: la tienda online se nombra —no se esconde— pero siempre acompañada de lo que la hace distinta, "tu tienda online, con stock y pedidos incluidos". Los ejemplos son de rubros que se venden por redes —moda, calzado, belleza, perfumes, accesorios, tecnología, segunda mano—, no de comida casera. El detalle de tono está en `.agents/rules/ui-styling.md`, "Cómo le hablamos al cliente".

---

## 2. El problema

Un volumen enorme del comercio boliviano ocurre informalmente por TikTok, Instagram, Facebook Marketplace y WhatsApp, sin plataforma detrás. Menos del 30% de las pymes bolivianas tiene sitio web, y quien vende por redes no siente que le falte uno: lo que le falta es orden. Responde el precio por mensaje cincuenta veces al día, vende lo que ya no tiene porque el stock lo lleva de memoria, pierde pedidos entre mensajes, manda fotos sueltas por WhatsApp y no tiene números de su negocio.

Lo que **no** le falta es el canal: sus clientes ya le escriben por WhatsApp, y ahí es donde cierra cada venta. Venduo no lo saca de ese chat; le ordena todo lo que pasa antes y después.

---

## 3. Cómo funciona

1. Elige una plantilla según su rubro. Cada una tiene su propia identidad —letra, colores, cómo muestra los productos— y la puede cambiar después sin perder nada.
2. Describe su negocio en un párrafo y deja **el WhatsApp de la tienda**, que es obligatorio: ahí le llega cada pedido. La IA ajusta la plantilla: agrega y quita bloques, reordena secciones, adapta textos y colores.
3. Carga sus productos, marcando cuáles son nuevos y cuáles de segunda mano o reacondicionados.
4. Publica. Obtiene una URL propia y un código QR de su tienda.
5. **Recibe los pedidos por WhatsApp.** Quien compra no deja datos: arma su carrito, ve el total y toca "Enviar pedido por WhatsApp". Se abre el chat con la tienda y el pedido ya escrito —productos, cantidades, total y el número del pedido—. La tienda cobra como ya lo hace, por QR, transferencia o en efectivo, y lo acuerdan en ese mismo chat.
6. Cuando le pagan, marca el pedido **pagado** en su panel y el stock se descuenta solo. Consulta sus estadísticas preguntando en lenguaje natural, arma catálogos en PDF y genera piezas de promoción con IA.

---

## 4. Los módulos

| Módulo                      | Qué hace                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Editor de tienda con IA** | Sobre una plantilla del rubro, la IA agrega, elimina y edita bloques visuales según lo que el emprendedor pide en texto        |
| **Pedidos por WhatsApp**    | El carrito se manda a WhatsApp de la tienda con su número y su total; el pedido queda en el panel y descuenta stock al pagarse |
| **Inteligencia de negocio** | Preguntas en lenguaje natural que devuelven gráficos y estadísticas                                                            |
| **Marketing con IA**        | Genera copys y piezas adaptadas a cada red social, listos para publicar en Facebook y WhatsApp                                 |
| **Segunda mano**            | Filtro del catálogo que reúne los productos usados y reacondicionados, con los descuentos destacados                           |
| **Catálogos en PDF**        | Catálogos armados con productos elegidos, una categoría o un pack, en una de doce plantillas con los colores de la tienda      |

**Sobre la segunda mano:** no es una sección aparte que se genera sola. Es un **filtro dentro del catálogo** de cada tienda. Lo que define que un producto sea de segunda mano es un campo que el emprendedor elige al cargarlo, junto con un precio de comparación opcional que produce el descuento destacado.

---

## 5. Modelo de negocio

- **Único ingreso:** suscripción mensual del emprendedor, con período de prueba. Paga porque la tienda, los pedidos, el análisis y los catálogos le sirven todos los días.
- **Venduo no cobra comisión por venta.** Lo que vende la tienda es de la tienda.
- **Venduo no toca el dinero de las ventas.** El comprador le paga a la tienda como ya le paga hoy —QR, transferencia, efectivo—, y lo acuerdan por WhatsApp. Venduo registra el pedido y su estado; no recibe, retiene ni reparte fondos. Por eso no necesita autorización como intermediario de pagos.
- **Costos:** infraestructura que escala con el uso, plantillas por sector que se reutilizan entre tiendas, e IA solo en momentos de alto valor. El costo marginal por tienda nueva es de centavos.

### Planes y prueba

El sistema contempla un **catálogo de planes** desde el inicio, aunque el MVP arranque con uno solo: la estructura admite sumar niveles más adelante sin migrar datos. Cada tienda tiene una suscripción asociada, que nace en período de prueba.

**Los precios no son parte de este documento.** No afectan al desarrollo: lo que el software necesita conocer es el estado de la suscripción, no su monto.

### Qué pasa cuando vence la prueba

El vencimiento **bloquea la plataforma**, no la borra:

1. La tienda pública deja de servirse.
2. El panel queda en solo lectura, con un aviso de que debe suscribirse.
3. Se habilita una única acción: **exportar los datos** en CSV — catálogo de productos y pedidos con sus líneas. CSV porque es lo que el emprendedor puede abrir sin instalar nada.
4. Se le informa que **sus datos se eliminarán a los 90 días** del bloqueo si no se suscribe. Es tiempo suficiente para volver de un mal mes, sin que la plataforma cargue datos muertos indefinidamente.

Esa eliminación a los 90 días es **el único caso en toda la plataforma donde se borran datos físicamente** (ver sección 8).

### El pedido por WhatsApp

| Paso | Qué pasa                                                                                                                                                         | Estado del pedido |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 1    | El comprador toca "Enviar pedido por WhatsApp". El servidor crea el pedido con los precios recalculados, **sin datos del comprador**, y comprueba que haya stock | `pendiente`       |
| 2    | Se abre WhatsApp con el pedido escrito para la tienda: las líneas, el total y el número                                                                          | `pendiente`       |
| 3    | La tienda cobra en el chat y marca el pedido **pagado**. Recién ahí **se descuenta el stock**                                                                    | `pagado`          |
| —    | Si no se concreta, la tienda lo **cancela**. Si ya estaba pagado, el stock vuelve al catálogo                                                                    | `cancelado`       |

**Los que no se concretan quedan a un lado, sin cancelarse.** Pasada una semana, un pendiente que nadie pagó pasa a "no concretado": deja de contar en lo que la tienda tiene por cobrar y en sus avisos, pero se puede marcar pagado si al final el comprador paga. Y si quien compra vuelve atrás y manda el mismo carrito, se reabre el pedido que ya existía en vez de crear otro.

**Por qué el stock baja al pagar y no al pedir.** Un pedido sin datos cuesta un toque, y muchos carritos se mandan y no se concretan. Si el stock bajara al tocar el botón, cualquiera podría vaciar una tienda tocándolo en bucle, y un carrito abandonado retendría unidades sin que la tienda supiera de quién. El pedido comprueba que haya stock; lo descuenta la tienda cuando le pagan.

**No hay envíos ni seguimiento.** Cómo llega el producto lo acuerdan la tienda y el comprador en el mismo chat; la plataforma no lo registra.

---

## 6. Alcance del MVP

Flujo de demostración completo:

1. Registro y login del emprendedor
2. Selección de plantilla según rubro, con el WhatsApp de la tienda obligatorio en el alta
3. Edición de la tienda asistida por IA sobre el catálogo de bloques
4. Tienda pública real, navegable en móvil, con URL propia
5. Gestión de productos con imagen y stock, marcables como nuevos, de segunda mano o reacondicionados
6. Carrito con el total y un botón que manda el pedido al WhatsApp de la tienda, sin pedirle datos al comprador
7. Panel de pedidos: cada pedido con su número, que descuenta stock al marcarse pagado
8. Inteligencia de negocio: estadísticas consultadas en lenguaje natural
9. Generador de copys de marketing y publicación en Facebook y WhatsApp
10. Catálogos en PDF editables: productos elegidos, una categoría o un pack, en una de doce plantillas de bloques intercambiables o con uno de los estilos sacados de la tienda, para descargar, compartir por WhatsApp o seguir editando en Canva

### Publicación en redes: plan A y plan B

El punto 9 es el de mayor riesgo de alcance, porque no depende solo de nosotros.

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

**Correo y contraseña, sin verificación.** Quien se registra entra al instante: no hay enlace por correo ni código que esperar.

El correo **se guarda igual**, así que exigir verificación más adelante es cambiar un ajuste del proyecto, sin migrar datos ni rehacer el formulario.

**Hay un solo tipo de cuenta: la de quien tiene una tienda.** Al registrarse no se elige rol; toda cuenta nueva va a crear su tienda. Los permisos derivan de los datos: sos dueño si tenés una tienda.

**Quien compra no tiene cuenta ni deja datos.** Su nombre y su teléfono ya van en el chat de WhatsApp donde manda el pedido.

> El ingreso con Google queda para después: el proveedor no está habilitado y hacerlo exige credenciales de Google Cloud.

### Moneda

**Boliviano, único.** No hay moneda configurable por tienda: es una constante del sistema. Los montos se guardan **en centavos, como enteros**. Nunca se usa punto flotante para dinero.

### URLs

Ruteo **por path, no por subdominio**:

| Ruta         | Qué es                                                                  |
| ------------ | ----------------------------------------------------------------------- |
| `/t/{slug}`  | Tienda pública del emprendedor, con su catálogo en `/t/{slug}/catalogo` |
| `/crear`     | Alta de la tienda: plantilla, descripción y WhatsApp                    |
| `/panel`     | Panel del emprendedor                                                   |
| `/c/{token}` | Un catálogo en PDF compartido, con los precios y el stock del día       |

Se usa el slug y no el identificador interno porque estas URLs **se imprimen en códigos QR y se mandan por WhatsApp**: tienen que ser legibles y compartibles.

### Lo que no entra

Tan importante como la lista de lo que sí:

- **Multi-tienda por usuario.** Un emprendedor, una tienda.
- **Red de vendedores, comisiones y referidos.** La tienda vende sola; no hay terceros que cobren por venta.
- **Gestión de envíos.** No hay couriers, guías, seguimiento ni marcas de enviado o recibido: la entrega la acuerdan la tienda y el comprador por WhatsApp.
- **Cobrar dentro de la plataforma.** No hay pasarela, custodia, QR de pago ni comprobantes: el pago se acuerda por WhatsApp y la tienda lo marca en su panel.
- **Cobro de la suscripción.** Se modela el estado de la suscripción, no el cobro.
- **Notificaciones por email.**
- **Aplicación móvil nativa.** La tienda es responsive; con eso alcanza.
- **Tests automatizados.**

---

## 8. Estructura de la aplicación

### Pantallas

- **Inicio** — presentación del producto
- **Crear** — elección de plantilla y alta de la tienda, con su WhatsApp
- **Panel del emprendedor** — resumen, y desde ahí productos, pedidos, estadísticas, apariencia, marketing. Es de Venduo, igual para toda tienda, y la tienda se reconoce en su sello
- **Catálogos en PDF** — dentro del panel, en `/panel/catalogos`: los catálogos guardados, las doce plantillas dibujadas con los productos de la tienda y el constructor, donde se eligen los productos —o se le pide el catálogo a la IA en una frase—, la plantilla —o uno de los cuatro estilos sacados de la tienda—, y se edita hoja por hoja con la vista previa siguiendo lo que se edita. Se descarga en PDF, se manda un enlace que siempre abre con los precios del día o se lleva a Canva para editarlo entero allá
- **Tienda pública** — portada, catálogo con filtro de segunda mano, ficha de producto y carrito, que manda el pedido por WhatsApp. Se dibuja con el kit de su plantilla

### Estrategia de multi-tenancy

**Esquema compartido con aislamiento por Row Level Security.** Toda tabla de negocio lleva el identificador de la tienda, y Postgres impide en la propia base que una tienda vea datos de otra. Se descartan esquema por tienda y base por tienda: rompen la ergonomía de Supabase y son desproporcionados para el proyecto.

**Un emprendedor tiene una sola tienda**, impuesto por un índice único. Eso simplifica mucho las políticas de seguridad: la función auxiliar devuelve **un identificador**, no una lista, y toda política es una comparación directa.

**Principio rector:** el identificador de la tienda se repite incluso donde podría deducirse — por ejemplo en los bloques, que ya pertenecen a una página que pertenece a una tienda. Esa redundancia deliberada permite que cada política de seguridad sea una comparación sobre una sola tabla, sin joins ni riesgo de recursión.

### Borrado lógico

**Nada se borra físicamente en la operación normal.** Todas las tablas de negocio llevan una marca de borrado y las consultas filtran por ella.

Tres consecuencias que hay que respetar, porque son las que se olvidan y rompen cosas:

- **Los índices únicos son parciales.** El slug de la tienda y el nombre de una categoría son únicos **solo entre las filas vivas**. Si no, un registro borrado bloquea para siempre reutilizar ese nombre.
- **El filtro va en la política de seguridad, no solo en la consulta.** Si se deja únicamente en la capa de datos, cualquier consulta nueva se olvida de excluir lo borrado.
- **Los pedidos no se borran nunca**, ni siquiera lógicamente: se cancelan cambiando su estado.

Las cláusulas de borrado en cascada quedan declaradas en el esquema, pero **solo se disparan en la purga**: la eliminación de una tienda que venció su prueba y no se suscribió, a los 90 días del bloqueo.

### Las tablas

#### Identidad

| Tabla      | Qué guarda                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------------- |
| `profiles` | Perfil del usuario: nombre y foto. Se crea solo al darse de alta, mediante un disparador sobre la tabla de Auth |

#### Tenant

**`stores`** — la tienda es el tenant.

| Columna                                              | Tipo        | Nota                                                                |
| ---------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| `id`                                                 | uuid        |                                                                     |
| `owner_id`                                           | uuid        | **Único.** Una tienda por usuario                                   |
| `name`, `slug`, `tagline`, `description`, `logo_url` | text        | `slug` con índice único parcial                                     |
| `whatsapp`                                           | text        | **A donde llega cada pedido.** Solo cifras. `create_store` lo exige |
| `template_key`                                       | text        | Referencia a la plantilla, anulable si se retira del catálogo       |
| `theme_overrides`                                    | jsonb       | Solo lo que la tienda cambia de su plantilla. `{}` es la base       |
| `is_published`                                       | boolean     |                                                                     |
| `created_at`, `updated_at`, `deleted_at`             | timestamptz |                                                                     |

No hay columna de moneda: es constante del sistema.

`whatsapp` es obligatorio en el alta pero no tiene `not null` en la columna: las tiendas creadas antes pueden no tenerlo, y una restricción haría fallar cualquier cambio que se les haga. Una tienda sin número no puede vender —el carrito no ofrece el botón— y su panel se lo pide primero.

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

**`products`**

| Columna                  | Nota                                                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `condition`              | `nuevo`, `segunda_mano` o `reacondicionado`. **Lo elige el emprendedor al cargar el producto** y es lo que alimenta el filtro de segunda mano |
| `condition_note`         | Descripción del estado, para usados                                                                                                           |
| `compare_at_price_cents` | Precio anterior, opcional. Debe ser mayor o igual al precio. Es lo que produce el descuento destacado                                         |
| `deleted_at`             | Borrado lógico                                                                                                                                |

#### Venta

**`orders`**

| Columna                                    | Nota                                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `order_number`                             | Correlativo legible. Va en el mensaje de WhatsApp: es como la tienda encuentra el pedido en su panel                 |
| `buyer_name`, `buyer_phone`, `buyer_email` | **Opcionales y vacíos en los pedidos nuevos**: quien compra ya está en el chat. Los conservan los pedidos anteriores |
| `subtotal_cents`, `total_cents`            | Calculados en el servidor, desde el catálogo                                                                         |
| `status`                                   | `pendiente`, `pagado`, `cancelado`                                                                                   |
| `paid_at`                                  | Cuándo la tienda lo marcó pagado                                                                                     |

Sin marca de borrado: un pedido se cancela, no se borra.

**`order_items`** — líneas del pedido, con el nombre y el precio del producto copiados al momento de la compra. Lleva también el identificador de la tienda por el principio de redundancia deliberada.

#### Tienda visual

| Tabla                         | Qué guarda                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `block_types`                 | **Catálogo global.** Cada tipo de bloque con su esquema de propiedades y sus valores por defecto                                                |
| `templates`, `template_pages` | **Catálogo global.** Ficha, versión y bloques sembrados de cada plantilla. Su identidad visual vive en código: ver `docs/store-templates.md`    |
| `sectors`                     | **Catálogo global.** Los rubros con su nombre visible y su orden. `templates.sector` lo referencia, y es lo que agrupa la galería del alta      |
| `insights`                    | Gráficos guardados. Guarda la **especificación**, no las filas: se recalcula con los datos de cada día                                          |
| `store_pages`                 | Páginas concretas de cada tienda, con estado borrador o publicada                                                                               |
| `store_blocks`                | Bloques concretos: tipo, posición, propiedades en JSON y visibilidad                                                                            |
| `block_edit_proposals`        | Lo que la IA propuso, con el estado previo guardado                                                                                             |
| `store_design_versions`       | Puntos de restauración del diseño: plantilla, personalización y páginas con bloques. Se toman antes de cada cambio; solo las escriben funciones |

El vínculo de un bloque con su tipo **no se puede romper**: no se retira del catálogo un tipo de bloque que alguna tienda esté usando.

El filtro de segunda mano no es un tipo de bloque aparte: es una **propiedad del bloque de grilla de productos**.

#### Catálogos en PDF

| Tabla      | Qué guarda                                                                                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalogs` | Cada catálogo guardado: su configuración entera —bloques, productos elegidos, packs y estilo— en `config`. **Nunca precios ni stock**: se leen al armar el PDF. `share_token` es la llave del enlace público `/c/{token}` |

Un catálogo es una lista de **bloques** —portada, páginas de productos, separador, pack, oferta, texto y contraportada— y cada uno se dibuja con la variante que se elija: cualquier bloque sirve en cualquier plantilla. La plantilla solo decide con qué bloques arranca. El estilo sale de la tienda —sus colores, su letra y sus esquinas— y se puede cambiar sin tocarla; un catálogo cuyo texto no se lee no se descarga.

El **precio de un pack** se muestra en el catálogo y nada más: la tienda online cobra cada producto por separado, y quien quiere el pack escribe por WhatsApp.

El enlace compartido lo abre cualquiera, sin cuenta. Lo lee `catalogo_compartido`, que devuelve un solo catálogo por su token y solo si la tienda se sirve al público; la tabla no tiene política para anónimos.

**Llevarlo a Canva pide la aprobación una sola vez.** Canva recibe el PDF y lo convierte en un diseño de la cuenta de la persona. La primera vez la tienda autoriza a Venduo, y se guarda en `social_connections` el token de renovación que entrega Canva, cifrado por la aplicación; las siguientes se renueva sin su pantalla. Desde su cuenta, la persona puede desconectar Canva: se revoca el token y se borra. Lo que queda en Canva es una copia: no sigue los precios del día.

#### IA y difusión

| Tabla                | Qué guarda                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai_generations`     | Historial de todo lo que generó la IA: tipo, proveedor, modelo, prompt y salida                                                                                  |
| `social_connections` | Credenciales de Facebook, WhatsApp y Canva por tienda. **Sin políticas de lectura: solo accesible desde el servidor**                                            |
| `social_posts`       | Posteos generados. Su estado distingue `publicado` por API de `compartido` manualmente, que es lo que permite sostener el plan A y el plan B con el mismo modelo |

### Cómo se hace cumplir el aislamiento

El patrón, con las trampas que hay que esquivar:

**Función auxiliar.** `my_store_id()` devuelve la tienda del usuario. Las políticas quedan como comparaciones simples:

```sql
-- El dueño ve los pedidos de su tienda
using (store_id = public.my_store_id())
```

**Trampa de recursión.** Una política que consulte la misma tabla que protege entra en recursión infinita. Por eso los auxiliares se declaran con permisos elevados y saltan la política.

**Trampa de rendimiento.** La identidad del usuario debe evaluarse una vez por consulta, no una vez por fila. Se logra envolviéndola como subconsulta:

```sql
using (owner_id = (select auth.uid()))
```

**El pedido no es una inserción del cliente.** Un comprador anónimo que inserta directamente en la tabla de pedidos puede declarar el total que quiera. Por eso la tabla de pedidos **no tiene política de inserción**: el pedido se crea mediante `create_order`, una función del servidor que **recalcula los precios desde el catálogo**, comprueba el stock y devuelve el número, las líneas y el WhatsApp de la tienda con los que se arma el mensaje.

**Lo que se sigue de un cambio de estado lo hace un disparador.** `handle_order_status_change` descuenta el stock al pasar a `pagado`, lo devuelve al cancelar un pagado, y rechaza los cambios que no tienen sentido: un cancelado no revive y un pagado no vuelve a pendiente. La aplicación nunca ajusta el stock a mano.

---

## 9. Los usos de la inteligencia artificial

Todos siguen el mismo patrón: se pide una respuesta estructurada, se valida antes de usarla y existe un plan alternativo si falla. **La IA nunca ejecuta nada por su cuenta: propone, el sistema valida y ejecuta.**

Todas las llamadas pasan por una capa propia que traduce el pedido al formato del proveedor elegido. Cambiar de modelo o de proveedor es cambiar una configuración, no reescribir los módulos.

### Edición de la tienda

El emprendedor edita su tienda en `/editor`: un recorrido de seis pasos —su marca, la portada, el catálogo, la ficha de producto, el carrito y publicar— con la tienda de verdad en una vista previa al lado. Puede hacerlo a mano, arrastrando secciones y tocando textos, colores, letra, logo y fotos, o pidiéndoselo a la IA en sus palabras. La ficha de producto y el carrito se eligen entre formas cerradas —la ficha dividida o en vitrina, el carrito en dos columnas, como boleta o por pasos— con lo que los acompaña: botón de compra fijo en el celular, consulta por WhatsApp, productos parecidos, sugerencias en el carrito.

Se le entrega a la IA el catálogo de tipos de bloque con sus campos, la apariencia actual y las secciones de la portada. La IA devuelve una **lista de operaciones**: cambiar un ajuste de la apariencia, agregar un bloque, quitarlo, ocultarlo, editar sus propiedades o moverlo de posición. Son las mismas operaciones que usa el editor a mano.

El sistema las valida **todas o ninguna** —cada propiedad contra su tipo de bloque, cada color contra el contraste mínimo— y, si no pasan, le devuelve los motivos a la IA para un segundo intento. La propuesta se ve en la vista previa con lo que cambia marcado, y el emprendedor decide si la aplica: aplicarla es un solo paso de deshacer. Cada propuesta queda registrada con el estado previo.

Nada llega al comprador hasta **publicar**, que guarda una versión del diseño anterior en `store_design_versions` y escribe todo en una sola transacción. Cualquier versión se puede restaurar desde Apariencia.

### Inteligencia de negocio

Recibe la pregunta del emprendedor y resuelve tres cosas en orden: qué datos necesita, qué tipo de gráfico comunica mejor ese resultado, y cómo se arma la consulta con los parámetros que dio el usuario.

Las defensas, que no son opcionales:

- **La IA solo lee.** Nunca elimina, actualiza ni ejecuta nada que modifique datos. Se ejecuta en una transacción de **solo lectura**.
- **El identificador de la tienda lo impone el sistema, nunca la IA.** La consulta solo puede tocar tres vistas ya acotadas a la tienda —`mis_ventas`, `mis_items` y `mis_productos`—, donde ni siquiera existe la columna de la tienda.
- **Lista blanca de vistas**, tiempo máximo de consulta y tope de filas.

Una venta es un pedido **pagado**: un pendiente puede ser un carrito que se mandó y nunca se concretó.

### Catálogos en PDF

Recibe una frase —«las zapatillas en oferta», «lista de precios para revendedores»— y los productos de la tienda con su precio, su descuento, su condición y su stock. Devuelve qué productos van, en qué orden, con qué plantilla, un nombre y una bajada para la portada, y en una línea por qué. El sistema descarta los productos que no son de esa tienda antes de armar nada, y el emprendedor ve la propuesta y decide si la usa. Con un catálogo abierto, la misma tarea elige y ordena solo entre sus productos.

### Marketing

Recibe un producto y devuelve textos adaptados a Facebook y WhatsApp. La generación y la publicación son dos pasos separados: la IA genera, el emprendedor revisa, y recién entonces se publica por API o se comparte manualmente según el plan que esté activo.
