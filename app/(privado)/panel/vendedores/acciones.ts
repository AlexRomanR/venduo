"use server"

import { revalidatePath } from "next/cache"

import { getMiTienda } from "@/lib/data/panel"
import { createClient } from "@/lib/supabase/server"

export type Decision = "activo" | "rechazado"

/**
 * Aprobar o rechazar a quien pidió vender para la tienda.
 *
 * Solo mueve vínculos pendientes de mi tienda. El filtro por tienda va escrito
 * además de la política de RLS, y el de estado hace que un doble toque no
 * reactive a alguien que ya se había rechazado.
 *
 * Aprobar no le da nada más que el vínculo activo: su código de referido ya
 * existía, y desde ahora `create_order` lo reconoce y le congela la comisión.
 */
export async function decidirSolicitud(
  id: string,
  decision: Decision
): Promise<{ ok: boolean; error?: string }> {
  if (decision !== "activo" && decision !== "rechazado") {
    return { ok: false, error: "Esa respuesta no existe." }
  }

  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: "Estás en modo demo: los cambios no se guardan.",
    }
  }

  const tienda = await getMiTienda()
  if (!tienda) return { ok: false, error: "No tienes una tienda." }

  const { data, error } = await supabase
    .from("store_sellers")
    .update({ status: decision })
    .eq("id", id)
    .eq("store_id", tienda.id)
    .eq("status", "pendiente")
    .is("deleted_at", null)
    .select("id")

  if (error) {
    return {
      ok: false,
      error: "No pudimos guardar tu respuesta. Intenta de nuevo.",
    }
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "Esa solicitud ya no está pendiente." }
  }

  // El Resumen y la barra cuentan las solicitudes: tienen que bajar también.
  revalidatePath("/panel", "layout")
  return { ok: true }
}
