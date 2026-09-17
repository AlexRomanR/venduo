"use server"

import { revalidatePath } from "next/cache"

import { BUCKETS } from "@/lib/supabase/storage"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import type { OrderStatus } from "@/types"

const RUTA = "/panel/pedidos"

export interface Resultado {
  ok: boolean
  error?: string
}

const VALIDOS: OrderStatus[] = [
  "pendiente",
  "pagado",
  "enviado",
  "entregado",
  "cancelado",
]

/**
 * Cambia el estado de un pedido.
 *
 * Es la acción con más consecuencias del panel, y ninguna la escribe este
 * código: las hace el disparador `handle_order_status_change`. Pasar a
 * **pagado** crea la comisión del vendedor contra la base congelada. Pasar a
 * **cancelado** la anula y devuelve el stock al catálogo.
 *
 * Por eso acá no se toca `commissions` ni `products`: duplicarlo desde la
 * aplicación daría comisiones dobles el día que alguien cambie dos veces de
 * estado.
 */
export async function cambiarEstado(
  id: string,
  estado: OrderStatus
): Promise<Resultado> {
  if (!VALIDOS.includes(estado)) {
    return { ok: false, error: "Ese estado no existe." }
  }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }

  const {
    data: { user },
  } = await supabase.auth.getUser()
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
    .update({
      status: estado,
      // `paid_at` marca cuándo entró la plata. Se pone una sola vez: volver a
      // pagado después de un enviado no debería reescribir la fecha.
      ...(estado === "pagado" ? { paid_at: new Date().toISOString() } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("store_id", tienda.id)

  if (error) {
    return { ok: false, error: "No pudimos cambiar el estado del pedido." }
  }

  revalidatePath(RUTA)
  revalidatePath("/panel")
  revalidatePath("/panel/productos")
  return { ok: true }
}

/**
 * Una URL firmada para ver el comprobante.
 *
 * El comprobante vive en un bucket privado y lo subió alguien anónimo, así que
 * su `owner` es nulo: ni el comprador ni el dueño de la tienda pueden leerlo
 * con la política de storage. La firma se hace con la clave de servicio, que
 * salta RLS, y por eso **antes se comprueba que el pedido sea de quien
 * pregunta**. Sin esa comprobación, este sería un lector de comprobantes de
 * cualquier tienda.
 */
export async function verComprobante(
  pedidoId: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const supabase = await createClient()
  if (!supabase) return { ok: false, error: "Supabase sin configurar." }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Necesitas iniciar sesión." }

  const { data: tienda } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!tienda) return { ok: false, error: "Todavía no tienes una tienda." }

  const { data: pedido } = await supabase
    .from("orders")
    .select("payment_proof_url")
    .eq("id", pedidoId)
    .eq("store_id", tienda.id)
    .maybeSingle()

  if (!pedido?.payment_proof_url) {
    return { ok: false, error: "Ese pedido no tiene comprobante." }
  }

  const admin = createAdminClient()
  if (!admin) return { ok: false, error: "Falta la clave de servicio." }

  const { data, error } = await admin.storage
    .from(BUCKETS.paymentProofs)
    // Una hora: lo suficiente para mirarlo, no para repartir el enlace.
    .createSignedUrl(pedido.payment_proof_url, 60 * 60)

  if (error || !data) {
    return { ok: false, error: "No pudimos abrir el comprobante." }
  }

  return { ok: true, url: data.signedUrl }
}
