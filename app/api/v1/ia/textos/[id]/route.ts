import { z } from "zod"

import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import {
  cambiarDescripcionDePropuesta,
  descartarPropuestaDeTextos,
  publicarPropuestaDeTextos,
} from "@/lib/data/textos-a-medida"

export const dynamic = "force-dynamic"

const pedidoSchema = z.object({
  accion: z.enum([
    "publicar",
    "descartar",
    "usar-descripcion",
    "volver-descripcion",
  ]),
})

/** Lo que la persona decide sobre una propuesta de textos. */
export async function POST(
  peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const [{ id }, datos] = await Promise.all([params, cuerpo(peticion)])
  const pedido = pedidoSchema.safeParse(datos)
  if (!pedido.success || !z.uuid().safeParse(id).success) {
    return fallo("No entendimos el pedido.")
  }

  const { accion } = pedido.data
  const resultado =
    accion === "publicar"
      ? await publicarPropuestaDeTextos(id)
      : accion === "descartar"
        ? await descartarPropuestaDeTextos(id)
        : await cambiarDescripcionDePropuesta(
            id,
            accion === "usar-descripcion" ? "despues" : "antes"
          )

  return resultado.ok ? respuesta({ ok: true }) : fallo(resultado.error, 422)
}
