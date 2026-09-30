"use client"

import * as React from "react"
import Link from "next/link"
import { Check, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Product } from "@/types"
import { ANCLA_DE_COMPRA } from "@/components/tienda/agregar"
import { useCarrito } from "@/components/tienda/carrito"

/**
 * El botón de compra que sigue al pulgar, en la ficha de un producto.
 *
 * En el celular la foto ocupa la primera pantalla y el botón de agregar queda
 * abajo, fuera de la vista. Esta barra aparece solo mientras ese botón no se
 * ve —mirando la foto o leyendo la descripción— y se va cuando vuelve a verse:
 * nunca hay dos botones de agregar a la vez. En la computadora el texto
 * acompaña a la foto y no hace falta.
 *
 * Reemplaza a la barra del carrito en la ficha, así que también lleva al
 * carrito cuando ya tiene algo.
 */
export function BarraDeCompra({
  producto,
  slug,
}: {
  producto: Product
  slug: string
}) {
  const { agregar, lineas, unidades, listo } = useCarrito()
  const [aLaVista, setALaVista] = React.useState(false)
  const [recien, setRecien] = React.useState(false)

  React.useEffect(() => {
    const boton = document.getElementById(ANCLA_DE_COMPRA)
    if (!boton) return
    const observador = new IntersectionObserver(([entrada]) =>
      setALaVista(!entrada.isIntersecting)
    )
    observador.observe(boton)
    return () => observador.disconnect()
  }, [])

  React.useEffect(() => {
    if (!recien) return
    const id = window.setTimeout(() => setRecien(false), 2200)
    return () => window.clearTimeout(id)
  }, [recien])

  const yaEnCarrito =
    lineas.find((l) => l.productoId === producto.id)?.cantidad ?? 0
  const disponible = Math.max(producto.stock - yaEnCarrito, 0)

  function alAgregar() {
    if (disponible === 0) return
    agregar(
      {
        productoId: producto.id,
        nombre: producto.name,
        precioCents: producto.price_cents,
        imagen: producto.image_url,
        stock: producto.stock,
      },
      1
    )
    setRecien(true)
    toast.success(`${producto.name} está en tu carrito.`)
  }

  return (
    <div
      inert={!aLaVista}
      className={cn(
        "sticky bottom-0 z-30 border-t-2 border-tinta bg-papel/95 backdrop-blur transition-transform duration-300 motion-reduce:transition-none md:hidden",
        "supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]",
        aLaVista ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex items-center gap-2 px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold opacity-60">
            {producto.name}
          </p>
          <p className="tabular font-titular text-lg font-bold tracking-[-0.02em]">
            {formatMoney(producto.price_cents)}
          </p>
        </div>

        {listo && unidades > 0 ? (
          <Link
            href={`/t/${slug}/carrito`}
            aria-label={`Ver tu carrito: ${unidades} ${unidades === 1 ? "artículo" : "artículos"}`}
            className="relative flex size-12 shrink-0 items-center justify-center rounded-plantilla border-2 border-tinta transition-colors hover:bg-tinta hover:text-papel"
          >
            <ShoppingBag aria-hidden="true" className="size-5" />
            <span className="tabular absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-tinta px-1 text-[11px] font-semibold text-papel">
              {unidades}
            </span>
          </Link>
        ) : null}

        <button
          type="button"
          onClick={alAgregar}
          disabled={disponible === 0}
          className={cn(
            "flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-plantilla px-5 font-semibold transition-colors disabled:opacity-50",
            recien
              ? "bg-tinta text-papel"
              : "bg-senal text-white hover:bg-senal-alta"
          )}
        >
          {producto.stock === 0 ? (
            "Agotado"
          ) : recien ? (
            <>
              <Check aria-hidden="true" className="size-4" />
              Agregado
            </>
          ) : (
            <>
              <ShoppingBag aria-hidden="true" className="size-4" />
              Agregar
            </>
          )}
        </button>
      </div>
    </div>
  )
}
