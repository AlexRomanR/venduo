"use client"

import * as React from "react"
import { ChevronDown, Clock } from "lucide-react"

import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * La prueba en una ficha: cuántos días quedan, en rojo cuando está por
 * vencer. Tocarla dice hasta cuándo. Es la misma de la app.
 */
export function FichaDePrueba({
  dias,
  hasta,
  porVencer,
}: {
  dias: number
  hasta: string | null
  porVencer: boolean
}) {
  const [abierta, setAbierta] = React.useState(false)
  const id = React.useId()

  return (
    <>
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={id}
        onClick={() => setAbierta((antes) => !antes)}
        className={cn(
          "inline-flex min-h-8 items-center gap-1.5 border px-2.5 text-sm font-semibold transition-opacity active:opacity-60",
          porVencer ? "border-senal text-senal" : "border-tinta/25"
        )}
      >
        <Clock aria-hidden="true" className="size-3.5" />
        {dias <= 0
          ? "Prueba · vence hoy"
          : `Prueba · ${dias} ${dias === 1 ? "día" : "días"}`}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-3.5 transition-transform duration-200",
            abierta && "rotate-180"
          )}
        />
      </button>
      {abierta ? (
        <p
          id={id}
          aria-live="polite"
          className="w-full border-t border-tinta/15 pt-2 text-sm opacity-65"
        >
          Tienes todo disponible{" "}
          {hasta ? `hasta el ${formatDate(hasta)}` : "durante la prueba"}.
        </p>
      ) : null}
    </>
  )
}
