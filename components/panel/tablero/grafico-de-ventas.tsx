"use client"

import * as React from "react"

import {
  formatDia,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  sumarDias,
} from "@/lib/format"
import type { Columna } from "@/lib/tablero"
import { useAncho } from "@/components/insights/grafico"

const ALTO = 196
const MARGEN = { arriba: 10, derecha: 2, abajo: 26, izquierda: 52 }

/** El tope del eje, a un número que se lee: Bs 1.234 pasa a Bs 1.500. */
function techo(valor: number) {
  if (valor <= 0) return 1
  const magnitud = 10 ** Math.floor(Math.log10(valor))
  const paso =
    [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((p) => p * magnitud >= valor) ?? 10
  return paso * magnitud
}

/** Una barra con las esquinas de arriba redondeadas y la base recta. */
function barra(x: number, y: number, ancho: number, alto: number) {
  const r = Math.min(4, ancho / 2, alto)
  const base = y + alto
  return [
    `M${x},${base}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + ancho - r},${y}`,
    `Q${x + ancho},${y} ${x + ancho},${y + r}`,
    `L${x + ancho},${base}`,
    "Z",
  ].join(" ")
}

/** "Hoy", "Ayer", "lun 14 sept" o "Semana del 8 al 14 sept". */
function nombreDe(columna: Columna, hoy: string) {
  if (columna.desde !== columna.hasta) {
    const mismoMes = columna.desde.slice(0, 7) === columna.hasta.slice(0, 7)
    const desde = mismoMes
      ? String(Number(columna.desde.slice(8)))
      : formatDia(columna.desde, { conSemana: false })
    return `Semana del ${desde} al ${formatDia(columna.hasta, { conSemana: false })}`
  }
  if (columna.desde === hoy) return "Hoy"
  if (columna.desde === sumarDias(hoy, -1)) return "Ayer"
  return formatDia(columna.desde)
}

/**
 * Las ventas del período, en columnas que se recorren.
 *
 * La lectura va arriba y no en un globo flotante: en un celular el globo tapa
 * justo la barra que el dedo está tocando. Se recorre con el dedo, con el
 * cursor o con las flechas, y sin tocar nada muestra el último día.
 *
 * Sigue las reglas de los gráficos del proyecto: una sola serie en el rojo de
 * señal, el eje desde cero, rejilla recesiva, la base de cada barra recta, y
 * solo el primero y el último rotulados cuando son muchos.
 */
export function GraficoDeVentas({
  columnas,
  hoy,
  descripcion,
}: {
  columnas: Columna[]
  hoy: string
  /** Lo que lee un lector de pantalla: el período y su total. */
  descripcion: string
}) {
  const { ref, ancho } = useAncho()
  const [activo, setActivo] = React.useState<number | null>(null)

  const ultimo = columnas.length - 1
  const mostrada = columnas[activo ?? ultimo]
  const porSemana = columnas.some((c) => c.desde !== c.hasta)

  const anchoUtil = Math.max(ancho - MARGEN.izquierda - MARGEN.derecha, 10)
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo
  const maximo = techo(Math.max(...columnas.map((c) => c.ventasCents), 0))
  const paso = anchoUtil / columnas.length
  const hueco = Math.min(paso * 0.3, 8)
  const anchoBarra = Math.max(paso - hueco, 1.5)
  const y = (valor: number) =>
    MARGEN.arriba + altoUtil - (valor / maximo) * altoUtil

  function indiceEn(evento: React.PointerEvent<SVGSVGElement>) {
    const caja = evento.currentTarget.getBoundingClientRect()
    const x =
      ((evento.clientX - caja.left) / caja.width) * ancho - MARGEN.izquierda
    return Math.min(Math.max(Math.floor(x / paso), 0), ultimo)
  }

  function alTeclear(evento: React.KeyboardEvent) {
    const mover: Record<string, (actual: number) => number> = {
      ArrowLeft: (actual) => Math.max(actual - 1, 0),
      ArrowRight: (actual) => Math.min(actual + 1, ultimo),
      Home: () => 0,
      End: () => ultimo,
    }
    if (evento.key === "Escape") {
      setActivo(null)
      return
    }
    const accion = mover[evento.key]
    if (!accion) return
    evento.preventDefault()
    setActivo((actual) => accion(actual ?? ultimo))
  }

  const etiquetasX =
    columnas.length <= 7
      ? columnas.map((columna, indice) => ({
          indice,
          texto: formatDia(columna.desde).split(" ")[0],
        }))
      : [
          {
            indice: 0,
            texto: formatDia(columnas[0].desde, { conSemana: false }),
          },
          {
            indice: ultimo,
            texto: formatDia(columnas[ultimo].hasta, { conSemana: false }),
          },
        ]

  return (
    <div>
      <p
        aria-live="polite"
        className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
      >
        <span className="font-semibold">{nombreDe(mostrada, hoy)}</span>
        <span className="tabular font-titular text-base font-bold">
          {formatMoney(mostrada.ventasCents)}
        </span>
        <span className="opacity-70">
          · {formatNumber(mostrada.pedidos)}{" "}
          {mostrada.pedidos === 1 ? "pedido" : "pedidos"}
        </span>
      </p>

      {/* `min-w-0`: sin él, dentro de un grid el div no encoge, el observador
          no se entera y el gráfico se queda con el ancho viejo. */}
      <div
        ref={ref}
        tabIndex={0}
        role="group"
        aria-label={`${descripcion}. Usa las flechas para recorrer cada ${porSemana ? "semana" : "día"}.`}
        onKeyDown={alTeclear}
        onBlur={() => setActivo(null)}
        className="mt-3 min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-tinta focus-visible:ring-offset-4 focus-visible:ring-offset-papel"
      >
        {ancho > 0 ? (
          <svg
            width={ancho}
            height={ALTO}
            viewBox={`0 0 ${ancho} ${ALTO}`}
            role="img"
            aria-label={descripcion}
            // El dedo que se mueve de costado recorre las barras; el que se
            // mueve hacia abajo sigue desplazando la página.
            className="max-w-full touch-pan-y select-none"
            onPointerDown={(evento) => setActivo(indiceEn(evento))}
            onPointerMove={(evento) => setActivo(indiceEn(evento))}
            onPointerLeave={(evento) => {
              if (evento.pointerType === "mouse") setActivo(null)
            }}
          >
            {[0, 0.5, 1].map((parte) => {
              const altura = MARGEN.arriba + altoUtil - parte * altoUtil
              return (
                <g key={parte}>
                  <line
                    x1={MARGEN.izquierda}
                    x2={ancho - MARGEN.derecha}
                    y1={altura}
                    y2={altura}
                    stroke="var(--tinta)"
                    strokeOpacity={parte === 0 ? 0.3 : 0.12}
                  />
                  <text
                    x={MARGEN.izquierda - 8}
                    y={altura + 4}
                    textAnchor="end"
                    className="tabular fill-tinta text-xs"
                    fillOpacity={0.65}
                  >
                    {formatMoneyCompact(maximo * parte)}
                  </text>
                </g>
              )
            })}

            {columnas.map((columna, indice) => {
              if (columna.ventasCents <= 0) return null
              const arriba = y(columna.ventasCents)
              return (
                <path
                  key={columna.desde}
                  d={barra(
                    MARGEN.izquierda + indice * paso + hueco / 2,
                    arriba,
                    anchoBarra,
                    MARGEN.arriba + altoUtil - arriba
                  )}
                  className="fill-senal transition-[fill-opacity] duration-150"
                  fillOpacity={activo === null || activo === indice ? 1 : 0.3}
                />
              )
            })}

            {activo !== null ? (
              <line
                x1={MARGEN.izquierda + activo * paso + paso / 2}
                x2={MARGEN.izquierda + activo * paso + paso / 2}
                y1={MARGEN.arriba}
                y2={MARGEN.arriba + altoUtil}
                stroke="var(--tinta)"
                strokeOpacity={0.25}
                strokeDasharray="3 3"
              />
            ) : null}

            {etiquetasX.map(({ indice, texto }) => {
              const unica = etiquetasX.length > 2
              return (
                <text
                  key={indice}
                  x={
                    unica
                      ? MARGEN.izquierda + indice * paso + paso / 2
                      : indice === 0
                        ? MARGEN.izquierda
                        : ancho - MARGEN.derecha
                  }
                  y={ALTO - 7}
                  textAnchor={unica ? "middle" : indice === 0 ? "start" : "end"}
                  className="fill-tinta text-xs"
                  fillOpacity={activo === indice ? 1 : 0.65}
                >
                  {texto}
                </text>
              )
            })}
          </svg>
        ) : (
          <div style={{ height: ALTO }} />
        )}
      </div>

      <p className="mt-2 text-xs opacity-65">
        Toca o pasa el cursor por las barras para ver cada{" "}
        {porSemana ? "semana" : "día"}.
      </p>
    </div>
  )
}
