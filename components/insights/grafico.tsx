"use client"

import * as React from "react"

import type { InsightSql } from "@/lib/ai/schemas"
import type { FilaInsight } from "@/lib/data/insights"
import {
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatNumberCompact,
} from "@/lib/format"
import { cn } from "@/lib/utils"

/*
 * Los gráficos se dibujan a mano en SVG en vez de traer una biblioteca.
 *
 * Dos razones. La primera es el peso: el público está en datos móviles y una
 * biblioteca de gráficos son decenas de kilobytes para dibujar cuatro formas.
 * La segunda es el sistema: este mundo no tiene sombras, ni esquinas
 * redondeadas en los contenedores, ni una segunda paleta, y pelear los valores
 * por defecto de una biblioteca cuesta más que dibujar una línea.
 *
 * Toda serie va en un solo color —el rojo de señal— porque el sistema tiene un
 * solo acento. Eso no es una limitación acá: el validador de la skill de
 * visualización mostró que un ramp de un solo tono no separa categorías ni con
 * visión normal (ΔE 7,0 entre adyacentes), así que la identidad nunca puede
 * venir del color. Viene de la posición y de la etiqueta directa.
 */

/**
 * Lo que el dibujo necesita de una consulta. No pide el SQL ni las vistas: el
 * panel del promotor dibuja series que calcula él, sin pasar por la IA.
 */
export type EspecGrafico = Pick<
  InsightSql,
  "titulo" | "explicacion" | "grafico" | "formato"
>

const ALTO = 260
const MARGEN = { arriba: 16, derecha: 12, abajo: 28, izquierda: 56 }

/**
 * Mide el ancho real para dibujar a escala 1:1 y que el texto no encoja.
 *
 * Con un `viewBox` el trazo escalaría solo y esto sobraría, pero también
 * encogerían las etiquetas: a 375 px quedarían al 60% y no se leen.
 *
 * Las dos precauciones de abajo no son de más. Redibujar dentro del propio
 * ciclo del observador hace que el navegador lo tome por un bucle y **descarte
 * la notificación**: pasaba dos de cada tres veces al angostar la ventana, y el
 * gráfico se quedaba con el ancho de escritorio desbordando la pantalla.
 */
function useAncho() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [ancho, setAncho] = React.useState(0)

  React.useEffect(() => {
    const nodo = ref.current
    if (!nodo) return

    // Un umbral de medio píxel: sin él, un redondeo de nada vuelve a disparar
    // el ciclo y alimenta justamente el bucle que se quiere evitar.
    const anotar = (medida: number) =>
      setAncho((previo) => (Math.abs(previo - medida) < 0.5 ? previo : medida))

    const observador = new ResizeObserver(([entrada]) => {
      const medida = entrada.contentRect.width
      requestAnimationFrame(() => anotar(medida))
    })
    observador.observe(nodo)

    // Red de seguridad: el cambio de viewport siempre avisa por acá, aunque el
    // observador se haya perdido una notificación.
    const alRedimensionar = () => anotar(nodo.getBoundingClientRect().width)
    window.addEventListener("resize", alRedimensionar)

    return () => {
      observador.disconnect()
      window.removeEventListener("resize", alRedimensionar)
    }
  }, [])

  return { ref, ancho }
}

interface Props {
  spec: EspecGrafico
  filas: FilaInsight[]
}

