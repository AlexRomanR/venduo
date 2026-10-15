"use server"

import { revalidatePath } from "next/cache"

import { redirect } from "next/navigation"

import { desconectarCanva } from "@/lib/canva"
import { darDeBajaLaCuenta } from "@/lib/cuenta"
import { getMiTienda } from "@/lib/data/panel"
import { createClient } from "@/lib/supabase/server"

/**
 * Da de baja la cuenta y cierra la sesión. Sale a la página pública de la
 * baja, que dice qué pasa ahora y qué a los 90 días.
 */
export async function darDeBaja(): Promise<{ ok: false; error: string }> {
  const resultado = await darDeBajaLaCuenta()
  if (!resultado.ok) return resultado

  const supabase = await createClient()
  await supabase?.auth.signOut()
  redirect("/borrar-cuenta?hecho=1")
}

/**
 * Quita el acceso de Venduo a la cuenta de Canva de la tienda. La próxima vez
 * que se toque "Editar en Canva", Canva vuelve a pedir la aprobación.
 *
 * La tienda sale de la sesión: nadie desconecta la de otro.
 */
export async function desconectarDeCanva(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const tienda = await getMiTienda()
  if (!tienda) return { ok: false, error: "Tu sesión venció. Vuelve a entrar." }
  await desconectarCanva(tienda.id)
  revalidatePath("/cuenta")
  return { ok: true }
}
