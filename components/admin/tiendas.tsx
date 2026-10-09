"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, Search, Store } from "lucide-react"

import { FICHA, FICHA_ELEGIDA, FICHA_LIBRE } from "@/lib/estilos"
import { formatMoney, formatNumber, formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Insignia, SinDatos } from "@/components/panel/piezas"

export interface FilaDeTienda {
  id: string
  nombre: string
  slug: string
  dueno: string
  plantilla: string
  creada: string
  publicada: boolean
  pausada: boolean
  suscripcion: string
  prueba_hasta: string
  productos: number
  pedidos_30d: number
  ventas_30d_cents: number
  visitas_7d: number
  visitas_30d: number
  ultima_actividad: string
}

const FILTROS = {
  todas: "Todas",
  trabadas: "Trabadas",
  sin_publicar: "Sin publicar",
  prueba: "En prueba",
  bloqueadas: "Bloqueadas",
  pausadas: "Pausadas",
} as const
type Filtro = keyof typeof FILTROS

const ORDENES = {
  recientes: "Más recientes",
  ventas: "Más ventas",
  visitas: "Más visitas",
  actividad: "Última actividad",
} as const
type Orden = keyof typeof ORDENES

const TRES_DIAS = 3 * 86_400_000

/**
 * Una tienda que no avanza: lleva más de tres días y todavía no tiene
 * productos, o no está publicada. Son las que conviene llamar.
 */
export function estaTrabada(t: FilaDeTienda, ahora: number): boolean {
  const vieja = ahora - Date.parse(t.creada) > TRES_DIAS
  return vieja && (t.productos === 0 || !t.publicada)
}

