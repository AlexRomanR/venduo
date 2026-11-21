import { z } from "zod"

import { cuerpo, exigirSesion, respuesta } from "@/lib/api/respuestas"
import { prepararPropuestaDeTextos } from "@/lib/data/textos-a-medida"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const pedidoSchema = z.object({ reintentar: z.boolean().optional() })

/**
 * Los textos a medida de la tienda: la propuesta que espera o, si corresponde,
 * una nueva. Es una ruta y no una Server Action porque tarda: las acciones van
 * en fila, y esta dejaría esperando a "Publicar" en el editor. La usan la web y
 * la app.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const pedido = pedidoSchema.safeParse(await cuerpo(peticion))
  return respuesta(
    await prepararPropuestaDeTextos({
      reintentar: pedido.success && pedido.data.reintentar === true,
    })
  )
}
