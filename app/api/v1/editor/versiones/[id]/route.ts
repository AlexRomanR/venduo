import { restaurarVersion } from "@/app/(privado)/panel/apariencia/acciones"
import { exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { exigirFuncion } from "@/lib/data/funciones"

export const dynamic = "force-dynamic"

/**
 * Volver a una versión del historial: la misma `restaurarVersion` del panel.
 * Antes de restaurar, la base guarda cómo estaba, así que deshacerlo es volver
 * a la versión que se acaba de guardar.
 */
export async function POST(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const permiso = await exigirFuncion("editor")
  if (!permiso.ok) return fallo(permiso.error, 403)

  const { id } = await params
  const resultado = await restaurarVersion({ version: id })
  if (!resultado.ok) {
    return fallo(resultado.error ?? "No pudimos volver a esa versión.", 422)
  }
  return respuesta({ ok: true })
}
