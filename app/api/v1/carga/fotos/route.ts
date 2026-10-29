import { z } from "zod"

import { leerFotos } from "@/app/(privado)/panel/productos/cargar/acciones"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"

export const dynamic = "force-dynamic"
// Leer una tanda de fotos con la IA puede tardar: la acción tiene su minuto.
export const maxDuration = 60

const pedidoSchema = z.object({
  urls: z.array(z.url()).min(1).max(40),
  modo: z.enum(["fotos", "lista"]),
})

/**
 * La app: borradores desde fotos de productos, o desde las páginas de una
 * lista escrita. Las fotos ya están subidas a la carpeta de la tienda; la
 * acción lo vuelve a comprobar. La misma de Cargar varios del panel.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const pedido = pedidoSchema.safeParse(await cuerpo(peticion))
  if (!pedido.success) return fallo("Elige entre 1 y 40 fotos.")

  const resultado = await leerFotos(pedido.data)
  if (!resultado.ok) return fallo(resultado.error, 422)
  return respuesta({ borradores: resultado.borradores, aviso: resultado.aviso })
}
