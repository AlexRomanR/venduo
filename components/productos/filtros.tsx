"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"

import { FICHA, FICHA_ELEGIDA, FICHA_LIBRE } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import type { CategoriaConUso } from "@/lib/data/catalogo"

const ESTADOS = [
  { valor: "activos", etiqueta: "Publicados" },
  { valor: "ocultos", etiqueta: "Ocultos" },
  { valor: "poco_stock", etiqueta: "Queda poco" },
  { valor: "sin_stock", etiqueta: "Sin stock" },
  { valor: "destacados", etiqueta: "Destacados" },
] as const

const ORDENES = [
  { valor: "", etiqueta: "Más recientes" },
  { valor: "nombre", etiqueta: "Nombre" },
  { valor: "precio", etiqueta: "Precio" },
  { valor: "stock", etiqueta: "Menos stock" },
] as const

/**
 * Los filtros viven en la URL.
 *
 * Así la lista sigue siendo un componente de servidor, el estado sobrevive a
 * recargar, y un filtro útil —"lo que se está por acabar"— se puede guardar en
 * favoritos o mandar por WhatsApp a quien reponga el stock.
 *
 * Va dentro del panel "Tus productos", como su barra de herramientas: una
 * franja con su regla abajo, sobre la lista que filtra. En el celular las
 * fichas se pliegan detrás de "Filtrar": abiertas ocupaban casi una pantalla
 * antes del primer producto.
 */
export function FiltrosCatalogo({
  categorias,
}: {
  categorias: CategoriaConUso[]
}) {
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

  // El buscador espera a que dejes de escribir: una navegación por tecla
  // recarga la lista entera y se siente peor que esperar un cuarto de segundo.
  React.useEffect(() => {
    const actual = parametros.get("buscar") ?? ""
    if (buscar === actual) return

    const id = window.setTimeout(() => aplicar({ buscar: buscar || null }), 250)
    return () => window.clearTimeout(id)
  }, [buscar, parametros, aplicar])

  const estado = parametros.get("estado")
  const categoria = parametros.get("categoria")
  const orden = parametros.get("orden") ?? ""
  const hayFiltros = Boolean(estado || categoria || buscar)
  const elegidos = [estado, categoria, orden].filter(Boolean).length

  // Abiertos de entrada si ya hay alguno puesto: esconder un filtro activo
  // deja una lista recortada sin decir por qué.
  const [abiertos, setAbiertos] = React.useState(elegidos > 0)

  return (
    <div className="flex flex-col gap-3 border-b border-tinta/15 px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3 border-b border-tinta">
          <Search aria-hidden="true" className="size-4 shrink-0 opacity-65" />
          <label htmlFor="buscar-producto" className="sr-only">
            Buscar en tu catálogo
          </label>
          <input
            id="buscar-producto"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por nombre, categoría o código"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-tinta/55"
          />
          {buscar ? (
            <button
              type="button"
              onClick={() => setBuscar("")}
              aria-label="Limpiar la búsqueda"
              className="flex size-11 items-center justify-center opacity-65 transition-colors hover:text-senal hover:opacity-100"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setAbiertos((antes) => !antes)}
          aria-expanded={abiertos}
          aria-controls="filtros-del-catalogo"
          className={cn(
            FICHA,
            "shrink-0 gap-2 lg:hidden",
            abiertos || elegidos > 0 ? FICHA_ELEGIDA : FICHA_LIBRE
          )}
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Filtrar
          {elegidos > 0 ? <span className="tabular">{elegidos}</span> : null}
        </button>
      </div>

      <div
        id="filtros-del-catalogo"
        className={cn("flex-col gap-3", abiertos ? "flex" : "hidden lg:flex")}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          {ESTADOS.map((e) => (
            <Ficha
              key={e.valor}
              activa={estado === e.valor}
              onClick={() =>
                aplicar({ estado: estado === e.valor ? null : e.valor })
              }
            >
              {e.etiqueta}
            </Ficha>
          ))}
        </div>

        {categorias.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <span className="mr-1 text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
              Categoría
            </span>
            {categorias.map((c) => (
              <Ficha
                key={c.id}
                activa={categoria === c.id}
                onClick={() =>
                  aplicar({ categoria: categoria === c.id ? null : c.id })
                }
              >
                {c.name}
                <span className="tabular ml-1.5 opacity-65">{c.productos}</span>
              </Ficha>
            ))}
            <Ficha
              activa={categoria === "sin"}
              onClick={() =>
                aplicar({ categoria: categoria === "sin" ? null : "sin" })
              }
            >
              Sin categoría
            </Ficha>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="flex items-center gap-2 text-xs">
            <span className="font-semibold tracking-[0.12em] uppercase opacity-65">
              Ordenar
            </span>
            <select
              value={orden}
              onChange={(e) => aplicar({ orden: e.target.value || null })}
              className="h-11 border-b border-tinta/30 bg-transparent pr-6 text-sm font-semibold transition-colors outline-none focus:border-senal"
            >
              {ORDENES.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </select>
          </label>

          {hayFiltros ? (
            <button
              type="button"
              onClick={() => {
                setBuscar("")
                aplicar({
                  buscar: null,
                  estado: null,
                  categoria: null,
                })
              }}
              className="flex min-h-11 items-center gap-1.5 text-xs font-semibold tracking-[0.12em] uppercase transition-colors hover:text-senal"
            >
              <X aria-hidden="true" className="size-3.5" />
              Quitar filtros
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Ficha({
  activa,
  onClick,
  children,
}: {
  activa: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={cn(FICHA, activa ? FICHA_ELEGIDA : FICHA_LIBRE)}
    >
      {children}
    </button>
  )
}
