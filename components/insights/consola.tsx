"use client"

import * as React from "react"
import {
  BookmarkCheck,
  BookmarkPlus,
  CornerDownLeft,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import type { InsightSql } from "@/lib/ai/schemas"
import type { FilaInsight } from "@/lib/data/insights"
import { leerGrafico } from "@/lib/insights/lectura"
import { cn } from "@/lib/utils"
import { Grafico } from "@/components/insights/grafico"
import type { GraficoEnTablero } from "@/components/insights/tablero"

const SUGERENCIAS = [
  "¿Cuánto vendí en los últimos 30 días?",
  "Mis productos más vendidos",
  "Ventas por semana de los últimos 3 meses",
  "¿Qué vendedor me trae más comisiones?",
  "¿Cuánto vale mi inventario?",
]

interface Entrada {
  numero: number
  pregunta: string
  consulta: InsightSql | null
  filas: FilaInsight[]
  lectura: string | null
  error?: string
  guardado: boolean
  /** Vino del tablero para seguir editándolo, no de una pregunta nueva. */
  deTablero?: boolean
}

interface Props {
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
  /** Un gráfico del tablero que se acaba de mandar a editar, o nada. */
  paraEditar: GraficoEnTablero | null
  alConsumirEdicion: () => void
}

/**
 * Cuaderno de análisis.
 *
 * Cada pregunta deja una entrada y las anteriores quedan debajo en vez de
 * reemplazarse. Eso es lo que permite comparar dos respuestas sin volver a
 * pedirlas —cada viaje al modelo cuesta más de diez segundos— y lo que hace que
 * la pantalla se lea como un informe y no como un chat.
 *
 * La entrada más reciente va arriba, pegada al campo: es la que se acaba de
 * pedir, y en móvil es la única que entra en pantalla.
 *
 * Es el cuerpo del panel "Haz una pregunta": el campo arriba y cada entrada
 * en su franja, separada por una regla de lado a lado, como las filas del
 * resto del panel.
 */
export function Consola({
  preguntar,
  guardar,
  paraEditar,
  alConsumirEdicion,
}: Props) {
  const [texto, setTexto] = React.useState("")
  const [entradas, setEntradas] = React.useState<Entrada[]>([])
  const [enCurso, setEnCurso] = React.useState(false)
  const campo = React.useRef<HTMLInputElement>(null)

  // La última consulta que salió bien es el contexto de la siguiente pregunta:
  // así «ahora por semana» modifica el gráfico en vez de empezar de cero.
  const anterior = entradas.find((e) => e.consulta)?.consulta ?? null

  // Editar un gráfico guardado es traerlo al cuaderno: entra como la entrada
  // más reciente, así pasa a ser el `anterior` de la próxima pregunta y el
  // cambio se pide en palabras, que es lo único que hay que aprender acá.
  React.useEffect(() => {
    if (!paraEditar) return

    setEntradas((previas) => [
      {
        numero: previas.length + 1,
        pregunta: paraEditar.pregunta,
        consulta: paraEditar.consulta,
        filas: paraEditar.filas,
        lectura: leerGrafico(paraEditar.consulta, paraEditar.filas),
        guardado: true,
        deTablero: true,
      },
      ...previas,
    ])

    campo.current?.focus()
    campo.current?.scrollIntoView({ block: "center", behavior: "smooth" })
    alConsumirEdicion()
  }, [paraEditar, alConsumirEdicion])

  async function enviar(pregunta: string) {
    const limpia = pregunta.trim()
    if (!limpia || enCurso) return

    setTexto("")
    setEnCurso(true)

    const respuesta = await preguntar(limpia, anterior)

    setEnCurso(false)
    setEntradas((previas) => [
      {
        numero: previas.length + 1,
        pregunta: limpia,
        consulta:
          respuesta.ok && respuesta.consulta ? respuesta.consulta : null,
        filas: respuesta.filas ?? [],
        lectura:
          respuesta.ok && respuesta.consulta
            ? leerGrafico(respuesta.consulta, respuesta.filas ?? [])
            : null,
        error: respuesta.ok
          ? undefined
          : (respuesta.error ?? "No pude responder eso."),
        guardado: false,
      },
      ...previas,
    ])
  }

  async function alGuardar(entrada: Entrada) {
    if (!entrada.consulta) return

    const resultado = await guardar(entrada.consulta, entrada.pregunta)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos guardar el gráfico.")
      return
    }

    setEntradas((previas) =>
      previas.map((e) =>
        e.numero === entrada.numero ? { ...e, guardado: true } : e
      )
    )
    toast.success("Guardado en tu tablero.")
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          enviar(texto)
        }}
        className="px-4 py-4 sm:px-5"
      >
        <div className="flex items-center gap-3 border-b-2 border-tinta pb-3">
          <label htmlFor="pregunta" className="sr-only">
            Pregunta sobre tu negocio
          </label>
          <input
            id="pregunta"
            ref={campo}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="¿Cuánto vendí esta semana?"
            autoComplete="off"
            className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-tinta/55 sm:text-lg"
          />
          <button
            type="submit"
            disabled={enCurso || texto.trim().length === 0}
            aria-label="Preguntar"
            className="flex size-12 shrink-0 items-center justify-center rounded-plantilla bg-senal text-white transition-colors hover:bg-senal-alta disabled:opacity-40"
          >
            {enCurso ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <CornerDownLeft aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
      </form>

      {enCurso ? (
        <p
          aria-live="polite"
          className="mx-4 mb-5 flex items-center gap-3 border-l-2 border-senal pl-4 text-sm leading-relaxed opacity-70 sm:mx-5"
        >
          <Loader2
            aria-hidden="true"
            className="size-4 shrink-0 animate-spin"
          />
          Escribiendo la consulta y midiendo contra tus datos. Tarda unos
          segundos.
        </p>
      ) : null}

      {entradas.length === 0 ? (
        <div className="border-t border-tinta/15 px-4 pt-4 pb-5 sm:px-5">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
            Prueba con
          </p>
          <ul className="mt-1 grid gap-x-10 sm:grid-cols-2">
            {SUGERENCIAS.map((sugerencia) => (
              <li key={sugerencia}>
                <button
                  type="button"
                  onClick={() => enviar(sugerencia)}
                  className="flex min-h-11 w-full items-center border-b border-tinta/15 py-3 text-left text-sm transition-colors hover:border-senal hover:text-senal"
                >
                  {sugerencia}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-[64ch] text-sm leading-relaxed opacity-70">
            Cada respuesta se queda en esta página, así que puedes comparar
            varias sin volver a pedirlas. Sobre la última puedes pedir cambios:
            «ahora por semana», «solo los últimos 7 días», «muéstralo como
            tabla».
          </p>
        </div>
      ) : null}

      {entradas.map((entrada) => (
        <article
          key={entrada.numero}
          className="border-t border-tinta/15 px-4 pt-5 pb-8 sm:px-5"
        >
          <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
            <span className="tabular">
              {String(entrada.numero).padStart(2, "0")}
            </span>{" "}
            · {entrada.deTablero ? "De tu tablero" : "Preguntaste"}
          </p>
          <h3 className="mt-2 max-w-[46ch] font-titular text-lg font-bold tracking-[-0.02em] sm:text-xl">
            {entrada.pregunta}
          </h3>

          {entrada.deTablero ? (
            <p className="mt-2 max-w-[58ch] text-sm leading-relaxed opacity-70">
              Escribe arriba qué quieres cambiarle: «por semana», «solo los
              últimos 30 días», «muéstralo como tabla».
            </p>
          ) : null}

          {entrada.error ? (
            <p className="mt-5 max-w-[58ch] border-l-2 border-senal pl-4 text-sm leading-relaxed">
              {entrada.error}
            </p>
          ) : entrada.consulta ? (
            <>
              <div className="mt-5 flex flex-wrap items-start gap-x-8 gap-y-4">
                <p className="max-w-[58ch] min-w-[min(100%,18rem)] flex-1 border-l-2 border-senal pl-4 leading-relaxed">
                  {entrada.lectura ??
                    "La consulta salió bien pero no devolvió ningún dato todavía."}
                </p>

                <button
                  type="button"
                  onClick={() => alGuardar(entrada)}
                  disabled={entrada.guardado}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2 rounded-plantilla border-2 px-4 text-sm font-semibold transition-colors",
                    entrada.guardado
                      ? "border-tinta/25 text-tinta/65"
                      : "border-tinta hover:bg-tinta hover:text-papel"
                  )}
                >
                  {entrada.guardado ? (
                    <BookmarkCheck aria-hidden="true" className="size-4" />
                  ) : (
                    <BookmarkPlus aria-hidden="true" className="size-4" />
                  )}
                  {entrada.guardado ? "En tu tablero" : "Guardar"}
                </button>
              </div>

              <h4 className="mt-8 font-titular text-base font-bold tracking-[-0.01em]">
                {entrada.consulta.titulo}
              </h4>
              <p className="mt-1 max-w-[70ch] text-xs leading-relaxed opacity-65">
                {entrada.consulta.explicacion}
              </p>

              <div className="mt-6">
                <Grafico spec={entrada.consulta} filas={entrada.filas} />
              </div>
            </>
          ) : null}
        </article>
      ))}
    </div>
  )
}
