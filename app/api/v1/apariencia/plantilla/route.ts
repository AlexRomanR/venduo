import { z } from "zod"

import { cambiarPlantilla } from "@/app/(privado)/panel/apariencia/acciones"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"

export const dynamic = "force-dynamic"

const cambioSchema = z.object({
  clave: z.string().min(1).max(40),
  /** Si las secciones de la portada se conservan o se cambian por las de la nueva. */
  conservarSecciones: z.boolean(),
})

/**
 * Cambia la plantilla de la tienda, desde la app.
 *
 * Es la misma acción del panel: pide el permiso y deja el trabajo a
 * `change_store_template`, que antes de cambiar guarda un punto de
 * restauración.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const cambio = cambioSchema.safeParse(await cuerpo(peticion))
  if (!cambio.success) return fallo("Esa plantilla no existe.")

  const resultado = await cambiarPlantilla(cambio.data)
  if (!resultado.ok) {
    return fallo(resultado.error ?? "No pudimos cambiar la plantilla.", 422)
  }

  return respuesta({ ok: true })
}
