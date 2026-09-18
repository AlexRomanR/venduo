"use server"

import { createClient } from "@/lib/supabase/server"
import { rpcMigrado } from "@/lib/supabase/rpc"
import {
  checkoutMarketplaceSchema,
  type CheckoutMarketplaceInput,
} from "@/lib/validation/checkout-marketplace"

export interface ResultadoCheckoutMarketplace {
  ok: boolean
  pedidoIds?: string[]
  error?: string
}

export async function crearPedidosMarketplace(
  entrada: CheckoutMarketplaceInput
): Promise<ResultadoCheckoutMarketplace> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error:
        "El Marketplace está en modo de demostración: el pago no se guarda.",
    }
  }

  const validado = checkoutMarketplaceSchema.safeParse(entrada)
  if (!validado.success) {
    return { ok: false, error: validado.error.issues[0]?.message }
  }

  const { nombre, telefono, correo, items } = validado.data
  const { data, error } = await rpcMigrado(
    supabase,
    "create_marketplace_orders",
    {
      p_buyer_name: nombre,
      p_buyer_phone: telefono,
      p_buyer_email: correo,
      p_items: items.map((item) => ({
        product_id: item.productoId,
        quantity: item.cantidad,
        referral_code: item.referido,
      })),
    }
  )

  if (error) {
    if (/stock/i.test(error.message)) {
      return {
        ok: false,
        error: "Cambió el stock de uno de tus productos. Revisa el carrito.",
      }
    }
    return {
      ok: false,
      error: "No pudimos crear tus pedidos. Intenta de nuevo en un momento.",
    }
  }

  const pedidoIds = Array.isArray(data)
    ? data.filter((id): id is string => typeof id === "string")
    : []

  if (pedidoIds.length === 0) {
    return { ok: false, error: "No pudimos crear ningún pedido." }
  }

  return { ok: true, pedidoIds }
}
