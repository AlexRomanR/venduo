import Link from "next/link"
import {
  ArrowRight,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react"

import { ConfigStatus } from "@/components/config-status"
import { TarjetaMarketplace } from "@/components/marketplace/producto"
import { getMarketplace } from "@/lib/data/marketplace"
import { formatNumber } from "@/lib/format"
import type { FiltrosMarketplace } from "@/lib/marketplace"

export const metadata = {
  title: "Venduo — Marketplace de productos bolivianos",
  description:
    "Compra productos de negocios bolivianos con el pago retenido hasta la entrega.",
}

const CONDICIONES = [
  ["nuevo", "Nuevo"],
  ["segunda_mano", "Segunda mano"],
  ["reacondicionado", "Reacondicionado"],
] as const

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const parametros = await searchParams
  const primero = (valor: string | string[] | undefined) =>
    typeof valor === "string" ? valor : undefined
  const condicion = primero(parametros.condicion)
  const orden = primero(parametros.orden)
  const filtros: FiltrosMarketplace = {
    q: primero(parametros.q),
    categoria: primero(parametros.categoria),
    condicion: CONDICIONES.some(([valor]) => valor === condicion)
      ? (condicion as FiltrosMarketplace["condicion"])
      : undefined,
    orden: ["recientes", "precio_asc", "precio_desc", "ofertas"].includes(
      orden ?? ""
    )
      ? (orden as FiltrosMarketplace["orden"])
      : undefined,
    pagina: Math.max(1, Number.parseInt(primero(parametros.p) ?? "1", 10) || 1),
  }
  const catalogo = await getMarketplace(filtros)

  const activo =
    filtros.q || filtros.categoria || filtros.condicion || filtros.orden

  return (
    <div>
      <section className="border-b border-tinta/15 px-5 py-8 lg:px-10 lg:py-10">
        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div>
            <h1 className="max-w-[15ch] font-titular text-[clamp(2.1rem,6vw,4.25rem)] leading-[0.96] font-extrabold tracking-[-0.04em] text-balance">
              Encuentra algo bueno. Cómpralo sin apostar.
            </h1>
            <p className="mt-4 max-w-[58ch] leading-relaxed opacity-65 sm:text-lg">
              Un solo mercado para productos de negocios bolivianos. Pagas el
              precio que ves y tu dinero queda protegido hasta la entrega.
            </p>
          </div>
          <div className="flex items-center gap-3 border-t border-tinta/15 pt-4 xl:max-w-sm xl:border-t-0 xl:border-l xl:pt-0 xl:pl-7">
            <ShieldCheck
              aria-hidden="true"
              className="size-6 shrink-0 text-senal"
            />
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">Pago retenido.</span>{" "}
              <span className="opacity-65">Se libera cuando recibes.</span>
            </p>
          </div>
        </div>

        <form action="/" className="mt-8 flex border-2 border-tinta bg-papel">
          <Search
            aria-hidden="true"
            className="ml-4 size-5 shrink-0 self-center opacity-45"
          />
          <input
            type="search"
            name="q"
            defaultValue={filtros.q}
            placeholder="Busca café, ropa, mochilas, regalos…"
            aria-label="Buscar productos"
            className="min-h-14 min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-tinta/45"
          />
          <button
            type="submit"
            className="min-h-14 shrink-0 bg-tinta px-5 text-sm font-semibold text-papel transition-colors hover:bg-senal"
          >
            Buscar
          </button>
        </form>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/"
            className={`flex min-h-11 shrink-0 items-center border px-4 text-sm font-semibold ${!filtros.categoria ? "border-tinta bg-tinta text-papel" : "border-tinta/25"}`}
          >
            Todo
          </Link>
          {catalogo.categorias.map((categoria) => (
            <Link
              key={categoria.nombre}
              href={`/?categoria=${encodeURIComponent(categoria.nombre)}`}
              className={`flex min-h-11 shrink-0 items-center gap-2 border px-4 text-sm font-semibold ${filtros.categoria === categoria.nombre ? "border-tinta bg-tinta text-papel" : "border-tinta/25 hover:border-tinta"}`}
            >
              {categoria.nombre}
              <span className="tabular text-xs opacity-55">
                {categoria.productos}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 py-7 lg:px-10 lg:py-9">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-tinta/15 pb-5">
          <div>
            <p className="text-sm font-semibold">
              {formatNumber(catalogo.total)}{" "}
              {catalogo.total === 1 ? "producto" : "productos"}
            </p>
            {activo ? (
              <Link
                href="/"
                className="mt-1 inline-flex text-xs text-senal underline underline-offset-4"
              >
                Limpiar filtros
              </Link>
            ) : (
              <p className="mt-1 text-xs opacity-50">
                Disponibles para comprar hoy
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <details className="relative sm:hidden">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 border border-tinta/25 px-4 text-sm font-semibold">
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                Condición
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-56 border border-tinta bg-papel p-2">
                {CONDICIONES.map(([valor, etiqueta]) => (
                  <Link
                    key={valor}
                    href={`/?condicion=${valor}`}
                    className="flex min-h-11 items-center px-3 text-sm hover:bg-tinta hover:text-papel"
                  >
                    {etiqueta}
                  </Link>
                ))}
              </div>
            </details>

            <div className="hidden items-center gap-1 sm:flex">
              {CONDICIONES.map(([valor, etiqueta]) => (
                <Link
                  key={valor}
                  href={`/?condicion=${valor}`}
                  className={`flex min-h-11 items-center px-3 text-xs font-semibold ${filtros.condicion === valor ? "text-senal" : "opacity-60 hover:opacity-100"}`}
                >
                  {etiqueta}
                </Link>
              ))}
            </div>

            <form action="/">
              {filtros.q ? (
                <input type="hidden" name="q" value={filtros.q} />
              ) : null}
              {filtros.categoria ? (
                <input
                  type="hidden"
                  name="categoria"
                  value={filtros.categoria}
                />
              ) : null}
              <select
                name="orden"
                defaultValue={filtros.orden ?? "recientes"}
                aria-label="Ordenar productos"
                className="min-h-11 border border-tinta/25 bg-papel px-3 text-sm font-semibold outline-none focus:border-senal"
              >
                <option value="recientes">Más relevantes</option>
                <option value="precio_asc">Menor precio</option>
                <option value="precio_desc">Mayor precio</option>
                <option value="ofertas">Ofertas</option>
              </select>
              <button
                type="submit"
                className="min-h-11 border-y border-r border-tinta/25 px-3 text-xs font-semibold hover:bg-tinta hover:text-papel"
              >
                Ordenar
              </button>
            </form>
          </div>
        </div>

        {catalogo.productos.length > 0 ? (
          <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-3 2xl:grid-cols-4">
            {catalogo.productos.map((producto, indice) => (
              <TarjetaMarketplace
                key={producto.id}
                producto={producto}
                prioridad={indice < 4}
              />
            ))}
          </div>
        ) : (
          <div className="py-16">
            <h2 className="max-w-[18ch] font-titular text-3xl font-extrabold tracking-[-0.035em]">
              No encontramos eso todavía.
            </h2>
            <p className="mt-4 max-w-[50ch] leading-relaxed opacity-65">
              Prueba con otra palabra o quita un filtro. Los productos nuevos
              aparecen en el Marketplace apenas se publican.
            </p>
            <Link
              href="/"
              className="mt-7 inline-flex min-h-11 items-center gap-2 font-semibold text-senal"
            >
              Ver todo el catálogo
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        )}

        {catalogo.paginas > 1 ? (
          <nav
            aria-label="Páginas del catálogo"
            className="mt-12 flex justify-center gap-2"
          >
            {Array.from(
              { length: catalogo.paginas },
              (_, indice) => indice + 1
            ).map((pagina) => {
              const consulta = new URLSearchParams()
              if (filtros.q) consulta.set("q", filtros.q)
              if (filtros.categoria)
                consulta.set("categoria", filtros.categoria)
              if (filtros.condicion)
                consulta.set("condicion", filtros.condicion)
              if (filtros.orden) consulta.set("orden", filtros.orden)
              consulta.set("p", String(pagina))
              return (
                <Link
                  key={pagina}
                  href={`/?${consulta.toString()}`}
                  aria-current={catalogo.pagina === pagina ? "page" : undefined}
                  className={`tabular flex size-11 items-center justify-center border text-sm font-semibold ${catalogo.pagina === pagina ? "border-tinta bg-tinta text-papel" : "border-tinta/25"}`}
                >
                  {pagina}
                </Link>
              )
            })}
          </nav>
        ) : null}

        {catalogo.esDemo ? <ConfigStatus /> : null}
      </section>
    </div>
  )
}
