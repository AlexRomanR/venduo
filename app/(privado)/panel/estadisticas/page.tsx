import { redirect } from "next/navigation"

import { getAIStatus } from "@/lib/ai"
import { estadisticasDeDemostracion } from "@/lib/demo-data"
import { getEstadisticas } from "@/lib/data/estadisticas"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { getGraficoConDatos, getGraficosGuardados } from "@/lib/data/insights"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { PERIODOS, type Periodo } from "@/lib/tablero"
import { Estudio } from "@/components/insights/estudio"
import { Cabecera } from "@/components/panel/piezas"
import { borrar, guardar, preguntar } from "./acciones"

// La IA de esta pantalla corre en sus acciones: con un tope explícito, un
// pedido que se demora termina con un aviso en vez de quedar colgado.
export const maxDuration = 60

export const metadata = { title: "Estadísticas" }

/** El período de la URL (`?dias=7`), o 30 si no es uno de los que hay. */
function leerPeriodo(valor: string | string[] | undefined): Periodo {
  const numero = Number(Array.isArray(valor) ? valor[0] : valor)
  return (PERIODOS as readonly number[]).includes(numero)
    ? (numero as Periodo)
    : 30
}

/**
 * Estadísticas: un tablero fijo que abre con cifras y la IA siempre a mano.
 *
 * El tablero fijo sale de consultas propias con RLS (`getEstadisticas`), sin
 * pasar por la IA. La IA sí escribe SQL, pero no elige dónde corre:
 * `run_insight_sql` lo ejecuta con RLS activa, en una transacción de solo
 * lectura y contra las vistas `mis_*`, donde `store_id` ni siquiera existe.
 */
export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Los guardados no esperan a la tienda: RLS ya los acota a la suya.
  const [tienda, guardados, funciones, consulta] = await Promise.all([
    getMiTienda(),
    getGraficosGuardados(),
    funcionesDeMiTienda(),
    searchParams,
  ])
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")
  if (funciones.estadisticas !== "activa") redirect("/panel")

  const dias = leerPeriodo(consulta.dias)
  // El tablero fijo y cada gráfico guardado, a la vez: un guardado lento no
  // frena las cifras.
  const [datos, graficos] = await Promise.all([
    isSupabaseConfigured
      ? getEstadisticas(dias)
      : Promise.resolve(estadisticasDeDemostracion(dias)),
    Promise.all(guardados.map(getGraficoConDatos)),
  ])
  const estadisticas = datos ?? estadisticasDeDemostracion(dias)
  const ai = getAIStatus()

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Tus estadísticas."
        resaltar="estadísticas"
        bajada="Lo que vendes, lo que te deja y lo que no se mueve."
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
        datos={estadisticas}
      />
    </div>
  )
}
