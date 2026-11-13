import { z } from "zod"

import { guardar } from "@/app/(privado)/panel/estadisticas/acciones"
import { insightSqlSchema } from "@/lib/ai/schemas"
import { cuerpo, exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { exigirFuncion } from "@/lib/data/funciones"
import { getEstadisticas } from "@/lib/data/estadisticas"
import { getGraficoConDatos, getGraficosGuardados } from "@/lib/data/insights"
import { PERIODOS, type Periodo } from "@/lib/tablero"
import { leerGrafico } from "@/lib/insights/lectura"

export const dynamic = "force-dynamic"

/** El período de `?dias=7`, o 30 si no es uno de los que hay, como la página. */
function leerPeriodo(valor: string | null): Periodo {
  const numero = Number(valor)
  return (PERIODOS as readonly number[]).includes(numero)
    ? (numero as Periodo)
    : 30
}

/**
 * Estadísticas: los gráficos que la persona guardó, calculados contra los
 * datos de hoy, y el tablero fijo del período (`?dias=7|30|90`), el mismo de
 * la página (`getEstadisticas`).
 *
 * Lo guardado es la consulta, así que se vuelve a correr: acá no hay ninguna
 * llamada a la IA. `estadisticas` se sumó después de `graficos`: una versión
 * vieja de la app lo ignora.
 */
export async function GET(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const permiso = await exigirFuncion("estadisticas")
  if (!permiso.ok) return fallo(permiso.error, 403)

  const dias = leerPeriodo(new URL(peticion.url).searchParams.get("dias"))
  // El tablero fijo y cada guardado a la vez: un guardado lento no frena las cifras.
  const [graficos, estadisticas] = await Promise.all([
    getGraficosGuardados().then((guardados) =>
      Promise.all(guardados.map(getGraficoConDatos))
    ),
    getEstadisticas(dias),
  ])

  return respuesta({
    estadisticas,
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
