"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"

const SECCIONES = [
  { href: "/explorar/tiendas", nombre: "Tiendas" },
  { href: "/explorar/productos", nombre: "Productos sueltos" },
]

/**
 * Navegación entre las dos vitrinas.
 *
 * Son rutas y no pestañas dentro de una pantalla porque cada una es un
 * catálogo entero: con búsqueda, paginación y una URL que se puede compartir
 * o recargar. Una pestaña con estado local pierde las tres cosas.
 */
export function NavExplorar() {
  const pathname = usePathname()

  return (
    <div className="mb-12">
      <Link
        href="/sumarme"
        className="inline-flex min-h-11 items-center gap-2 text-sm opacity-70 transition-opacity hover:opacity-100"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver
      </Link>

      <div className="mt-4 grid grid-cols-2">
        {SECCIONES.map((seccion) => (
          <Link
            key={seccion.href}
            href={seccion.href}
            aria-current={pathname === seccion.href ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center border-t-2 pt-3 font-titular text-sm font-bold tracking-[-0.01em] transition-colors duration-200",
              pathname === seccion.href
                ? "border-tinta"
                : "border-tinta/15 opacity-45 hover:opacity-100"
            )}
          >
            {seccion.nombre}
          </Link>
        ))}
      </div>
    </div>
  )
}
