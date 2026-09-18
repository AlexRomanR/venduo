# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Microempresa o productor local boliviano.** Tiene capacidad de producción ociosa y
ningún canal digital efectivo. Vende por Facebook Marketplace, WhatsApp y TikTok, sin
plataforma detrás; menos del 30% de las pymes bolivianas tiene sitio web. No puede pagar
publicidad por adelantado ni contratar a nadie con sueldo fijo, y no sabe calcular
márgenes ni precios de venta.

**Promotor: joven de 16 a 28 años** —estudiante, técnico, buscador de primer empleo— con Bs 0 de
capital, tiempo disponible y redes activas, pero ningún producto propio que vender. En
Bolivia el 96,2% de los jóvenes que trabajan lo hacen en la informalidad, la tasa más alta
de la región; el desempleo juvenil duplica al general (6% contra 3,1%) y siete de cada
diez ganan menos de Bs 2.500 al mes. El problema no es que falte trabajo: es que el
disponible no paga, no forma y no deja historial que puedan mostrar después.

Ambos operan **desde el celular**, no desde un escritorio.

## Product Purpose

Poner en un mismo Marketplace lo que un negocio produce y a los jóvenes que lo van a
vender, con el precio, la comisión y el reparto calculados por la plataforma.

El negocio declara **solo su costo base**; el precio final lo construye el sistema sumando
la comisión del joven y el take-rate, escalados según el rango de precio.

Para el negocio, el éxito es vender sin poner un peso por adelantado ni calcular márgenes.
Para el joven, es ganar una comisión sin capital ni inventario, y acumular un **historial
de ventas verificable**: su primer antecedente laboral real.

## Positioning

Cada problema es la solución del otro, y nadie los había conectado: el emprendedor no
puede pagar un sueldo fijo, y el joven no consigue trabajo que deje rastro.

El mecanismo que un competidor no podría copiar sin rehacer su modelo: **el negocio nunca
fija un precio.** Declara lo que quiere recibir y la plataforma arma el precio encima, con
una comisión que sube en los productos baratos y baja en los caros para que vender siempre
valga el esfuerzo. Nadie negocia porcentajes con nadie.

Y el joven no cobra una sola vez: **el comprador que trae queda asociado a él** por una
ventana de tiempo, así que sigue ganando si esa persona vuelve a comprar por su cuenta.

Al comprador le da una garantía que un negocio de TikTok no puede dar solo: **su pago queda
retenido hasta que recibe el pedido.** Si el producto no aparece, no pierde la plata.

El único ingreso de la plataforma es el **take-rate**, y el joven no paga nunca nada.

## Operating Context

- **El celular es el dispositivo principal**, tanto para vender como para comprar.
- **La entrega se coordina por WhatsApp** entre el negocio y el comprador. La plataforma
  arma el mensaje con el detalle del pedido y registra solo dos marcas —enviado y
  recibido—, que son las que liberan el pago. No gestiona envíos.
- **El cobro es por PagoFácil, con custodia y reparto a tres.** El comprador paga, el
  dinero queda retenido, y al confirmarse la entrega —o al vencer el plazo— se reparte:
  costo base al negocio, comisión al joven, take-rate a Venduo. Si hay un reclamo, el pago
  se congela y Venduo media. **Venduo nunca es titular del dinero ajeno**: recibe su
  take-rate como un beneficiario más del reparto. El costo de PagoFácil sale de la parte
  del negocio. En el MVP la pasarela es simulada, y lo construido hoy todavía es un flujo
  provisorio de QR bancario con comprobante, sin custodia ni reparto.
- Los enlaces de producto y de vendedor **se imprimen en códigos QR y se mandan por
  WhatsApp**, así que tienen que ser legibles y compartibles.
- El vendedor trabaja en sus redes, en su barrio y cara a cara.

## Capabilities and Constraints

- **Una persona, un negocio.** Multi-negocio está fuera de alcance e impedido en la base.
- **Un joven vende productos de muchos negocios.** Esa asimetría define el modelo de datos.
- **El negocio declara costo base, nunca precio final.** El precio lo construye el
  servidor con la tabla de rangos vigente.
- **Moneda: boliviano, constante del sistema.** No hay moneda configurable.
- **Montos en centavos enteros, porcentajes en puntos básicos.** Nunca punto flotante.
- **El costo base, la comisión y el take-rate se congelan al momento de la venta**, y los
  tres suman exactamente el total del pedido.
