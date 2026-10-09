import "server-only"

import { cache } from "react"

import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { diaEnBolivia } from "@/lib/format"
import {
  resumirVisitas,
  diasHastaHoy,
  type FilaDeVisitas,
  type ResumenDeVisitas,
} from "@/lib/visitas-resumen"
import { createClient, type createAdminClient } from "@/lib/supabase/server"

type Cliente = NonNullable<ReturnType<typeof createAdminClient>>

/**
 * Las visitas de una tienda en los últimos `dias`, con sus productos y sus
 * ventas pagadas del mismo período.
 *
 * Sirve para los dos paneles con el cliente de cada uno: el administrador lee
 * con la clave de servicio; el emprendedor, con su sesión, y RLS le devuelve
 * nada si Venduo no le activó las visitas.
 */
export async function visitasDeTienda(
  db: Cliente,
  tienda: string,
  dias = 30
): Promise<ResumenDeVisitas> {
  const hoy = diaEnBolivia()
  const desde = diasHastaHoy(dias, hoy)[0]
  const inicio = `${desde}T00:00:00-04:00`

  const [filas, productos, lineas, pedidos] = await Promise.all([
    db
      .from("store_visits_daily")
      .select("day, kind, source, product_id, visits, visitors")
      .eq("store_id", tienda)
      .gte("day", desde),
    db.from("products").select("id, name").eq("store_id", tienda),
    db
      .from("order_items")
      .select("product_id, quantity, orders!inner(status, created_at)")
      .eq("store_id", tienda)
      .eq("orders.status", "pagado")
      .gte("orders.created_at", inicio),
    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", tienda)
      .eq("status", "pagado")
      .gte("created_at", inicio),
  ])

  const vendidos: Record<string, number> = {}
  for (const linea of lineas.data ?? []) {
    if (!linea.product_id) continue
    vendidos[linea.product_id] =
      (vendidos[linea.product_id] ?? 0) + linea.quantity
  }

  return resumirVisitas((filas.data ?? []) as FilaDeVisitas[], {
    dias,
    hoy,
    nombres: Object.fromEntries(
      (productos.data ?? []).map((p) => [p.id, p.name])
    ),
    vendidos,
    pagados: pedidos.count ?? 0,
  })
}

/**
 * Las visitas de la tienda de quien mira, solo si Venduo se las activó. Si no,
 * `null`: la pantalla no muestra nada ni explica por qué.
 */
export const visitasDeMiTienda = cache(async function visitasDeMiTienda(
  dias = 30
): Promise<ResumenDeVisitas | null> {
  const [supabase, tienda, funciones] = await Promise.all([
    createClient(),
    getMiTienda(),
    funcionesDeMiTienda(),
  ])
  if (!supabase || !tienda || funciones.visitas !== "activa") return null
  return visitasDeTienda(supabase, tienda.id, dias)
})
