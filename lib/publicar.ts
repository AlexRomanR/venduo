import { formatMoney } from "@/lib/format"

/*
 * Publicar en redes: la imagen y el texto de un producto para compartir.
 *
 * Sin dependencias de servidor: lo leen la pantalla, la acción que escribe los
 * textos y la ruta que dibuja la imagen.
 */

export type Diseno = "foto" | "color" | "oferta"
export type Formato = "historia" | "cuadrado"
export type Canal = "whatsapp" | "instagram" | "facebook"

export const DISENOS: { clave: Diseno; nombre: string }[] = [
  { clave: "foto", nombre: "Foto grande" },
  { clave: "color", nombre: "Tu color" },
  { clave: "oferta", nombre: "Oferta" },
]

export const FORMATOS: {
  clave: Formato
  nombre: string
  detalle: string
  ancho: number
  alto: number
}[] = [
  {
    clave: "historia",
    nombre: "Historia",
    detalle: "Estados, historias y TikTok",
    ancho: 1080,
    alto: 1920,
  },
  {
    clave: "cuadrado",
    nombre: "Cuadrada",
    detalle: "Publicación y Marketplace",
    ancho: 1080,
    alto: 1080,
  },
]

export const CANALES: { clave: Canal; nombre: string }[] = [
  { clave: "whatsapp", nombre: "WhatsApp" },
  { clave: "instagram", nombre: "Instagram y TikTok" },
  { clave: "facebook", nombre: "Facebook" },
]

export function esDiseno(valor: unknown): valor is Diseno {
  return DISENOS.some((d) => d.clave === valor)
}

export function esFormato(valor: unknown): valor is Formato {
  return FORMATOS.some((f) => f.clave === valor)
}

/** Lo que hace falta de un producto para publicarlo. */
export interface ProductoParaPublicar {
  id: string
  nombre: string
  categoria: string | null
  descripcion: string | null
  precioCents: number
  precioAnteriorCents: number | null
  stock: number
  foto: string | null
}

/** Cuánto se rebajó, en un porcentaje entero. `null` si no tiene rebaja. */
export function rebajaDe(producto: ProductoParaPublicar): number | null {
  const antes = producto.precioAnteriorCents
  if (!antes || antes <= producto.precioCents) return null
  const rebaja = Math.round((1 - producto.precioCents / antes) * 100)
  return rebaja >= 1 ? rebaja : null
}

/** Con tres o menos se dice que quedan pocas: es lo que apura sin mentir. */
export function quedanPocas(producto: ProductoParaPublicar): boolean {
  return producto.stock > 0 && producto.stock <= 3
}

/** El precio dicho en una línea: "Antes Bs 520, ahora Bs 450". */
export function lineaDePrecio(producto: ProductoParaPublicar): string {
  const rebaja = rebajaDe(producto)
  return rebaja && producto.precioAnteriorCents
    ? `Antes ${formatMoney(producto.precioAnteriorCents)}, ahora ${formatMoney(producto.precioCents)}`
    : formatMoney(producto.precioCents)
}

/** Lo que escribe la IA, o el texto armado sin ella: sin precio ni enlace. */
export interface TextosBase {
  whatsapp: string
  instagram: string
  facebook: string
  hashtags: string[]
}

export type Textos = Record<Canal, string>

/**
 * Los textos listos para publicar: lo escrito más el precio y el enlace, que
 * salen de la base y no del modelo. Los hashtags van al final del de
 * Instagram y TikTok, que es donde se usan.
 */
export function armarTextos(
  base: TextosBase,
  producto: ProductoParaPublicar,
  enlace: string
): Textos {
  const precio = lineaDePrecio(producto)
  const hashtags = base.hashtags
    .map((etiqueta) => `#${etiqueta.replace(/^#/, "")}`)
    .join(" ")
  return {
    whatsapp: `${base.whatsapp.trim()}\n\n${precio}\n${enlace}`,
    instagram: [
      base.instagram.trim(),
      "",
      precio,
      `Pídelo aquí: ${enlace}`,
      hashtags ? `\n${hashtags}` : "",
    ]
      .join("\n")
      .trim(),
    facebook: `${base.facebook.trim()}\n\n${precio}\nPídelo aquí: ${enlace}`,
  }
}

/** Una palabra apta para hashtag: sin tildes ni espacios. */
function etiqueta(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .slice(0, 30)
}

/**
 * Los textos sin la IA: cuando Venduo la apagó, o mientras responde. Cortos y
 * con los datos del producto, para que siempre haya algo listo para compartir.
 */
export function textosSinIa(
  producto: ProductoParaPublicar,
  tienda: string
): TextosBase {
  const rebaja = rebajaDe(producto)
  const pocas = quedanPocas(producto)
  const nombre = producto.nombre.trim()
  const gancho = rebaja
    ? `${nombre}, ahora con ${rebaja}% de descuento.`
    : `${nombre}, ya disponible en ${tienda}.`
  const apuro = pocas ? "Quedan pocas unidades." : null
  const descripcion = producto.descripcion?.trim() || null
  return {
    whatsapp: [gancho, apuro, "Escríbeme y te lo separo."]
      .filter(Boolean)
      .join("\n"),
    instagram: [
      gancho,
      rebaja ? `Solo en ${tienda}, por tiempo limitado.` : null,
      apuro,
      "Pídelo por mensaje o desde el enlace.",
    ]
      .filter(Boolean)
      .join("\n"),
    facebook: [
      rebaja ? `${gancho} Lo encuentras en ${tienda}.` : gancho,
      descripcion,
      apuro,
      "Haz tu pedido por WhatsApp desde el enlace: te respondemos enseguida.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    hashtags: [
      etiqueta(tienda),
      producto.categoria ? etiqueta(producto.categoria) : null,
      "Bolivia",
      "CompraLocal",
      rebaja ? "Oferta" : "Novedad",
    ].filter((valor): valor is string => Boolean(valor && valor.length >= 2)),
  }
}

/** Dónde se dibuja la imagen de un producto. `descargar` la baja con su nombre. */
export function rutaDeImagen(
  productoId: string,
  diseno: Diseno,
  formato: Formato,
  descargar = false
): string {
  const consulta = new URLSearchParams({
    producto: productoId,
    diseno,
    formato,
  })
  if (descargar) consulta.set("descargar", "1")
  return `/panel/marketing/imagen?${consulta.toString()}`
}
