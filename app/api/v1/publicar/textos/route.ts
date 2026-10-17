import { z } from "zod"

import { escribirTextos } from "@/app/(privado)/panel/marketing/acciones"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"

export const dynamic = "force-dynamic"
// El modelo puede tardar: sin esto, la función se corta antes que su tope.
export const maxDuration = 60

const pedidoSchema = z.object({
  producto: z.string().min(1).max(64),
  /** Cuántas versiones se pidieron antes: cada una sale distinta. */
  vuelta: z.number().int().min(0).max(20).default(0),
  /** `false`: el texto armado sin la IA, al instante. */
  conIa: z.boolean().default(true),
})

/**
 * Los textos para publicar un producto: la misma acción de la pantalla de la
 * web. Pide permiso a la IA, anota el uso y pone el precio y el enlace con los
 * datos de la base; sin la IA activa, los arma sin ella.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const pedido = pedidoSchema.safeParse(await cuerpo(peticion))
  if (!pedido.success) return fallo("Elige un producto para escribir su texto.")

  const resultado = await escribirTextos(
    pedido.data.producto,
    pedido.data.vuelta,
    pedido.data.conIa
  )
  if (!resultado.ok) return fallo(resultado.error, 422)
  return respuesta({ textos: resultado.textos, conIa: resultado.conIa })
}