export function Grafico({ spec, filas }: Props) {
  const dinero = spec.formato === "dinero"

  const formatoCompleto = (v: number) =>
    dinero ? formatMoney(v) : formatNumber(v)
  const formatoCorto = (v: number) =>
    dinero ? formatMoneyCompact(v) : formatNumberCompact(v)

  if (filas.length === 0) {
    return (
      <div className="border-t-2 border-tinta py-10 text-center">
        <p className="font-titular text-lg font-bold tracking-[-0.02em]">
          Sin datos para ese período
        </p>
        <p className="mx-auto mt-2 max-w-[44ch] text-sm leading-relaxed opacity-70">
          La consulta corrió bien, pero no hay filas todavía. Prueba con un
          rango más amplio.
        </p>
      </div>
    )
  }

  if (spec.grafico === "numero") {
    return <Numero fila={filas[0]} spec={spec} formato={formatoCompleto} />
  }

  if (spec.grafico === "tabla") {
    return <Tabla filas={filas} spec={spec} formato={formatoCompleto} />
  }

  if (spec.grafico === "barra") {
    return (
      <Barras
        filas={filas}
        formatoCompleto={formatoCompleto}
        formatoCorto={formatoCorto}
      />
    )
  }

  return (
    <Serie
      filas={filas}
      spec={spec}
      formatoCompleto={formatoCompleto}
      formatoCorto={formatoCorto}
    />
  )
}

/* ---------------------------------------------------------------------------
 * Una sola cifra. La skill lo dice: a veces la respuesta no es un gráfico.
 * ------------------------------------------------------------------------ */
