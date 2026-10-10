import { z } from "zod"

import { guardar } from "@/app/(privado)/panel/estadisticas/acciones"
import { insightSqlSchema } from "@/lib/ai/schemas"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { exigirFuncion } from "@/lib/data/funciones"
import { getGraficoConDatos, getGraficosGuardados } from "@/lib/data/insights"
import { leerGrafico } from "@/lib/insights/lectura"

export const dynamic = "force-dynamic"

/**
 * El tablero de Estadísticas: los gráficos que la persona guardó, calculados
 * contra los datos de hoy.
 *
 * Lo guardado es la consulta, así que se vuelve a correr: acá no hay ninguna
 * llamada a la IA.
 */
export async function GET() {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const permiso = await exigirFuncion("estadisticas")
  if (!permiso.ok) return fallo(permiso.error, 403)

  const guardados = await getGraficosGuardados()
  const graficos = await Promise.all(guardados.map(getGraficoConDatos))

  return respuesta({
    graficos: graficos.map((grafico) => ({
      id: grafico.id,
      pregunta: grafico.pregunta,
      consulta: grafico.consulta,
      filas: grafico.filas,
      lectura: leerGrafico(grafico.consulta, grafico.filas),
    })),
  })
}

const guardarSchema = z.object({
  consulta: insightSqlSchema,
  pregunta: z.string().trim().min(1).max(500),
})

/** Guarda un gráfico en el tablero. */
export async function POST(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const permiso = await exigirFuncion("estadisticas")
  if (!permiso.ok) return fallo(permiso.error, 403)

  const pedido = guardarSchema.safeParse(await cuerpo(peticion))
  if (!pedido.success) return fallo("Ese gráfico no se puede guardar.")

  const resultado = await guardar(pedido.data.consulta, pedido.data.pregunta)
  if (!resultado.ok) {
    return fallo(resultado.error ?? "No pudimos guardar el gráfico.", 422)
  }

  return respuesta({ ok: true })
}
