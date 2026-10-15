import { z } from "zod"

import { pedirCatalogoALaIa } from "@/app/(privado)/panel/catalogos/acciones"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { exigirFuncion } from "@/lib/data/funciones"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const pedidoSchema = z.object({
  frase: z.string().trim().min(1).max(300),
  /** Los productos del catálogo abierto, si se pide un orden para él. */
  actuales: z.array(z.string().min(1).max(64)).max(200).nullable(),
})

/**
 * Lo que la IA propone para el catálogo que la app tiene abierto, sin
 * guardarlo: la misma `pedirCatalogoALaIa` del constructor. La app lo muestra
 * y, si la persona lo usa, se lo pasa a su editor.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const permiso = await exigirFuncion("catalogos")
  if (!permiso.ok) return fallo(permiso.error, 403)

  const pedido = pedidoSchema.safeParse(await cuerpo(peticion))
  if (!pedido.success) return fallo("Cuéntale a la IA qué quieres.")

  const resultado = await pedirCatalogoALaIa(
    pedido.data.frase,
    pedido.data.actuales
  )
  if (!resultado.ok) return fallo(resultado.error, 422)
  return respuesta({ propuesta: resultado.propuesta })
}
