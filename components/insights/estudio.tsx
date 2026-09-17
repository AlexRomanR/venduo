"use client"

import * as React from "react"
import { FileText } from "lucide-react"

import type { InsightSql } from "@/lib/ai/schemas"
import type { FilaInsight } from "@/lib/data/insights"
import { Consola } from "@/components/insights/consola"
import { Tablero, type GraficoEnTablero } from "@/components/insights/tablero"
import { Encabezado, Vacio } from "@/components/panel/piezas"

interface Props {
  graficos: GraficoEnTablero[]
  preguntar: (
    pregunta: string,
    anterior: InsightSql | null
  ) => Promise<{
    ok: boolean
    error?: string
    consulta?: InsightSql
    filas?: FilaInsight[]
  }>
  guardar: (
    spec: InsightSql,
    pregunta: string
  ) => Promise<{ ok: boolean; error?: string }>
  borrar: (id: string) => Promise<{ ok: boolean; error?: string }>
}

/**
 * El cuaderno y el tablero, juntos.
 *
 * Existe porque las dos mitades se hablan: editar un gráfico guardado lo manda
 * al cuaderno como la entrada más reciente, y desde ahí se lo modifica con
 * otra frase. Ese estado no puede vivir en ninguna de las dos por separado.
 */
export function Estudio({ graficos, preguntar, guardar, borrar }: Props) {
  const [paraEditar, setParaEditar] = React.useState<GraficoEnTablero | null>(
    null
  )

  const olvidarEdicion = React.useCallback(() => setParaEditar(null), [])

  // El PDF lo arma el servidor y vive en su propia URL, así que abrirlo es
  // abrir una pestaña: el visor del navegador ya trae descargar e imprimir, y
  // no hay que construir ninguno de los dos.
  function abrirPdf(id?: string) {
    const url = id
      ? `/panel/estadisticas/pdf?g=${encodeURIComponent(id)}`
      : "/panel/estadisticas/pdf"

    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <>
      <Consola
        preguntar={preguntar}
        guardar={guardar}
        paraEditar={paraEditar}
        alConsumirEdicion={olvidarEdicion}
      />

      <section className="mt-14 border-t border-tinta/15 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <Encabezado etiqueta="Tu tablero" />

          {graficos.length > 0 ? (
            <button
              type="button"
              onClick={() => abrirPdf()}
              className="flex min-h-11 items-center gap-2 rounded-plantilla border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
            >
              <FileText aria-hidden="true" className="size-4" />
              Descargar todo en PDF
            </button>
          ) : null}
        </div>

        <div className="mt-8">
          {graficos.length === 0 ? (
            <Vacio
              titulo="Todavía no guardaste ningún gráfico"
              detalle="Cuando uno te sirva, dale a Guardar y queda aquí. Se vuelve a calcular con los datos de cada día, así que no envejece."
            />
          ) : (
            <>
              <Tablero
                graficos={graficos}
                borrar={borrar}
                alEditar={setParaEditar}
                alDescargar={(grafico) => abrirPdf(grafico.id)}
              />

              <p className="mt-10 max-w-[64ch] text-xs leading-relaxed opacity-45">
                El PDF se abre en otra pestaña, con los datos del momento en que
                lo pides. Sale en vectores, así que se puede imprimir en grande
                sin que se pixele.
              </p>
            </>
          )}
        </div>
      </section>
    </>
  )
}
