import { getSiteUrl } from "@/lib/env"

/**
 * El enlace de una tienda, en un solo lugar.
 *
 * Antes lo armaban siete archivos con `${sitio}/t/${slug}` a mano, y cualquier
 * cambio de forma obligaba a encontrarlos todos. Ahora la forma se decide acá.
 *
 * ## Por qué hay dos formas y no una
 *
 * La deseable es el subdominio, `rosa-deportes.venduo.com`: se dicta por
 * teléfono sin explicar una barra, y se lee como la tienda de esa persona y no
 * como una página dentro de otra cosa.
 *
 * La que funciona hoy es la ruta, `venduo.app/t/rosa-deportes`, porque el
 * subdominio necesita tres cosas que todavía no existen: el dominio propio, un
 * registro DNS comodín `*.dominio` y un dominio comodín dado de alta en el
 * proveedor. Nada de eso se resuelve desde el código.
 *
 * `DOMINIO_DE_TIENDAS` es el interruptor. Mientras esté vacío, todo sale por
 * ruta; en cuanto tenga un dominio, todos los enlaces del sistema —el QR
 * impreso, el material del vendedor, el panel— pasan a la forma con subdominio
 * a la vez, porque todos preguntan acá.
 */
export const DOMINIO_DE_TIENDAS =
  process.env.NEXT_PUBLIC_DOMINIO_TIENDAS?.trim() || ""

/** Slugs que nunca pueden ser una tienda, porque son la aplicación. */
export const SUBDOMINIOS_RESERVADOS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "panel",
  "cuenta",
  "vendedor",
  "explorar",
  "login",
  "auth",
  "t",
  "v",
])

/** La URL pública de una tienda. Absoluta: se comparte y se imprime. */
export function urlDeTienda(slug: string): string {
  if (DOMINIO_DE_TIENDAS) {
    return `https://${slug}.${DOMINIO_DE_TIENDAS}`
  }
  return `${getSiteUrl()}/t/${slug}`
}

/**
 * La misma tienda, con el código de un vendedor.
 *
 * Es el enlace que el vendedor reparte, y la única forma de que una venta se
 * le acredite: el código viaja en la URL y `create_order` lo valida contra esa
 * tienda antes de congelar la comisión.
 */
export function urlDeReferido(slug: string, codigo: string): string {
  return `${urlDeTienda(slug)}?ref=${encodeURIComponent(codigo)}`
}

/** El enlace de un producto suelto dentro de la tienda. */
export function urlDeProducto(
  slug: string,
  productoId: string,
  codigo?: string | null
): string {
  const base = `${urlDeTienda(slug)}/p/${productoId}`
  return codigo ? `${base}?ref=${encodeURIComponent(codigo)}` : base
}

/**
 * Una ruta dentro de la tienda, para navegar sin salir de ella.
 *
 * Relativa y siempre con `/t/{slug}`: el middleware deja pasar esa forma tal
 * cual también desde un subdominio. Lleva el código del vendedor si lo hay,
 * para que el cartel de "te trajo" siga en cada pantalla; el carrito además lo
 * recuerda, así que perderlo acá no le quita la venta a nadie.
 */
export function rutaDeTienda(
  slug: string,
  subruta = "",
  parametros: Record<string, string | null | undefined> = {}
): string {
  const consulta = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor) consulta.set(clave, valor)
  }
  const texto = consulta.toString()
  return `/t/${slug}${subruta}${texto ? `?${texto}` : ""}`
}

/**
 * Cómo se muestra un enlace cuando se lee, no cuando se hace clic.
 *
 * Sin el `https://`, que nadie dicta por teléfono ni copia a mano.
 */
export function enlaceLegible(url: string): string {
  return url.replace(/^https?:\/\//, "")
}

/**
 * El slug de tienda que pide un host, si es que pide alguno.
 *
 * Lo usa el middleware para reescribir `rosa-deportes.venduo.com` a
 * `/t/rosa-deportes`. Devuelve `null` cuando el host es el sitio mismo, cuando
 * no hay dominio de tiendas configurado, o cuando el subdominio está reservado.
 */
export function slugDesdeHost(host: string | null): string | null {
  if (!DOMINIO_DE_TIENDAS || !host) return null

  // El puerto sobra y en local siempre está.
  const limpio = host.split(":")[0].toLowerCase()
  const sufijo = `.${DOMINIO_DE_TIENDAS.toLowerCase()}`

  if (!limpio.endsWith(sufijo)) return null

  const subdominio = limpio.slice(0, -sufijo.length)

  // Solo un nivel: `a.b.venduo.com` no es la tienda "a.b".
  if (!subdominio || subdominio.includes(".")) return null
  if (SUBDOMINIOS_RESERVADOS.has(subdominio)) return null

  return subdominio
}
