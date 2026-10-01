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
import { GraficoDeVentas } from "@/components/panel/tablero/grafico-de-ventas"
import { Seccion, SinDatos } from "@/components/panel/tablero/seccion"

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
  redActiva,
}: {
  serie: DiaDeVentas[]
  hoy: string
  redActiva: boolean
}) {
  const [periodo, setPeriodo] = React.useState<Periodo>(30)

  const { actual, anterior } = cortarPeriodo(serie, periodo)
  const ahora = totales(actual)
  const antes = totales(anterior)
  const hayVentas = serie.some((dia) => dia.pedidos > 0)
  // Sin ventas en el período anterior no hay flechas: la nota que las explica
  // estaría hablando de algo que no se ve.
  const comparable = antes.pedidos > 0

  const porcentajeDeLaRed =
    ahora.ventasCents > 0
      ? Math.round((ahora.redCents / ahora.ventasCents) * 100)
      : 0

  return (
    <Seccion
      id="como-te-va"
      icono={ChartNoAxesColumn}
      titulo="Cómo te va"
      bajada="Tus ventas, sin contar los pedidos cancelados."
      extra={
        hayVentas ? (
          <SelectorDePeriodo valor={periodo} alCambiar={setPeriodo} />
        ) : null
      }
      accion={{
        href: "/panel/estadisticas",
        texto: "Pregúntale más a tus estadísticas",
      }}
    >
      {hayVentas ? (
        <>
          <dl className="grid grid-cols-2 gap-px bg-tinta/15 lg:grid-cols-4">
            <Cifra
              etiqueta="Ventas"
              valor={formatMoney(ahora.ventasCents)}
              cambio={variacion(ahora.ventasCents, antes.ventasCents)}
            />
            <Cifra
              etiqueta="Pedidos"
              valor={formatNumber(ahora.pedidos)}
              cambio={variacion(ahora.pedidos, antes.pedidos)}
            />
            <Cifra
              etiqueta="Por pedido"
              valor={
                ahora.ticketCents === null
                  ? "—"
                  : formatMoney(ahora.ticketCents)
              }
              detalle="Promedio de cada compra"
            />
            {redActiva ? (
              <Cifra
                etiqueta="Vendió tu red"
                valor={formatMoney(ahora.redCents)}
                detalle={
                  ahora.ventasCents > 0
                    ? `${porcentajeDeLaRed} % de tus ventas`
                    : "Todavía nada en este período"
                }
              />
            ) : (
              <Cifra
                etiqueta="Tu mejor día"
                valor={
                  ahora.mejorDia ? formatMoney(ahora.mejorDia.ventasCents) : "—"
                }
                detalle={
                  ahora.mejorDia
                    ? formatDia(ahora.mejorDia.dia)
                    : "Sin ventas en este período"
                }
              />
            )}
          </dl>

          {comparable ? (
            <p className="border-t border-tinta/15 px-4 pt-3 text-xs opacity-65 sm:px-5">
              Las flechas comparan con los {periodo} días anteriores.
            </p>
          ) : null}

          <div
            className={cn(
              "px-4 pt-4 pb-5 sm:px-5",
              !comparable && "border-t border-tinta/15"
            )}
          >
            <GraficoDeVentas
              columnas={columnas(actual)}
              hoy={hoy}
              descripcion={`Ventas de los últimos ${periodo} días: ${formatMoney(ahora.ventasCents)} en ${formatNumber(ahora.pedidos)} ${ahora.pedidos === 1 ? "pedido" : "pedidos"}`}
            />
          </div>
        </>
      ) : (
        <SinDatos
          icono={ChartNoAxesColumn}
          titulo="Todavía no hay ventas para mostrar"
          texto="Cuando llegue tu primer pedido, acá vas a ver cómo te va día a día y si vendes más o menos que antes."
        />
      )}
    </Seccion>
  )
}

function Cifra({
  etiqueta,
  valor,
  cambio,
  detalle,
}: {
  etiqueta: string
  valor: string
  /** Cuánto cambió contra el período anterior; `null` si no hay con qué. */
  cambio?: number | null
  detalle?: string
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
      <dd className="tabular mt-2 font-titular text-[clamp(1.4rem,4vw,1.85rem)] leading-none font-extrabold tracking-[-0.04em]">
        {valor}
      </dd>
      {cambio !== undefined ? (
        <dd
          className={cn(
            "mt-2 flex items-center gap-1.5 text-sm",
            cambio === null ? "opacity-65" : "font-semibold"
          )}
        >
          {Icono ? <Icono aria-hidden="true" className="size-4" /> : null}
          {cambio === null ? (
            "Sin datos para comparar"
          ) : (
            <span>
              <span className="sr-only">{cambio >= 0 ? "Subió" : "Bajó"} </span>
              {formatPercent(Math.abs(cambio) * 100)}
            </span>
          )}
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

  return (
    <div
      role="radiogroup"
      aria-label="Período"
      className="flex border border-tinta"
    >
      {PERIODOS.map((dias, indice) => {
        const elegido = dias === valor
        return (
          <button
            key={dias}
            ref={(boton) => {
              botones.current[indice] = boton
            }}
            type="button"
            role="radio"
            aria-checked={elegido}
            tabIndex={elegido ? 0 : -1}
            onClick={() => alCambiar(dias)}
            onKeyDown={(evento) => alTeclear(evento, indice)}
            className={cn(
              "tabular min-h-11 px-3 text-sm font-semibold transition-colors",
              indice > 0 && "border-l border-tinta",
              elegido ? "bg-tinta text-papel" : "hover:bg-tinta/[0.06]"
            )}
          >
            {dias} días
          </button>
        )
      })}
    </div>
  )
}
