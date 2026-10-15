"use client"

import * as React from "react"
import { Check } from "lucide-react"

/**
 * Un check grande que aparece sobre la pantalla y se va solo: lo que vale la
 * pena se festeja, como cobrar un pedido. Corto, sin tapar nada que se toque,
 * y quieto con "Reducir movimiento". Es el mismo de la app.
 *
 * `useFestejo` devuelve el festejo para dibujar y la función que lo dispara.
 */
export function useFestejo() {
  const [vez, setVez] = React.useState(0)

  React.useEffect(() => {
    if (vez === 0) return
    const reloj = window.setTimeout(() => setVez(0), 1150)
    return () => window.clearTimeout(reloj)
  }, [vez])

  const festejo =
    vez > 0 ? (
      <div
        key={vez}
        aria-hidden="true"
        className="festejo pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
      >
        <span className="flex size-28 items-center justify-center rounded-full bg-tinta text-papel">
          <Check className="size-14" strokeWidth={3} />
        </span>
      </div>
    ) : null

  return { festejo, festejar: () => setVez((antes) => antes + 1) }
}
