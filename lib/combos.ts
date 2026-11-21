/**
 * Los combos que se compran, sin dependencias de servidor ni de React: lo usan
 * la página del combo, el carrito y el pedido. El precio lo decide siempre
 * `create_order`, leyendo el catálogo guardado; esto es para mostrar y para no
 * dejar pedir de más.
 */

/** Un producto del combo, con lo que se eligió de él. */
export interface ParteDeCombo {
  productoId: string
  /** La opción elegida —talla, color—, si el producto las tiene. */
  varianteId?: string | null
  nombre: string
  /** El nombre de la opción, "M · Negro". */
  variante?: string | null
  imagen?: string | null
}

/** De qué combo es una línea del carrito y qué se eligió de cada producto. */
export interface ComboDelCarrito {
  /** El `share_token` del catálogo. */
  catalogo: string
  /** El id del combo dentro del catálogo. */
  id: string
  /** En el orden del combo: un producto repetido va dos veces. */
  partes: ParteDeCombo[]
}

/**
 * La clave de una línea de combo: el combo y lo elegido. El mismo combo con
 * otras tallas es otra línea; con las mismas, suma.
 */
export function claveDeCombo(combo: ComboDelCarrito): string {
  const elegido = combo.partes
    .map((parte) => parte.varianteId ?? parte.productoId)
    .join(",")
  return `combo:${combo.catalogo}:${combo.id}:${elegido}`
}

/** El id con que una línea de combo ocupa el lugar del producto en el carrito. */
export function idDeLineaDeCombo(
  combo: Pick<ComboDelCarrito, "catalogo" | "id">
) {
  return `combo:${combo.catalogo}:${combo.id}`
}

/** Si una línea del carrito es un combo. */
export function esLineaDeCombo(linea: { productoId: string }): boolean {
  return linea.productoId.startsWith("combo:")
}

/** Un producto del combo con el stock de lo que se eligió de él. */
export interface ParteConStock {
  productoId: string
  varianteId?: string | null
  nombre: string
  stock: number
}

/** Cuántas veces lleva el combo cada producto u opción, con su stock. */
function agrupar(partes: ParteConStock[]) {
  const grupos = new Map<string, ParteConStock & { veces: number }>()
  for (const parte of partes) {
    const clave = parte.varianteId ?? parte.productoId
    const grupo = grupos.get(clave)
    if (grupo) grupo.veces += 1
    else grupos.set(clave, { ...parte, veces: 1 })
  }
  return [...grupos.values()]
}

/**
 * Cuántos combos se pueden pedir: los que deja el producto que menos tiene,
 * contando las veces que el combo lo lleva. Es lo mismo que comprueba
 * `create_order`.
 */
export function topeDeCombos(partes: ParteConStock[]): number {
  if (partes.length === 0) return 0
  return Math.max(
    0,
    Math.min(
      ...agrupar(partes).map((grupo) =>
        Math.floor(Math.max(grupo.stock, 0) / grupo.veces)
      )
    )
  )
}

/** Los productos que no alcanzan para un combo, por su nombre y sin repetir. */
export function agotadosDelCombo(partes: ParteConStock[]): string[] {
  return agrupar(partes)
    .filter((grupo) => grupo.stock < grupo.veces)
    .map((grupo) => grupo.nombre)
}

/**
 * Lo que se ahorra con el combo frente a comprar cada producto suelto. Sin
 * ahorro —el combo cuesta igual o más—, `null`: no se muestra.
 */
export function ahorroDelCombo(
  precioCents: number,
  sueltoCents: number
): { cents: number; porcentaje: number } | null {
  const cents = sueltoCents - precioCents
  if (precioCents <= 0 || cents <= 0) return null
  return { cents, porcentaje: Math.round((cents / sueltoCents) * 100) }
}

/** "Short Jean", "Short Jean y Gorra", "Short Jean, Gorra y Polera". */
export function enumerar(nombres: string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? ""
  return `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`
}
