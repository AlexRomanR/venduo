"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

import { ORDENES_DE_CATALOGO } from "@/lib/catalogo"
import { cn } from "@/lib/utils"

/**
 * Buscar y ordenar el catálogo.
 *
 * Va por URL, como los filtros: "zapatillas, de menor a mayor precio" es un
 * enlace que se puede mandar. La búsqueda espera a que se deje de escribir
 * para no reemplazar la URL con cada letra.
 */
export function BuscarYOrdenar({
  redondeado = false,
  className,
}: {
  /** Con el radio de la plantilla. */
  redondeado?: boolean
  className?: string
}) {
  const router = useRouter()
  const ruta = usePathname()
  const parametros = useSearchParams()

  const [buscar, setBuscar] = React.useState(parametros.get("buscar") ?? "")
  const orden = parametros.get("orden") ?? "destacados"

  const aplicar = React.useCallback(
    (cambios: Record<string, string | null>) => {
      const siguientes = new URLSearchParams(parametros.toString())
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) siguientes.set(clave, valor)
        else siguientes.delete(clave)
      }
      const consulta = siguientes.toString()
      router.replace(consulta ? `${ruta}?${consulta}` : ruta, {
        scroll: false,
      })
    },
    [parametros, router, ruta]
  )

  React.useEffect(() => {
    const actual = parametros.get("buscar") ?? ""
    if (buscar.trim() === actual) return

    const id = window.setTimeout(
      () => aplicar({ buscar: buscar.trim() || null }),
      350
    )
    return () => window.clearTimeout(id)
  }, [buscar, parametros, aplicar])

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <label
        className={cn(
          "flex min-h-12 items-center gap-3 border border-tinta/25 px-4 transition-colors focus-within:border-tinta sm:w-80",
          redondeado && "rounded-plantilla"
        )}
      >
        <Search aria-hidden="true" className="size-4 shrink-0 opacity-45" />
        <span className="sr-only">Buscar en el catálogo</span>
        <input
          type="search"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar"
          maxLength={80}
          className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-tinta/40 [&::-webkit-search-cancel-button]:hidden"
        />
        {buscar ? (
          <button
            type="button"
            onClick={() => setBuscar("")}
            aria-label="Borrar la búsqueda"
            className="-mr-2 flex size-11 shrink-0 items-center justify-center opacity-55 transition-opacity hover:opacity-100"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </label>

      <label className="flex items-center gap-3">
        <span className="shrink-0 text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
          Ordenar
        </span>
        <select
          value={orden}
          onChange={(e) =>
            aplicar({
              orden: e.target.value === "destacados" ? null : e.target.value,
            })
          }
          className={cn(
            "min-h-12 flex-1 border border-tinta/25 bg-papel px-3 text-sm font-semibold transition-colors outline-none hover:border-tinta focus-visible:border-tinta sm:flex-none",
            redondeado && "rounded-plantilla px-4"
          )}
        >
          {Object.entries(ORDENES_DE_CATALOGO).map(([valor, nombre]) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
