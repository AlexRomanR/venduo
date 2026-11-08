"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Minus, TrendingDown, TrendingUp } from "lucide-react"

import {
  formatDia,
  formatMoney,
  formatNumber,
  formatPercent,
} from "@/lib/format"
import {
  columnas as armarColumnas,
  cortarPeriodo,
  PERIODOS,
  totales,
  variacion,
  type DiaDeVentas,
  type Periodo,
} from "@/lib/tablero"
import { cn } from "@/lib/utils"
import { Flecha } from "@/components/portada/trazos"
import portada from "@/components/portada/portada.module.css"
import { entra, contar, useEscena } from "@/components/panel/resumen/escena"
import { Mano, Rotulo } from "@/components/panel/resumen/piezas"

/**
 * Cómo vienen las ventas, en la escena oscura del Resumen: cuánto se vendió en
 * grande, contando al aparecer; contra el período anterior; y el gráfico que
 * crece barra por barra con el mejor día anotado a mano. El período se elige
 * acá mismo y la escena se vuelve a armar: la serie de 180 días viene entera.
 */
export function Ventas({
  serie,
  hoy,
  conEstadisticas,
}: {
  serie: DiaDeVentas[]
  hoy: string
  conEstadisticas: boolean
}) {
  const raiz = useRef<HTMLElement>(null)
  const [periodo, setPeriodo] = useState<Periodo>(30)
  const hayVentas = serie.some((dia) => dia.pedidos > 0)

  useEscena(raiz)

  return (
    <section
      ref={raiz}
      data-escena
      id="como-te-va"
      aria-labelledby="titulo-como-te-va"
      className="-mx-4 my-6 overflow-hidden bg-[var(--tinta)] px-5 py-12 text-[var(--papel)] sm:-mx-5 sm:px-8 lg:mx-0 lg:my-10 lg:rounded-[28px] lg:px-12 lg:py-16"
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Rotulo claro>Cómo te va</Rotulo>
          <h2
            id="titulo-como-te-va"
            className={cn(
              portada.titular,
              "js-sube mt-3 text-[clamp(1.6rem,3vw,2.2rem)]"
            )}
          >
            Tus ventas, día por día.
          </h2>
        </div>
        {hayVentas ? (
          <div className="js-sube">
            <SelectorDePeriodo valor={periodo} alCambiar={setPeriodo} />
          </div>
        ) : null}
      </div>

      {hayVentas ? (
        <Periodo
          key={periodo}
          serie={serie}
          hoy={hoy}
          periodo={periodo}
          conEstadisticas={conEstadisticas}
        />
      ) : (
        <div className="js-sube mt-10 max-w-[36ch]">
          <p
            className={cn(
              portada.titular,
              "text-[clamp(2rem,5vw,3.4rem)] text-[var(--papel)]/35"
            )}
          >
            Bs 0
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-[var(--papel)]/70">
            Cuando llegue tu primer pedido, aquí vas a ver cuánto vendes y si
            vendes más que antes.
          </p>
          <Mano className="mt-4 text-[var(--boli-claro)]">
            el primero siempre es el más difícil
          </Mano>
        </div>
      )}
    </section>
  )
}

