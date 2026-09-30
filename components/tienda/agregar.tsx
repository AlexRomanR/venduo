"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Minus, Plus, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Product } from "@/types"
import { useCarrito } from "@/components/tienda/carrito"

/** Dónde está el botón de agregar: la barra de compra lo mira para no repetirlo. */
export const ANCLA_DE_COMPRA = "agregar-al-carrito"

/**
 * Cantidad y agregar al carrito.
 *
 * El botón confirma en su sitio en vez de mandar al carrito: quien compra
 * desde el celular suele querer seguir mirando, y sacarlo de la ficha después
 * de cada producto es lo que hace que abandone con un solo artículo.
 */
export function AgregarAlCarrito({
  producto,
  slug,
}: {
  producto: Product
  slug: string
}) {
  const router = useRouter()
  const { agregar, lineas } = useCarrito()
  const [cantidad, setCantidad] = React.useState(1)
  const [recien, setRecien] = React.useState(false)

  const agotado = producto.stock === 0
  const yaEnCarrito =
    lineas.find((l) => l.productoId === producto.id)?.cantidad ?? 0
  const disponible = Math.max(producto.stock - yaEnCarrito, 0)
  const tope = Math.max(disponible, 1)

  React.useEffect(() => {
    if (!recien) return
    const id = window.setTimeout(() => setRecien(false), 2200)
    return () => window.clearTimeout(id)
  }, [recien])

  function alAgregar() {
    if (agotado || disponible === 0) return

    agregar(
      {
        productoId: producto.id,
        nombre: producto.name,
        precioCents: producto.price_cents,
        imagen: producto.image_url,
        stock: producto.stock,
      },
      Math.min(cantidad, disponible)
    )

    setRecien(true)
    setCantidad(1)
    toast.success(`${producto.name} está en tu carrito.`)
  }

  if (agotado) {
    return (
      <div id={ANCLA_DE_COMPRA} className="border-t-2 border-tinta pt-7">
        <p className="font-titular text-lg font-bold tracking-[-0.02em]">
          Sin stock por ahora
        </p>
        <p className="mt-2 max-w-[48ch] leading-relaxed opacity-70">
          Este producto se agotó. Escríbele a la tienda para saber cuándo
          vuelve.
        </p>
      </div>
    )
  }

  return (
    <div id={ANCLA_DE_COMPRA} className="border-t-2 border-tinta pt-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
            Cantidad
          </span>
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              disabled={cantidad <= 1}
              aria-label="Quitar una unidad"
              className="flex size-11 items-center justify-center border border-tinta/30 transition-colors hover:border-senal hover:text-senal disabled:opacity-30"
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>

            <span
              aria-live="polite"
              className="tabular flex h-11 w-14 items-center justify-center font-titular text-lg font-bold"
            >
              {cantidad}
            </span>

            <button
              type="button"
              onClick={() => setCantidad((c) => Math.min(tope, c + 1))}
              disabled={cantidad >= tope}
              aria-label="Agregar una unidad"
              className="flex size-11 items-center justify-center border border-tinta/30 transition-colors hover:border-senal hover:text-senal disabled:opacity-30"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
            Subtotal
          </span>
          <p className="tabular font-titular text-2xl font-extrabold tracking-[-0.03em]">
            {formatMoney(producto.price_cents * cantidad)}
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={alAgregar}
          disabled={disponible === 0}
          className={cn(
            "flex min-h-12 flex-1 items-center justify-center gap-2 rounded-plantilla px-5 font-semibold transition-colors",
            recien
              ? "bg-tinta text-papel"
              : "bg-senal text-white hover:bg-senal-alta",
            disponible === 0 && "opacity-50"
          )}
        >
          {recien ? (
            <>
              <Check aria-hidden="true" className="size-4" />
              Agregado
            </>
          ) : (
            <>
              <ShoppingBag aria-hidden="true" className="size-4" />
              Agregar al carrito
            </>
          )}
        </button>

        {yaEnCarrito > 0 ? (
          <button
            type="button"
            onClick={() => router.push(`/t/${slug}/carrito`)}
            className="flex min-h-12 items-center justify-center rounded-plantilla border-2 border-tinta px-5 font-semibold transition-colors hover:bg-tinta hover:text-papel"
          >
            Ir a pagar
          </button>
        ) : null}
      </div>

      {yaEnCarrito > 0 ? (
        <p className="mt-4 text-sm opacity-55">
          Ya tienes {yaEnCarrito} en tu carrito.
          {disponible === 0
            ? " Es todo el stock disponible."
            : ` Puedes agregar ${disponible} más.`}
        </p>
      ) : null}
    </div>
  )
}
