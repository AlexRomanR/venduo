"use client"

import * as React from "react"
import { Download, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import type { InsightSql } from "@/lib/ai/schemas"
import type { FilaInsight } from "@/lib/data/insights"
import { leerGrafico } from "@/lib/insights/lectura"
import { Grafico, Leyenda } from "@/components/insights/grafico"

export interface GraficoEnTablero {
  id: string
  titulo: string
  pregunta: string
  consulta: InsightSql
  filas: FilaInsight[]
}

const ACCION =
  "flex size-11 items-center justify-center opacity-65 transition-colors hover:text-senal hover:opacity-100 disabled:opacity-30"

/**
 * Los gráficos guardados.
 *
 * Se recalculan en cada carga contra los datos de hoy: lo que se guardó es la
 * pregunta, no el resultado. Un gráfico congelado el día que se creó deja de
 * ser un tablero y pasa a ser una captura de pantalla.
 *
 * Cada gráfico es una celda del panel "Tu tablero", separada de las demás
 * por una regla de un píxel. Si quedan impares, el último ocupa el ancho
 * entero: una celda vacía dejaría ver el gris de las reglas como un bloque.
 */
export function Tablero({
  graficos,
  borrar,
  alEditar,
  alDescargar,
}: {
  graficos: GraficoEnTablero[]
  borrar: (id: string) => Promise<{ ok: boolean; error?: string }>
  alEditar: (grafico: GraficoEnTablero) => void
  alDescargar: (grafico: GraficoEnTablero) => void
}) {
  const [borrando, setBorrando] = React.useState<string | null>(null)

  async function alBorrar(grafico: GraficoEnTablero) {
    setBorrando(grafico.id)
    const resultado = await borrar(grafico.id)
    setBorrando(null)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos borrarlo.")
      return
    }

    toast.success(`"${grafico.titulo}" salió de tu tablero.`)
  }

  return (
    <div className="grid gap-px bg-tinta/15 lg:grid-cols-2 lg:[&>*:last-child:nth-child(odd)]:col-span-2">
      {graficos.map((grafico) => {
        const lectura = leerGrafico(grafico.consulta, grafico.filas)

        return (
          <section
            key={grafico.id}
            className="min-w-0 bg-papel px-4 pt-4 pb-6 sm:px-5"
          >
            <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-titular text-lg font-bold tracking-[-0.02em]">
                  {grafico.titulo}
                </h3>
                <Leyenda spec={grafico.consulta} />
              </div>

              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => alEditar(grafico)}
                  aria-label={`Editar ${grafico.titulo} con una pregunta`}
                  className={ACCION}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => alDescargar(grafico)}
                  aria-label={`Descargar ${grafico.titulo} en PDF`}
                  className={ACCION}
                >
                  <Download aria-hidden="true" className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => alBorrar(grafico)}
                  disabled={borrando === grafico.id}
                  aria-label={`Quitar ${grafico.titulo} del tablero`}
                  className={ACCION}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </div>
            </div>

            <div className="mt-5">
              <Grafico spec={grafico.consulta} filas={grafico.filas} />
            </div>

            {/* La lectura se recalcula con los datos de hoy, igual que el trazo. */}
            {lectura ? (
              <p className="mt-4 border-l-2 border-senal pl-4 text-sm leading-relaxed">
                {lectura}
              </p>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