function Periodo({
  serie,
  hoy,
  periodo,
  conEstadisticas,
}: {
  serie: DiaDeVentas[]
  hoy: string
  periodo: Periodo
  conEstadisticas: boolean
}) {
  const raiz = useRef<HTMLDivElement>(null)
  const { actual, anterior } = cortarPeriodo(serie, periodo)
  const ahora = totales(actual)
  const antes = totales(anterior)
  const comparable = antes.pedidos > 0
  const cambio = comparable
    ? variacion(ahora.ventasCents, antes.ventasCents)
    : null

  const columnas = armarColumnas(actual)
  const maximo = Math.max(...columnas.map((c) => c.ventasCents), 1)
  const mejor = columnas.reduce(
    (elegida, c, i) =>
      c.ventasCents > (columnas[elegida]?.ventasCents ?? 0) ? i : elegida,
    0
  )
  const [activa, setActiva] = useState<number | null>(null)
  const mirada = columnas[activa ?? mejor]
  const porSemana = columnas.length < actual.length

  useEscena(raiz, (tl, piezas) => {
    contar(tl, piezas(".js-monto")[0], ahora.ventasCents, formatMoney, 0.1)
    entra(
      tl,
      piezas(".js-barra"),
      {
        scaleY: 0,
        transformOrigin: "50% 100%",
        duration: 0.9,
        ease: "expo.out",
        stagger: { each: 0.9 / columnas.length },
      },
      0.25
    )
    entra(
      tl,
      piezas(".js-anota"),
      { autoAlpha: 0, y: -12, duration: 0.5, ease: "back.out(2)" },
      1.1
    )
    piezas(".js-cifra").forEach((pieza, i) => {
      const valor = Number(pieza.dataset.valor)
      const dinero = pieza.dataset.dinero === "si"
      contar(
        tl,
        pieza,
        valor,
        dinero ? formatMoney : formatNumber,
        0.5 + i * 0.1
      )
    })
  })

  const IconoDelCambio =
    cambio === null
      ? null
      : cambio > 0
        ? TrendingUp
        : cambio < 0
          ? TrendingDown
          : Minus

  // La nota del mejor día va del lado donde hay lugar.
  const posicion = (mejor + 0.5) / columnas.length
  const notaALaIzquierda = posicion > 0.6

  return (
    <div ref={raiz} data-escena className="mt-10">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-12">
        <div>
          <p className="js-sube text-[15px] text-[var(--papel)]/65">
            En {periodo} días vendiste
          </p>
          <p
            className={cn(
              portada.titular,
              portada.cifras,
              "js-sube js-monto mt-2 text-[clamp(3rem,8vw,5.6rem)] leading-[0.9]"
            )}
            style={{ fontStretch: "92%" }}
          >
            {formatMoney(ahora.ventasCents)}
          </p>
          {cambio !== null && IconoDelCambio ? (
            <p className="js-sube mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--papel)]/10 px-3.5 py-1.5 text-[14.5px] font-semibold">
              <IconoDelCambio
                aria-hidden="true"
                className={cn(
                  "size-4",
                  cambio > 0 && "text-[var(--boli-claro)]"
                )}
              />
              {cambio === 0
                ? "Igual que"
                : `${formatPercent(Math.abs(cambio) * 100)} ${cambio > 0 ? "más" : "menos"} que`}{" "}
              los {periodo} días anteriores
            </p>
          ) : null}

          <dl className="js-sube mt-8 grid grid-cols-3 border-t border-[var(--papel)]/15">
            <Cifra etiqueta="Pedidos" valor={ahora.pedidos} />
            {ahora.gananciaCents !== null ? (
              <Cifra
                etiqueta={ahora.gananciaParcial ? "Ganancia*" : "Ganancia"}
                valor={ahora.gananciaCents}
                dinero
              />
            ) : (
              <Cifra etiqueta="Por pedido" valor={ahora.ticketCents} dinero />
            )}
            <Cifra
              etiqueta="Mejor día"
              valor={ahora.mejorDia?.ventasCents ?? null}
              dinero
            />
          </dl>
          {ahora.gananciaParcial ? (
            <p className="mt-3 text-[13px] text-[var(--papel)]/55">
              * Falta el costo de algunos productos.
            </p>
          ) : null}
        </div>

        <div>
          <p
            aria-live="polite"
            className="flex min-h-6 items-baseline justify-between gap-3 text-[14px]"
          >
            <span className="text-[var(--papel)]/65">
              {mirada
                ? mirada.desde === mirada.hasta
                  ? formatDia(mirada.desde)
                  : `Semana del ${formatDia(mirada.desde, { conSemana: false })}`
                : null}
            </span>
            <span className="font-semibold tabular-nums">
              {mirada
                ? `${formatMoney(mirada.ventasCents)} · ${formatNumber(mirada.pedidos)} ${mirada.pedidos === 1 ? "pedido" : "pedidos"}`
                : null}
            </span>
          </p>

          <div
            role="img"
            aria-label={`Ventas de los últimos ${periodo} días: ${formatMoney(ahora.ventasCents)} en ${formatNumber(ahora.pedidos)} ${ahora.pedidos === 1 ? "pedido" : "pedidos"}`}
            className="relative mt-14 flex h-[200px] items-end gap-[3px] lg:h-[240px]"
            onPointerLeave={() => setActiva(null)}
          >
            {columnas.map((columna, i) => {
              const esMejor = i === mejor && columna.ventasCents > 0
              const esHoy = columna.hasta === hoy
              return (
                <span
                  key={columna.desde}
                  onPointerEnter={() => setActiva(i)}
                  onClick={() => setActiva(i)}
                  className="relative flex h-full flex-1 cursor-pointer items-end"
                >
                  <span
                    className={cn(
                      "js-barra block w-full rounded-t-[3px] transition-colors duration-200",
                      esMejor
                        ? "bg-[var(--boli-claro)]"
                        : activa === i
                          ? "bg-[var(--papel)]"
                          : "bg-[var(--papel)]/30",
                      esHoy && !esMejor && "bg-[var(--papel)]/60"
                    )}
                    style={{
                      height: `${Math.max((columna.ventasCents / maximo) * 100, columna.ventasCents > 0 ? 3 : 1)}%`,
                    }}
                  />
                </span>
              )
            })}

            {columnas[mejor]?.ventasCents > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "js-anota pointer-events-none absolute -top-12 flex items-end gap-1",
                  notaALaIzquierda ? "flex-row-reverse" : ""
                )}
                style={
                  notaALaIzquierda
                    ? { right: `${(1 - posicion) * 100}%` }
                    : { left: `${posicion * 100}%` }
                }
              >
                <Flecha
                  className={cn(
                    "h-8 w-10 shrink-0 translate-y-3",
                    notaALaIzquierda
                      ? "rotate-[100deg]"
                      : "-scale-x-100 rotate-[-100deg]"
                  )}
                />
                <Mano className="text-[18px] whitespace-nowrap text-[var(--boli-claro)]">
                  {porSemana ? "tu mejor semana" : "tu mejor día"}
                </Mano>
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex justify-between text-[12.5px] text-[var(--papel)]/50">
            <span>{formatDia(actual[0].dia, { conSemana: false })}</span>
            <span>Hoy</span>
          </div>

          {conEstadisticas ? (
            <Link
              href="/panel/estadisticas"
              className={cn(portada.enlace, "mt-4 text-[var(--papel)]")}
              style={{ textDecorationColor: "rgb(247 245 240 / 0.35)" }}
            >
              Ver estadísticas
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Cifra({
  etiqueta,
  valor,
  dinero = false,
}: {
  etiqueta: string
  valor: number | null
  dinero?: boolean
}) {
  return (
    <div className="min-w-0 border-r border-[var(--papel)]/15 py-4 pr-2 last:border-r-0 [&:not(:first-child)]:pl-3">
      <dt className="text-[12px] font-semibold tracking-[0.1em] text-[var(--papel)]/55 uppercase">
        {etiqueta}
      </dt>
      <dd
        data-valor={valor ?? undefined}
        data-dinero={dinero ? "si" : "no"}
        className={cn(
          portada.titular,
          portada.cifras,
          "mt-2 text-[clamp(1.05rem,1.9vw,1.35rem)] leading-none whitespace-nowrap",
          valor !== null && "js-cifra"
        )}
      >
        {valor === null
          ? "—"
          : dinero
            ? formatMoney(valor)
            : formatNumber(valor)}
      </dd>
    </div>
  )
}

/** Elegir el período: tres botones que se comportan como radios. */
function SelectorDePeriodo({
  valor,
  alCambiar,
}: {
  valor: Periodo
  alCambiar: (periodo: Periodo) => void
}) {
  const botones = useRef<Array<HTMLButtonElement | null>>([])
  const elegido = PERIODOS.indexOf(valor)

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
      className="relative grid grid-cols-3 rounded-full bg-[var(--papel)]/10 p-1"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-[var(--papel)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
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
              "relative min-h-11 rounded-full px-4 text-[14px] font-semibold tabular-nums transition-colors duration-300",
              esElegido
                ? "text-[var(--tinta)]"
                : "text-[var(--papel)]/75 hover:text-[var(--papel)]"
            )}
          >
            {dias} días
          </button>
        )
      })}
    </div>
  )
}
