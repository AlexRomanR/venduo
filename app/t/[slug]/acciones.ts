"use server"

import { z } from "zod"

import { getComboDeTienda } from "@/lib/data/combos"
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
const lineaDeProducto = z.object({
  productoId: z.uuid(),
  /** La opción elegida, si el producto las tiene. */
  varianteId: z.uuid().nullable().optional(),
  cantidad: z.number().int().min(1).max(99),
})

/**
 * Un combo de un catálogo: cuál es y qué se eligió de cada producto, en el
 * orden del combo. Ni su precio ni sus productos los decide el navegador: los
 * lee `create_order` del catálogo guardado.
 */
const lineaDeCombo = z.object({
  combo: z.object({
    catalogo: z.string().min(1).max(64),
    id: z.string().min(1).max(64),
  }),
  partes: z
    .array(
      z.object({
        productoId: z.uuid(),
        varianteId: z.uuid().nullable().optional(),
      })
    )
    .min(1)
    .max(12),
  cantidad: z.number().int().min(1).max(99),
})

const pedidoSchema = z.object({
  items: z
    .array(z.union([lineaDeCombo, lineaDeProducto]))
    .min(1, "Tu carrito está vacío.")
    .max(30, "Demasiados artículos en un solo pedido."),
})

export type PedidoInput = z.input<typeof pedidoSchema>

/** Una línea del pedido, con el precio que calculó el servidor. */
export interface LineaPedida {
  nombre: string
  variante: string | null
  cantidad: number
  totalCents: number
  /** Si es un combo, lo que trae, con la opción elegida. */
  partes?: { nombre: string; variante: string | null }[]
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
  | {
      ok: false
      error: string
      /** El combo que ya no se puede pedir: el carrito lo quita. */
      comboQuitado?: string
    }

/** Lo que devuelve `create_order`: se valida porque llega como `Json`. */
const respuestaSchema = z.object({
  numero: z.number().int(),
  whatsapp: z.string().min(1),
  total_cents: z.number().int(),
  items: z.array(
    z.object({
      nombre: z.string(),
      variante: z.string().nullable().optional(),
      cantidad: z.number().int(),
      total_cents: z.number().int(),
      partes: z
        .array(
          z.object({
            nombre: z.string(),
            variante: z.string().nullable().optional(),
          })
        )
        .optional(),
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
    p_items: validado.data.items.map((i) =>
      "combo" in i
        ? {
            combo: i.combo,
            quantity: i.cantidad,
            partes: i.partes.map((p) => ({
              product_id: p.productoId,
              variant_id: p.varianteId ?? null,
            })),
          }
        : {
            product_id: i.productoId,
            variant_id: i.varianteId ?? null,
            quantity: i.cantidad,
          }
    ),
  })

  if (error) {
    const combo = /Combo no disponible: (.+)/.exec(error.message)?.[1]
    return {
      ok: false,
      error: mensajeDeError(error.message),
      ...(combo ? { comboQuitado: combo } : {}),
    }
  }

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
      variante: item.variante ?? null,
      cantidad: item.cantidad,
      totalCents: item.total_cents,
      ...(item.partes
        ? {
            partes: item.partes.map((p) => ({
              nombre: p.nombre,
              variante: p.variante ?? null,
            })),
          }
        : {}),
    })),
  }
}

/**
 * Los combos del carrito, como están hoy: si se pueden pedir y a qué precio.
 * El carrito lo pregunta al abrirse para quitar los que ya no están y mostrar
 * el precio que se va a cobrar. Solo lee.
 */
export async function revisarCombos(
  slug: string,
  combos: { catalogo: string; id: string }[]
): Promise<{ catalogo: string; id: string; precioCents: number | null }[]> {
  const pedidos = z
    .array(
      z.object({
        catalogo: z.string().min(1).max(64),
        id: z.string().min(1).max(64),
      })
    )
    .max(30)
    .safeParse(combos)
  if (!pedidos.success) return []

  return Promise.all(
    pedidos.data.map(async (c) => {
      const encontrado = await getComboDeTienda(slug, c.catalogo, c.id)
      return { ...c, precioCents: encontrado?.combo?.precioCents ?? null }
    })
  )
}

function mensajeDeError(crudo: string) {
  // Primero: el carrito pudo quedar abierto de antes de las vacaciones.
  if (/vacaciones/i.test(crudo)) {
    return "Estamos de vacaciones y por ahora no recibimos pedidos."
  }
  if (/Combo no disponible/i.test(crudo)) {
    return "Un combo de tu carrito ya no está disponible y lo quitamos."
  }
  if (/combos no están disponibles/i.test(crudo)) {
    return "Por ahora no recibimos combos. Quítalo de tu carrito para enviar tu pedido."
  }
  const sinOpcion = /Elige una opción de (.+)/.exec(crudo)
  if (sinOpcion) {
    return `${sinOpcion[1]} ahora tiene opciones: quítalo de tu carrito y vuelve a agregarlo eligiendo la tuya.`
  }
  if (/Opción no disponible/i.test(crudo)) {
    return "Una de las opciones de tu carrito ya no está. Quítala y elige otra."
  }
  if (/stock/i.test(crudo)) {
    return "Se acabó el stock de algo de tu carrito. Revísalo e inténtalo de nuevo."
  }
  if (/product/i.test(crudo)) {
    return "Uno de los productos ya no está disponible."
  }
  if (/whatsapp/i.test(crudo)) {
    return "Todavía no recibimos pedidos por WhatsApp."
  }
  return "No pudimos armar tu pedido. Inténtalo de nuevo en un momento."
}
