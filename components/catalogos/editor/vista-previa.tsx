"use client"

import * as React from "react"

import type { DatosDelCatalogo } from "@/lib/catalogos/datos"
import type { Catalogo } from "@/lib/catalogos/modelo"
import { cn } from "@/lib/utils"
import {
  DibujoDeHoja,
  hojasConContexto,
  type HojaConContexto,
} from "@/components/catalogos/documento"
import { html } from "@/components/catalogos/html"

/** El ancho de un elemento, al día. */
export function useAncho<T extends HTMLElement>() {
  const ref = React.useRef<T>(null)
  const [ancho, setAncho] = React.useState(0)

  React.useLayoutEffect(() => {
    const elemento = ref.current
    if (!elemento) return
    setAncho(elemento.clientWidth)
    const observador = new ResizeObserver(([entrada]) => {
      setAncho(Math.floor(entrada.contentRect.width))
    })
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  return [ref, ancho] as const
}

/**
 * Una hoja del catálogo a su medida real, achicada para que entre.
 *
 * Se dibuja en puntos —un punto es un píxel— y se escala entera: así el
 * reparto, los cortes de renglón y los tamaños son los mismos del PDF, que se
 * arma con las mismas variantes.
 */
export function HojaEscalada({
  hoja,
  ctx,
  ancho,
  className,
}: HojaConContexto & { ancho: number; className?: string }) {
  const escala = ancho / ctx.hoja.ancho
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ width: ancho, height: ctx.hoja.alto * escala }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 origin-top-left select-none"
        style={{
          width: ctx.hoja.ancho,
          height: ctx.hoja.alto,
          transform: `scale(${escala})`,
        }}
      >
        <DibujoDeHoja P={html} hoja={hoja} ctx={ctx} />
      </div>
    </div>
  )
}

/**
 * Todas las hojas, una debajo de otra. Tocar una elige su bloque en el editor.
 *
 * Se dibuja con el catálogo diferido: escribir un título no espera a que se
 * redibujen treinta hojas.
 */
export function VistaPrevia({
  catalogo,
  datos,
  elegido,
  alElegir,
}: {
  catalogo: Catalogo
  datos: DatosDelCatalogo
  elegido: string | null
  alElegir: (bloque: string) => void
}) {
  const diferido = React.useDeferredValue(catalogo)
  const hojas = React.useMemo(
    () => hojasConContexto(diferido, datos),
    [diferido, datos]
  )
  const [ref, ancho] = useAncho<HTMLDivElement>()
  const anchoDeHoja = Math.min(ancho, 620)

  return (
    <div ref={ref} className="flex flex-col items-center gap-5">
      {hojas.length === 0 ? (
        <p className="max-w-[40ch] py-10 text-center text-sm leading-relaxed opacity-70">
          Todavía no hay hojas para mostrar. Elige productos o agrega una
          portada.
        </p>
      ) : null}
      {anchoDeHoja > 0
        ? hojas.map(({ hoja, ctx }) => {
            const activa = hoja.bloque.id === elegido
            return (
              <figure key={ctx.numero} className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => alElegir(hoja.bloque.id)}
                  aria-label={`Editar la hoja ${ctx.numero}`}
                  aria-pressed={activa}
                  className={cn(
                    "block outline-offset-4 transition-shadow",
                    activa
                      ? "ring-2 ring-tinta ring-offset-4 ring-offset-papel"
                      : "ring-1 ring-tinta/15 hover:ring-tinta/50"
                  )}
                >
                  <HojaEscalada hoja={hoja} ctx={ctx} ancho={anchoDeHoja} />
                </button>
                <figcaption className="tabular text-xs opacity-65">
                  Hoja {ctx.numero} de {ctx.total}
                </figcaption>
              </figure>
            )
          })
        : null}
    </div>
  )
}