function Numero({
  fila,
  spec,
  formato,
}: {
  fila: FilaInsight
  spec: EspecGrafico
  formato: (v: number) => string
}) {
  return (
    <div className="border-t-2 border-tinta pt-6">
      <p className="tabular font-titular text-[clamp(2.5rem,9vw,4.5rem)] leading-none font-extrabold tracking-[-0.04em] text-senal">
        {formato(fila.valor)}
      </p>
      <p className="mt-4 text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
        {spec.titulo}
      </p>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Serie de tiempo: línea, área o columnas.
 * ------------------------------------------------------------------------ */
function Serie({
  filas,
  spec,
  formatoCompleto,
  formatoCorto,
}: {
  filas: FilaInsight[]
  spec: EspecGrafico
  formatoCompleto: (v: number) => string
  formatoCorto: (v: number) => string
}) {
  const { ref, ancho } = useAncho()
  const [activo, setActivo] = React.useState<number | null>(null)

  const anchoUtil = Math.max(ancho - MARGEN.izquierda - MARGEN.derecha, 10)
  const altoUtil = ALTO - MARGEN.arriba - MARGEN.abajo

  const maximo = Math.max(...filas.map((f) => f.valor), 1)
  // La escala arranca en cero siempre: un eje truncado exagera la variación,
  // y es el primer anti-patrón de cualquier gráfico de negocio.
  const escalaY = (v: number) =>
    MARGEN.arriba + altoUtil - (v / maximo) * altoUtil
  const escalaX = (i: number) =>
    filas.length === 1
      ? MARGEN.izquierda + anchoUtil / 2
      : MARGEN.izquierda + (i / (filas.length - 1)) * anchoUtil

  const puntos = filas.map((f, i) => ({
    x: escalaX(i),
    y: escalaY(f.valor),
    ...f,
  }))
  const linea = puntos
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ")
  const area = `${linea} L${puntos.at(-1)!.x},${MARGEN.arriba + altoUtil} L${puntos[0].x},${MARGEN.arriba + altoUtil} Z`

  const marcas = [0, 0.5, 1].map((r) => ({
    valor: maximo * r,
    y: MARGEN.arriba + altoUtil - r * altoUtil,
  }))

  const esColumna = spec.grafico === "columna"
  const anchoColumna = Math.max(
    Math.min(anchoUtil / Math.max(filas.length, 1) - 6, 48),
    3
  )

  return (
    // `min-w-0` rompe un círculo: el SVG se dibuja al ancho medido de este
    // div, y sin esto un contenedor de grid o flex no puede encoger por debajo
    // de su contenido, así que al angostar la ventana el div nunca se achica,
    // el observador nunca se dispara y el gráfico se queda en el ancho viejo.
    <div ref={ref} className="min-w-0 border-t-2 border-tinta pt-6">
      {ancho > 0 ? (
        <div className="relative">
          <svg
            // El `viewBox` con `max-w-full` es el cinturón de seguridad: si la
            // medida llega tarde —y a veces llega, el navegador descarta
            // notificaciones del observador cuando sospecha un bucle— el dibujo
            // se achica para entrar en su caja en vez de desbordar la pantalla.
            // Cuando la medida está al día, escala 1:1 y no cambia nada.
            width={ancho}
            viewBox={`0 0 ${ancho} ${ALTO}`}
            height={ALTO}
            role="img"
            aria-label={spec.titulo}
            onMouseLeave={() => setActivo(null)}
            className="max-w-full overflow-visible"
          >
            {/* Rejilla recesiva: solo horizontal, y por detrás de todo. */}
            {marcas.map((marca) => (
              <g key={marca.y}>
                <line
                  x1={MARGEN.izquierda}
                  x2={ancho - MARGEN.derecha}
                  y1={marca.y}
                  y2={marca.y}
                  stroke="var(--tinta)"
                  strokeOpacity={0.12}
                  strokeWidth={1}
                />
                <text
                  x={MARGEN.izquierda - 10}
                  y={marca.y + 4}
                  textAnchor="end"
                  className="fill-tinta text-[11px]"
                  fillOpacity={0.5}
                >
                  {formatoCorto(marca.valor)}
                </text>
              </g>
            ))}

            {esColumna ? (
              puntos.map((p, i) => (
                <rect
                  key={p.etiqueta + i}
                  x={p.x - anchoColumna / 2}
                  y={p.y}
                  width={anchoColumna}
                  height={Math.max(MARGEN.arriba + altoUtil - p.y, 1)}
                  rx={Math.min(4, anchoColumna / 2)}
                  className="fill-senal"
                  fillOpacity={activo === null || activo === i ? 1 : 0.35}
                />
              ))
            ) : (
              <>
                {spec.grafico === "area" ? (
                  <path d={area} className="fill-senal" fillOpacity={0.12} />
                ) : null}
                <path
                  d={linea}
                  fill="none"
                  className="stroke-senal"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* Marcador solo en el punto activo y en el último: un punto
                    en cada fecha convierte la línea en una hilera de ruido. */}
                {puntos.map((p, i) =>
                  activo === i ||
                  (activo === null && i === puntos.length - 1) ? (
                    <circle
                      key={p.etiqueta + i}
                      cx={p.x}
                      cy={p.y}
                      r={5}
                      className="fill-senal stroke-papel"
                      strokeWidth={2}
                    />
                  ) : null
                )}
              </>
            )}

            {/* Zonas de contacto: más anchas que la marca, como pide la skill. */}
            {puntos.map((p, i) => (
              <rect
                key={`hit-${i}`}
                x={p.x - Math.max(anchoUtil / filas.length / 2, 12)}
                y={MARGEN.arriba}
                width={Math.max(anchoUtil / filas.length, 24)}
                height={altoUtil}
                fill="transparent"
                onMouseEnter={() => setActivo(i)}
              />
            ))}

            {activo !== null ? (
              <line
                x1={puntos[activo].x}
                x2={puntos[activo].x}
                y1={MARGEN.arriba}
                y2={MARGEN.arriba + altoUtil}
                stroke="var(--tinta)"
                strokeOpacity={0.3}
                strokeWidth={1}
              />
            ) : null}

            {/* Solo el primero y el último rotulan el eje: con treinta fechas,
                etiquetarlas todas es una mancha. */}
            <text
              x={MARGEN.izquierda}
              y={ALTO - 8}
              className="fill-tinta text-[11px]"
              fillOpacity={0.5}
            >
              {etiquetaCorta(filas[0].etiqueta)}
            </text>
            {filas.length > 1 ? (
              <text
                x={ancho - MARGEN.derecha}
                y={ALTO - 8}
                textAnchor="end"
                className="fill-tinta text-[11px]"
                fillOpacity={0.5}
              >
                {etiquetaCorta(filas.at(-1)!.etiqueta)}
              </text>
            ) : null}
          </svg>

          {activo !== null ? (
            <div
              className="pointer-events-none absolute z-10 border border-tinta bg-papel px-3 py-2"
              style={{
                left: Math.min(Math.max(puntos[activo].x - 60, 0), ancho - 130),
                top: Math.max(puntos[activo].y - 60, 0),
              }}
            >
              <p className="text-xs tracking-[0.12em] uppercase opacity-55">
                {etiquetaCorta(filas[activo].etiqueta)}
              </p>
              <p className="tabular font-titular font-bold">
                {formatoCompleto(filas[activo].valor)}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ height: ALTO }} />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Ranking: barras horizontales con etiqueta directa.
 *
 * Horizontales y no verticales porque las etiquetas son nombres —un producto,
 * un vendedor— y en vertical se cortan o se inclinan. La identidad viene del
 * nombre a la izquierda, nunca del color.
 * ------------------------------------------------------------------------ */
function Barras({
  filas,
  formatoCompleto,
  formatoCorto,
}: {
  filas: FilaInsight[]
  formatoCompleto: (v: number) => string
  formatoCorto: (v: number) => string
}) {
  const maximo = Math.max(...filas.map((f) => f.valor), 1)

  return (
    <div className="border-t-2 border-tinta pt-2">
      <ul>
        {filas.map((fila, i) => (
          <li
            key={fila.etiqueta + i}
            className="group grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-tinta/10 py-3 last:border-0"
          >
            <p className="truncate text-sm font-semibold" title={fila.etiqueta}>
              {fila.etiqueta}
            </p>
            <p className="tabular font-titular text-sm font-bold">
              {formatoCorto(fila.valor)}
            </p>
            <div
              className="col-span-2 mt-2 h-2 bg-tinta/8"
              role="img"
              aria-label={`${fila.etiqueta}: ${formatoCompleto(fila.valor)}`}
            >
              <div
                className="h-full rounded-r-[4px] bg-senal transition-[width] duration-500 ease-out"
                style={{
                  width: `${Math.max((fila.valor / maximo) * 100, 1.5)}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Tabla: la vista alternativa que la skill pide que exista siempre.
 * ------------------------------------------------------------------------ */
function Tabla({
  filas,
  spec,
  formato,
}: {
  filas: FilaInsight[]
  spec: EspecGrafico
  formato: (v: number) => string
}) {
  return (
    <div className="overflow-x-auto border-t-2 border-tinta">
      <table className="w-full min-w-[20rem] text-sm">
        <thead>
          <tr className="border-b border-tinta/15 text-left">
            <th className="py-3 pr-4 text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
              {"Etiqueta"}
            </th>
            <th className="py-3 text-right text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
              {spec.titulo}
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr
              key={fila.etiqueta + i}
              className="border-b border-tinta/10 last:border-0"
            >
              <td className="py-3 pr-4">{etiquetaCorta(fila.etiqueta)}</td>
              <td className="tabular py-3 text-right font-semibold">
                {formato(fila.valor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------------ */

/**
 * Acorta una etiqueta que sea una fecha ISO; deja pasar cualquier otra.
 *
 * Se detecta por la forma y no por la dimensión declarada: ahora la consulta
 * la escribe la IA, así que el formato de la etiqueta es lo único que hay.
 */
function etiquetaCorta(valor: string) {
  const mes = valor.match(/^(\d{4})-(\d{2})$/)
  if (mes) return `${mes[2]}/${mes[1].slice(2)}`

  const dia = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dia) return `${dia[3]}/${dia[2]}`

  return valor
}

export function Leyenda({ spec }: { spec: EspecGrafico }) {
  return (
    <p className={cn("text-xs leading-relaxed opacity-45")}>
      {spec.explicacion}
    </p>
  )
}
