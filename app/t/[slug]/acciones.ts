"use server"

import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

/**
 * El pedido que llega desde la tienda pública.
 *
 * Fíjate en lo que **no** está: ni el precio, ni el total, ni el identificador
 * de la tienda vienen del formulario. El precio lo recalcula `create_order`
 * desde el catálogo, y la tienda se resuelve por el slug de la URL. Un
 * comprador que edite el formulario no puede declarar lo que va a pagar.
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
  cantidad: z.number().int().min(1).max(99),
  productoId: z.uuid(),
  referido: z.string().trim().max(20).nullable(),
})

export type PedidoInput = z.input<typeof pedidoSchema>

export interface ResultadoPedido {
  ok: boolean
  error?: string
  pedidoId?: string
  /** El enlace de WhatsApp con el detalle, para coordinar la entrega. */
  whatsapp?: string
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
    .select("id, name")
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
    p_items: [{ product_id: v.productoId, quantity: v.cantidad }],
  })

  if (error || !pedidoId) {
    return { ok: false, error: mensajeDeError(error?.message ?? "") }
  }

  const { data: pedido } = await supabase
    .from("orders")
    .select("order_number")
    .eq("id", pedidoId)
    .maybeSingle()

  return {
    ok: true,
    pedidoId,
    whatsapp: mensajeDeWhatsApp(
      tienda.name,
      pedido?.order_number ? `#${pedido.order_number}` : null
    ),
  }
}

/**
 * La entrega se coordina por WhatsApp: la plataforma no gestiona envíos.
 * Lo que sí hace es dejar el mensaje escrito para que nadie tenga que
 * explicar qué pidió.
 */
function mensajeDeWhatsApp(tienda: string, codigo: string | null) {
  const texto = codigo
    ? `Hola ${tienda}, acabo de hacer el pedido ${codigo} por su tienda en Venduo.`
    : `Hola ${tienda}, acabo de hacer un pedido por su tienda en Venduo.`

  return `https://wa.me/?text=${encodeURIComponent(texto)}`
}

function mensajeDeError(crudo: string) {
  if (/stock/i.test(crudo)) {
    return "No queda stock suficiente de ese producto."
  }
  if (/product/i.test(crudo)) {
    return "Ese producto ya no está disponible."
  }
  return "No pudimos tomar el pedido. Intenta de nuevo en un momento."
}
