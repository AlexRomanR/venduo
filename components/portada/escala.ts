"use client"

import { useEffect, useState, type RefObject } from "react"

/** El ancho de una caja, al día cada vez que cambia. Antes de medir, 0. */
export function useAncho(caja: RefObject<HTMLElement | null>) {
  const [ancho, setAncho] = useState(0)

  useEffect(() => {
    const el = caja.current
    if (!el) return
    const observador = new ResizeObserver(([entrada]) =>
      setAncho(entrada.contentRect.width)
    )
    observador.observe(el)
    return () => observador.disconnect()
  }, [caja])

  return ancho
}

/**
 * Cuánto hay que escalar un dibujo de ancho fijo para que entre entero en su
 * caja. Las escenas se dibujan a un tamaño y se achican o agrandan juntas, así
 * no se corta ninguna pieza en una pantalla más angosta.
 */
export function useEscala(
  caja: RefObject<HTMLElement | null>,
  ancho: number,
  maximo = 1.15
) {
  const medido = useAncho(caja)
  return medido ? Math.min(maximo, medido / ancho) : 1
}
