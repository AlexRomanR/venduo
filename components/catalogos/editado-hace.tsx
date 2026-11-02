"use client"

import * as React from "react"

import { formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Cuánto vale "recién": lo que se guardó hace menos que esto. */
const RECIEN_MS = 2 * 60_000

/**
 * "Editado hace…" de un catálogo guardado. Si se acaba de guardar —se vuelve
 * del editor—, dice "Editado hace un momento" con el resaltador, una vez: es
 * el que se buscaba al volver a la lista.
 */
export function EditadoHace({ fecha }: { fecha: string }) {
  const [recien, setRecien] = React.useState(false)

  React.useEffect(() => {
    setRecien(Date.now() - new Date(fecha).getTime() < RECIEN_MS)
  }, [fecha])

  return (
    <p className="mt-0.5 text-xs opacity-65">
      <span className={cn(recien && "texto-recien opacity-100")}>
        {recien
          ? "Editado hace un momento"
          : `Editado ${formatRelative(fecha)}`}
      </span>
    </p>
  )
}
