"use client"

import * as React from "react"

import { ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { useManija, type NivelDelPanel } from "@/components/panel/manija"

export type { NivelDelPanel }

/** Lo que mide cerrado: la manija y las pestañas. */
const CERRADO = 101
/** Lo que deja libre arriba abierto del todo: la barra y un poco de hoja. */
const LIBRE_ARRIBA = 120

export function altoDe(nivel: NivelDelPanel, pantalla: number): number {
  if (nivel === 0) return CERRADO
  if (nivel === 1) return Math.round(pantalla * 0.5)
  return pantalla - LIBRE_ARRIBA
}

/**
 * El panel del editor en el celular: sube desde abajo sobre las hojas, con la
 * barra de la IA y las pestañas al pie, como el editor de la tienda. Se arrastra desde la manija y se
 * queda en el nivel más cercano; tocar la manija lo abre o lo cierra.
 *
 * Desde `lg` no flota: es la columna de la izquierda del editor, y la manija
 * no se dibuja. `--alto-del-panel` queda en la raíz del editor para que las
 * hojas dejen ese lugar abajo y la última se pueda ver entera.
 */
export function PanelDeslizable({
  nivel,
  alCambiarNivel,
  cabecera,
  pie,
  contenido,
  children,
}: {
  nivel: NivelDelPanel
  alCambiarNivel: (nivel: NivelDelPanel) => void
  /** Las pestañas: al pie en el celular, arriba en la computadora. */
  cabecera: React.ReactNode
  /** Lo fijo debajo de lo que se edita: la barra de la IA. */
  pie?: React.ReactNode
  /** Al cambiar, lo de adentro vuelve a empezar desde arriba. */
  contenido: string
  children: React.ReactNode
}) {
  const { alto, pantalla, arrastrando, propsDeManija } = useManija({
    nivel,
    alCambiarNivel,
    altoDe,
  })
  const desplazable = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    desplazable.current?.scrollTo({ top: 0 })
  }, [contenido])

  // Las hojas dejan abajo el lugar del panel.
  React.useEffect(() => {
    document.documentElement.style.setProperty(
      "--alto-del-panel",
      `${altoDe(nivel, pantalla)}px`
    )
    return () => {
      document.documentElement.style.removeProperty("--alto-del-panel")
    }
  }, [nivel, pantalla])

  return (
    <section
      aria-label="Editar el catálogo"
      style={{ "--alto": `${alto}px` } as React.CSSProperties}
      className={cn(
        // `overflow-clip` y no `hidden`: recorta las esquinas igual, y deja
        // que la barra de la IA quede pegada abajo en la computadora.
        "pieza-tarjeta flex min-w-0 flex-col border border-tinta bg-papel lg:overflow-clip!",
        "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:h-[calc(var(--alto)+env(safe-area-inset-bottom))] max-lg:border-x-0 max-lg:border-b-0",
        !arrastrando &&
          "motion-safe:max-lg:transition-[height] motion-safe:max-lg:duration-300 motion-safe:max-lg:ease-out"
      )}
    >
      <div className="flex h-11 shrink-0 items-stretch lg:hidden">
        <button
          type="button"
          aria-label={nivel === 0 ? "Abrir el panel" : "Cerrar el panel"}
          {...propsDeManija}
          className="flex min-w-0 flex-1 touch-none items-center justify-center pl-11 -outline-offset-2"
        >
          <span
            aria-hidden="true"
            className="h-1 w-10 rounded-full bg-tinta/30"
          />
        </button>
        <button
          type="button"
          aria-label={nivel === 2 ? "Achicar el panel" : "Agrandar el panel"}
          onClick={() => alCambiarNivel(nivel === 2 ? 1 : 2)}
          className="flex size-11 shrink-0 items-center justify-center -outline-offset-2"
        >
          {nivel === 2 ? (
            <ChevronDown aria-hidden="true" className="size-5" />
          ) : (
            <ChevronUp aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>
      {cabecera}
      <div
        ref={desplazable}
        // Los controles de adentro ya se alcanzan con Tab: la caja sola era una
        // parada que no mostraba nada.
        tabIndex={-1}
        className={cn(
          "outline-none max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto max-lg:overscroll-contain",
          nivel === 0 && "max-lg:hidden"
        )}
      >
        {children}
      </div>
      {pie ? (
        <div
          className={cn(
            "shrink-0 lg:sticky lg:bottom-0 lg:z-10",
            nivel === 0 && "max-lg:hidden"
          )}
        >
          {pie}
        </div>
      ) : null}
    </section>
  )
}
