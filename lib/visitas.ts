/**
 * Las visitas de una tienda, sin dependencias de servidor.
 *
 * Lo leen el aviso que manda la página (`components/tienda/visita.tsx`) y
 * `/api/visita`. Nada de esto identifica a nadie: se mira de dónde vino la
 * visita, si es un celular y si es un robot; la huella la arma la base con una
 * sal que cambia cada día.
 */

export const TIPOS_DE_VISITA = [
  "portada",
  "catalogo",
  "producto",
  "carrito",
  "pedido",
] as const
export type TipoDeVisita = (typeof TIPOS_DE_VISITA)[number]

export const ORIGENES = [
  "whatsapp",
  "tiktok",
  "instagram",
  "facebook",
  "qr",
  "catalogo",
  "otro",
  "directo",
] as const
export type Origen = (typeof ORIGENES)[number]

export const NOMBRES_DE_ORIGEN: Record<Origen, string> = {
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: "Facebook",
  qr: "Código QR",
  catalogo: "Catálogo en PDF",
  otro: "Otra página",
  directo: "Directo",
}

/** La marca que ponen los QR y los catálogos de Venduo en el enlace. */
export const PARAMETRO_DE_ORIGEN = "o"

/** El enlace de la tienda con la marca de dónde se compartió. */
export function conOrigen(url: string, origen: "qr" | "catalogo"): string {
  const separador = url.includes("?") ? "&" : "?"
  return `${url}${separador}${PARAMETRO_DE_ORIGEN}=${origen}`
}

/**
 * De dónde vino una visita: la marca del enlace, la página que la mandó o el
 * navegador de la app desde la que se abrió. Las apps suelen ocultar la página
 * de origen, pero se delatan en el navegador que usan.
 */
export function detectarOrigen(
  marca: string | null,
  referente: string,
  navegador: string,
  propioHost: string
): Origen {
  if (marca === "qr" || marca === "catalogo") return marca

  const ua = navegador.toLowerCase()
  if (/instagram/.test(ua)) return "instagram"
  if (/fban|fbav|fb_iab|messenger/.test(ua)) return "facebook"
  if (/tiktok|musical_ly|bytedance/.test(ua)) return "tiktok"
  if (/whatsapp/.test(ua)) return "whatsapp"

  let host = ""
  try {
    host = referente ? new URL(referente).hostname.toLowerCase() : ""
  } catch {
    host = ""
  }
  if (!host || host === propioHost) return "directo"
  if (/(^|\.)(wa\.me|whatsapp\.com)$/.test(host)) return "whatsapp"
  if (/(^|\.)tiktok\.com$/.test(host)) return "tiktok"
  if (/(^|\.)instagram\.com$/.test(host)) return "instagram"
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/.test(host)) {
    return "facebook"
  }
  return "otro"
}

export function dispositivo(navegador: string): "celular" | "computadora" {
  return /mobi|android|iphone|ipad|ipod/i.test(navegador)
    ? "celular"
    : "computadora"
}

/** Robots, buscadores y vistas previas de enlaces: no son visitas. */
export function esRobot(navegador: string): boolean {
  return (
    !navegador ||
    /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp\/|headless|lighthouse|monitor|curl|wget|python|axios|node-fetch/i.test(
      navegador
    )
  )
}