export function TablaDeTiendas({
  tiendas,
  ahora,
}: {
  tiendas: FilaDeTienda[]
  ahora: number
}) {
  const [busqueda, setBusqueda] = React.useState("")
  const [filtro, setFiltro] = React.useState<Filtro>("todas")
  const [orden, setOrden] = React.useState<Orden>("recientes")

  const cuenta: Record<Filtro, number> = React.useMemo(
    () => ({
      todas: tiendas.length,
      trabadas: tiendas.filter((t) => estaTrabada(t, ahora)).length,
      sin_publicar: tiendas.filter((t) => !t.publicada).length,
      prueba: tiendas.filter((t) => t.suscripcion === "prueba").length,
      bloqueadas: tiendas.filter((t) => t.suscripcion === "bloqueada").length,
      pausadas: tiendas.filter((t) => t.pausada).length,
    }),
    [tiendas, ahora]
  )

  const lista = React.useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    const filtradas = tiendas.filter((t) => {
      if (
        texto &&
        !`${t.nombre} ${t.slug} ${t.dueno}`.toLowerCase().includes(texto)
      ) {
        return false
      }
      switch (filtro) {
        case "trabadas":
          return estaTrabada(t, ahora)
        case "sin_publicar":
          return !t.publicada
        case "prueba":
          return t.suscripcion === "prueba"
        case "bloqueadas":
          return t.suscripcion === "bloqueada"
        case "pausadas":
          return t.pausada
        default:
          return true
      }
    })
    const valor = (t: FilaDeTienda) =>
      orden === "ventas"
        ? t.ventas_30d_cents
        : orden === "visitas"
          ? t.visitas_30d
          : orden === "actividad"
            ? Date.parse(t.ultima_actividad)
            : Date.parse(t.creada)
    return [...filtradas].sort((a, b) => valor(b) - valor(a))
  }, [tiendas, busqueda, filtro, orden, ahora])

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-tinta/15 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Buscar una tienda</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-0 size-4 -translate-y-1/2 opacity-55"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Nombre, enlace o correo del dueño"
              className="h-11 w-full border-b border-tinta bg-transparent pl-7 text-base outline-none placeholder:text-tinta/40 focus-visible:border-senal"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="opacity-70">Ordenar</span>
            <select
              value={orden}
              onChange={(evento) => setOrden(evento.target.value as Orden)}
              className="h-11 border-b border-tinta bg-transparent pr-2 font-semibold outline-none focus-visible:border-senal"
            >
              {Object.entries(ORDENES).map(([clave, nombre]) => (
                <option key={clave} value={clave}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filtrar"
        >
          {(Object.keys(FILTROS) as Filtro[]).map((clave) => (
            <button
              key={clave}
              type="button"
              aria-pressed={filtro === clave}
              onClick={() => setFiltro(clave)}
              className={cn(
                FICHA,
                filtro === clave ? FICHA_ELEGIDA : FICHA_LIBRE
              )}
            >
              {FILTROS[clave]}
              <span className="tabular ml-1.5 opacity-65">{cuenta[clave]}</span>
            </button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <SinDatos
          icono={Store}
          titulo={
            tiendas.length === 0 ? "Todavía no hay tiendas" : "Ninguna coincide"
          }
          texto={
            tiendas.length === 0
              ? "Cuando alguien termine su alta, va a aparecer acá."
              : "Prueba con otro filtro o con otra búsqueda."
          }
        />
      ) : (
        <ul>
          {/* En escritorio, los rótulos de las columnas; en el celular cada
              cifra lleva el suyo al lado. */}
          <li
            aria-hidden="true"
            className="hidden gap-x-6 px-4 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase opacity-65 sm:px-5 lg:grid lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,0.7fr))_1rem]"
          >
            <span>Tienda</span>
            <span>Ventas, 30 días</span>
            <span>Visitas, 30 días</span>
            <span>Productos</span>
            <span />
          </li>
          {lista.map((t) => (
            <li
              key={t.id}
              className="border-t border-tinta/15 max-lg:[&:nth-child(2)]:border-t-0"
            >
              <Link
                href={`/admin/tiendas/${t.id}`}
                className="group grid gap-x-6 gap-y-2 px-4 py-4 transition-colors hover:bg-tinta/[0.03] sm:px-5 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,0.7fr))_1rem] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold">{t.nombre}</span>
                    <Estados tienda={t} ahora={ahora} />
                  </p>
                  <p className="mt-0.5 truncate text-sm opacity-70">
                    {t.dueno} · {t.plantilla}
                  </p>
                </div>
                <Dato
                  etiqueta="Ventas 30 d"
                  valor={formatMoney(t.ventas_30d_cents)}
                  detalle={`${formatNumber(t.pedidos_30d)} pedidos`}
                />
                <Dato
                  etiqueta="Visitas 30 d"
                  valor={formatNumber(t.visitas_30d)}
                  detalle={`${formatNumber(t.visitas_7d)} en 7 días`}
                />
                <Dato
                  etiqueta="Productos"
                  valor={formatNumber(t.productos)}
                  detalle={`Activa ${formatRelative(t.ultima_actividad, new Date(ahora))}`}
                />
                <ChevronRight
                  aria-hidden="true"
                  className="hidden size-4 opacity-40 transition-transform group-hover:translate-x-0.5 lg:block"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Dato({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string
  valor: string
  detalle: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm lg:block">
      <span className="text-xs opacity-65 lg:hidden">{etiqueta}</span>
      <span className="text-right lg:text-left">
        <span className="tabular block font-semibold">{valor}</span>
        <span className="block text-xs opacity-65">{detalle}</span>
      </span>
    </div>
  )
}

function Estados({ tienda, ahora }: { tienda: FilaDeTienda; ahora: number }) {
  return (
    <>
      {tienda.pausada ? <Insignia tono="senal">Pausada</Insignia> : null}
      {tienda.suscripcion === "bloqueada" ? (
        <Insignia tono="senal">Bloqueada</Insignia>
      ) : tienda.suscripcion === "prueba" ? (
        <Insignia tono="suave">Prueba</Insignia>
      ) : null}
      {!tienda.publicada ? (
        <Insignia tono="anulada">Sin publicar</Insignia>
      ) : null}
      {estaTrabada(tienda, ahora) ? (
        <Insignia tono="tinta">Trabada</Insignia>
      ) : null}
    </>
  )
}
