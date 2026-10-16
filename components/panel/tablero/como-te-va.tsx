"use client"

import * as React from "react"
import {
  ChartNoAxesColumn,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import {
  formatDia,
  formatMoney,
  formatNumber,
  formatPercent,
} from "@/lib/format"
import {
  columnas,
  cortarPeriodo,
  PERIODOS,
  totales,
  variacion,
  type DiaDeVentas,
  type Periodo,
} from "@/lib/tablero"
import { cn } from "@/lib/utils"
import { Contador } from "@/components/panel/contador"
import { GraficoDeVentas } from "@/components/panel/tablero/grafico-de-ventas"
import { Seccion, SinDatos } from "@/components/panel/piezas"

/**
 * Cómo vienen las ventas: cuatro cifras, contra qué compararlas y el gráfico.
 *
 * Antes eran cuatro números sueltos de 30 días: "Bs 12.450" no dice si es
 * mucho o poco. Cada cifra trae ahora cuánto cambió contra el período
 * anterior del mismo largo, y el período se elige acá mismo: la serie de 180
 * días viene entera, así que cambiar de 7 a 90 días no espera al servidor.
 */
export function ComoTeVa({
  serie,
  hoy,
  conEstadisticas = true,
}: {
  serie: DiaDeVentas[]
  hoy: string
  /** Si la tienda puede abrir Estadísticas: si no, el pie no la ofrece. */
  conEstadisticas?: boolean
}) {
  const [periodo, setPeriodo] = React.useState<Periodo>(30)

  const { actual, anterior } = cortarPeriodo(serie, periodo)
  const ahora = totales(actual)
  const antes = totales(anterior)
  const hayVentas = serie.some((dia) => dia.pedidos > 0)
  // Sin ventas en el período anterior no hay flechas: la nota que las explica
  // estaría hablando de algo que no se ve.
  const comparable = antes.pedidos > 0

  return (
    <Seccion
      id="como-te-va"
      icono={ChartNoAxesColumn}
      titulo="Cómo te va"
      bajada="Tus ventas, contra el período anterior."
      className="@container"
      extra={
        hayVentas ? (
          <SelectorDePeriodo valor={periodo} alCambiar={setPeriodo} />
        ) : null
      }
      accion={
        conEstadisticas
          ? {
              href: "/panel/estadisticas",
              texto: "Pregúntale más a tus estadísticas",
            }
          : undefined
      }
    >
      {hayVentas ? (
        // Con lugar, dos zonas: las cifras de a dos a la izquierda y el gráfico
        // a la derecha. Una debajo de la otra, a todo el ancho, el gráfico se
        // estiraba en barras finas y el panel medía el doble de alto.
        <div className="@3xl:grid @3xl:grid-cols-[minmax(0,23rem)_minmax(0,1fr)]">
          <dl className="grid grid-cols-2 gap-px border-b border-tinta/15 bg-tinta/15 @2xl:grid-cols-4 @3xl:grid-cols-2 @3xl:border-r @3xl:border-b-0">
            <Cifra
              etiqueta="Ventas"
              valor={ahora.ventasCents}
              dinero
              cambio={
                comparable
                  ? variacion(ahora.ventasCents, antes.ventasCents)
                  : undefined
              }
              periodo={periodo}
            />
            <Cifra
              etiqueta="Pedidos"
              valor={ahora.pedidos}
              cambio={
                comparable ? variacion(ahora.pedidos, antes.pedidos) : undefined
              }
              periodo={periodo}
            />
            <Cifra
              etiqueta="Por pedido"
              valor={ahora.ticketCents}
              dinero
              periodo={periodo}
            />
            <Cifra
              etiqueta="Tu mejor día"
              valor={ahora.mejorDia?.ventasCents ?? null}
              dinero
              detalle={
                ahora.mejorDia ? formatDia(ahora.mejorDia.dia) : undefined
              }
              periodo={periodo}
            />
          </dl>

          <div className="px-4 pt-4 pb-5 sm:px-5 @3xl:self-center">
            <GraficoDeVentas
              columnas={columnas(actual)}
              hoy={hoy}
              descripcion={`Ventas de los últimos ${periodo} días: ${formatMoney(ahora.ventasCents)} en ${formatNumber(ahora.pedidos)} ${ahora.pedidos === 1 ? "pedido" : "pedidos"}`}
            />
          </div>
        </div>
      ) : (
        <SinDatos
          icono={ChartNoAxesColumn}
          titulo="Todavía no hay ventas para mostrar"
          texto="Cuando llegue tu primer pedido, aquí vas a ver cómo te va día a día y si vendes más o menos que antes."
        />
      )}
    </Seccion>
  )
}

function Cifra({
  etiqueta,
  valor,
  dinero = false,
  cambio,
  detalle,
  periodo,
}: {
  etiqueta: string
  /** `null` cuando no hay de qué: un promedio sin pedidos. */
  valor: number | null
  /** Si `valor` es un monto en centavos. */
  dinero?: boolean
  /** Cuánto cambió contra el período anterior; `null` si no hay con qué. */
  cambio?: number | null
  detalle?: string
  periodo: Periodo
}) {
  const Icono =
    cambio === undefined || cambio === null
      ? null
      : cambio > 0
        ? TrendingUp
        : cambio < 0
          ? TrendingDown
          : Minus

  return (
    <div className="flex flex-col bg-papel px-4 py-4 sm:px-5">
      <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
        {etiqueta}
      </dt>
      <dd className="mt-2 font-titular text-[clamp(1.4rem,4vw,1.85rem)] leading-none font-extrabold tracking-[-0.04em]">
        {valor === null ? (
          "—"
        ) : (
          <Contador valor={valor} tipo={dinero ? "dinero" : "numero"} />
        )}
      </dd>
      {cambio !== undefined && cambio !== null ? (
        <dd
          className="mt-2 flex items-center gap-1.5 text-sm font-semibold"
          title={`Contra los ${periodo} días anteriores`}
        >
          {Icono ? <Icono aria-hidden="true" className="size-4" /> : null}
          <span>
            <span className="sr-only">
              {cambio >= 0 ? "Subió" : "Bajó"} contra los {periodo} días
              anteriores:{" "}
            </span>
            {formatPercent(Math.abs(cambio) * 100)}
          </span>
        </dd>
      ) : detalle ? (
        <dd className="mt-2 text-sm leading-snug opacity-70">{detalle}</dd>
      ) : null}
    </div>
  )
}

/**
 * Elegir el período: tres botones que se comportan como radios.
 *
 * Las flechas se mueven entre ellos, como en cualquier grupo de opciones.
 */
function SelectorDePeriodo({
  valor,
  alCambiar,
}: {
  valor: Periodo
  alCambiar: (periodo: Periodo) => void
}) {
  const botones = React.useRef<Array<HTMLButtonElement | null>>([])

  function alTeclear(evento: React.KeyboardEvent, indice: number) {
    const paso =
      evento.key === "ArrowRight" || evento.key === "ArrowDown"
        ? 1
        : evento.key === "ArrowLeft" || evento.key === "ArrowUp"
          ? -1
          : 0
    if (!paso) return
    evento.preventDefault()
    const siguiente = (indice + paso + PERIODOS.length) % PERIODOS.length
    alCambiar(PERIODOS[siguiente])
    botones.current[siguiente]?.focus()
  }

  const elegido = PERIODOS.indexOf(valor)

  return (
    <div
      role="radiogroup"
      aria-label="Período"
      className="relative grid w-full grid-cols-3 border border-tinta sm:w-auto"
    >
      {/* La ficha elegida se corre hasta su lugar en vez de saltar. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1/3 bg-tinta transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(${elegido * 100}%)` }}
      />
      {PERIODOS.map((dias, indice) => {
        const esElegido = dias === valor
        return (
          <button
            key={dias}
            ref={(boton) => {
              botones.current[indice] = boton
            }}
            type="button"
            role="radio"
            aria-checked={esElegido}
            tabIndex={esElegido ? 0 : -1}
            onClick={() => alCambiar(dias)}
            onKeyDown={(evento) => alTeclear(evento, indice)}
            className={cn(
              "tabular relative min-h-11 px-3 text-sm font-semibold transition-colors duration-300",
              esElegido ? "text-papel" : "hover:bg-tinta/[0.06]"
            )}
          >
            {dias} días
          </button>
        )
      })}
    </div>
  )
}
