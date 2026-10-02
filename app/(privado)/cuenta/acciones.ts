"use server"

import { revalidatePath } from "next/cache"

import { desconectarCanva } from "@/lib/canva"
import { getMiTienda } from "@/lib/data/panel"

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
