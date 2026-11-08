"use client"

import * as React from "react"
import { ArrowUp, Check, Loader2, Plus } from "lucide-react"

import type { InsightSql } from "@/lib/ai/schemas"
import type { FilaInsight } from "@/lib/data/insights"
import { MENSAJE_SIN_RESPUESTA } from "@/lib/ai/mensajes"
import { leerGrafico } from "@/lib/insights/lectura"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { Grafico } from "@/components/insights/grafico"
import type { GraficoEnTablero } from "@/components/insights/tablero"

/*
 * La conversación con la IA de Estadísticas.
 *
 * Se dibuja en dos lugares —la columna fija desde 1280 px y la hoja que sale
 * de abajo en el celular— y su estado vive en `useConversacion`, arriba de los
 * dos: cerrar la hoja la desmonta, y sin esto se perdían las respuestas y la
 * pregunta en curso. Lo más nuevo va abajo, junto al campo, como en un chat.
 */

/** Con ventas: lo que el tablero fijo no responde. */
const SUGERENCIAS_CON_VENTAS = [
  "Ventas por semana de los últimos 3 meses",
  "¿Qué talla o color se vende más?",
  "¿Qué categoría vende más?",
  "Ventas por mi tienda y por chat",
  "¿Cuánto vale mi inventario?",
]

/** Sin ventas: preguntas que tienen respuesta con solo productos. */
const SUGERENCIAS_SIN_VENTAS = [
  "¿Cuánto vale mi inventario?",
  "¿Qué productos están sin stock?",
  "¿A qué productos les falta el costo?",
  "Mis productos por categoría",
]

export interface Entrada {
  numero: number
  pregunta: string
  consulta: InsightSql | null
  filas: FilaInsight[]
  lectura: string | null
  error?: string
  /** El id del gráfico guardado, si ya está en el tablero. */
  guardado: string | null
  /** Vino del tablero para seguir cambiándolo, no de una pregunta nueva. */
  deTablero?: boolean
}

type Preguntar = (
  pregunta: string,
  anterior: InsightSql | null
) => Promise<{
  ok: boolean
  error?: string
  consulta?: InsightSql
  filas?: FilaInsight[]
}>

type Guardar = (
  spec: InsightSql,
  pregunta: string
) => Promise<{ ok: boolean; error?: string; id?: string }>

export function useConversacion({
  preguntar,
  guardar,
  alAgregar,
}: {
  preguntar: Preguntar
  guardar: Guardar
  /** Se agregó un gráfico al tablero: la pantalla lo muestra. */
  alAgregar: (id: string) => void
}) {
  const [texto, setTexto] = React.useState("")
  // De la más vieja a la más nueva: se dibujan en ese orden.
  const [entradas, setEntradas] = React.useState<Entrada[]>([])
  const [enCurso, setEnCurso] = React.useState<string | null>(null)
  const [cambiando, setCambiando] = React.useState(false)
  const [agregando, setAgregando] = React.useState<number | null>(null)
  const [errorAlAgregar, setErrorAlAgregar] = React.useState<number | null>(
    null
  )
  const campo = React.useRef<HTMLTextAreaElement | null>(null)

  // La última consulta que salió bien es el punto de partida de la siguiente:
  // así «ahora por mes» cambia el gráfico en vez de empezar de cero.
  const anterior =
    [...entradas].reverse().find((e) => e.consulta)?.consulta ?? null

  async function enviar(pregunta: string) {
    const limpia = pregunta.trim()
    if (!limpia || enCurso) return
    setTexto("")
    setCambiando(false)
    setEnCurso(limpia)

    // Si la plataforma corta la función, la acción lanza en vez de responder.
    const respuesta = await preguntar(limpia, anterior).catch(() => ({
      ok: false as const,
      error: MENSAJE_SIN_RESPUESTA,
      consulta: undefined,
      filas: undefined,
    }))

    setEnCurso(null)
    setEntradas((previas) => [
      ...previas,
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
          : (respuesta.error ??
            "No pudimos responder eso. Escríbelo de otra forma."),
        guardado: null,
      },
    ])
  }

  async function agregar(entrada: Entrada) {
    if (!entrada.consulta || agregando !== null) return
    setAgregando(entrada.numero)
    setErrorAlAgregar(null)
    const resultado = await guardar(entrada.consulta, entrada.pregunta)
    setAgregando(null)
    if (!resultado.ok || !resultado.id) {
      setErrorAlAgregar(entrada.numero)
      return
    }
    const id = resultado.id
    setEntradas((previas) =>
      previas.map((e) =>
        e.numero === entrada.numero ? { ...e, guardado: id } : e
      )
    )
    alAgregar(id)
  }

  function cambiarAlgo() {
    setCambiando(true)
    campo.current?.focus()
  }

  /** Un gráfico del tablero vuelve a la conversación para cambiarlo. */
  const traer = React.useCallback((grafico: GraficoEnTablero) => {
    setEntradas((previas) => [
      ...previas,
      {
        numero: previas.length + 1,
        pregunta: grafico.pregunta,
        consulta: grafico.consulta,
        filas: grafico.filas,
        lectura: leerGrafico(grafico.consulta, grafico.filas),
        guardado: grafico.id,
        deTablero: true,
      },
    ])
    setCambiando(true)
  }, [])

  return {
    texto,
    setTexto,
    entradas,
    enCurso,
    cambiando,
    agregando,
    errorAlAgregar,
    campo,
    enviar,
    agregar,
    cambiarAlgo,
    traer,
  }
}

