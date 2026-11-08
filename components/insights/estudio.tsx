"use client"

import * as React from "react"
import { FileText, LayoutDashboard, MessageSquareText } from "lucide-react"

import type { InsightSql } from "@/lib/ai/schemas"
import type { FilaInsight } from "@/lib/data/insights"
import type { EstadoDeFuncion } from "@/lib/funciones"
import { toast } from "sonner"

import { AVISO_DE_NO_DISPONIBLE } from "@/lib/funciones"
import { cn } from "@/lib/utils"
import { HojaDeAjuste } from "@/components/panel/ajustes"
import { ConFuncion } from "@/components/panel/funcion"
import {
  CampoDePregunta,
  Mensajes,
  useConversacion,
} from "@/components/insights/consola"
import { Tablero, type GraficoEnTablero } from "@/components/insights/tablero"
import {
  ContraElAnterior,
  Periodos,
  SinVentasTodavia,
  TarjetasDelPeriodo,
} from "@/components/insights/tarjetas"
import { Seccion } from "@/components/panel/piezas"
import type { Estadisticas } from "@/lib/estadisticas"

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
  ) => Promise<{ ok: boolean; error?: string; id?: string }>
  borrar: (id: string) => Promise<{ ok: boolean; error?: string }>
  /** Si Venduo dejó activa la IA de estadísticas en esta tienda. */
  ia?: EstadoDeFuncion
  /**
   * El tablero fijo. Llegan los datos y no el dibujo: JSX armado en el
   * servidor y pasado como prop hacía que React avisara de una lista sin
   * claves.
   */
  datos: Estadisticas
}

const TITULO = "Pregunta sobre tus ventas"
const BAJADA = "Lo dibujamos con los datos de tu tienda."

/** Desde 1280 px la IA va en su columna; por debajo, en una hoja. */
function useColumna() {
  const [columna, setColumna] = React.useState(false)
  React.useEffect(() => {
    const consulta = window.matchMedia("(min-width: 1280px)")
    const actualizar = () => setColumna(consulta.matches)
    actualizar()
    consulta.addEventListener("change", actualizar)
    return () => consulta.removeEventListener("change", actualizar)
  }, [])
  return columna
}

/**
 * Estadísticas: el tablero a la izquierda y la IA siempre a mano.
 *
 * El tablero fijo llega del servidor por `arriba` y `abajo`, y entre los dos
 * va "Tu tablero", lo que la persona agregó. La IA va en una columna fija a la
 * derecha desde 1280 px; por debajo, una bandeja abre la misma conversación
 * en una hoja. El estado vive acá, arriba de las dos, para que cerrar la hoja
 * no la borre y para que un gráfico del tablero pueda volver a ella.
 */
