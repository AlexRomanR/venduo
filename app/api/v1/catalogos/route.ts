import { z } from "zod"

import { guardarCatalogo } from "@/app/(privado)/panel/catalogos/acciones"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { exigirFuncion } from "@/lib/data/funciones"

export const dynamic = "force-dynamic"

const entradaSchema = z.object({
  /** `null` es un catálogo nuevo. */
  id: z.uuid().nullable(),
  catalogo: z.unknown(),
})

/**
 * Guardar el catálogo que la app armó: la misma `guardarCatalogo` del panel,
 * que lo valida entero —también el contraste— antes de escribir nada.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const permiso = await exigirFuncion("catalogos")
  if (!permiso.ok) return fallo(permiso.error, 403)

  const entrada = entradaSchema.safeParse(await cuerpo(peticion))
  if (!entrada.success) return fallo("No pudimos leer el catálogo.")

  const resultado = await guardarCatalogo(
    entrada.data.id,
    entrada.data.catalogo
  )
  if (!resultado.ok) return fallo(resultado.error, 422)
  return respuesta({ id: resultado.id, enlace: resultado.enlace })
}
