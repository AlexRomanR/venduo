"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CircleAlert,
  Loader2,
  Minus,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  BOTON_PRIMARIO,
  FICHA,
  FICHA_ELEGIDA,
  FICHA_LIBRE,
} from "@/lib/estilos"
import { CURRENCY_SYMBOL, formatMoney, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { VentaInput } from "@/lib/validation/venta"
import { useFestejo } from "@/components/panel/festejo"
import { Seccion, SinDatos } from "@/components/panel/piezas"
import type { ResultadoDeVenta } from "@/app/(privado)/panel/pedidos/acciones"

/** Lo que hace falta de un producto para venderlo. */
export interface ProductoParaVender {
  id: string
  nombre: string
  foto: string | null
  precioCents: number
  stock: number
  categoria: string | null
}

interface Linea {
  productoId: string
  cantidad: number
  /** Lo que se escribe en el campo, en bolivianos: puede quedar vacío un momento. */
  precio: string
}

const FRANJA =
  "flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

/**
 * Registrar una venta directa: lo que se vendió en el chat o en persona.
 *
 * Se tocan los productos —una foto por producto, como en el resto del panel—
 * y abajo se arma la venta: unidades con más y menos, y el precio al que se
 * vendió, por si hubo una rebaja. Queda pagada y el stock baja en el acto.
 * Si el stock dice que no hay, se avisa en la línea antes de registrar: el
 * servidor la rechazaría, y es justo lo que hay que corregir.
 */
export function NuevaVenta({
  productos,
  registrar,
  soloLectura,
}: {
  productos: ProductoParaVender[]
  registrar: (venta: VentaInput) => Promise<ResultadoDeVenta>
  soloLectura: boolean
}) {
  const router = useRouter()
  const { festejo, festejar } = useFestejo()
  const [lineas, setLineas] = React.useState<Linea[]>([])
  const [registrando, setRegistrando] = React.useState(false)

  const porId = React.useMemo(
    () => new Map(productos.map((p) => [p.id, p])),
    [productos]
  )

  function sumar(producto: ProductoParaVender) {
    setLineas((antes) => {
      const ya = antes.find((l) => l.productoId === producto.id)
      if (ya) {
        return antes.map((l) =>
          l.productoId === producto.id
            ? { ...l, cantidad: Math.min(l.cantidad + 1, 999) }
            : l
        )
      }
      return [
        ...antes,
        {
          productoId: producto.id,
          cantidad: 1,
          precio: String(producto.precioCents / 100),
        },
      ]
    })
  }

  function cambiar(productoId: string, cambio: Partial<Linea>) {
    setLineas((antes) =>
      antes.map((l) => (l.productoId === productoId ? { ...l, ...cambio } : l))
    )
  }

  function quitar(productoId: string) {
    setLineas((antes) => antes.filter((l) => l.productoId !== productoId))
  }

  const totalCents = lineas.reduce(
    (total, l) =>
      total + Math.round((Number(l.precio) || 0) * 100) * l.cantidad,
    0
  )
  const unidades = lineas.reduce((total, l) => total + l.cantidad, 0)
  const faltaStock = lineas.some(
    (l) => l.cantidad > (porId.get(l.productoId)?.stock ?? 0)
  )
  const faltaPrecio = lineas.some(
    (l) => l.precio.trim() === "" || Number.isNaN(Number(l.precio))
  )
  const lista = lineas.length > 0 && !faltaStock && !faltaPrecio

  async function enviar() {
    if (!lista || registrando) return
    if (soloLectura) {
      toast.info("Es una tienda de ejemplo: la venta no se guarda.")
      return
    }
    setRegistrando(true)
    const resultado = await registrar({
      lineas: lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad,
        precio: Number(l.precio),
      })),
    }).catch((): ResultadoDeVenta => ({
      ok: false,
      error: "No pudimos registrar la venta. Revisa tu conexión.",
    }))
    setRegistrando(false)

    if (!resultado.ok) {
      toast.error(resultado.error)
      return
    }

    festejar()
    toast.success(
      `Venta #${resultado.numero} registrada: ${formatMoney(resultado.totalCents)}. Ya se descontó del stock.`,
      {
        action: {
          label: "Ver",
          onClick: () => router.push(`/panel/pedidos/${resultado.id}`),
        },
      }
    )
    setLineas([])
    // El stock de cada producto cambió: la grilla lo vuelve a leer.
    router.refresh()
  }

  if (productos.length === 0) {
    return (
      <Seccion
        id="productos"
        icono={ShoppingBag}
        titulo="Qué vendiste"
        bajada="Toca un producto para sumarlo."
      >
        <SinDatos
          icono={Package}
          titulo="Todavía no tienes productos"
          texto="Carga los que vendes y vuelve: cada venta descuenta de su stock."
        >
          <Link
            href="/panel/productos/nuevo"
            className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
          >
            <Plus aria-hidden="true" className="size-4" />
            Nuevo producto
          </Link>
        </SinDatos>
      </Seccion>
    )
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 max-lg:pb-28 md:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      {festejo}

      <ElegirProductos
        productos={productos}
        enLaVenta={new Map(lineas.map((l) => [l.productoId, l.cantidad]))}
        alTocar={sumar}
      />

      <Seccion
        id="venta"
        icono={Receipt}
        titulo="La venta"
        bajada="Cambia el precio si hiciste una rebaja."
        className="lg:sticky lg:top-6"
      >
        {lineas.length === 0 ? (
          <p className="px-4 py-6 text-sm opacity-70 sm:px-5">
            Todavía no sumaste nada. Toca los productos que vendiste.
          </p>
        ) : (
          <ul>
            {lineas.map((linea) => {
              const producto = porId.get(linea.productoId)
              if (!producto) return null
              return (
                <LineaDeVenta
                  key={linea.productoId}
                  linea={linea}
                  producto={producto}
                  alCambiar={(cambio) => cambiar(linea.productoId, cambio)}
                  alQuitar={() => quitar(linea.productoId)}
                />
              )
            })}
          </ul>
        )}

        {/* En el celular, el total y el botón van fijos arriba de las
            pestañas: es lo que se vino a hacer. En una pantalla ancha, al pie
            de la venta. */}
        <div
          className={cn(
            "fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-3 border-t border-tinta bg-papel px-4 py-3 lg:static lg:flex lg:border-tinta/15 lg:px-5 lg:py-4",
            // Sin nada en la venta no hay qué registrar: no tapa la grilla.
            lineas.length === 0 && "max-lg:hidden"
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
              Total
              {unidades > 0
                ? ` · ${formatNumber(unidades)} ${unidades === 1 ? "unidad" : "unidades"}`
                : ""}
            </p>
            <p className="tabular font-titular text-2xl leading-tight font-extrabold tracking-[-0.03em]">
              {formatMoney(totalCents)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void enviar()}
            disabled={!lista || registrando}
            className={cn(BOTON_PRIMARIO, "min-h-12 shrink-0 px-5")}
          >
            {registrando ? (
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            ) : null}
            Registrar venta
          </button>
        </div>
      </Seccion>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Elegir los productos
 * ------------------------------------------------------------------------ */

function ElegirProductos({
  productos,
  enLaVenta,
  alTocar,
}: {
  productos: ProductoParaVender[]
  enLaVenta: Map<string, number>
  alTocar: (producto: ProductoParaVender) => void
}) {
  const [buscar, setBuscar] = React.useState("")
  const [categoria, setCategoria] = React.useState<string | null>(null)

  const categorias = [
    ...new Set(productos.map((p) => p.categoria).filter(Boolean)),
  ] as string[]
  const texto = buscar.trim().toLowerCase()
  const visibles = productos.filter(
    (p) =>
      (!categoria || p.categoria === categoria) &&
      (!texto || p.nombre.toLowerCase().includes(texto))
  )

  return (
    <Seccion
      id="productos"
      icono={ShoppingBag}
      titulo="Qué vendiste"
      bajada="Toca un producto para sumarlo."
    >
      <div className="flex flex-col gap-3 border-b border-tinta/15 px-4 py-4 sm:px-5">
        <label className="flex min-h-12 items-center gap-3 border border-tinta px-3">
          <Search aria-hidden="true" className="size-5 shrink-0 opacity-60" />
          <span className="sr-only">Buscar un producto</span>
          <input
            type="search"
            value={buscar}
            onChange={(evento) => setBuscar(evento.target.value)}
            placeholder="Buscar"
            className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-tinta/45 [&::-webkit-search-cancel-button]:hidden"
          />
        </label>
        {categorias.length > 1 ? (
          <div
            role="group"
            aria-label="Filtrar por categoría"
            className={cn(FRANJA, "-mx-4 px-4 sm:-mx-5 sm:px-5")}
          >
            {[null, ...categorias].map((valor) => (
              <button
                key={valor ?? "todas"}
                type="button"
                aria-pressed={categoria === valor}
                onClick={() => setCategoria(valor)}
                className={cn(
                  FICHA,
                  "shrink-0 whitespace-nowrap",
                  categoria === valor ? FICHA_ELEGIDA : FICHA_LIBRE
                )}
              >
                {valor ?? "Todas"}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {visibles.length === 0 ? (
        <p className="px-4 py-6 text-sm opacity-70 sm:px-5">
          Nada coincide con esa búsqueda. Prueba con otra palabra.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4 sm:p-5 lg:grid-cols-4 xl:grid-cols-5">
          {visibles.map((p) => {
            const cantidad = enLaVenta.get(p.id) ?? 0
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => alTocar(p)}
                  aria-label={`Sumar ${p.nombre}, ${formatMoney(p.precioCents)}${cantidad ? `. Ya van ${cantidad}` : ""}`}
                  className="group flex w-full flex-col gap-1 text-left"
                >
                  <span
                    className={cn(
                      "relative flex aspect-square w-full items-center justify-center overflow-hidden border bg-tinta/[0.05] transition-colors",
                      cantidad > 0
                        ? "border-2 border-tinta"
                        : "border-tinta/15 group-hover:border-tinta"
                    )}
                  >
                    {p.foto ? (
                      <Image
                        src={p.foto}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 12vw, 33vw"
                        className={cn(
                          "object-cover transition-transform duration-300 group-active:scale-[0.97] motion-reduce:transform-none",
                          p.stock === 0 && "opacity-45"
                        )}
                      />
                    ) : (
                      <Package
                        aria-hidden="true"
                        className="size-6 opacity-35"
                      />
                    )}
                    {cantidad > 0 ? (
                      <span className="tabular absolute top-1.5 right-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-tinta px-1.5 text-xs font-bold text-papel">
                        {cantidad}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate text-sm">{p.nombre}</span>
                  <span className="tabular -mt-1 text-sm font-semibold">
                    {formatMoney(p.precioCents)}
                  </span>
                  <span
                    className={cn(
                      "tabular -mt-1 truncate text-xs",
                      p.stock === 0 ? "font-semibold text-senal" : "opacity-65"
                    )}
                  >
                    {p.stock === 0
                      ? "Sin stock"
                      : `Quedan ${formatNumber(p.stock)}`}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Seccion>
  )
}

/* ---------------------------------------------------------------------------
 * Una línea de la venta
 * ------------------------------------------------------------------------ */

function LineaDeVenta({
  linea,
  producto,
  alCambiar,
  alQuitar,
}: {
  linea: Linea
  producto: ProductoParaVender
  alCambiar: (cambio: Partial<Linea>) => void
  alQuitar: () => void
}) {
  const precioCents = Math.round((Number(linea.precio) || 0) * 100)
  const rebaja =
    precioCents < producto.precioCents && linea.precio.trim() !== ""
  const sinStock = linea.cantidad > producto.stock
  const idPrecio = `precio-${producto.id}`

  return (
    <li className="flex flex-col gap-3 border-t border-tinta/15 px-4 py-4 first:border-t-0 sm:px-5">
      <div className="flex items-center gap-3">
        <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden border border-tinta/15 bg-tinta/[0.05]">
          {producto.foto ? (
            <Image
              src={producto.foto}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <Package aria-hidden="true" className="size-4 opacity-35" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 leading-snug font-semibold">
            {producto.nombre}
          </span>
          <span className="tabular block text-sm opacity-65">
            {formatMoney(precioCents * linea.cantidad)}
          </span>
        </span>
        <button
          type="button"
          onClick={alQuitar}
          aria-label={`Quitar ${producto.nombre} de la venta`}
          className="flex size-11 shrink-0 items-center justify-center transition-colors hover:bg-tinta/[0.06]"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
            Unidades
          </span>
          <div className="flex h-11 items-stretch border border-tinta">
            <button
              type="button"
              onClick={() =>
                linea.cantidad > 1
                  ? alCambiar({ cantidad: linea.cantidad - 1 })
                  : alQuitar()
              }
              aria-label="Una menos"
              className="flex w-11 items-center justify-center transition-colors hover:bg-tinta hover:text-papel"
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>
            <span
              aria-live="polite"
              className="tabular flex min-w-10 items-center justify-center border-x border-tinta text-base font-semibold"
            >
              {linea.cantidad}
            </span>
            <button
              type="button"
              onClick={() =>
                alCambiar({ cantidad: Math.min(linea.cantidad + 1, 999) })
              }
              aria-label="Una más"
              className="flex w-11 items-center justify-center transition-colors hover:bg-tinta hover:text-papel"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>

        <label
          htmlFor={idPrecio}
          className="flex min-w-0 flex-1 flex-col gap-1"
        >
          <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
            Precio en {CURRENCY_SYMBOL}
          </span>
          <input
            id={idPrecio}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={linea.precio}
            onChange={(evento) => alCambiar({ precio: evento.target.value })}
            className="tabular h-11 w-full min-w-0 border-b-2 border-tinta bg-transparent text-base font-semibold outline-none focus-visible:border-senal"
          />
        </label>
      </div>

      {rebaja ? (
        <p className="text-sm opacity-70">
          Rebaja de {formatMoney(producto.precioCents - precioCents)} por
          unidad.
        </p>
      ) : null}

      {sinStock ? (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm font-semibold text-senal"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            {producto.stock === 0
              ? "Tu stock dice que no te queda."
              : `Tu stock dice que te quedan ${formatNumber(producto.stock)}.`}{" "}
            <Link
              href={`/panel/productos/${producto.id}`}
              className="underline underline-offset-4"
            >
              Corregir el stock
            </Link>
          </span>
        </p>
      ) : null}
    </li>
  )
}
