# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Emprendedor boliviano sin tienda online.** Vende por Facebook Marketplace, WhatsApp y
TikTok, sin plataforma detrás. Menos del 30% de las pymes bolivianas tiene sitio web. No
tiene números de su negocio, promociona a mano en varias redes, y no puede contratar a
nadie porque no le alcanza para un sueldo fijo.

**Joven vendedor.** En Bolivia el 96,2% de los jóvenes que trabajan lo hacen en la
informalidad, la tasa más alta de la región; el desempleo juvenil duplica al general (6%
contra 3,1%) y siete de cada diez ganan menos de Bs 2.500 al mes. El problema no es que
falte trabajo: es que el disponible no paga, no forma y no deja historial que puedan
mostrar después.

Ambos operan **desde el celular**, no desde un escritorio.

## Product Purpose

Convertir a un emprendedor que vende por redes en una tienda online funcionando en
minutos, y darle una red de vendedores jóvenes que colocan sus productos a comisión.

Para el emprendedor, el éxito es tener catálogo, cobro, números y promoción sin contratar
a nadie. Para el joven, es ganar una comisión y acumular un **historial de ventas
verificable**: su primer antecedente laboral real.

## Positioning

Cada problema es la solución del otro, y nadie los había conectado: el emprendedor no
puede pagar un sueldo fijo, y el joven no consigue trabajo que deje rastro.

El mecanismo que un competidor no podría copiar sin rehacer su modelo: **Venduo no cobra
comisión por venta.** El porcentaje que se descuenta va íntegro al vendedor que la generó.
El único ingreso es la suscripción del emprendedor, y el joven no paga nunca nada.

## Operating Context

- **El celular es el dispositivo principal**, tanto para vender como para comprar.
- **La entrega se coordina por WhatsApp** entre el emprendedor y el comprador. La
  plataforma arma el mensaje con el detalle del pedido; no gestiona envíos.
- **El cobro es por QR** con comprobante de transferencia. En el MVP la pasarela está
  simulada: el comprador sube el comprobante y el emprendedor confirma a mano.
- Los enlaces de tienda y de vendedor **se imprimen en códigos QR y se mandan por
  WhatsApp**, así que tienen que ser legibles y compartibles.
- El vendedor trabaja en sus redes, en su barrio y cara a cara.

## Capabilities and Constraints

- **Un emprendedor, una tienda.** Multi-tienda está fuera de alcance e impedido en la base.
- **Un vendedor pertenece a varias tiendas.** Esa asimetría define el modelo de datos.
- **Moneda: boliviano, constante del sistema.** No hay moneda configurable.
- **Montos en centavos enteros, porcentajes en puntos básicos.** Nunca punto flotante.
- **La comisión se congela al momento de la venta** y no se recalcula después.
- **El historial del vendedor sobrevive a la tienda**: si un emprendedor abandona la
  plataforma y sus datos se purgan, el antecedente laboral del joven queda intacto.
- **Registro con correo y contraseña, sin verificación.** La fricción de verificar un
  correo es la barrera que la plataforma promete no ponerle a un joven.
- **Fuera de alcance, confirmado:** gestión de envíos, cobro de la suscripción,
  notificaciones por correo, aplicación móvil nativa y tests automatizados.
- **Decisión abierta:** si en producción la pasarela puede dispersar el pago a un
  beneficiario que no es el comercio, y qué identificación le exige. Si exigiera alta
  formal de cada vendedor, choca con la promesa de cero barrera de entrada.

La especificación funcional completa vive en `VENDUO.md` y es la fuente de verdad.

## Brand Commitments

- **Nombre: Venduo.**
- **Idioma: español neutro boliviano, tratando de "tú"** — "Ingresa", "Escribe tu
  contraseña". Funciona en todo el país, en el altiplano y en el oriente, y no suena
  extranjero a nadie.
  - _Pendiente:_ el código y las reglas escritas hasta ahora usan voseo rioplatense
    ("Ingresá", "Escribí"), heredado del andamiaje inicial. Hay que corregirlo.
- **Sin identidad visual definida.** No hay logo, paleta ni tipografía comprometidas.

## Evidence on Hand

- **Hay un negocio real de referencia** que el equipo va a usar para la demostración. Sus
  datos concretos —rubro, catálogo, precios, historia— **todavía no están registrados
  acá**; hay que capturarlos antes de construir la demostración para no contradecirlos.
- **Los datos de ejemplo actuales son ficticios.** `lib/demo-data.ts` contiene un catálogo
  inventado de café. No presentarlos como un cliente real.
- **Las cifras de la sección 2 de `VENDUO.md` son material de pitch** y no tienen fuente
  citada en el repositorio. Verificarlas antes de mostrarlas a un jurado.
- No hay testimonios, casos de éxito, prensa ni métricas de uso. **No inventarlos.**

## Product Principles

1. **Cero barrera para el joven.** Cualquier fricción que se le agregue —verificar un
   correo, dar de alta una cuenta bancaria, esperar aprobación— contradice la promesa
   central del producto.
2. **El historial es del vendedor, no de la tienda.** Ninguna decisión técnica o de
   producto puede hacer que el antecedente laboral de alguien desaparezca porque un
   tercero se fue.
3. **El celular es el escenario real, no un caso secundario.** Lo que no se puede usar con
   el pulgar en la calle no sirve.
4. **La IA propone, la persona decide.** Nada se aplica al negocio de alguien sin que lo
   haya revisado.
5. **Lo que no entra es tan importante como lo que entra.** El alcance cerrado es lo que
   permite terminar.

## Accessibility & Inclusion

**Android de gama baja y datos móviles.** Es el equipo y la conexión del público real:
jóvenes vendiendo desde el celular y compradores en la calle.

Consecuencias que el diseño y el código deben respetar:

- Peso de imágenes y de JavaScript acotado. Una tienda que tarda en cargar no vende.
- La animación no puede ser requisito para entender la interfaz.
- Objetivos táctiles de 44 px como mínimo.
- El diseño se resuelve primero a 375 px de ancho.
