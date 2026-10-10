import { z } from "zod"

import { borrar } from "@/app/(privado)/panel/estadisticas/acciones"
import { exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { exigirFuncion } from "@/lib/data/funciones"

export const dynamic = "force-dynamic"

/** Quita un gráfico del tablero. RLS deja tocar solo los propios. */
export async function DELETE(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const permiso = await exigirFuncion("estadisticas")
  if (!permiso.ok) return fallo(permiso.error, 403)

  const id = z.uuid().safeParse((await params).id)
  if (!id.success) return fallo("No encontramos ese gráfico.", 404)

  const resultado = await borrar(id.data)
  if (!resultado.ok) {
    return fallo(resultado.error ?? "No pudimos borrar el gráfico.", 422)
  }

  return respuesta({ ok: true })
}
