"use server"

import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

/**
 * El pedido que llega desde la tienda pública.
 *
 * Fíjate en lo que **no** está: ni el precio, ni el total, ni el identificador
 * de la tienda vienen del formulario. Los precios los recalcula `create_order`
 * desde el catálogo y la tienda se resuelve por el slug de la URL. Un comprador
 * que edite el carrito en su navegador no puede declarar lo que va a pagar.
 */
const pedidoSchema = z.object({
  nombre: z.string().trim().min(2, "Pon tu nombre.").max(120),
  // Obligatorio: es el canal de entrega, no un dato de contacto opcional.
  telefono: z
    .string()
    .trim()
    .min(7, "Necesitamos tu WhatsApp para coordinar la entrega.")
    .max(30),
  correo: z
    .string()
    .trim()
    .email("Ese correo no parece válido.")
    .or(z.literal("")),
  referido: z.string().trim().max(20).nullable(),
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

export interface ResultadoPedido {
  ok: boolean
  error?: string
  pedidoId?: string
}

export async function crearPedido(
  slug: string,
  entrada: PedidoInput
): Promise<ResultadoPedido> {
  const validado = pedidoSchema.safeParse(entrada)
  if (!validado.success) {
    return { ok: false, error: validado.error.issues[0]?.message }
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

  const v = validado.data

  // El pedido no es una inserción: `orders` no tiene política de INSERT a
  // propósito. `create_order` recalcula precios, valida stock, resuelve el
  // referido contra esta tienda y congela la comisión.
  const { data: pedidoId, error } = await supabase.rpc("create_order", {
    p_store_id: tienda.id,
    p_buyer_name: v.nombre,
    p_buyer_phone: v.telefono,
    // Cadena vacía y no `null`: la función ya hace
    // `nullif(btrim(coalesce(...,'')),'')` con el correo, y con el código
    // comprueba `is not null and btrim(...) <> ''`. Son equivalentes en la
    // base, y así el tipo generado —que no expresa que admiten nulo— encaja
    // sin forzarlo.
    p_buyer_email: v.correo,
    p_referral_code: v.referido ?? "",
    p_items: v.items.map((i) => ({
      product_id: i.productoId,
      quantity: i.cantidad,
    })),
  })

  if (error || !pedidoId) {
    return { ok: false, error: mensajeDeError(error?.message ?? "") }
  }

  return { ok: true, pedidoId }
}

/**
 * Adjunta el comprobante de pago.
 *
 * Pasa por `adjuntar_comprobante`, que es `security definer`: el comprador no
 * tiene cuenta y `orders` no se actualiza desde el cliente. La función solo
 * acepta mientras el pedido siga pendiente, así que nadie puede reescribir la
 * prueba de una venta ya cerrada.
 */
export async function adjuntarComprobante(
  pedidoId: string,
  ruta: string
): Promise<{ ok: boolean; error?: string }> {
  // Una ruta dentro del bucket, no una URL: el comprobante es privado y quien
  // lo sube no puede firmarlo. La firma la hace después quien tiene que verlo.
  if (!/^[\w-]+\/[\w.-]+$/.test(ruta)) {
    return { ok: false, error: "Ese archivo no se subió bien." }
  }

  const supabase = await createClient()
  if (!supabase) return { ok: false, error: "Tienda en modo de ejemplo." }

  const { data, error } = await supabase.rpc("adjuntar_comprobante", {
    p_order_id: pedidoId,
    p_url: ruta,
  })

  if (error) {
    return { ok: false, error: "No pudimos guardar el comprobante." }
  }
  if (!data) {
    return {
      ok: false,
      error: "Este pedido ya tiene comprobante o ya fue confirmado.",
    }
  }

  return { ok: true }
}

function mensajeDeError(crudo: string) {
  if (/stock/i.test(crudo)) {
    return "Se acabó el stock de algo de tu carrito. Revísalo y vuelve a intentar."
  }
  if (/product/i.test(crudo)) {
    return "Uno de los productos ya no está disponible."
  }
  return "No pudimos tomar el pedido. Intenta de nuevo en un momento."
}
