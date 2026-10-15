import { z } from "zod"

import { decidirPropuesta, proponerCambios } from "@/app/editor/acciones"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"

export const dynamic = "force-dynamic"
// Pedirle un cambio a la IA puede llevar dos vueltas al modelo.
export const maxDuration = 60

/**
 * Pedirle a la IA un cambio para el borrador que la app tiene abierto.
 *
 * Es la misma `proponerCambios` del editor de la web: pide el permiso y el tope
 * de la IA, valida las operaciones contra la tienda y no toca nada. La app
 * muestra la propuesta en su vista previa y la persona decide.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const entrada = (await cuerpo(peticion)) as {
    pedido?: unknown
    borrador?: unknown
  } | null

  const resultado = await proponerCambios({
    pedido: typeof entrada?.pedido === "string" ? entrada.pedido : "",
    borrador: entrada?.borrador,
  })
  if (!resultado.ok) return fallo(resultado.error, 422)
  return respuesta(resultado)
}

const decisionSchema = z.object({ id: z.uuid(), aplicada: z.boolean() })

/** Lo que la persona hizo con la propuesta: queda anotado, como en la web. */
export async function PATCH(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const decision = decisionSchema.safeParse(await cuerpo(peticion))
  if (!decision.success) return fallo("Esa propuesta no existe.")
  await decidirPropuesta(decision.data)
  return respuesta({ ok: true })
}
