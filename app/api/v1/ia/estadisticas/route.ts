import { z } from "zod"

import { preguntar } from "@/app/(privado)/panel/estadisticas/acciones"
import { insightSqlSchema } from "@/lib/ai/schemas"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { leerGrafico } from "@/lib/insights/lectura"

export const dynamic = "force-dynamic"
// El modelo puede tardar: sin esto, la función se corta antes que su tope.
export const maxDuration = 60

const pedidoSchema = z.object({
  pregunta: z.string().trim().min(1).max(500),
  /** El gráfico anterior, para una pregunta que sigue la conversación. */
  anterior: insightSqlSchema.nullable().optional(),
})

/**
 * Una pregunta en palabras, un gráfico: lo mismo que la consola de
 * Estadísticas del panel, para la app.
 *
 * Es la misma acción —pide permiso, anota el uso, valida lo que escribe el
 * modelo y lo corre en solo lectura contra las vistas de la tienda—. Acá se
 * suma la lectura del gráfico ya calculada, para que la app no la repita.
 */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const pedido = pedidoSchema.safeParse(await cuerpo(peticion))
  if (!pedido.success) {
    return fallo("Escribe un poco más para poder responderte.")
  }

  const resultado = await preguntar(
    pedido.data.pregunta,
    pedido.data.anterior ?? null
  )
  if (!resultado.ok || !resultado.consulta || !resultado.filas) {
    return fallo(
      resultado.error ?? "No pudimos calcular ese gráfico. Prueba de nuevo.",
      422
    )
  }

  return respuesta({
    consulta: resultado.consulta,
    filas: resultado.filas,
    lectura: leerGrafico(resultado.consulta, resultado.filas),
  })
}
