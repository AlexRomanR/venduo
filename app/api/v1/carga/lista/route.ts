import { z } from "zod"

import { leerLista } from "@/app/(privado)/panel/productos/cargar/acciones"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const pedidoSchema = z.object({ texto: z.string().trim().min(1).max(20_000) })

/**
 * La app: borradores desde una lista escrita, un producto por renglón. La
 * misma de Cargar varios del panel. Una tabla pegada no llega acá: la app la
 * manda a `/carga/planilla`, como hace la web.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const pedido = pedidoSchema.safeParse(await cuerpo(peticion))
  if (!pedido.success) return fallo("Escribe al menos un producto.")

  const resultado = await leerLista(pedido.data.texto)
  if (!resultado.ok) return fallo(resultado.error, 422)
  return respuesta({ borradores: resultado.borradores, aviso: resultado.aviso })
}
