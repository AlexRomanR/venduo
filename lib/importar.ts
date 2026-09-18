import type { ProductCondition } from "@/types"

/**
 * Leer una planilla de productos.
 *
 * El negocio llena la plantilla de `public/plantillas/productos-venduo.xlsx`,
 * pero una planilla hecha por una persona llega de muchas formas: con tildes o
 * sin ellas, con "Segunda mano" en vez de "segunda_mano", con un monto escrito
 * "180,50". Acá se traduce todo eso a una fila limpia; si una fila no se puede
 * leer, se dice cuál y por qué, en vez de rechazar el archivo entero.
 *
 * Sin dependencias de servidor ni de la biblioteca de Excel: recibe las filas
 * ya leídas, así se puede usar con cualquier fuente.
 */

/** Una fila tal como se entendió, antes de validarla. */
export interface FilaLeida {
  /** El número de fila en la planilla, para decir dónde está el error. */
  numero: number
  nombre: string
  descripcion: string
  costoBase: number | null
  stock: number | null
  categoria: string
  condicion: ProductCondition | null
  /** El texto original, para mostrarlo si no se entendió. */
  condicionEscrita: string
  notaCondicion: string
  sku: string
}

type Campo = Exclude<keyof FilaLeida, "numero" | "condicionEscrita">

/**
 * Qué columna es qué. Se compara sin tildes, sin mayúsculas y sin lo que va
 * entre paréntesis, así "Cuánto quieres recibir (Bs)" y "cuanto quieres
 * recibir" son la misma columna.
 */
const COLUMNAS: Record<string, Campo> = {
  nombre: "nombre",
  producto: "nombre",
  descripcion: "descripcion",
  "cuanto quieres recibir": "costoBase",
  "costo base": "costoBase",
  costo: "costoBase",
  stock: "stock",
  unidades: "stock",
  cantidad: "stock",
  categoria: "categoria",
  condicion: "condicion",
  "estado del articulo": "notaCondicion",
  estado: "notaCondicion",
  codigo: "sku",
  sku: "sku",
}

export function normalizar(texto: unknown): string {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/** Un monto o una cantidad, venga como número o como texto con coma. */
function numero(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null
  const texto = String(valor ?? "")
    .replace(/[^\d,.-]/g, "")
    .trim()
  if (!texto) return null

  // "1.250,50" y "1250,50" son bolivianos con coma decimal; "1250.50" también
  // se acepta. La última coma o punto es el decimal si tiene dos cifras.
  const normal = /,\d{1,2}$/.test(texto)
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto.replace(/,/g, "")
  const valorNumerico = Number(normal)
  return Number.isFinite(valorNumerico) ? valorNumerico : null
}

/** La condición, entendida con las formas en que la escribe una persona. */
function condicion(valor: unknown): ProductCondition | null {
  const texto = normalizar(valor).replace(/[_-]/g, " ")
  if (!texto || texto === "nuevo" || texto === "nueva") return "nuevo"
  if (["segunda mano", "usado", "usada", "de segunda"].includes(texto)) {
    return "segunda_mano"
  }
  if (["reacondicionado", "reacondicionada", "restaurado"].includes(texto)) {
    return "reacondicionado"
  }
  return null
}

export interface Lectura {
  filas: FilaLeida[]
  /** Columnas obligatorias que no aparecen en la primera fila. */
  faltan: string[]
}

const OBLIGATORIAS: Array<[Campo, string]> = [
  ["nombre", "Nombre"],
  ["costoBase", "Cuánto quieres recibir (Bs)"],
  ["stock", "Stock"],
]

/**
 * Las filas de una hoja, con la primera como encabezado.
 *
 * Las filas vacías se saltan: una planilla suele tener renglones en blanco al
 * final, y contarlos como errores asusta sin motivo.
 */
export function leerPlanilla(hoja: unknown[][]): Lectura {
  const [encabezado = [], ...resto] = hoja
  const indices = new Map<Campo, number>()

  encabezado.forEach((celda, i) => {
    const campo = COLUMNAS[normalizar(celda)]
    if (campo && !indices.has(campo)) indices.set(campo, i)
  })

  const faltan = OBLIGATORIAS.filter(([campo]) => !indices.has(campo)).map(
    ([, titulo]) => titulo
  )

  const celda = (fila: unknown[], campo: Campo) => {
    const i = indices.get(campo)
    return i === undefined ? null : fila[i]
  }

  const filas: FilaLeida[] = []
  resto.forEach((fila, i) => {
    const vacia = fila.every(
      (valor) => valor === null || String(valor).trim() === ""
    )
    if (vacia) return

    const condicionEscrita = String(celda(fila, "condicion") ?? "").trim()

    filas.push({
      // +2: la planilla empieza en 1 y la primera fila es el encabezado.
      numero: i + 2,
      nombre: String(celda(fila, "nombre") ?? "").trim(),
      descripcion: String(celda(fila, "descripcion") ?? "").trim(),
      costoBase: numero(celda(fila, "costoBase")),
      stock: numero(celda(fila, "stock")),
      categoria: String(celda(fila, "categoria") ?? "").trim(),
      condicion: condicion(condicionEscrita),
      condicionEscrita,
      notaCondicion: String(celda(fila, "notaCondicion") ?? "").trim(),
      sku: String(celda(fila, "sku") ?? "").trim(),
    })
  })

  return { filas, faltan }
}

/** Cuántos productos se pueden cargar de una vez. */
export const MAXIMO_POR_PLANILLA = 200
