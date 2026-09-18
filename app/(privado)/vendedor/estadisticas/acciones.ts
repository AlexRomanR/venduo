"use server"

import { revalidatePath } from "next/cache"

import type { InsightSql } from "@/lib/ai/schemas"
import { responderPregunta, type Respuesta } from "@/lib/insights/responder"
import { createClient } from "@/lib/supabase/server"

/**
 * Una pregunta del promotor, contra sus vistas `promotor_*`.
 *
 * No recibe ningún identificador: las vistas ya están acotadas a quien
 * pregunta, y una acción que aceptara un usuario terminaría recibiendo uno
 * ajeno.
 */
export async function preguntar(
  pregunta: string,
  anterior: InsightSql | null
): Promise<Respuesta> {
  return responderPregunta({
    pregunta,
    anterior,
    publico: "promotor",
    storeId: null,
  })
}

export async function guardar(consulta: InsightSql, pregunta: string) {
  const supabase = await createClient()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Tu sesión venció. Vuelve a ingresar." }

  const { error } = await supabase.from("seller_insights").insert({
    user_id: user.id,
    titulo: consulta.titulo,
    pregunta,
    spec: consulta,
  })

  if (error) return { ok: false, error: "No pudimos guardar el gráfico." }

  revalidatePath("/vendedor/estadisticas")
  return { ok: true }
}

export async function borrar(id: string) {
  const supabase = await createClient()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }

  const { error } = await supabase
    .from("seller_insights")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { ok: false, error: "No pudimos borrar el gráfico." }

  revalidatePath("/vendedor/estadisticas")
  return { ok: true }
}
