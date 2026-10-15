import { z } from "zod"

import { cuerpo, fallo, respuesta } from "@/lib/api/respuestas"
import { getMiTienda } from "@/lib/data/panel"
import { getUsuario } from "@/lib/supabase/server"
import { capturarVista, firmaValida } from "@/lib/vista"

export const dynamic = "force-dynamic"
// Abrir Chrome y cargar la tienda tarda; el tope cubre una portada lenta.
export const maxDuration = 60

const internoSchema = z.object({
  tienda: z.string().uuid(),
  firma: z.string().min(1),
})

/**
 * Saca la vista de la tienda si quedó vieja, y devuelve la vigente.
 *
 * La pide la app después de guardar algo que se ve en la portada, y el
 * servidor después de sus propias ediciones (`pedirVista`), firmada. Es la
 * única ruta que lleva Chrome en su paquete (`next.config.ts`).
 */
export async function POST(peticion: Request) {
  const datos = await cuerpo(peticion)
  const interno = internoSchema.safeParse(datos)

  let tiendaId: string | null = null
  if (interno.success) {
    if (!firmaValida(interno.data.tienda, interno.data.firma)) {
      return fallo("No autorizado.", 401)
    }
    tiendaId = interno.data.tienda
  } else {
    const usuario = await getUsuario()
    if (!usuario) return fallo("Tu sesión venció. Vuelve a entrar.", 401)
    tiendaId = (await getMiTienda())?.id ?? null
  }

  if (!tiendaId) return fallo("Todavía no tienes una tienda.", 404)

  const url = await capturarVista(tiendaId)
  return respuesta({ url })
}