export function Estudio({
  graficos,
  preguntar,
  guardar,
  borrar,
  ia = "activa",
  datos,
}: Props) {
  const conVentas = datos.vendioAlgunaVez
  const columna = useColumna()
  const [abierta, setAbierta] = React.useState(false)
  const [recien, setRecien] = React.useState<string | null>(null)
  const [listo, setListo] = React.useState(false)

  const verEnTablero = React.useCallback((id: string) => {
    setAbierta(false)
    // La hoja se cierra con su animación: se baja cuando ya no tapa nada.
    window.setTimeout(() => {
      document
        .getElementById(`grafico-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 250)
  }, [])

  const conversacion = useConversacion({
    preguntar,
    guardar,
    alAgregar: (id) => {
      setRecien(id)
      setAbierta(false)
    },
  })

  // El gráfico agregado llega con la página recalculada: recién entonces se
  // baja hasta él.
  React.useEffect(() => {
    if (!recien || !graficos.some((g) => g.id === recien)) return
    verEnTablero(recien)
  }, [recien, graficos, verEnTablero])

  // Una respuesta que llega con la hoja cerrada se avisa en la bandeja.
  const respuestas = conversacion.entradas.length
  const vistas = React.useRef(respuestas)
  React.useEffect(() => {
    if (respuestas > vistas.current && !abierta && !columna) setListo(true)
    vistas.current = respuestas
  }, [respuestas, abierta, columna])

  function abrir() {
    setListo(false)
    setAbierta(true)
  }

  function traerDelTablero(grafico: GraficoEnTablero) {
    conversacion.traer(grafico)
    if (!columna) abrir()
  }

  // El PDF lo arma el servidor en su propia URL: abrirlo es abrir una pestaña,
  // con el visor del navegador para descargar e imprimir.
  function abrirPdf(id?: string) {
    const url = id
      ? `/panel/estadisticas/pdf?g=${encodeURIComponent(id)}`
      : "/panel/estadisticas/pdf"
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const conColumna = ia === "activa"

  const bandeja =
    ia === "oculta" ? null : (
      <div
        className={cn(
          "pieza-bandeja fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 lg:sticky lg:bottom-4 lg:z-10 lg:mx-auto lg:w-full lg:max-w-md lg:rounded-full lg:border lg:border-tinta/12 lg:bg-hoja/95 lg:p-1.5 lg:shadow-[var(--sombra-cuaderno)] lg:backdrop-blur-md",
          conColumna && "xl:hidden"
        )}
      >
        <ConFuncion estado={ia}>
          <button
            type="button"
            onClick={abrir}
            className="flex min-h-12 w-full items-center gap-3 rounded-full border border-tinta/25 bg-papel px-4 text-left transition-colors hover:border-tinta"
          >
            <MessageSquareText aria-hidden="true" className="size-5 shrink-0" />
            {listo ? (
              <span className="font-semibold">
                <span className="pieza-resaltado">Tu gráfico está listo</span>
              </span>
            ) : (
              <span className="text-tinta/70">{TITULO}…</span>
            )}
          </button>
        </ConFuncion>
      </div>
    )

  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:gap-8",
        conColumna &&
          "xl:grid xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start xl:gap-6"
      )}
    >
      <div className="flex min-w-0 flex-col gap-6 max-lg:pb-20 md:gap-8">
        {conVentas ? (
          <>
            <Periodos dias={datos.periodo.dias} />
            <ContraElAnterior periodo={datos.periodo} />
          </>
        ) : (
          <SinVentasTodavia datos={datos} />
        )}

        {graficos.length > 0 ? (
          <Seccion
            id="tablero"
            icono={LayoutDashboard}
            titulo="Tu tablero"
            bajada="Lo que agregaste, con los datos de hoy."
            extraEnLinea
            extra={
              <button
                type="button"
                onClick={() => abrirPdf()}
                aria-label="Descargar en PDF"
                className="inline-flex min-h-11 items-center justify-center gap-1.5 text-sm font-semibold underline decoration-tinta/40 underline-offset-4 hover:decoration-tinta max-sm:size-11 max-sm:no-underline"
              >
                <FileText aria-hidden="true" className="size-4" />
                <span className="max-sm:sr-only">Descargar en PDF</span>
              </button>
            }
          >
            <Tablero
              graficos={graficos}
              borrar={borrar}
              alEditar={
                ia === "activa"
                  ? traerDelTablero
                  : () => toast.info(AVISO_DE_NO_DISPONIBLE)
              }
              alDescargar={(grafico) => abrirPdf(grafico.id)}
              recien={recien}
            />
          </Seccion>
        ) : null}

        {conVentas ? <TarjetasDelPeriodo datos={datos} /> : null}

        {bandeja}
      </div>

      {/* La columna se muestra por CSS y no por JavaScript: así llega con la
          página, sin aparecer de golpe al hidratar. */}
      {conColumna ? (
        <aside
          aria-label={TITULO}
          className="pieza-tarjeta sticky top-6 hidden h-[calc(100dvh-3rem)] flex-col border border-tinta xl:flex"
        >
          <div className="border-b border-tinta/15 px-5 py-4">
            <h2 className="font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
              {TITULO}
            </h2>
            <p className="mt-0.5 text-sm text-tinta/70">{BAJADA}</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            <Mensajes
              conversacion={conversacion}
              conVentas={conVentas}
              alVerEnTablero={verEnTablero}
            />
          </div>
          <div className="border-t border-tinta/15 px-4 py-3">
            <CampoDePregunta
              conversacion={conversacion}
              id="pregunta-columna"
            />
          </div>
        </aside>
      ) : null}

      {conColumna ? (
        <HojaDeAjuste
          abierta={abierta}
          titulo={TITULO}
          descripcion={BAJADA}
          alCerrar={() => setAbierta(false)}
          pie={
            <CampoDePregunta conversacion={conversacion} id="pregunta-hoja" />
          }
        >
          <Mensajes
            conversacion={conversacion}
            conVentas={conVentas}
            alVerEnTablero={verEnTablero}
          />
        </HojaDeAjuste>
      ) : null}
    </div>
  )
}
