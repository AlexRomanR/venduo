import { leerColumnas, leerPrecio } from "@/lib/carga"
import type { BorradoresDeProductos, LecturaDePlanilla } from "../schemas"

/**
 * El modo demo de la carga de productos. Con fotos, un borrador por foto sin
 * precio, como haría la IA si no lo ve escrito. Con una lista, lee cada
 * renglón: el número del final es el precio. Con una planilla, adivina las
 * columnas por sus encabezados, lo mismo que la pantalla sin IA.
 */

function leerContexto(mensaje: string): Record<string, unknown> {
  const crudo = mensaje.match(/<<CONTEXTO>>\s*([\s\S]*?)\s*<<\/CONTEXTO>>/)?.[1]
  try {
    const leido = JSON.parse(crudo ?? "{}") as unknown
    return leido && typeof leido === "object"
      ? (leido as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

const LISTA_DE_EJEMPLO = [
  "Polera básica blanca 65",
  "Short deportivo 90",
  "Gorra con visera 55",
  "Medias de algodón, pack de 3",
]

export function borradoresDeDemostracion(
  mensaje: string
): BorradoresDeProductos {
  const contexto = leerContexto(mensaje)
  const categorias = Array.isArray(contexto.categorias)
    ? contexto.categorias.filter((c): c is string => typeof c === "string")
    : []
  const fotos = typeof contexto.fotos === "number" ? contexto.fotos : 0

  if (contexto.modo === "fotos") {
    return {
      borradores: Array.from({ length: Math.min(fotos, 40) }, (_, i) => ({
        nombre: `Producto de la foto ${i + 1}`,
        precio: null,
        stock: null,
        categoria: categorias[i % Math.max(categorias.length, 1)] ?? null,
        descripcion: "",
        foto: i,
        duda: "En el modo demo la IA no mira la foto: escribe el nombre y el precio.",
      })),
      aviso: null,
    }
  }

  const texto = typeof contexto.texto === "string" ? contexto.texto : ""
  const renglones = (texto.trim() ? texto.split(/\r?\n/) : LISTA_DE_EJEMPLO)
    .map((renglon) => renglon.trim())
    .filter(Boolean)
    .slice(0, 60)

  return {
    borradores: renglones.map((renglon) => {
      const numero = /(?:bs\.?\s*)?([\d.,]+)\s*(?:bs\.?)?$/i.exec(renglon)
      const precio = numero ? leerPrecio(numero[1]) : null
      const nombre = (numero ? renglon.slice(0, numero.index) : renglon)
        .replace(/[\s,;:-]+$/, "")
        .slice(0, 120)
      return {
        nombre,
        precio,
        stock: null,
        categoria: categorias[0] ?? null,
        descripcion: "",
        foto: null,
        duda: precio === null ? "No encontramos el precio." : null,
      }
    }),
    aviso: texto.trim()
      ? null
      : "En el modo demo, sin una lista escrita, armamos unos de ejemplo.",
  }
}

export function lecturaDeDemostracion(mensaje: string): LecturaDePlanilla {
  const contexto = leerContexto(mensaje)
  const filas = Array.isArray(contexto.filas)
    ? contexto.filas.map((fila) =>
        Array.isArray(fila) ? fila.map((celda) => String(celda ?? "")) : []
      )
    : []
  return { ...leerColumnas(filas), aviso: null }
}
