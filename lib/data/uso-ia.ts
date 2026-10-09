import "server-only"

import { after } from "next/server"

import { exigirFuncion } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { diaEnBolivia } from "@/lib/format"
import type { ClaveFuncion } from "@/lib/funciones"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * El permiso y la cuenta de cada pedido a la IA.
 *
 * Cada acción que llama al modelo pide permiso antes —la función activa para
 * esta tienda, y el tope diario si Venduo puso uno— y anota después cómo le
 * fue, para el panel de administración. La anotación corre con `after`: no
 * demora la respuesta.
 */

export type TipoDeIa = "editor" | "estadisticas" | "catalogos"

const FUNCION: Record<TipoDeIa, ClaveFuncion> = {
  editor: "ia_editor",
  estadisticas: "ia_estadisticas",
  catalogos: "ia_catalogos",
}

export const AVISO_DE_TOPE =
  "Llegaste al límite de pedidos a la IA por hoy. Mañana vuelve a estar disponible."

export async function permisoDeIa(
  tipo: TipoDeIa
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = createAdminClient()
  const [funcion, tienda, tope] = await Promise.all([
    exigirFuncion(FUNCION[tipo]),
    getMiTienda(),
    db
      ?.from("platform_settings")
      .select("value")
      .eq("key", "ia_tope_diario")
      .maybeSingle(),
  ])
  if (!funcion.ok) return funcion

  const maximo = tope?.data?.value
  if (!db || !tienda || typeof maximo !== "number" || maximo < 1) {
    return { ok: true }
  }

  // El día es el de Bolivia, que no cambia de hora en el año.
  const { count } = await db
    .from("ai_requests")
    .select("id", { count: "exact", head: true })
    .eq("store_id", tienda.id)
    .gte("created_at", `${diaEnBolivia()}T00:00:00-04:00`)
  return (count ?? 0) >= maximo
    ? { ok: false, error: AVISO_DE_TOPE }
    : { ok: true }
}

export async function anotarUsoDeIa(
  tipo: TipoDeIa,
  inicio: number,
  error?: unknown
) {
  const ms = Date.now() - inicio
  // La tienda ya la leyó el permiso: con memoria por pedido, no es otro viaje.
  const tienda = await getMiTienda()
  after(async () => {
    const db = createAdminClient()
    if (!db) return
    const { error: fallo } = await db.from("ai_requests").insert({
      store_id: tienda?.id ?? null,
      kind: tipo,
      ok: error === undefined,
      ms,
      error:
        error === undefined
          ? null
          : (error instanceof Error ? error.message : String(error)).slice(
              0,
              300
            ),
    })
    if (fallo) console.error("[ia] no se pudo anotar el uso:", fallo.message)
  })
}
