"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Minus, Plus, ShieldCheck, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import { formatMoney } from "@/lib/format"
import type { ProductoMarketplace } from "@/lib/marketplace"
import { useCarritoMarketplace } from "@/components/marketplace/carrito"

export function AgregarProductoMarketplace({
  producto,
  referido,
}: {
  producto: ProductoMarketplace
  referido: string | null
}) {
  const router = useRouter()
  const { agregar } = useCarritoMarketplace()
  const [cantidad, setCantidad] = React.useState(1)
  const [agregado, setAgregado] = React.useState(false)

  function ponerEnCarrito(irAPagar = false) {
    agregar(producto, cantidad, referido)
    setAgregado(true)
    toast.success(`${producto.nombre} está en tu carrito.`)
    if (irAPagar) router.push("/carrito")
  }

  return (
    <div className="border-t-2 border-tinta pt-6">
      <div className="flex items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.1em] uppercase opacity-45">
            Cantidad
          </p>
          <div className="mt-2 flex items-center">
            <button
              type="button"
              onClick={() => setCantidad((actual) => Math.max(1, actual - 1))}
              disabled={cantidad === 1}
              aria-label="Quitar una unidad"
              className="flex size-11 items-center justify-center border border-tinta/25 disabled:opacity-30"
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>
            <span className="tabular flex h-11 w-12 items-center justify-center font-semibold">
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() =>
                setCantidad((actual) => Math.min(producto.stock, actual + 1))
              }
              disabled={cantidad >= producto.stock}
              aria-label="Agregar una unidad"
              className="flex size-11 items-center justify-center border border-tinta/25 disabled:opacity-30"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold tracking-[0.1em] uppercase opacity-45">
            Subtotal
          </p>
          <p className="tabular mt-1 font-titular text-2xl font-extrabold tracking-[-0.035em]">
            {formatMoney(producto.precioCents * cantidad)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => ponerEnCarrito(false)}
          className="flex min-h-12 items-center justify-center gap-2 rounded-plantilla border-2 border-tinta px-5 font-semibold transition-colors hover:bg-tinta hover:text-papel"
        >
          {agregado ? (
            <Check aria-hidden="true" className="size-4" />
          ) : (
            <ShoppingBag aria-hidden="true" className="size-4" />
          )}
          {agregado ? "Agregado" : "Añadir al carrito"}
        </button>
        <button
          type="button"
          onClick={() => ponerEnCarrito(true)}
          className="flex min-h-12 items-center justify-center rounded-plantilla bg-senal px-5 font-semibold text-white transition-colors hover:bg-senal-alta"
        >
          Comprar ahora
        </button>
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed opacity-60">
        <ShieldCheck
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-senal"
        />
        Tu pago queda retenido en PagoFácil hasta que confirmas que recibiste el
        pedido.
      </p>
    </div>
  )
}
