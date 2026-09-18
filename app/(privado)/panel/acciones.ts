"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

/**
 * Marca la guía de primeros pasos como terminada.
 *
 * Solo escribe la fecha si todavía no estaba: volver a ver la guía desde la
 * barra lateral y cerrarla otra vez no tiene que mover cuándo empezó el
 * negocio. El `update` filtra por dueño —y RLS lo vuelve a comprobar—, así que
 * no hace falta pedir el identificador de la tienda.
 */
export async function terminarGuia(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  if (!supabase) return { ok: true }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Tu sesión se cerró. Vuelve a entrar." }

  const { error } = await supabase
    .from("stores")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .is("onboarded_at", null)

  if (error) {
    return { ok: false, error: "No pudimos guardar. Intenta de nuevo." }
  }

  revalidatePath("/panel")
  return { ok: true }
}
