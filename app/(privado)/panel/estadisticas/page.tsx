import { redirect } from "next/navigation"

import { getAIStatus } from "@/lib/ai"
import { getGraficoConDatos, getGraficosGuardados } from "@/lib/data/insights"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { Estudio } from "@/components/insights/estudio"
import { borrar, guardar, preguntar } from "./acciones"

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
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const guardados = await getGraficosGuardados()
  const graficos = await Promise.all(guardados.map(getGraficoConDatos))
  const ai = getAIStatus()

  return (
    <div className="flex flex-col gap-14">
      <div>
        <h1 className="max-w-[20ch] font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">
          Pregúntale a tus números.
        </h1>
        <p className="mt-3 max-w-[58ch] text-sm leading-relaxed opacity-70">
          Solo se consultan los datos de tu tienda, y solo se leen.
          {ai.demo ? (
            <>
              {" "}
              <span className="font-semibold">
                Estás en modo demo: el modelo devuelve una respuesta simulada,
                pero las cifras salen de tus datos reales.
              </span>
            </>
          ) : null}
        </p>
      </div>

      <section>
        <Estudio
          graficos={graficos}
          preguntar={preguntar}
          guardar={guardar}
          borrar={borrar}
          rutaPdf="/panel/estadisticas/pdf"
        />
      </section>
    </div>
  )
}
