"use client"

import * as React from "react"
import { Check, Package, Search } from "lucide-react"

import { CONDICIONES, type ProductoDelCatalogo } from "@/lib/catalogos/datos"
import { FICHA, FICHA_ELEGIDA, FICHA_LIBRE } from "@/lib/estilos"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Insignia, Miniatura } from "@/components/panel/piezas"

/*
 * Elegir qué productos van en el catálogo: buscar, filtrar y marcar.
 *
 * El orden en que se marcan es el orden del catálogo; después se cambia
 * arrastrando. "Elegir los que se ven" marca de una vez lo que dejan los
 * filtros: todo lo rebajado, toda una categoría.
 */

type Filtro = "todos" | "rebaja" | "segunda" | "destacados" | `cat:${string}`

function plano(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

function cumple(producto: ProductoDelCatalogo, filtro: Filtro): boolean {
  if (filtro === "todos") return true
  if (filtro === "rebaja") return producto.precioAnteriorCents !== null
  if (filtro === "segunda") return producto.condicion !== "nuevo"
  if (filtro === "destacados") return producto.destacado
  return producto.categoriaId === filtro.slice(4)
}

export function SelectorDeProductos({
  productos,
  categorias,
  elegidos,
  alCambiar,
  tope = 200,
  alto,
}: {
  productos: ProductoDelCatalogo[]
  categorias: { id: string; nombre: string }[]
  elegidos: string[]
  alCambiar: (ids: string[]) => void
  tope?: number
  /** Con alto, la lista se desplaza adentro en vez de alargar la pantalla. */
  alto?: string
}) {
  const [buscar, setBuscar] = React.useState("")
  const [filtro, setFiltro] = React.useState<Filtro>("todos")
  const marcados = React.useMemo(() => new Set(elegidos), [elegidos])

  const visibles = React.useMemo(() => {
    const texto = plano(buscar.trim())
    return productos.filter(
      (producto) =>
        cumple(producto, filtro) &&
        (!texto ||
          plano(producto.nombre).includes(texto) ||
          (producto.codigo ? plano(producto.codigo).includes(texto) : false))
    )
  }, [productos, filtro, buscar])

  const filtros: { valor: Filtro; etiqueta: string }[] = [
    { valor: "todos", etiqueta: "Todos" },
    ...categorias.map((categoria) => ({
      valor: `cat:${categoria.id}` as Filtro,
      etiqueta: categoria.nombre,
    })),
    ...(productos.some((p) => p.precioAnteriorCents !== null)
      ? [{ valor: "rebaja" as Filtro, etiqueta: "Con descuento" }]
      : []),
    ...(productos.some((p) => p.condicion !== "nuevo")
      ? [{ valor: "segunda" as Filtro, etiqueta: "Segunda mano" }]
      : []),
    ...(productos.some((p) => p.destacado)
      ? [{ valor: "destacados" as Filtro, etiqueta: "Destacados" }]
      : []),
  ]

  const visiblesSinMarcar = visibles.filter((p) => !marcados.has(p.id))
  const visiblesMarcados = visibles.filter((p) => marcados.has(p.id))

  function alternar(id: string) {
    if (marcados.has(id)) alCambiar(elegidos.filter((otro) => otro !== id))
    else if (elegidos.length < tope) alCambiar([...elegidos, id])
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 border-b border-tinta/15 px-4 py-4 sm:px-5">
        <label className="relative block">
          <span className="sr-only">Buscar un producto</span>
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-0 size-4 -translate-y-1/2 opacity-55"
          />
          <input
            type="search"
            value={buscar}
            onChange={(evento) => setBuscar(evento.target.value)}
            placeholder="Busca por nombre o código"
            className="h-11 w-full border-0 border-b border-tinta/40 bg-transparent pl-6 text-base placeholder:text-tinta/40 focus-visible:border-senal focus-visible:outline-none"
          />
        </label>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {filtros.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              aria-pressed={filtro === opcion.valor}
              onClick={() => setFiltro(opcion.valor)}
              className={cn(
                FICHA,
                "shrink-0 whitespace-nowrap",
                filtro === opcion.valor ? FICHA_ELEGIDA : FICHA_LIBRE
              )}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="tabular text-sm" aria-live="polite">
            <span className="font-semibold">{elegidos.length}</span>
            <span className="opacity-70">
              {elegidos.length === 1 ? " elegido" : " elegidos"} de{" "}
              {productos.length}
            </span>
          </p>
          <div className="flex gap-1">
            {visiblesSinMarcar.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  alCambiar(
                    [...elegidos, ...visiblesSinMarcar.map((p) => p.id)].slice(
                      0,
                      tope
                    )
                  )
                }
                className="min-h-11 px-2 text-sm font-semibold underline-offset-4 hover:underline"
              >
                {visibles.length === productos.length
                  ? "Elegir todos"
                  : `Elegir estos ${visiblesSinMarcar.length}`}
              </button>
            ) : null}
            {visiblesMarcados.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  const quitar = new Set(visiblesMarcados.map((p) => p.id))
                  alCambiar(elegidos.filter((id) => !quitar.has(id)))
                }}
                className="min-h-11 px-2 text-sm font-semibold underline-offset-4 opacity-75 hover:underline hover:opacity-100"
              >
                Quitar estos
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="px-4 py-6 text-sm leading-relaxed opacity-70 sm:px-5">
          {productos.length === 0
            ? "Tu tienda todavía no tiene productos. Cárgalos en Productos y vuelve: el catálogo se arma con ellos."
            : "Nada coincide con esa búsqueda. Prueba con otra palabra o quita el filtro."}
        </p>
      ) : (
        <ul
          className={cn("overflow-y-auto", alto)}
          aria-label="Productos de tu tienda"
        >
          {visibles.map((producto) => {
            const marcado = marcados.has(producto.id)
            const posicion = elegidos.indexOf(producto.id) + 1
            return (
              <li
                key={producto.id}
                className="border-t border-tinta/15 first:border-t-0"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={marcado}
                  onClick={() => alternar(producto.id)}
                  className={cn(
                    "flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left transition-colors sm:px-5",
                    marcado ? "bg-tinta/[0.05]" : "hover:bg-tinta/[0.03]"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "tabular flex size-6 shrink-0 items-center justify-center border-2 text-[11px] font-bold",
                      marcado
                        ? "border-tinta bg-tinta text-papel"
                        : "border-tinta/40"
                    )}
                  >
                    {marcado ? (
                      posicion <= 99 ? (
                        posicion
                      ) : (
                        <Check className="size-3.5" />
                      )
                    ) : null}
                  </span>
                  <Miniatura foto={producto.foto} icono={Package} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {producto.nombre}
                    </span>
                    <span className="tabular mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span>{formatMoney(producto.precioCents)}</span>
                      {producto.precioAnteriorCents ? (
                        <span className="text-xs line-through opacity-60">
                          {formatMoney(producto.precioAnteriorCents)}
                        </span>
                      ) : null}
                      <span className="text-xs opacity-65">
                        {producto.stock > 0
                          ? `${producto.stock} en stock`
                          : "Agotado"}
                      </span>
                    </span>
                  </span>
                  {producto.condicion !== "nuevo" ? (
                    <Insignia tono="suave">
                      {CONDICIONES[producto.condicion]}
                    </Insignia>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
