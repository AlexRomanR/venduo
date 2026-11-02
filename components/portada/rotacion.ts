"use client"

import { useEffect, useState, type RefObject } from "react"

import { CON_MOVIMIENTO } from "@/components/portada/gsap"

/**
 * Un índice que avanza solo mientras la sección está a la vista, y se queda
 * quieto en cuanto la persona elige uno. Sin movimiento pedido, no avanza.
 */
export function useRotacion(
  raiz: RefObject<HTMLElement | null>,
  cantidad: number,
  cada = 3200,
  /** Mientras sea falso, no avanza: espera a que termine una entrada. */
  activo = true
) {
  const [actual, setActual] = useState(0)
  const [fijada, setFijada] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = raiz.current
    if (!el) return
    const observador = new IntersectionObserver(
      ([entrada]) => setVisible(entrada.isIntersecting),
      { threshold: 0.35 }
    )
    observador.observe(el)
    return () => observador.disconnect()
  }, [raiz])

  useEffect(() => {
    if (fijada || !visible || !activo) return
    if (!window.matchMedia(CON_MOVIMIENTO).matches) return
    const id = window.setInterval(
      () => setActual((i) => (i + 1) % cantidad),
      cada
    )
    return () => window.clearInterval(id)
  }, [fijada, visible, activo, cantidad, cada])

  const elegir = (i: number) => {
    setActual(i)
    setFijada(true)
  }

  /** Vuelve al primero, y a avanzar solo. */
  const reiniciar = () => {
    setActual(0)
    setFijada(false)
  }

  return { actual, elegir, reiniciar, fijada, visible }
}

/** El valor que había antes del último cambio. */
export function useAnterior<T>(valor: T) {
  const [estado, setEstado] = useState({ actual: valor, anterior: valor })
  if (estado.actual !== valor) {
    setEstado({ actual: valor, anterior: estado.actual })
  }
  return estado.anterior
}

/**
 * La capa de cada imagen en un fundido: la nueva aparece encima de la
 * anterior, que se queda entera debajo, y las demás ya no se ven. Así nunca
 * quedan dos o tres imágenes a medio camino, una sobre otra.
 */
export function capaDelFundido(i: number, actual: number, anterior: number) {
  if (i === actual) return "z-20 opacity-100 transition-opacity duration-500"
  if (i === anterior) return "z-10 opacity-100"
  return "opacity-0"
}
