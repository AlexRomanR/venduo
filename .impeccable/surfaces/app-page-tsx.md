---
version: 2
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/portada"]
---

Superficie: `/` — la portada pública. Modo Persuade.

Llega alguien que no conoce Venduo, desde un enlace de TikTok, WhatsApp o sus redes,
casi siempre en un Android de gama media con datos móviles. Ya vende por redes y no
siente que le falte una página web: le falta orden. Tiene que entender que Venduo es más
que una tienda online —la tienda y el sistema que la maneja— y querer registrarse. Lo que
la convence es ver que el pedido le sigue llegando por WhatsApp, donde ya vende, pero
ordenado.

Prueba: el mecanismo funcionando en pantalla, en escenas que cuentan un pedido real de
punta a punta. Los productos, precios, stock y pedidos son de Rosa Deportes, la tienda de
ejemplo, y la portada lo declara al pie.

## Direction contract

THESIS: La portada nombra las tres cosas que la persona se lleva —la tienda online, el
inventario y las ventas—, promete que se arman en minutos y lo muestra con su propio
celular: las cosas con las que hoy vende (sus productos, sus dudas, su WhatsApp) caen al
celular y se ordenan. Cada sección es una escena que se puede tocar, no una lista de
características.

OWN-WORLD: El cuaderno de ventas pasado en limpio. Papel cálido `#f7f5f0`, tinta
`#1d1c1a`, una frambuesa `#d0216a` para lo que pide algo y un resaltador amarillo
`#fff1a6` bajo una frase de cada titular. Titulares en Archivo con eje de ancho, texto en
Geist y notas a mano en Kalam. Productos a color recortados sin fondo, un celular en 3D y
tarjetas que flotan con sombra teñida de tinta. Sin naranja: la marca es la frambuesa,
también en el toldo del logo. El sistema compartido y sus excepciones están en `DESIGN.md`, "La
portada".

STORY: Se reconoce en los problemas de vender por redes ("¿Te pasa esto?"), ve cómo arma
su tienda en tres pasos, ve un pedido llegar a su WhatsApp y el stock bajar solo, descubre
que todo lo que Venduo arma lleva su estilo, encuentra su rubro y repasa lo que incluye.
Cierra con las preguntas de siempre y una sola acción: crear su tienda gratis.

ORDER: Portada → ¿Te pasa esto? → Cómo funciona → Pedidos por WhatsApp → Por qué no es
solo una tienda online → Para quién es → Qué incluye → Preguntas → Cierre. El pedido va
después de "Cómo funciona" porque asume que la tienda ya existe.

FIRST VIEWPORT: Barra fija con las anclas y "Crear mi tienda gratis". A la izquierda, el
titular —"Tu tienda online, tu inventario y tus ventas. Lista en minutos."—, la bajada,
los cuatro agregados y la acción. A la derecha, el celular en 3D con la tienda de Rosa,
rodeado de productos y de las dudas de quien vende. En escritorio, una entrada fija y
corta: los productos caen al celular y se agrega uno al carrito. En el celular, el texto
primero y el celular debajo, sin entrada fija.

MOBILE: Cada escena tiene su versión en columna, legible a 360 px. Las franjas que se
deslizan lo avisan con bordes que se esfuman, puntos y "Desliza →"; los carruseles se
manejan con el dedo. "Pedidos" muestra un solo celular grande que pasa del carrito al
WhatsApp.

TRUTH: Lo que muestra un celular existe en Venduo hoy y se llama igual: el mensaje del
pedido es el de `mensajeDePedido`, los estados son "Pendiente" y "Pagado", Venduo no sabe
el nombre de quien compra, y las notificaciones del celular no se dibujan porque todavía
no existen.

PENDING: La captura de la plantilla Fórmula muestra un frasco de una marca real y hay que
reemplazarla; la de Calle dice "lo cerramos por WhatsApp". "Celulares y tecnología" usa la
misma plantilla que "Regalos" porque no hay una de tecnología.

FINISH: Revisado con `/impeccable critique` el 30/10/2026: 26/36 en la última pasada,
con sus problemas corregidos después.
