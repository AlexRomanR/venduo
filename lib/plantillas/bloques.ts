import type {
  BloquePublico,
  CategoriaPublica,
  TiendaPublica,
} from "@/lib/data/tienda-publica"
import type { Product } from "@/types"

/**
 * Lo que un bloque significa, sin decir cómo se ve.
 *
 * Cada kit dibuja los bloques a su manera, pero qué productos entran en una
 * grilla o qué foto representa a una categoría es lo mismo en todas las
 * plantillas. Vive acá para que dos kits no lo resuelvan distinto.
 *
 * Las propiedades llegan como jsonb: las escribe una plantilla o, mañana, la
 * IA. Se leen tolerando que falten, porque un bloque a medio configurar tiene
 * que salir discreto y no roto.
 */

export const TIPOS_DE_BLOQUE = [
  "hero",
  "categories",
  "product_grid",
  "about",
  "testimonials",
  "cta",
  "contact",
  "faq",
] as const

export type TipoDeBloque = (typeof TIPOS_DE_BLOQUE)[number]

export function esTipoDeBloque(valor: string): valor is TipoDeBloque {
  return (TIPOS_DE_BLOQUE as readonly string[]).includes(valor)
}

export function texto(bloque: BloquePublico, clave: string) {
  const valor = bloque.props[clave]
  return typeof valor === "string" && valor.trim() ? valor : undefined
}

export function numero(bloque: BloquePublico, clave: string) {
  const valor = bloque.props[clave]
  return typeof valor === "number" && Number.isFinite(valor) ? valor : undefined
}

export function booleano(bloque: BloquePublico, clave: string) {
  return bloque.props[clave] === true
}

/** El texto del botón de la portada. `ctaText` es el nombre viejo. */
export function accionDePortada(bloque: BloquePublico) {
  return texto(bloque, "ctaLabel") ?? texto(bloque, "ctaText")
}

/** Los productos de una grilla: su condición, su categoría y su tope. */
export function productosDeGrilla(
  bloque: BloquePublico,
  productos: Product[]
): Product[] {
  let salida = productos

  const condicion = texto(bloque, "condition")
  if (condicion && condicion !== "todos") {
    salida = salida.filter((p) => p.condition === condicion)
  }

  const categoria = texto(bloque, "category")
  if (categoria) {
    salida = salida.filter(
      (p) => p.category?.toLowerCase() === categoria.toLowerCase()
    )
  }

  if (booleano(bloque, "featured")) {
    salida = salida.filter((p) => p.is_featured)
  }

  return salida.slice(0, numero(bloque, "limit") ?? 12)
}

/**
 * A qué filtro del catálogo lleva el "ver todo" de una grilla.
 *
 * Una grilla de destacados no tiene filtro propio: lleva al catálogo entero.
 */
export function filtroDeGrilla(bloque: BloquePublico): {
  condicion: string | null
} {
  const condicion = texto(bloque, "condition")
  return { condicion: condicion && condicion !== "todos" ? condicion : null }
}

export interface CategoriaConFoto extends CategoriaPublica {
  foto: string | null
}

/**
 * Las categorías que se muestran, cada una con una foto.
 *
 * La foto es la del primer producto con imagen de esa categoría, que por el
 * orden del catálogo suele ser uno destacado. Las categorías sin productos no
 * se muestran: una vitrina vacía se lee como un error.
 */
export function categoriasConFoto(
  tienda: TiendaPublica,
  limite = 6
): CategoriaConFoto[] {
  return tienda.categorias
    .filter((categoria) => categoria.productos > 0)
    .slice(0, limite)
    .map((categoria) => ({
      ...categoria,
      foto:
        tienda.productos.find(
          (p) => p.category_id === categoria.id && p.image_url
        )?.image_url ?? null,
    }))
}

/** La foto de la portada: la del bloque, o la del primer producto que tenga. */
export function fotoDePortada(
  bloque: BloquePublico | null,
  productos: Product[]
): string | null {
  const propia = bloque ? texto(bloque, "imageUrl") : undefined
  if (propia) return propia

  return (
    productos.find((p) => p.is_featured && p.image_url)?.image_url ??
    productos.find((p) => p.image_url)?.image_url ??
    null
  )
}

/** El porcentaje de descuento, si el producto tiene precio anterior. */
export function descuento(producto: Product): number | null {
  const antes = producto.compare_at_price_cents
  if (!antes || antes <= producto.price_cents) return null
  return Math.round((1 - producto.price_cents / antes) * 100)
}

/**
 * Productos para "también te puede gustar".
 *
 * Primero los de la misma categoría, después el resto: una ficha sin
 * sugerencias es un callejón sin salida en el celular.
 */
export function relacionados(
  producto: Product,
  productos: Product[],
  cantidad = 4
): Product[] {
  const otros = productos.filter((p) => p.id !== producto.id && p.stock > 0)
  const misma = otros.filter(
    (p) => producto.category_id && p.category_id === producto.category_id
  )
  const resto = otros.filter((p) => !misma.includes(p))
  return [...misma, ...resto].slice(0, cantidad)
}

export const CONDICIONES: Record<string, string> = {
  nuevo: "Nuevo",
  segunda_mano: "Segunda mano",
  reacondicionado: "Reacondicionado",
}

/** Los ítems de un bloque de preguntas o testimonios, ya leídos. */
export function items(bloque: BloquePublico): Array<Record<string, unknown>> {
  const lista: unknown = bloque.props.items
  if (!Array.isArray(lista)) return []

  return lista.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null && !Array.isArray(item)
  )
}

/** Pregunta y respuesta de un ítem. Acepta las dos formas que se sembraron. */
export function preguntaYRespuesta(item: Record<string, unknown>) {
  const pregunta =
    typeof item.question === "string"
      ? item.question
      : typeof item.q === "string"
        ? item.q
        : null
  const respuesta =
    typeof item.answer === "string"
      ? item.answer
      : typeof item.a === "string"
        ? item.a
        : null
  return { pregunta, respuesta }
}
