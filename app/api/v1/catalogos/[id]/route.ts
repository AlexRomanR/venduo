import { borrarCatalogo } from "@/app/(privado)/panel/catalogos/acciones"
import { exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"

export const dynamic = "force-dynamic"

/** Dar de baja un catálogo. El enlace que se haya compartido deja de abrir. */
export async function DELETE(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const { id } = await params
  const resultado = await borrarCatalogo(id)
  if (!resultado.ok) return fallo(resultado.error, 422)
  return respuesta({ ok: true })
}
