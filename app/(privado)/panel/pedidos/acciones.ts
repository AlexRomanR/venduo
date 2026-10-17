"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient, getUsuario } from "@/lib/supabase/server"
import { ESTADOS } from "@/lib/pedidos"
import { ventaSchema, type VentaInput } from "@/lib/validation/venta"
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

export type ResultadoDeVenta =
  | { ok: true; id: string; numero: number; totalCents: number }
  | { ok: false; error: string }

const ventaRegistradaSchema = z.object({
  id: z.string(),
  numero: z.number(),
  total_cents: z.number(),
})

/**
 * Registra una venta directa: lo que se vendió en el chat o en persona.
 *
 * No escribe en `orders`: llama a `registrar_venta`, que arma el pedido con la
 * tienda de la sesión y lo deja pagado en la misma transacción. El stock lo
 * descuenta el disparador de siempre, que rechaza la venta entera si no
 * alcanza, y copia el costo de cada producto para la ganancia.
 */
export async function registrarVenta(
  entrada: VentaInput
): Promise<ResultadoDeVenta> {
  const validada = ventaSchema.safeParse(entrada)
  if (!validada.success) {
    return {
      ok: false,
      error: validada.error.issues[0]?.message ?? "Revisa la venta.",
    }
  }

  const supabase = await createClient()
  if (!supabase) {
    return { ok: false, error: "En el modo demo no se guardan ventas." }
  }

  const { data, error } = await supabase.rpc("registrar_venta", {
    p_items: validada.data.lineas.map((linea) => ({
      product_id: linea.productoId,
      quantity: linea.cantidad,
      precio_cents: Math.round(linea.precio * 100),
    })),
  })

  if (error) return { ok: false, error: mensajeDeVenta(error.message) }

  const venta = ventaRegistradaSchema.safeParse(data)
  if (!venta.success) {
    return {
      ok: false,
      error: "No pudimos confirmar la venta. Revisa tus pedidos.",
    }
  }

  revalidatePath(RUTA)
  revalidatePath("/panel")
  revalidatePath("/panel/productos")
  return {
    ok: true,
    id: venta.data.id,
    numero: venta.data.numero,
    totalCents: venta.data.total_cents,
  }
}

function mensajeDeVenta(crudo: string) {
  const sinStock = /Stock insuficiente de (.+): quedan (\d+)/.exec(crudo)
  if (sinStock) {
    return `Tu stock dice que quedan ${sinStock[2]} de ${sinStock[1]}. Corrígelo y vuelve a registrar la venta.`
  }
  if (/Producto no disponible/i.test(crudo)) {
    return "Uno de los productos ya no está en tu catálogo. Quítalo de la venta."
  }
  if (/No tienes una tienda/i.test(crudo)) {
    return "Todavía no tienes una tienda."
  }
  return "No pudimos registrar la venta. Vuelve a intentar."
}
