"use server"

import { revalidatePath } from "next/cache"

import { createClient, getUsuario } from "@/lib/supabase/server"
import { ESTADOS } from "@/lib/pedidos"
import type { OrderStatus } from "@/types"

const RUTA = "/panel/pedidos"

export interface Resultado {
  ok: boolean
  error?: string
}

/**
 * Cambia el estado de un pedido.
 *
 * Es la acción con más consecuencias del panel, y ninguna la escribe este
 * código: las hace el disparador `handle_order_status_change`. Pasar a
 * **pagado** descuenta el stock y fecha el pago; cancelar un pagado lo
 * devuelve. El disparador también rechaza los cambios que no tienen sentido.
 *
 * Por eso acá no se toca `products`: duplicarlo desde la aplicación daría
 * stock inventado el día que alguien cambie dos veces de estado.
 */
export async function cambiarEstado(
  id: string,
  estado: OrderStatus
): Promise<Resultado> {
  if (!ESTADOS.some((e) => e.valor === estado)) {
    return { ok: false, error: "Ese estado no existe." }
  }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }

  const user = await getUsuario()
  if (!user) return { ok: false, error: "Necesitas iniciar sesión." }

  const { data: tienda } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!tienda) return { ok: false, error: "Todavía no tienes una tienda." }

  const { error } = await supabase
    .from("orders")
    .update({ status: estado, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("store_id", tienda.id)

  if (error) return { ok: false, error: mensajeDeError(error.message) }

  revalidatePath(RUTA)
  revalidatePath("/panel")
  revalidatePath("/panel/productos")
  return { ok: true }
}

function mensajeDeError(crudo: string) {
  const sinStock = /Stock insuficiente de (.+): quedan (\d+)/.exec(crudo)
  if (sinStock) {
    return `No alcanza el stock de ${sinStock[1]}: quedan ${sinStock[2]}. Repón el stock o cancela el pedido.`
  }
  if (/cancelado no cambia/i.test(crudo)) {
    return "Un pedido cancelado ya no cambia de estado."
  }
  if (/no vuelve a pendiente/i.test(crudo)) {
    return "Un pedido pagado no vuelve a pendiente. Si no se concretó, cancélalo."
  }
  return "No pudimos cambiar el estado del pedido."
}
