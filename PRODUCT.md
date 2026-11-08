# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Emprendedor boliviano sin tienda online.** Vende por Facebook Marketplace, WhatsApp y
TikTok, sin plataforma detrás. Menos del 30% de las pymes bolivianas tiene sitio web. No
tiene números de su negocio, promociona a mano en varias redes, lleva el stock de memoria
y pierde pedidos entre mensajes.

**Quien le compra.** Llega desde un enlace en sus redes o en un chat, en el celular, y ya
está acostumbrado a comprarle por WhatsApp. No quiere crear una cuenta ni llenar un
formulario.

Los dos operan **desde el celular**, no desde un escritorio.

## Product Purpose

Convertir a un emprendedor que vende por redes en una tienda online funcionando en
minutos, con el stock, los pedidos, los números y los catálogos detrás, sin sacarlo del
canal donde ya vende: los pedidos le siguen llegando por WhatsApp, pero ordenados.

Para el emprendedor, el éxito es tener catálogo, pedidos ordenados, números y promoción
sin contratar a nadie. Para quien compra, es pedir con un toque y seguir la conversación
en el chat de siempre.

## Positioning

Una tienda online común muestra productos y espera que el cliente cambie de costumbre.
Venduo hace lo contrario: la tienda arma el pedido y lo manda al WhatsApp de siempre, con
el número y el total, y detrás ordena el stock y los números.

**Venduo no cobra comisión por venta y no toca el dinero.** El único ingreso es la
suscripción del emprendedor. El pago se acuerda en el chat, como hoy.

## Operating Context

- **El celular es el dispositivo principal**, tanto para vender como para comprar.
- **El pedido sale por WhatsApp.** Quien compra arma su carrito y toca un botón: se abre
  el chat con la tienda y el pedido escrito. No deja datos; ya está en el chat.
- **El pago y la entrega se acuerdan en ese chat.** La plataforma no cobra, no retiene
  dinero ni gestiona envíos. La tienda marca el pedido pagado y ahí baja el stock.
- Los enlaces de tienda **se imprimen en códigos QR y se mandan por WhatsApp**, así que
  tienen que ser legibles y compartibles.

## Capabilities and Constraints

- **Un emprendedor, una tienda.** Multi-tienda está fuera de alcance e impedido en la base.
- **El WhatsApp de la tienda es obligatorio.** Es a donde llega cada pedido.
- **Moneda: boliviano, constante del sistema.** No hay moneda configurable.
- **Montos en centavos enteros, porcentajes en puntos básicos.** Nunca punto flotante.
- **El stock baja al marcar el pedido pagado**, no al crearlo: un carrito mandado y
  nunca concretado no retiene unidades.
- **Registro con correo y contraseña, sin verificación.** La fricción de verificar un
  correo es una barrera más antes de tener la tienda funcionando.
- **Fuera de alcance, confirmado:** red de vendedores y comisiones, gestión de envíos,
  cobrar dentro de la plataforma, pedirle datos a quien compra, cobro de la suscripción,
  notificaciones por correo y tests automatizados.
- **La app nativa del emprendedor sí entra** desde el 10 de octubre de 2026, en un
  repositorio aparte: `docs/plan-app-movil.md`.

La especificación funcional completa vive en `VENDUO.md` y es la fuente de verdad.

## Brand Commitments

- **Nombre: Venduo.**
- **Idioma: español neutro boliviano, tratando de "tú"** — "Ingresa", "Escribe tu
  contraseña". Funciona en todo el país, en el altiplano y en el oriente, y no suena
  extranjero a nadie.
  - _Pendiente:_ el código y las reglas escritas hasta ahora usan voseo rioplatense
    ("Ingresá", "Escribí"), heredado del andamiaje inicial. Hay que corregirlo.
- **Identidad visual: el cuaderno de ventas pasado en limpio.** Papel cálido, tinta, una
  frambuesa de señal y el resaltador; Archivo para titulares y cifras, Geist para leer y
  Kalam para las notas a mano. Sobre el papel, las cosas de un mostrador: el ticket con su
  sello, la nota pegada, la polaroid del producto. El logo es la feria en el celular, con
  el toldo en frambuesa (`.agents/rules/marca.md`). El sistema completo, con sus tres
  registros —en escenas, de trabajo y el diario—, está en `DESIGN.md`.

## Evidence on Hand

- **No hay ningún negocio real detrás.** La tienda de la demostración es ficticia y la
  arma el equipo registrándose y cargando productos como lo haría cualquier usuario. Eso
  la vuelve una prueba del flujo real, no un dato precargado.
- **Nunca presentar la tienda de la demostración como un cliente.** Es un ejemplo, y
  decirlo cuesta menos que un jurado descubriéndolo.
- **Los datos de ejemplo actuales son ficticios.** `lib/demo-data.ts` contiene un catálogo
  inventado de café, que es lo que se ve en modo demo sin credenciales.
- **Las cifras de la sección 2 de `VENDUO.md` son material de pitch** y no tienen fuente
  citada en el repositorio. Verificarlas antes de mostrarlas a un jurado.
- No hay testimonios, casos de éxito, prensa ni métricas de uso. **No inventarlos.**

## Product Principles

1. **Cero fricción para quien compra.** Ni cuenta ni formulario: el pedido sale con un
   toque hacia el chat donde ya compra.
2. **No sacar a nadie de WhatsApp.** La venta se cierra donde siempre se cerró; Venduo
   ordena lo que pasa antes y después.
3. **El celular es el escenario real, no un caso secundario.** Lo que no se puede usar con
   el pulgar en la calle no sirve.
4. **La IA propone, la persona decide.** Nada se aplica al negocio de alguien sin que lo
   haya revisado.
5. **Lo que no entra es tan importante como lo que entra.** El alcance cerrado es lo que
   permite terminar.

## Accessibility & Inclusion

**El celular y los datos móviles.** Es el equipo y la conexión del público real:
emprendedores vendiendo desde el celular y compradores en la calle. Desde el 7 de
noviembre de 2026 **no se diseña para Android de gama baja**: los celulares de hoy
mueven escenas, sombras y animaciones sin esfuerzo, y Venduo tiene que sentirse vivo.

Consecuencias que el diseño y el código deben respetar:

- Peso de imágenes y de JavaScript acotado. Una tienda que tarda en cargar no vende, y
  los datos móviles se pagan.
- El movimiento puede ser rico —escenas, notas que caen, el sello que se estampa— pero
  nunca es requisito para entender la interfaz, y con "Reducir movimiento" todo queda
  quieto.
- Objetivos táctiles de 44 px como mínimo.
- El diseño se resuelve primero a 375 px de ancho.
