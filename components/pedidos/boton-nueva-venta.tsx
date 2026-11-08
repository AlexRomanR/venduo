"use client"

import * as React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { BOTON_PRIMARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"

/**
 * "Nueva venta" flotando sobre las pestañas del celular. Al bajar por la
 * lista se achica a un círculo con su "+": a lo ancho tapaba la columna de los
 * sellos, que es donde se cobra. Arriba de todo vuelve a decir qué hace.
 */
export function BotonNuevaVenta() {
  const [chico, setChico] = React.useState(false)

  React.useEffect(() => {
    const medir = () => setChico(window.scrollY > 80)
    medir()
    window.addEventListener("scroll", medir, { passive: true })
    return () => window.removeEventListener("scroll", medir)
  }, [])

  return (
    <Link
      href="/panel/pedidos/nueva"
      aria-label="Nueva venta"
      className={cn(
        BOTON_PRIMARIO,
        "fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-20 min-h-12 overflow-hidden whitespace-nowrap shadow-[var(--sombra-cuaderno)] transition-[padding,gap] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none lg:hidden",
        chico ? "size-12 gap-0 px-0" : "gap-2 px-5"
      )}
    >
      <Plus aria-hidden="true" className="size-5 shrink-0" />
      <span
        aria-hidden="true"
        className={cn(
          "transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          chico ? "max-w-0 opacity-0" : "max-w-32 opacity-100"
        )}
      >
        Nueva venta
      </span>
    </Link>
  )
}
