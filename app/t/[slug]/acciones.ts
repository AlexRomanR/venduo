"use server"

import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

/**
 * El pedido que sale de la tienda pública hacia el WhatsApp de la tienda.
 *
 * Fíjate en lo que **no** está: ni el precio, ni el total, ni el identificador
 * de la tienda vienen del navegador, y tampoco datos de quien compra —esos ya
 * van en el chat—. Los precios los recalcula `create_order` desde el catálogo
 * y la tienda se resuelve por el slug de la URL. Un comprador que edite el
 * carrito en su navegador no puede declarar lo que va a pagar.
 */
const pedidoSchema = z.object({
  items: z
    .array(
      z.object({
        productoId: z.uuid(),
        cantidad: z.number().int().min(1).max(99),
      })
    )
    .min(1, "Tu carrito está vacío.")
    .max(30, "Demasiados artículos en un solo pedido."),
})

export type PedidoInput = z.input<typeof pedidoSchema>

/** Una línea del pedido, con el precio que calculó el servidor. */
export interface LineaPedida {
  nombre: string
  cantidad: number
  totalCents: number
}

export type ResultadoPedido =
  | {
      ok: true
      numero: number
      /** El WhatsApp de la tienda, a donde se manda el pedido. */
      whatsapp: string
      lineas: LineaPedida[]
      totalCents: number
    }
  | { ok: false; error: string }

/** Lo que devuelve `create_order`: se valida porque llega como `Json`. */
const respuestaSchema = z.object({
  numero: z.number().int(),
  whatsapp: z.string().min(1),
  total_cents: z.number().int(),
  items: z.array(
    z.object({
      nombre: z.string(),
      cantidad: z.number().int(),
      total_cents: z.number().int(),
    })
  ),
})

export async function crearPedido(
  slug: string,
  entrada: PedidoInput
): Promise<ResultadoPedido> {
  const validado = pedidoSchema.safeParse(entrada)
  if (!validado.success) {
    return {
      ok: false,
      error: validado.error.issues[0]?.message ?? "Revisa tu carrito.",
    }
  }

  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      error: "La tienda está en modo de ejemplo: todavía no toma pedidos.",
    }
  }

  const { data: tienda } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .maybeSingle()

  if (!tienda) return { ok: false, error: "Esta tienda ya no está disponible." }

  // El pedido no es una inserción: `orders` no tiene política de INSERT a
  // propósito. `create_order` recalcula los precios y comprueba el stock.
  const { data, error } = await supabase.rpc("create_order", {
    p_store_id: tienda.id,
    p_items: validado.data.items.map((i) => ({
      product_id: i.productoId,
      quantity: i.cantidad,
    })),
  })

  if (error) return { ok: false, error: mensajeDeError(error.message) }

  const respuesta = respuestaSchema.safeParse(data)
  if (!respuesta.success) {
    return { ok: false, error: mensajeDeError("") }
  }

  return {
    ok: true,
    numero: respuesta.data.numero,
    whatsapp: respuesta.data.whatsapp,
    totalCents: respuesta.data.total_cents,
    lineas: respuesta.data.items.map((item) => ({
      nombre: item.nombre,
      cantidad: item.cantidad,
      totalCents: item.total_cents,
    })),
  }
}

function mensajeDeError(crudo: string) {
  if (/stock/i.test(crudo)) {
    return "Se acabó el stock de algo de tu carrito. Revísalo y vuelve a intentar."
  }
  if (/product/i.test(crudo)) {
    return "Uno de los productos ya no está disponible."
  }
  if (/whatsapp/i.test(crudo)) {
    return "Esta tienda todavía no recibe pedidos por WhatsApp."
  }
  return "No pudimos armar tu pedido. Intenta de nuevo en un momento."
}
