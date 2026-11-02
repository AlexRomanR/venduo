"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const DURACION_MS = 1700

/**
 * Si un valor acaba de cambiar: verdadero durante un momento después de cada
 * cambio, nunca al aparecer. `vuelta` sube con cada cambio, para volver a
 * arrancar una animación aunque la anterior no haya terminado.
 */
export function useRecien<T>(valor: T, duracion = DURACION_MS) {
  const [estado, setEstado] = React.useState({ activo: false, vuelta: 0 })
  const anterior = React.useRef(valor)

  React.useEffect(() => {
    if (Object.is(anterior.current, valor)) return
    anterior.current = valor
    setEstado((antes) => ({ activo: true, vuelta: antes.vuelta + 1 }))
    const listo = window.setTimeout(
      () => setEstado((antes) => ({ ...antes, activo: false })),
      duracion
    )
    return () => window.clearTimeout(listo)
  }, [valor, duracion])

  return estado
}

/**
 * Un texto que se marca con el resaltador cada vez que cambia `valor`: la
 * cifra de hojas, el nombre de la plantilla, "Cambios sin guardar".
 */
export function Recien({
  valor,
  children,
  className,
}: {
  valor: unknown
  children: React.ReactNode
  className?: string
}) {
  const { activo, vuelta } = useRecien(valor)
  return (
    <span key={vuelta} className={cn(activo && "texto-recien", className)}>
      {children}
    </span>
  )
}
