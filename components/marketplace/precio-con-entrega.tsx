"use client"

import * as React from "react"
import { Motorbike } from "lucide-react"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

// Solo visual: ni el carrito ni create_order suman este monto.
const COSTO_ENTREGA_CENTS = 1000

export function PrecioConEntrega({
  precioCents,
  precioAnteriorCents,
}: {
  precioCents: number
  precioAnteriorCents: number | null
}) {
  const [conEntrega, setConEntrega] = React.useState(false)

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="tabular font-titular text-3xl font-extrabold tracking-[-0.04em] text-senal sm:text-4xl">
            {formatMoney(precioCents)}
          </p>
          {precioAnteriorCents ? (
            <p className="tabular text-sm line-through opacity-45">
              {formatMoney(precioAnteriorCents)}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          aria-pressed={conEntrega}
          onClick={() => setConEntrega((actual) => !actual)}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-plantilla border border-tinta/25 px-4 text-sm font-semibold transition-colors",
            conEntrega
              ? "border-tinta bg-tinta text-papel"
              : "hover:border-tinta"
          )}
        >
          <Motorbike aria-hidden="true" className="size-4" />
          Entrega
        </button>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          conEntrega ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden" inert={!conEntrega}>
          <div className="mt-4 flex items-center gap-4 border-y border-tinta/15 py-3">
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full bg-senal text-white transition-[translate,opacity] duration-500 ease-out motion-reduce:transition-none",
                conEntrega
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-6 opacity-0"
              )}
            >
              <Motorbike aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Entrega a domicilio</p>
              <p className="text-xs opacity-60">
                Un repartidor te lo lleva hasta tu puerta.
              </p>
            </div>
            <p className="tabular font-titular text-lg font-extrabold tracking-[-0.03em] text-senal">
              + {formatMoney(COSTO_ENTREGA_CENTS)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
