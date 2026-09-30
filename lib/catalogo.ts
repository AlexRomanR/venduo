import type { Product, ProductCondition } from "@/types"

/**
 * Filtrar y ordenar el catálogo de la tienda pública.
 *
 * Vive fuera de `lib/data` porque lo usan también componentes de cliente —el
 * buscador lee los órdenes posibles— y un módulo que importa el cliente de
 * Supabase del servidor no puede viajar al navegador.
 */

/** Cómo se puede ordenar el catálogo. El primero es el orden por defecto. */
export const ORDENES_DE_CATALOGO = {
  destacados: "Destacados",
  recientes: "Lo más nuevo",
  "precio-menor": "Precio: menor a mayor",
  "precio-mayor": "Precio: mayor a menor",
} as const

export type OrdenDeCatalogo = keyof typeof ORDENES_DE_CATALOGO

export interface FiltrosDeCatalogo {
  categoria: string | null
  /** Una condición del producto, o `oferta`: tener precio anterior. */
  condicion: string | null
  buscar: string | null
  orden: OrdenDeCatalogo
}

/** Los filtros tal como llegan en la URL, ya limpios. */
export function leerFiltros(
  consulta: Record<string, string | string[] | undefined>
): FiltrosDeCatalogo {
  const texto = (clave: string) =>
    typeof consulta[clave] === "string" && consulta[clave]
      ? (consulta[clave] as string).slice(0, 80)
      : null

  const orden = texto("orden")

  return {
    categoria: texto("categoria"),
    condicion: texto("condicion"),
    buscar: texto("buscar"),
    orden:
      orden && Object.hasOwn(ORDENES_DE_CATALOGO, orden)
        ? (orden as OrdenDeCatalogo)
        : "destacados",
  }
}

/**
 * Los filtros de la vitrina pública.
 *
 * `destacados` es el orden en que ya viene el catálogo desde la base: primero
 * lo destacado, después lo más nuevo. Los demás ordenan una copia.
 */
export function filtrarCatalogo(
  productos: Product[],
  filtros: Partial<FiltrosDeCatalogo>
): Product[] {
  let salida = productos

  if (filtros.categoria) {
    salida = salida.filter((p) => p.category_id === filtros.categoria)
  }

  if (filtros.condicion === "oferta") {
    salida = salida.filter((p) => Boolean(p.compare_at_price_cents))
  } else if (filtros.condicion) {
    salida = salida.filter(
      (p) => p.condition === (filtros.condicion as ProductCondition)
    )
  }

  const buscar = filtros.buscar?.trim().toLowerCase()
  if (buscar) {
    salida = salida.filter(
      (p) =>
        p.name.toLowerCase().includes(buscar) ||
        p.description?.toLowerCase().includes(buscar) ||
        p.category?.toLowerCase().includes(buscar)
    )
  }

  switch (filtros.orden) {
    case "recientes":
      return [...salida].sort((a, b) =>
        b.created_at.localeCompare(a.created_at)
      )
    case "precio-menor":
      return [...salida].sort((a, b) => a.price_cents - b.price_cents)
    case "precio-mayor":
      return [...salida].sort((a, b) => b.price_cents - a.price_cents)
    default:
      return salida
  }
}

/** Lo justo de un producto para sugerirlo en el carrito, que es de cliente. */
export interface ProductoSugerido {
  id: string
  nombre: string
  precioCents: number
  imagen: string | null
  stock: number
}

/**
 * Productos para ofrecer en el carrito, destacados primero.
 *
 * Van de más: el carrito descarta los que ya tiene y muestra tres. Se mandan
 * pocos y recortados porque viajan al navegador dentro de la página, y el
 * catálogo entero no hace falta para sugerir tres cosas.
 */
export function sugerenciasDelCarrito(
  productos: Product[],
  cantidad = 8
): ProductoSugerido[] {
  return productos
    .filter((p) => p.stock > 0 && p.image_url)
    .sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
    .slice(0, cantidad)
    .map((p) => ({
      id: p.id,
      nombre: p.name,
      precioCents: p.price_cents,
      imagen: p.image_url,
      stock: p.stock,
    }))
}
