"use client"

import * as React from "react"

/** Cerrado, a media pantalla o casi entero. */
export type NivelDelPanel = 0 | 1 | 2

/**
 * Un panel del celular que se sube y se baja con el dedo y queda en el nivel
 * más cercano. Tocar la manija, sin arrastrar, lo abre o lo cierra. Lo usan el
 * editor de la tienda y el de catálogos.
 */
export function useManija({
  nivel,
  alCambiarNivel,
  altoDe,
}: {
  nivel: NivelDelPanel
  alCambiarNivel: (nivel: NivelDelPanel) => void
  altoDe: (nivel: NivelDelPanel, pantalla: number) => number
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

  function soltar() {
    const actual = inicio.current
    inicio.current = null
    if (!actual) return
    setArrastre(null)
    if (!actual.movio) {
      alCambiarNivel(nivel === 0 ? 1 : 0)
      return
    }
    const niveles: NivelDelPanel[] = [0, 1, 2]
    alCambiarNivel(
      niveles.reduce((mejor, candidato) =>
        Math.abs(altoDe(candidato, pantalla) - alto) <
        Math.abs(altoDe(mejor, pantalla) - alto)
          ? candidato
          : mejor
      )
    )
  }

  return {
    alto,
    pantalla,
    arrastrando: arrastre !== null,
    propsDeManija: {
      onPointerDown: (evento: React.PointerEvent<HTMLButtonElement>) => {
        evento.currentTarget.setPointerCapture(evento.pointerId)
        inicio.current = { y: evento.clientY, alto, movio: false }
      },
      onPointerMove: (evento: React.PointerEvent<HTMLButtonElement>) => {
        const actual = inicio.current
        if (!actual) return
        const delta = actual.y - evento.clientY
        if (Math.abs(delta) > 6) actual.movio = true
        if (!actual.movio) return
        setArrastre(
          Math.min(
            altoDe(2, pantalla),
            Math.max(altoDe(0, pantalla), actual.alto + delta)
          )
        )
      },
      onPointerUp: soltar,
      onPointerCancel: soltar,
      // Con el teclado no hay arrastre: Enter y espacio abren o cierran.
      onKeyDown: (evento: React.KeyboardEvent<HTMLButtonElement>) => {
        if (evento.key !== "Enter" && evento.key !== " ") return
        evento.preventDefault()
        alCambiarNivel(nivel === 0 ? 1 : 0)
      },
    },
  }
}
