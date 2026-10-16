"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

const ORDENES = [
  { valor: "", etiqueta: "Más recientes" },
  { valor: "nombre", etiqueta: "Nombre" },
  { valor: "precio", etiqueta: "Precio" },
  { valor: "stock", etiqueta: "Menos stock" },
] as const

/**
 * El buscador del catálogo, el mismo de la app: una franja con su regla abajo,
 * sobre las fichas. La búsqueda vive en la dirección, como los filtros, así la
 * lista sigue siendo del servidor y el estado sobrevive a recargar.
 *
 * En una pantalla ancha suma el orden, que en el celular no entra sin empujar
 * la lista hacia abajo.
 */
export function BuscadorDeProductos() {
  const router = useRouter()
  const ruta = usePathname()
  const parametros = useSearchParams()
  const [buscar, setBuscar] = React.useState(parametros.get("buscar") ?? "")

  const aplicar = React.useCallback(
    (cambios: Record<string, string | null>) => {
      const siguientes = new URLSearchParams(parametros.toString())
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) siguientes.set(clave, valor)
        else siguientes.delete(clave)
      }
      const consulta = siguientes.toString()
      router.replace(consulta ? `${ruta}?${consulta}` : ruta, { scroll: false })
    },
    [parametros, router, ruta]
  )

  // Espera a que dejes de escribir: una navegación por tecla recarga la lista
  // entera y se siente peor que esperar un cuarto de segundo.
  React.useEffect(() => {
    const actual = parametros.get("buscar") ?? ""
    if (buscar === actual) return
    const id = window.setTimeout(() => aplicar({ buscar: buscar || null }), 250)
    return () => window.clearTimeout(id)
  }, [buscar, parametros, aplicar])

  return (
    <div className="flex items-center border-b border-tinta/15 pl-4 sm:pl-5">
      <Search aria-hidden="true" className="size-5 shrink-0 opacity-60" />
      <label htmlFor="buscar-producto" className="sr-only">
        Buscar en tu catálogo
      </label>
      <input
        id="buscar-producto"
        type="search"
        value={buscar}
        onChange={(e) => setBuscar(e.target.value)}
        placeholder="Buscar por nombre, categoría o código"
        autoComplete="off"
        className="h-12 min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-tinta/55 [&::-webkit-search-cancel-button]:hidden"
      />
      {buscar ? (
        <button
          type="button"
          onClick={() => setBuscar("")}
          aria-label="Limpiar la búsqueda"
          className="flex size-11 shrink-0 items-center justify-center opacity-65 transition-opacity hover:opacity-100"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
      <label className="hidden h-12 shrink-0 items-center gap-2 border-l border-tinta/15 px-5 text-sm lg:flex">
        <span className="opacity-65">Ordenar</span>
        <select
          value={parametros.get("orden") ?? ""}
          onChange={(e) => aplicar({ orden: e.target.value || null })}
          className="h-11 bg-transparent pr-1 font-semibold outline-none"
        >
          {ORDENES.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
