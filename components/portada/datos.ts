import { BarChart3, FileText, MessageCircle, Palette } from "lucide-react"

/**
 * El contenido de la portada pública (`app/page.tsx`): sus textos,
 * copiados tal cual para probarlos con el diseño nuevo. La tienda Rosa Deportes,
 * sus pedidos, precios y stock son ilustrativos: la portada lo dice al pie. Los
 * productos recortados están en `productos.ts`.
 */

export { PRODUCTOS, producto } from "@/components/portada/productos"

/** Lo que viene además de la tienda, el inventario y las ventas del titular. */
export const ADEMAS = [
  { icono: Palette, texto: "Editas tu plantilla, o se lo pides a la IA" },
  { icono: MessageCircle, texto: "Los pedidos te llegan por WhatsApp" },
  { icono: FileText, texto: "Catálogos en PDF para mandar" },
  { icono: BarChart3, texto: "Estadísticas que respondes preguntando" },
]

/** Lo que dice quien vende por redes antes de usar Venduo. */
export const DOLORES = [
  "Me preguntan el precio cincuenta veces al día por mensaje.",
  "Vendí algo que ya no tenía.",
  "No sé cuánto me queda de cada talla.",
  "Los pedidos se me pierden entre tantos mensajes.",
  "Mando fotos sueltas por WhatsApp y se ve desordenado.",
]

/** Una tienda online común contra lo que trae Venduo, fila por fila. */
export const COMPARACION = [
  {
    tema: "Tu catálogo",
    comun: "Una página con fotos y precios.",
    venduo:
      "Tu tienda online, con tu plantilla, para compartir en tus redes y tus chats.",
  },
  {
    tema: "El stock",
    comun: "Lo llevas aparte, en un cuaderno o en tu cabeza.",
    venduo:
      "Marcas el pedido como pagado y el stock se descuenta solo, y te avisamos antes de que algo se acabe.",
  },
  {
    tema: "Los pedidos",
    comun: "Te llegan sueltos, mezclados con el resto del chat.",
    venduo:
      "Llegan a tu WhatsApp con la lista de productos, el total y su número, y quedan en tu panel.",
  },
  {
    tema: "Para mandar",
    comun: "Armas a mano un catálogo con capturas.",
    venduo:
      "Catálogos en PDF con tus productos, tus colores y tus precios de hoy.",
  },
  {
    tema: "Tus números",
    comun: "No sabes cuánto vendiste el mes pasado.",
    venduo: "Le preguntas «¿qué se vendió más?» y te responde con un gráfico.",
  },
]

export const PASOS = [
  {
    n: "01",
    titulo: "Subes tus productos",
    corto: "Subes",
    detalle:
      "Todos de una vez: desde tu Excel o Google Sheets, una foto de tu cuaderno o las fotos de tus productos. La IA los lee y tú revisas antes de guardar. Y si prefieres, uno por uno.",
  },
  {
    n: "02",
    titulo: "Compartes tu enlace en tus redes",
    corto: "Compartes",
    detalle:
      "O lo mandas por WhatsApp. Quien te sigue ve todo tu catálogo ordenado, con precios y lo que queda, sin preguntarte nada.",
  },
  {
    n: "03",
    titulo: "Los pedidos llegan a tu WhatsApp",
    corto: "Te llegan",
    detalle:
      "Tu cliente arma su carrito y te lo manda con el total. Cuando te paga, lo marcas y el stock se descuenta solo.",
  },
]

export const INCLUYE = [
  {
    titulo: "Tienda online con plantillas",
    detalle:
      "Eliges una plantilla de tu rubro y la ajustas a tu marca: colores, letra, portada. La IA te ayuda si se lo pides.",
  },
  {
    titulo: "Control de stock",
    detalle:
      "Cuando marcas un pedido como pagado, se descuenta del inventario. Te avisamos de lo que se está acabando y nadie compra lo que ya no tienes.",
  },
  {
    titulo: "Pedidos por WhatsApp",
    detalle:
      "Quien compra no llena formularios: toca un botón y te escribe con su pedido, el total y su número ya armados.",
  },
  {
    titulo: "Catálogos en PDF",
    detalle:
      "Eliges productos o un pack, una de doce plantillas, y descargas un catálogo con tus colores para mandar por WhatsApp.",
    nuevo: true,
  },
  {
    titulo: "Tu negocio en un panel",
    detalle:
      "Pedidos, productos y ventas de un vistazo, con lo que pide tu atención primero. En el celular o en la computadora.",
  },
  {
    titulo: "Estadísticas en tus palabras",
    detalle:
      "Le preguntas «¿qué se vendió más este mes?» y te responde con un gráfico.",
  },
]

export const RUBROS = [
  "Ropa y calzado",
  "Belleza y maquillaje",
  "Perfumes",
  "Accesorios y joyas",
  "Celulares y tecnología",
  "Deporte",
  "Regalos y variedades",
]

export const PREGUNTAS = [
  {
    p: "¿Es una tienda online?",
    r: "Sí, y más que eso. Tienes tu tienda online con tu enlace, y detrás el stock, los pedidos, las estadísticas y los catálogos en PDF. Todo se maneja desde el celular.",
  },
  {
    p: "Ya vendo por TikTok y WhatsApp. ¿Tengo que dejar de hacerlo?",
    r: "No. Sigues vendiendo donde ya te conocen. Compartes el enlace de tu tienda en tus redes y en tus chats, y lo que pasa después —el pedido, el stock, los números— se ordena solo.",
  },
  {
    p: "¿Mi cliente tiene que crear una cuenta?",
    r: "No, ni llenar un formulario. Elige sus productos, toca «Enviar pedido por WhatsApp» y te escribe con todo armado: qué quiere, cuánto es y el número del pedido.",
  },
  {
    p: "¿Cómo me pagan mis clientes?",
    r: "Como ya te pagan: por QR, transferencia o en efectivo. Lo acuerdan en el mismo chat del pedido. Cuando te pagan, lo marcas en tu panel y el stock se descuenta solo.",
  },
  {
    p: "¿Qué es el catálogo en PDF?",
    r: "Un catálogo armado con tus productos —los que elijas, una categoría o un pack— en una de doce plantillas, con tus colores. Lo descargas y lo mandas por WhatsApp o lo subes a un estado.",
  },
  {
    p: "¿Necesito saber de computación?",
    r: "No. Si sabes subir una foto a TikTok, sabes usar Venduo. Y si necesitas ayuda, se la pides a la IA con tus palabras.",
  },
  {
    p: "¿Cuánto cuesta?",
    r: "Abrir tu tienda y probar todo no cuesta nada. Los planes llegan después, y Venduo no se queda con comisión de tus ventas.",
  },
]
