import "server-only"

import { cache } from "react"

import { getMiTienda } from "@/lib/data/panel"
import { createClient } from "@/lib/supabase/server"
import { leerValores, type Variante } from "@/lib/variantes"

type Fila = {
  id: string
  product_id: string
  valores: unknown
  nombre: string
  price_cents: number | null
  stock: number
  sku: string | null
  image_url: string | null
}

const COLUMNAS =
  "id, product_id, valores, nombre, price_cents, stock, sku, image_url"

function aVariante(fila: Fila): Variante {
  return {
    id: fila.id,
    valores: leerValores(fila.valores),
    nombre: fila.nombre,
    precioCents: fila.price_cents,
    stock: fila.stock,
    sku: fila.sku,
    imagen: fila.image_url,
  }
}

/** Agrupa las variantes por producto, en el orden en que se guardaron. */
export function porProducto(filas: Fila[]): Record<string, Variante[]> {
  const grupos: Record<string, Variante[]> = {}
  for (const fila of filas) {
    ;(grupos[fila.product_id] ??= []).push(aVariante(fila))
  }
  return grupos
}

/** Las variantes vivas de un producto de mi tienda. */
export async function getVariantesDeProducto(id: string): Promise<Variante[]> {
  const supabase = await createClient()
  if (!supabase) return []

  const { data } = await supabase
    .from("product_variants")
    .select(COLUMNAS)
    .eq("product_id", id)
    .is("deleted_at", null)
    .order("position")

  return (data ?? []).map(aVariante)
}

/**
 * Las variantes de todos los productos de mi tienda, por producto. Con memoria
 * por pedido: la venta directa y la lista las comparten.
 */
export const getVariantesDeMiTienda = cache(
  async function getVariantesDeMiTienda(): Promise<Record<string, Variante[]>> {
    const supabase = await createClient()
    if (!supabase) return {}

    const tienda = await getMiTienda()
    if (!tienda) return {}

    const { data } = await supabase
      .from("product_variants")
      .select(COLUMNAS)
      .eq("store_id", tienda.id)
      .is("deleted_at", null)
      .order("position")

    return porProducto(data ?? [])
  }
)
