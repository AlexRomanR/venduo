"use server"

import { revalidatePath } from "next/cache"

import { redirect } from "next/navigation"

import { desconectarCanva } from "@/lib/canva"
import { darDeBajaLaCuenta } from "@/lib/cuenta"
import { getMiTienda } from "@/lib/data/panel"
import { createClient } from "@/lib/supabase/server"
import { fechaDeVueltaValida } from "@/lib/vacaciones"
import { actualizarVistaDespues } from "@/lib/vista"

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

/**
 * Pone o saca la tienda de vacaciones, y su fecha de vuelta.
 *
 * Al prenderlas se conserva el `desde` si ya estaba de vacaciones: cambiar la
 * fecha no reinicia nada. La base rechaza los pedidos de la tienda mientras
 * dure; la venta directa sigue.
 */
export async function guardarVacaciones(entrada: {
  activa: boolean
  hasta: string | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (entrada.activa && entrada.hasta && !fechaDeVueltaValida(entrada.hasta)) {
    return { ok: false, error: "Elige un día desde mañana." }
  }

  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: "Estás en modo demo: los cambios no se guardan.",
    }
  }
  const tienda = await getMiTienda()
  if (!tienda) return { ok: false, error: "Tu sesión venció. Vuelve a entrar." }

  const { error } = await supabase
    .from("stores")
    .update(
      entrada.activa
        ? {
            vacaciones_desde:
              tienda.vacaciones_desde ?? new Date().toISOString(),
            vacaciones_hasta: entrada.hasta,
          }
        : { vacaciones_desde: null, vacaciones_hasta: null }
    )
    .eq("id", tienda.id)

  if (error) {
    return {
      ok: false,
      error: "No pudimos cambiar tus vacaciones. Revisa tu conexión.",
    }
  }

  revalidatePath("/cuenta")
  revalidatePath("/panel")
  // La portada cambió: lleva la banda. La captura de la app se rehace.
  actualizarVistaDespues()
  return { ok: true }
}
