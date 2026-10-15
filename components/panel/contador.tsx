"use client"

import * as React from "react"

import { formatMoney, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const DURACION_MS = 450

/**
 * Un número que sube hasta su valor al aparecer, y de un valor al otro cuando
 * cambia: se nota que es algo vivo sin hacer esperar. Es el mismo de la app.
 *
 * Antes de que corra el JavaScript no muestra el valor final para después
 * volver a cero —ese salto se lee como un error—: espera invisible, y si el
 * contador no arranca, la cifra aparece igual (`contador-espera`). Un lector
 * de pantalla lee siempre el valor final. Con "Reducir movimiento", quieto.
 */
export function Contador({
  valor,
  tipo = "numero",
  className,
}: {
  valor: number
  /** `dinero` es un monto en centavos. */
  tipo?: "numero" | "dinero"
  className?: string
}) {
  const [mostrado, setMostrado] = React.useState<number | null>(null)
  const desde = React.useRef(0)

  React.useEffect(() => {
    const inicio = desde.current
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (quieto || inicio === valor) {
      desde.current = valor
      setMostrado(valor)
      return
    }

    let cuadro = 0
    const empezo = performance.now()
    const paso = (ahora: number) => {
      const avance = Math.min(1, (ahora - empezo) / DURACION_MS)
      // Sale rápido y frena al llegar: se lee el número final, no el camino.
      const suave = 1 - (1 - avance) ** 3
      setMostrado(Math.round(inicio + (valor - inicio) * suave))
      if (avance < 1) cuadro = requestAnimationFrame(paso)
      else desde.current = valor
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [valor])

  const formatear = tipo === "dinero" ? formatMoney : formatNumber

  return (
    <span
      className={cn(
        "tabular",
        mostrado === null && "contador-espera",
        className
      )}
    >
      <span aria-hidden="true">{formatear(mostrado ?? valor)}</span>
      <span className="sr-only">{formatear(valor)}</span>
    </span>
  )
}