- **El historial del vendedor sobrevive a la tienda**: si un emprendedor abandona la
  plataforma y sus datos se purgan, el antecedente laboral del joven queda intacto.
- **Registro con correo y contraseña, sin verificación.** La fricción de verificar un
  correo es la barrera que la plataforma promete no ponerle a un joven.
- **El historial del joven distingue** lo que vendió él de lo que generó un comprador que
  trajo.
- **Fuera de alcance, confirmado:** tienda online propia por negocio con plantillas,
  suscripción, aprobación de vendedores, gestión de envíos, recibir o guardar el dinero
  ajeno, notificaciones por correo, aplicación móvil nativa y tests automatizados.
- **Decisiones abiertas con PagoFácil:** si puede retener un cobro y liberarlo o devolverlo
  por orden de Venduo; si la dispersión admite como beneficiario al vendedor, que no es el
  comercio; y qué identificación le exige. Si exigiera alta formal de cada vendedor, choca
  con la promesa de cero barrera de entrada.
- **Decidido:** al comprador se lo reconoce por su teléfono normalizado mientras no tenga
  cuenta, y la tabla de rangos está sembrada con la propuesta del modelo.
- **Decisiones abiertas del producto:** la ventana de atribución del comprador (se proponen
  90 días), el costo base mínimo, el plazo de liberación automática (se proponen 7 días
  desde el envío) y qué pasa si el negocio nunca marca el pedido enviado.

El modelo de negocio vive en `docs/modelo-de-negocio.md` y la especificación funcional en
`VENDUO.md`, que es la fuente de verdad del producto.

## Brand Commitments

- **Nombre: Venduo.**
- **Idioma: español neutro boliviano, tratando de "tú"** — "Ingresa", "Escribe tu
  contraseña". Funciona en todo el país, en el altiplano y en el oriente, y no suena
  extranjero a nadie.
  - _Pendiente:_ el código y las reglas escritas hasta ahora usan voseo rioplatense
    ("Ingresá", "Escribí"), heredado del andamiaje inicial. Hay que corregirlo.
- **Sin identidad visual definida.** No hay logo, paleta ni tipografía comprometidas.

## Evidence on Hand

- **No hay ningún negocio real detrás.** Los negocios de la demostración son ficticios y
  los arma el equipo registrándose y cargando productos como lo haría cualquier usuario.
  Eso la vuelve una prueba del flujo real, no un dato precargado.
- **Nunca presentar un negocio de la demostración como un cliente.** Es un ejemplo, y
  decirlo cuesta menos que un jurado descubriéndolo.
- **Los datos de ejemplo actuales son ficticios.** `lib/demo-data.ts` contiene un catálogo
  inventado de café, que es lo que se ve en modo demo sin credenciales.
- **Las cifras de la sección 2 de `VENDUO.md` son material de pitch** y no tienen fuente
  citada en el repositorio. Verificarlas antes de mostrarlas a un jurado.
- No hay testimonios, casos de éxito, prensa ni métricas de uso. **No inventarlos.**

## Product Principles

1. **Cero barrera para el joven.** Cualquier fricción que se le agregue —verificar un
   correo, dar de alta una cuenta bancaria, esperar aprobación— contradice la promesa
   central del producto.
2. **El historial es del vendedor, no del negocio.** Ninguna decisión técnica o de
   producto puede hacer que el antecedente laboral de alguien desaparezca porque un
   tercero se fue.
3. **El precio lo construye el sistema.** Ni el negocio ni el joven negocian porcentajes:
   si alguna pantalla deja escribir un precio final, el modelo se rompe.
4. **El celular es el escenario real, no un caso secundario.** Lo que no se puede usar con
   el pulgar en la calle no sirve.
5. **La IA propone, la persona decide.** Nada se aplica al negocio de alguien sin que lo
   haya revisado.
6. **Lo que no entra es tan importante como lo que entra.** El alcance cerrado es lo que
   permite terminar.

## Accessibility & Inclusion

**Android de gama baja y datos móviles.** Es el equipo y la conexión del público real:
jóvenes vendiendo desde el celular y compradores en la calle.

Consecuencias que el diseño y el código deben respetar:

- Peso de imágenes y de JavaScript acotado. Un catálogo que tarda en cargar no vende.
- La animación no puede ser requisito para entender la interfaz.
- Objetivos táctiles de 44 px como mínimo.
- El diseño se resuelve primero a 375 px de ancho.
