"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { rpcMigrado } from "@/lib/supabase/rpc"
import { createClient } from "@/lib/supabase/server"

const idSchema = z.uuid()
const disputaSchema = z.object({
  pedidoId: z.uuid(),
  motivo: z.string().trim().min(10).max(500),
})

export interface ResultadoPago {
  ok: boolean
  error?: string
}

async function ejecutar(
  funcion: string,
  pedidoId: string,
  extras: Record<string, unknown> = {}
): Promise<ResultadoPago> {
  const id = idSchema.safeParse(pedidoId)
  if (!id.success) return { ok: false, error: "Ese pedido no es válido." }

  const supabase = await createClient()
  if (!supabase)
    return { ok: false, error: "El pago está en modo de demostración." }

  const { data, error } = await rpcMigrado(supabase, funcion, {
    p_order_id: id.data,
    ...extras,
  })
  if (error || data !== true) {
    return {
      ok: false,
      error: "El pedido cambió de estado. Actualiza la página para continuar.",
    }
  }

  revalidatePath(`/pedido/${id.data}`)
  revalidatePath("/pago")
  return { ok: true }
}

export async function simularPago(pedidoId: string) {
  return await ejecutar("simulate_pagofacil_payment", pedidoId)
}

export async function confirmarRecepcion(pedidoId: string) {
  return await ejecutar("confirm_order_received", pedidoId)
}

export async function abrirDisputa(
  pedidoId: string,
  motivo: string
): Promise<ResultadoPago> {
  const validado = disputaSchema.safeParse({ pedidoId, motivo })
  if (!validado.success) {
    return {
      ok: false,
      error: "Cuéntanos el problema con al menos 10 caracteres.",
    }
  }
  return ejecutar("open_order_dispute", validado.data.pedidoId, {
    p_reason: validado.data.motivo,
  })
}
