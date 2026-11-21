import "server-only"

import { CARPETA_DE_CARGA } from "@/lib/carga"
import { env } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

/**
 * Pasado esto, una foto de la carga que no terminó en un producto es de una
 * carga abandonada. Los borradores viven en la pestaña (`sessionStorage`): dos
 * días alcanzan de sobra para volver a ellos.
 */
const PLAZO_MS = 2 * 24 * 60 * 60 * 1000

/**
 * Borra las fotos de cargas que no se terminaron.
 *
 * La carga de varios sube las fotos al leerlas, antes de que existan los
 * productos, a `product-images/{tienda}/carga/`. Si la persona no crea esos
 * productos, quedaban ahí para siempre. Se borran las de más de dos días que
 * ningún producto de la tienda usa.
 *
 * Solo esa carpeta: las fotos de esa carpeta solo pueden estar en un producto
 * (la biblioteca del editor y los catálogos toman las fotos de los productos).
 * Corre después de responder (`after`), con la sesión de la persona: el bucket
 * solo le deja borrar lo que subió ella. Si algo falla, se intenta la próxima.
 */
export async function limpiarCargasViejas(tiendaId: string): Promise<void> {
  const supabase = await createClient()
  const base = env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabase || !base) return

  const carpeta = `${tiendaId}/${CARPETA_DE_CARGA}`
  const { data: archivos, error } = await supabase.storage
    .from("product-images")
    .list(carpeta, {
      limit: 1000,
      sortBy: { column: "created_at", order: "asc" },
    })
  if (error || !archivos?.length) return

  const limite = Date.now() - PLAZO_MS
  const viejos = archivos.filter(
    (archivo) =>
      archivo.id && // las carpetas no tienen id
      archivo.created_at &&
      new Date(archivo.created_at).getTime() < limite
  )
  if (!viejos.length) return

  const rutas = viejos.map((archivo) => `${carpeta}/${archivo.name}`)
  const urlDe = (ruta: string) =>
    supabase.storage.from("product-images").getPublicUrl(ruta).data.publicUrl

  // Las que usa algún producto de la tienda.
  const { data: productos, error: errorDeProductos } = await supabase
    .from("products")
    .select("images")
    .eq("store_id", tiendaId)
    .overlaps("images", rutas.map(urlDe))
  if (errorDeProductos) return
  const usadas = new Set((productos ?? []).flatMap((p) => p.images ?? []))

  const sueltas = rutas.filter((ruta) => !usadas.has(urlDe(ruta)))
  if (!sueltas.length) return
  const { error: errorAlBorrar } = await supabase.storage
    .from("product-images")
    .remove(sueltas)
  if (errorAlBorrar) {
    console.error(
      "[carga] no se pudieron borrar fotos viejas:",
      errorAlBorrar.message
    )
  }
}
