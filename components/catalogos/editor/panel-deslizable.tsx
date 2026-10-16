"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** Cerrado —solo las pestañas—, a media pantalla o casi entera. */
export type NivelDelPanel = 0 | 1 | 2

/** Lo que mide cerrado: la manija y las pestañas. */
const CERRADO = 92
/** Lo que deja libre arriba abierto del todo: la barra y un poco de hoja. */
const LIBRE_ARRIBA = 120

function altoDe(nivel: NivelDelPanel, pantalla: number): number {
  if (nivel === 0) return CERRADO
  if (nivel === 1) return Math.round(pantalla * 0.5)
  return pantalla - LIBRE_ARRIBA
}

/**
 * El panel del editor en el celular, el mismo de la app: sube desde abajo
 * sobre las hojas, con las pestañas arriba. Se arrastra desde la manija y se
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
  children,
}: {
  nivel: NivelDelPanel
  alCambiarNivel: (nivel: NivelDelPanel) => void
  cabecera: React.ReactNode
  children: React.ReactNode
}) {
  const [pantalla, setPantalla] = React.useState(800)
  const [arrastre, setArrastre] = React.useState<number | null>(null)
  const inicio = React.useRef<{ y: number; alto: number; movio: boolean }>(null)

  React.useEffect(() => {
    const medir = () => setPantalla(window.innerHeight)
    medir()
    window.addEventListener("resize", medir)
    return () => window.removeEventListener("resize", medir)
  }, [])

  const alto = arrastre ?? altoDe(nivel, pantalla)

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

  function soltar() {
    const actual = inicio.current
    inicio.current = null
    if (!actual) return
    if (!actual.movio) {
      alCambiarNivel(nivel === 0 ? 1 : 0)
      setArrastre(null)
      return
    }
    // Al nivel más cercano a donde quedó.
    const niveles: NivelDelPanel[] = [0, 1, 2]
    const cercano = niveles.reduce((mejor, candidato) =>
      Math.abs(altoDe(candidato, pantalla) - alto) <
      Math.abs(altoDe(mejor, pantalla) - alto)
        ? candidato
        : mejor
    )
    setArrastre(null)
    alCambiarNivel(cercano)
  }

  return (
    <section
      aria-label="Editar el catálogo"
      style={{ "--alto": `${alto}px` } as React.CSSProperties}
      className={cn(
        "min-w-0 border border-tinta bg-papel",
        "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:flex max-lg:h-[var(--alto)] max-lg:flex-col max-lg:border-x-0 max-lg:border-b-0",
        arrastre === null &&
          "motion-reduce:transition-none max-lg:transition-[height] max-lg:duration-300 max-lg:ease-out"
      )}
    >
      <button
        type="button"
        aria-label={nivel === 0 ? "Abrir el panel" : "Cerrar el panel"}
        onPointerDown={(evento) => {
          evento.currentTarget.setPointerCapture(evento.pointerId)
          inicio.current = { y: evento.clientY, alto, movio: false }
        }}
        onPointerMove={(evento) => {
          const actual = inicio.current
          if (!actual) return
          const delta = actual.y - evento.clientY
          if (Math.abs(delta) > 6) actual.movio = true
          if (!actual.movio) return
          setArrastre(
            Math.min(
              altoDe(2, pantalla),
              Math.max(CERRADO, actual.alto + delta)
            )
          )
        }}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        className="flex h-7 shrink-0 touch-none items-center justify-center lg:hidden"
      >
        <span
          aria-hidden="true"
          className="h-1 w-10 rounded-full bg-tinta/30"
        />
      </button>
      {cabecera}
      <div className="max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto max-lg:overscroll-contain">
        {children}
      </div>
    </section>
  )
}
