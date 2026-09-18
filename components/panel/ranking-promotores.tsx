"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  MapPin,
  Medal,
  Search,
  Sparkles,
  Store,
  Trophy,
  X,
} from "lucide-react"

import { formatMoney, formatNumber } from "@/lib/format"
import type { PromotorRanking } from "@/lib/promotor"
import { cn } from "@/lib/utils"

interface Props {
  rankingMiNegocio: PromotorRanking[]
  rankingGlobal: PromotorRanking[]
  nombreNegocio?: string
}

type Ambito = "negocio" | "global"
type Criterio = "ventas" | "volumen"

export function RankingPromotores({
  rankingMiNegocio,
  rankingGlobal,
  nombreNegocio = "tu negocio",
}: Props) {
  const [ambito, setAmbito] = React.useState<Ambito>(
    rankingMiNegocio.length > 0 ? "negocio" : "global"
  )
  const [criterio, setCriterio] = React.useState<Criterio>("ventas")
  const [busqueda, setBusqueda] = React.useState("")

  const listaActual = ambito === "negocio" ? rankingMiNegocio : rankingGlobal

  // Filtrado por búsqueda
  const listaFiltrada = React.useMemo(() => {
    let res = [...listaActual]
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim()
      res = res.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.ciudad && p.ciudad.toLowerCase().includes(q)) ||
          (p.productos &&
            p.productos.some((prod) => prod.toLowerCase().includes(q)))
      )
    }

    // Ordenamiento por criterio
    res.sort((a, b) => {
      if (criterio === "ventas") {
        return b.ventas - a.ventas || b.volumenCents - a.volumenCents
      }
      return b.volumenCents - a.volumenCents || b.ventas - a.ventas
    })

    return res
  }, [listaActual, busqueda, criterio])

  const top3 = listaFiltrada.slice(0, 3)
  const resto = listaFiltrada.slice(3)

  return (
    <div className="flex flex-col gap-8">
      {/* Controles superiores: Selector de Ámbito, Filtro de Criterio y Buscador */}
      <div className="flex flex-col gap-4 border-b border-tinta/15 pb-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Selector de Ámbito (Tabs editoriales) */}
        <div className="inline-flex rounded-sm border border-tinta/20 bg-papel p-1">
          <button
            type="button"
            onClick={() => setAmbito("negocio")}
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-sm px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors sm:text-sm",
              ambito === "negocio"
                ? "bg-tinta text-papel shadow-xs"
                : "text-tinta/70 hover:bg-tinta/5 hover:text-tinta"
            )}
          >
            <Store className="size-4" aria-hidden="true" />
            <span>En mi negocio</span>
            <span
              className={cn(
                "py-0.2 ml-1 rounded-full px-1.5 text-[10px]",
                ambito === "negocio"
                  ? "bg-papel/20 text-papel"
                  : "bg-tinta/10 text-tinta"
              )}
            >
              {rankingMiNegocio.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAmbito("global")}
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-sm px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors sm:text-sm",
              ambito === "global"
                ? "bg-tinta text-papel shadow-xs"
                : "text-tinta/70 hover:bg-tinta/5 hover:text-tinta"
            )}
          >
            <Trophy className="size-4 text-senal" aria-hidden="true" />
            <span>Toda la red Venduo</span>
            <span
              className={cn(
                "py-0.2 ml-1 rounded-full px-1.5 text-[10px]",
                ambito === "global"
                  ? "bg-papel/20 text-papel"
                  : "bg-tinta/10 text-tinta"
              )}
            >
              Top {rankingGlobal.length}
            </span>
          </button>
        </div>

        {/* Buscador y Criterio de Orden */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Campo de búsqueda */}
          <div className="relative min-w-[220px]">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tinta/40"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o ciudad..."
              className="h-11 w-full rounded-sm border border-tinta/20 bg-papel pr-8 pl-9 text-sm text-tinta placeholder:text-tinta/40 focus:border-tinta focus:outline-none"
            />
            {busqueda ? (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-tinta/50 hover:text-tinta"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* Criterio de orden */}
          <div className="flex items-center gap-1.5 text-xs text-tinta/70">
            <span className="font-semibold">Ordenar:</span>
            <button
              type="button"
              onClick={() => setCriterio("ventas")}
              className={cn(
                "min-h-9 rounded-sm border px-2.5 py-1 font-semibold transition-colors",
                criterio === "ventas"
                  ? "border-tinta bg-tinta text-papel"
                  : "border-tinta/20 bg-transparent text-tinta hover:border-tinta/40"
              )}
            >
              Más ventas
            </button>
            <button
              type="button"
              onClick={() => setCriterio("volumen")}
              className={cn(
                "min-h-9 rounded-sm border px-2.5 py-1 font-semibold transition-colors",
                criterio === "volumen"
                  ? "border-tinta bg-tinta text-papel"
                  : "border-tinta/20 bg-transparent text-tinta hover:border-tinta/40"
              )}
            >
              {ambito === "negocio" ? "Más comisión" : "Mayor volumen"}
            </button>
          </div>
        </div>
      </div>

      {/* Descripción contextual del ámbito activo */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="text-sm leading-relaxed text-tinta/80">
          {ambito === "negocio" ? (
            <>
              Mostrando los promotores que{" "}
              <strong>
                más ventas y comisiones generaron para {nombreNegocio}
              </strong>
              .
            </>
          ) : (
            <>
              Líderes de ventas en <strong>toda la plataforma Venduo</strong>.
              Jóvenes con mayor trayectoria y compradores fieles en Bolivia.
            </>
          )}
        </p>
        <span className="text-xs font-semibold tracking-wider text-tinta/50 uppercase">
          {listaFiltrada.length}{" "}
          {listaFiltrada.length === 1 ? "promotor" : "promotores"}
        </span>
      </div>

      {/* Estado vacío si no hay datos en el filtro */}
      {listaFiltrada.length === 0 ? (
        <div className="rounded-sm border border-dashed border-tinta/20 bg-tinta/[0.02] p-8 text-center sm:p-12">
          <Trophy className="mx-auto size-10 text-tinta/30" />
          <h3 className="mt-3 font-titular text-lg font-bold">
            {busqueda
              ? "No encontramos promotores con esa búsqueda"
              : ambito === "negocio"
                ? "Aún no tienes ventas de promotores"
                : "No hay promotores registrados"}
          </h3>
          <p className="mx-auto mt-2 max-w-[45ch] text-sm text-tinta/70">
            {busqueda
              ? "Intenta con otro nombre de promotor o ciudad."
              : ambito === "negocio"
                ? "Tus productos están disponibles en el catálogo para que los jóvenes los elijan y compartan."
                : "Los promotores irán sumando ventas confirmadas."}
          </p>
          {ambito === "negocio" && !busqueda ? (
            <button
              type="button"
              onClick={() => setAmbito("global")}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-sm bg-tinta px-5 py-2 text-sm font-semibold text-papel transition-colors hover:bg-tinta/90"
            >
              <Trophy className="size-4 text-senal" />
              Ver los mejores promotores de Venduo
            </button>
          ) : busqueda ? (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              className="mt-4 text-xs font-semibold text-senal underline underline-offset-4"
            >
              Borrar filtro de búsqueda
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* PODIO TOP 3 (Tarjetas editoriales destacadas) */}
          {top3.length > 0 ? (
            <section aria-label="Podio de líderes">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {top3.map((promotor, idx) => {
                  const posicion = idx + 1
                  const esPrimero = posicion === 1
                  const esSegundo = posicion === 2

                  return (
                    <div
                      key={promotor.userId}
                      className={cn(
                        "relative flex flex-col justify-between border p-5 transition-all sm:p-6",
                        esPrimero
                          ? "border-tinta bg-tinta/[0.03] shadow-xs"
                          : "border-tinta/20 bg-papel"
                      )}
                    >
                      {/* Medalla y puesto */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "tabular flex size-8 items-center justify-center font-titular text-sm font-extrabold sm:size-9 sm:text-base",
                              esPrimero
                                ? "border-2 border-tinta bg-tinta text-papel"
                                : esSegundo
                                  ? "border-2 border-tinta/40 bg-papel text-tinta"
                                  : "border-2 border-tinta/25 bg-tinta/10 text-tinta/80"
                            )}
                          >
                            #{posicion}
                          </span>

                          <span className="text-[11px] font-bold tracking-widest text-tinta/60 uppercase">
                            {esPrimero
                              ? "Líder de ventas"
                              : esSegundo
                                ? "Segundo puesto"
                                : "Tercer puesto"}
                          </span>
                        </div>

                        {/* Distintivo de medalla */}
                        {esPrimero ? (
                          <span className="flex items-center gap-1 rounded-full bg-senal/10 px-2 py-0.5 text-[11px] font-bold text-senal">
                            <Sparkles className="size-3" />
                            Oro
                          </span>
                        ) : esSegundo ? (
                          <span className="flex items-center gap-1 rounded-full bg-tinta/10 px-2 py-0.5 text-[11px] font-bold text-tinta/80">
                            <Medal className="size-3" />
                            Plata
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full border border-tinta/20 bg-tinta/5 px-2 py-0.5 text-[11px] font-bold text-tinta/80">
                            <Award className="size-3 text-tinta/60" />
                            Bronce
                          </span>
                        )}
                      </div>

                      {/* Información del promotor con Avatar */}
                      <div className="mt-4 flex items-start gap-3.5">
                        <div className="relative size-12 shrink-0 overflow-hidden border border-tinta/25 bg-tinta/5">
                          {promotor.avatarUrl ? (
                            <Image
                              src={promotor.avatarUrl}
                              alt={promotor.nombre}
                              width={96}
                              height={96}
                              unoptimized
                              className="size-full object-cover grayscale transition-all duration-300 hover:scale-105 hover:grayscale-0"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center font-titular text-xs font-bold text-tinta/40">
                              {promotor.nombre.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-titular text-lg font-bold tracking-tight text-tinta sm:text-xl">
                            {promotor.slug ? (
                              <Link
                                href={`/v/${promotor.slug}`}
                                className="group inline-flex items-center gap-1.5 transition-colors hover:text-senal"
                                title="Ver vitrina y perfil público"
                              >
                                <span className="truncate">
                                  {promotor.nombre}
                                </span>
                                <ArrowUpRight className="size-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-100" />
                              </Link>
                            ) : (
                              promotor.nombre
                            )}
                          </h4>

                          {/* Ciudad o procedencia */}
                          {promotor.ciudad ? (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-tinta/60">
                              <MapPin className="size-3 opacity-60" />
                              {promotor.ciudad}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Estado respecto al negocio */}
                      <div className="mt-3">
                        {ambito === "global" ? (
                          promotor.promocionaMiTienda ? (
                            <span className="inline-flex items-center gap-1 rounded-sm border border-tinta/25 bg-tinta/5 px-2 py-0.5 text-[11px] font-semibold text-tinta">
                              <CheckCircle2 className="size-3 text-senal" />
                              Promociona tus productos
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-sm border border-tinta/15 px-2 py-0.5 text-[11px] font-semibold text-tinta/60">
                              Disponible para promocionar
                            </span>
                          )
                        ) : promotor.productos &&
                          promotor.productos.length > 0 ? (
                          <p className="line-clamp-1 text-xs text-tinta/70">
                            {promotor.productos.slice(0, 2).join(" · ")}
                            {promotor.productos.length > 2
                              ? ` y ${promotor.productos.length - 2} más`
                              : ""}
                          </p>
                        ) : null}
                      </div>

                      {/* Métricas clave */}
                      <div className="mt-6 border-t border-tinta/10 pt-4">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <p className="text-[11px] font-semibold tracking-wider text-tinta/50 uppercase">
                              Ventas
                            </p>
                            <p className="tabular font-titular text-2xl font-extrabold text-tinta">
                              {formatNumber(promotor.ventas)}{" "}
                              <span className="text-xs font-semibold text-tinta/60">
                                {promotor.ventas === 1 ? "pedido" : "pedidos"}
                              </span>
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[11px] font-semibold tracking-wider text-tinta/50 uppercase">
                              {ambito === "negocio"
                                ? "Comisión generada"
                                : "Volumen movido"}
                            </p>
                            <p className="tabular font-titular text-lg font-bold text-tinta">
                              {formatMoney(
                                (ambito === "negocio"
                                  ? promotor.comisionCents
                                  : promotor.volumenCents) ??
                                  promotor.volumenCents
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Detalle secundario */}
                        {ambito === "negocio" &&
                        promotor.ventasIndirectas &&
                        promotor.ventasIndirectas > 0 ? (
                          <p className="mt-2 text-[11px] text-tinta/55">
                            {formatNumber(promotor.ventasDirectas ?? 0)}{" "}
                            directas · {formatNumber(promotor.ventasIndirectas)}{" "}
                            de compradores recurrentes
                          </p>
                        ) : ambito === "global" && promotor.tiendasCount ? (
                          <p className="mt-2 text-[11px] text-tinta/55">
                            Vende en {formatNumber(promotor.tiendasCount)}{" "}
                            {promotor.tiendasCount === 1 ? "tienda" : "tiendas"}{" "}
                            de Venduo
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}

          {/* TABLA O LISTA CLASIFICADA (PUESTOS 4 EN ADELANTE) */}
          {resto.length > 0 ? (
            <section aria-label="Resto de la tabla de clasificación">
              <div className="border-t-2 border-tinta pt-2">
                <h3 className="text-xs font-bold tracking-wider text-tinta/60 uppercase">
                  Clasificación general ({top3.length + 1} al{" "}
                  {listaFiltrada.length})
                </h3>

                <div className="mt-3 divide-y divide-tinta/15 border-b border-tinta/15">
                  {resto.map((promotor, idx) => {
                    const posicion = idx + 4

                    return (
                      <div
                        key={promotor.userId}
                        className="grid grid-cols-[auto_1fr] items-center gap-4 py-4 hover:bg-tinta/[0.015] sm:grid-cols-[auto_1fr_auto] sm:gap-6"
                      >
                        {/* Posición */}
                        <span className="tabular flex size-9 items-center justify-center font-titular text-base font-bold text-tinta/70">
                          #{posicion}
                        </span>

                        {/* Avatar, Nombre y detalles */}
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative size-9 shrink-0 overflow-hidden border border-tinta/20 bg-tinta/5">
                            {promotor.avatarUrl ? (
                              <Image
                                src={promotor.avatarUrl}
                                alt={promotor.nombre}
                                width={72}
                                height={72}
                                unoptimized
                                className="size-full object-cover grayscale transition-all duration-300 hover:scale-105 hover:grayscale-0"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center font-titular text-[11px] font-bold text-tinta/40">
                                {promotor.nombre.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="font-titular text-base font-bold text-tinta">
                                {promotor.slug ? (
                                  <Link
                                    href={`/v/${promotor.slug}`}
                                    className="group inline-flex items-center gap-1 transition-colors hover:text-senal"
                                  >
                                    {promotor.nombre}
                                    <ArrowUpRight className="size-3.5 opacity-40 transition-opacity group-hover:opacity-100" />
                                  </Link>
                                ) : (
                                  promotor.nombre
                                )}
                              </span>

                              {promotor.ciudad ? (
                                <span className="inline-flex items-center gap-0.5 text-xs text-tinta/60">
                                  <MapPin className="size-3 opacity-60" />
                                  {promotor.ciudad}
                                </span>
                              ) : null}

                              {ambito === "global" &&
                              promotor.promocionaMiTienda ? (
                                <span className="py-0.2 inline-flex items-center gap-1 rounded-sm border border-tinta/20 bg-tinta/5 px-1.5 text-[10px] font-semibold text-tinta">
                                  <CheckCircle2 className="size-2.5 text-senal" />
                                  Tu tienda
                                </span>
                              ) : null}
                            </div>

                            {/* Productos en vista negocio */}
                            {ambito === "negocio" &&
                            promotor.productos &&
                            promotor.productos.length > 0 ? (
                              <p className="mt-0.5 truncate text-xs text-tinta/60">
                                {promotor.productos.join(" · ")}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {/* Cifras de ventas y volumen */}
                        <div className="col-span-2 flex items-baseline justify-between border-t border-tinta/10 pt-2 sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right">
                          <p className="tabular font-titular text-lg font-bold text-tinta">
                            {formatNumber(promotor.ventas)}{" "}
                            <span className="text-xs font-semibold text-tinta/55">
                              {promotor.ventas === 1 ? "venta" : "ventas"}
                            </span>
                          </p>
                          <p className="tabular text-xs text-tinta/60">
                            {formatMoney(
                              (ambito === "negocio"
                                ? promotor.comisionCents
                                : promotor.volumenCents) ??
                                promotor.volumenCents
                            )}{" "}
                            <span className="opacity-70">
                              {ambito === "negocio" ? "de comisión" : "movidos"}
                            </span>
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  )
}