export type Conversacion = ReturnType<typeof useConversacion>

/** Las respuestas, de la más vieja a la más nueva, o las sugerencias. */
export function Mensajes({
  conversacion,
  conVentas,
  alVerEnTablero,
}: {
  conversacion: Conversacion
  conVentas: boolean
  alVerEnTablero: (id: string) => void
}) {
  const { entradas, enCurso, agregando, errorAlAgregar } = conversacion
  const fin = React.useRef<HTMLDivElement>(null)

  // Al llegar algo nuevo, la columna baja hasta eso: solo la columna, no la
  // página (`block: "nearest"` dentro de un contenedor con scroll propio).
  React.useEffect(() => {
    fin.current?.scrollIntoView({ block: "nearest" })
  }, [entradas.length, enCurso])

  const sugerencias = conVentas
    ? SUGERENCIAS_CON_VENTAS
    : SUGERENCIAS_SIN_VENTAS

  return (
    <div className="flex flex-col">
      {entradas.length === 0 && !enCurso ? (
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-tinta/65 uppercase">
            Prueba con
          </p>
          <ul className="mt-1">
            {sugerencias.map((sugerencia) => (
              <li key={sugerencia}>
                <button
                  type="button"
                  onClick={() => conversacion.enviar(sugerencia)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-tinta/12 py-2.5 text-left text-sm transition-colors hover:border-tinta"
                >
                  {sugerencia}
                  <ArrowUp
                    aria-hidden="true"
                    className="size-4 shrink-0 rotate-45 opacity-55"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {entradas.map((entrada) => (
        <article
          key={entrada.numero}
          className="border-b border-tinta/12 py-5 first:pt-0 last:border-b-0"
        >
          <p className="text-xs font-semibold tracking-[0.12em] text-tinta/65 uppercase">
            {entrada.deTablero ? "De tu tablero" : "Preguntaste"}
          </p>
          <h3 className="mt-1 font-titular text-base leading-snug font-bold tracking-[-0.015em]">
            {entrada.pregunta}
          </h3>

          {entrada.error ? (
            <div className="mt-3 flex flex-col gap-3">
              <p role="alert" className="text-sm leading-relaxed">
                {entrada.error}
              </p>
              <button
                type="button"
                onClick={() => conversacion.enviar(entrada.pregunta)}
                className={cn(BOTON_SECUNDARIO, "min-h-11 w-full text-sm")}
              >
                Inténtalo de nuevo
              </button>
            </div>
          ) : entrada.consulta ? (
            <>
              <p className="mt-3 text-sm leading-relaxed">
                {entrada.lectura ?? (
                  <>
                    <span className="font-semibold">
                      No hay datos para eso todavía.
                    </span>{" "}
                    Prueba con otra pregunta, o con una que no dependa de los
                    costos si todavía no los cargaste.
                  </>
                )}
              </p>
              <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-tinta/65 uppercase">
                {entrada.consulta.titulo}
              </p>
              <div className="mt-3">
                <Grafico spec={entrada.consulta} filas={entrada.filas} />
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {entrada.filas.length === 0 ? null : entrada.guardado ? (
                  <button
                    type="button"
                    onClick={() =>
                      entrada.guardado && alVerEnTablero(entrada.guardado)
                    }
                    className={cn(
                      BOTON_SECUNDARIO,
                      "min-h-11 w-full border-tinta/25 text-sm"
                    )}
                  >
                    <Check aria-hidden="true" className="size-4" />
                    En tu tablero
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => conversacion.agregar(entrada)}
                    disabled={agregando !== null}
                    className={cn(BOTON_PRIMARIO, "min-h-11 w-full text-sm")}
                  >
                    {agregando === entrada.numero ? (
                      <Loader2
                        aria-hidden="true"
                        className="size-4 animate-spin"
                      />
                    ) : (
                      <Plus aria-hidden="true" className="size-4" />
                    )}
                    Agregar a tu tablero
                  </button>
                )}
                <button
                  type="button"
                  onClick={conversacion.cambiarAlgo}
                  className={cn(BOTON_SECUNDARIO, "min-h-11 w-full text-sm")}
                >
                  Cambiar algo
                </button>
                {errorAlAgregar === entrada.numero ? (
                  <p role="alert" className="text-sm text-senal">
                    No pudimos agregarlo a tu tablero. Inténtalo de nuevo.
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </article>
      ))}

      {enCurso ? (
        <article className="border-t border-tinta/12 py-5 first:border-t-0 first:pt-0">
          <p className="text-xs font-semibold tracking-[0.12em] text-tinta/65 uppercase">
            Preguntaste
          </p>
          <h3 className="mt-1 font-titular text-base leading-snug font-bold tracking-[-0.015em]">
            {enCurso}
          </h3>
          <p
            aria-live="polite"
            className="mt-3 flex items-center gap-2 text-sm text-tinta/70"
          >
            <Loader2
              aria-hidden="true"
              className="size-4 shrink-0 animate-spin"
            />
            Lo estamos armando. Tarda unos segundos.
          </p>
          <div className="mt-3 flex h-24 items-end gap-1.5">
            {[40, 65, 30, 80, 55, 70, 45].map((alto, indice) => (
              <span
                key={indice}
                className="pieza-hueso block flex-1 animate-pulse rounded-t-[4px] motion-reduce:animate-none"
                style={{ height: `${alto}%` }}
              />
            ))}
          </div>
        </article>
      ) : null}
      <div ref={fin} />
    </div>
  )
}

/** El campo para preguntar, abajo, al alcance del pulgar. */
export function CampoDePregunta({
  conversacion,
  id,
}: {
  conversacion: Conversacion
  /** Hay dos campos (columna y hoja): cada uno con su id. */
  id: string
}) {
  const { texto, setTexto, enCurso, cambiando } = conversacion
  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault()
        conversacion.enviar(texto)
      }}
      className="flex items-end gap-2"
    >
      <label htmlFor={id} className="sr-only">
        Tu pregunta
      </label>
      <textarea
        id={id}
        ref={(nodo) => {
          // El que está a la vista es el que se enfoca con "Cambiar algo".
          if (nodo && nodo.offsetParent !== null)
            conversacion.campo.current = nodo
        }}
        value={texto}
        rows={1}
        onChange={(evento) => setTexto(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === "Enter" && !evento.shiftKey) {
            evento.preventDefault()
            conversacion.enviar(texto)
          }
        }}
        placeholder={
          cambiando ? "¿Qué le cambiamos? Ej.: por mes" : "Escribe tu pregunta"
        }
        autoComplete="off"
        maxLength={500}
        className="pieza-campo field-sizing-content max-h-32 min-h-12 min-w-0 flex-1 resize-none border border-tinta/25 bg-papel px-4 py-3 text-base leading-snug outline-none placeholder:text-tinta/65"
      />
      <button
        type="submit"
        disabled={Boolean(enCurso) || texto.trim().length === 0}
        aria-label="Preguntar"
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accion text-white transition-colors hover:bg-accion-alta disabled:opacity-40"
      >
        {enCurso ? (
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <ArrowUp aria-hidden="true" className="size-5" />
        )}
      </button>
    </form>
  )
}
