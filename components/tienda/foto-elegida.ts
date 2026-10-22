"use client"

import * as React from "react"

import { EVENTO_DE_FOTO } from "@/components/tienda/agregar"

/**
 * La galería de un kit se entera de la foto que pidió el selector —la del
 * color elegido— y la muestra. El selector no sabe qué galería hay, ni la
 * galería quién la pide: se hablan por un evento de la página.
 */
export function useFotoElegida(alElegir: (url: string) => void) {
  // La última versión de la función, sin volver a suscribirse en cada dibujo.
  const ultima = React.useRef(alElegir)
  React.useEffect(() => {
    ultima.current = alElegir
  })

  React.useEffect(() => {
    const oir = (evento: Event) => {
      if (evento instanceof CustomEvent && typeof evento.detail === "string") {
        ultima.current(evento.detail)
      }
    }
    window.addEventListener(EVENTO_DE_FOTO, oir)
    return () => window.removeEventListener(EVENTO_DE_FOTO, oir)
  }, [])
}
