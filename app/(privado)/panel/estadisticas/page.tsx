import { redirect } from "next/navigation"

import { getAIStatus } from "@/lib/ai"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { getGraficoConDatos, getGraficosGuardados } from "@/lib/data/insights"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { Estudio } from "@/components/insights/estudio"
import { Cabecera } from "@/components/panel/piezas"
import { borrar, guardar, preguntar } from "./acciones"

// La IA de esta pantalla corre en sus acciones: con un tope explícito, un
// pedido que se demora termina con un aviso en vez de quedar colgado.
export const maxDuration = 60

export const metadata = { title: "Estadísticas" }

/**
 * Inteligencia de negocio.
 *
 * Todo entra por lenguaje natural. La IA sí escribe el SQL, pero no elige dónde
 * corre: `run_insight_sql` lo ejecuta con RLS activa, en una transacción de solo
 * lectura y contra las vistas `mis_*`, donde `store_id` ni siquiera existe. El
 * alcance no depende de que el modelo se acuerde de filtrar.
 */
export default async function EstadisticasPage() {
  // Los guardados no esperan a la tienda: RLS ya los acota a la suya, y
  // pedirlos en serie era un viaje más antes de ejecutar cada gráfico.
  const [tienda, guardados, funciones] = await Promise.all([
    getMiTienda(),
    getGraficosGuardados(),
    funcionesDeMiTienda(),
  ])
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")
  if (funciones.estadisticas !== "activa") redirect("/panel")

  const graficos = await Promise.all(guardados.map(getGraficoConDatos))
  const ai = getAIStatus()

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Pregúntale a tus números."
        bajada="Solo se consultan los datos de tu tienda, y solo se leen."
        demo={
          ai.demo &&
          "Estás en modo demo: el modelo devuelve una respuesta simulada, pero las cifras salen de tus datos reales."
        }
      />

      <Estudio
        graficos={graficos}
        preguntar={preguntar}
        guardar={guardar}
        borrar={borrar}
        ia={funciones.ia_estadisticas}
      />
    </div>
  )
}
