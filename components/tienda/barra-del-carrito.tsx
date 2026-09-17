"use client"

import Link from "next/link"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useCarrito } from "@/components/tienda/carrito"

/**
 * Una barra que sigue al pulgar con el subtotal y el paso siguiente.
 *
 * Es la misma en todas las plantillas: toma su identidad de los tokens, y lo
 * que tiene que resolver —cuánto llevas y cómo seguir— no cambia con el rubro.
 */
export function BarraDelCarrito({ slug }: { slug: string }) {
  const { unidades, subtotalCents, listo } = useCarrito()

  if (!listo || unidades === 0) return null

  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 border-t-2 border-tinta bg-papel/95 backdrop-blur",
        "supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
            {unidades} {unidades === 1 ? "artículo" : "artículos"}
          </p>
          <p className="tabular font-titular text-lg font-bold tracking-[-0.02em]">
            {formatMoney(subtotalCents)}
          </p>
        </div>

        <Link
          href={`/t/${slug}/carrito`}
          className="flex min-h-12 items-center gap-2 rounded-plantilla bg-senal px-5 font-semibold text-white transition-colors hover:bg-senal-alta"
        >
          Ver mi carrito
        </Link>
      </div>
    </div>
  )
}
