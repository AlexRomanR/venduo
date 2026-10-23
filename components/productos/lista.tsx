"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Minus, Package, Plus, Star } from "lucide-react"
import { toast } from "sonner"

import { formatMoney, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { cuantasVariantes, leerOpciones } from "@/lib/variantes"
import type { Product } from "@/types"

type Ajustar = (
  id: string,
  stock: number
) => Promise<{ ok: boolean; error?: string }>

/** Cuánto se espera después del último toque antes de guardar. */
const ESPERA_MS = 700

/**
 * El catálogo, una fila por producto: la misma de la app.
 *
 * No es una tabla: a 375 px una tabla de ocho columnas obliga a desplazar en
 * horizontal, y este panel se usa desde el celular.
 */
export function ListaProductos({
  productos,
  ajustarStock,
  soloLectura = false,
  vistas = null,
}: {
  productos: Product[]
  ajustarStock: Ajustar
  /** En modo demo se ve todo pero no se guarda nada. */
  soloLectura?: boolean
  /** Las vistas de 30 días por producto, si Venduo le activó las visitas. */
  vistas?: Record<string, number> | null
}) {
  // Con lugar, cada fila va en una línea: el stock al lado del nombre y no
  // abajo a la derecha, lejos de lo que cuenta.
  return (
    <ul className="@container">
      {productos.map((producto) => (
        <FilaDeProducto
          key={producto.id}
          producto={producto}
          ajustar={ajustarStock}
          soloLectura={soloLectura}
          vistas={vistas ? (vistas[producto.id] ?? 0) : null}
        />
      ))}
    </ul>
  )
}

/**
 * Un producto en la lista: su foto grande, cuánto vale y cuánto queda.
 *
 * Lo que dice cómo está —agotado, oculto, destacado— va sobre la foto, no en
 * una línea de texto aparte. El stock se cambia con más y menos donde se mira:
 * contar unidades es lo que más veces por semana hace quien vende, y abrir un
 * formulario para cambiar un número es lo que hace que deje de hacerlo. Se
 * guarda un momento después del último toque, no con cada uno.
 */
function FilaDeProducto({
  producto,
  ajustar,
  soloLectura,
  vistas,
}: {
  producto: Product
  ajustar: Ajustar
  soloLectura: boolean
  vistas: number | null
}) {
  const router = useRouter()
  const [stock, setStock] = React.useState(producto.stock)
  const [guardando, setGuardando] = React.useState(false)
  const reloj = React.useRef<number | undefined>(undefined)

  React.useEffect(() => setStock(producto.stock), [producto.stock])
  React.useEffect(() => () => window.clearTimeout(reloj.current), [])

  function cambiar(nuevo: number) {
    if (soloLectura) {
      toast.info("Estás en modo demo: los cambios no se guardan.")
      return
    }
    const valor = Math.max(0, Math.min(999_999, nuevo))
    setStock(valor)
    window.clearTimeout(reloj.current)
    reloj.current = window.setTimeout(async () => {
      setGuardando(true)
      const resultado = await ajustar(producto.id, valor)
      setGuardando(false)
      if (!resultado.ok) {
        setStock(producto.stock)
        toast.error(resultado.error ?? "No pudimos guardar el stock.")
        return
      }
      router.refresh()
    }, ESPERA_MS)
  }

  const agotado = stock === 0
  const pocos = stock > 0 && stock <= producto.low_stock_threshold
  const oculto = !producto.is_active || Boolean(producto.moderated_at)
  const marca = producto.moderated_at
    ? { texto: "Oculto por Venduo", rojo: true }
    : !producto.is_active
      ? { texto: "Oculto", rojo: false }
      : agotado
        ? { texto: "Agotado", rojo: true }
        : pocos
          ? { texto: "Queda poco", rojo: false }
          : null
  const href = `/panel/productos/${producto.id}`
  const variantes = cuantasVariantes(leerOpciones(producto.opciones))

  return (
    <li className="flex gap-3 border-t border-tinta/15 py-3 pr-3 pl-4 first:border-t-0 sm:pr-4 sm:pl-5 @2xl:items-center @2xl:gap-4">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className={cn(
          "relative block size-[76px] shrink-0 overflow-hidden border border-tinta/15 bg-tinta/[0.05] transition-opacity active:opacity-70",
          oculto && "opacity-45"
        )}
      >
        {producto.image_url ? (
          <Image
            src={producto.image_url}
            alt=""
            fill
            sizes="76px"
            className="object-cover"
          />
        ) : (
          <Package className="absolute inset-0 m-auto size-5 opacity-35" />
        )}
        {producto.is_featured ? (
          <span className="absolute top-1 right-1 flex size-[22px] items-center justify-center rounded-full bg-tinta text-papel">
            <Star className="size-3 fill-current" strokeWidth={2} />
          </span>
        ) : null}
        {marca ? (
          <span
            className={cn(
              "absolute inset-x-0 bottom-0 truncate px-1 py-0.5 text-center text-[11px] leading-[14px] font-semibold text-papel",
              marca.rojo ? "bg-senal" : "bg-tinta"
            )}
          >
            {marca.texto}
          </span>
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 @2xl:flex-row @2xl:items-center @2xl:gap-6">
        <Link
          href={href}
          className="group flex min-w-0 flex-col gap-0.5 @2xl:flex-1"
        >
          <span className="line-clamp-2 font-titular text-base leading-5 font-bold tracking-[-0.01em] transition-colors group-hover:text-senal">
            {producto.name}
            {marca ? <span className="sr-only">, {marca.texto}</span> : null}
          </span>
          <span className="flex items-baseline gap-2">
            <span className="tabular font-semibold">
              {formatMoney(producto.price_cents)}
            </span>
            {producto.compare_at_price_cents ? (
              <span className="tabular text-sm line-through opacity-65">
                {formatMoney(producto.compare_at_price_cents)}
              </span>
            ) : null}
            {vistas !== null ? (
              <span className="tabular min-w-0 flex-1 truncate text-right text-sm opacity-70">
                {formatNumber(vistas)} {vistas === 1 ? "vista" : "vistas"}
              </span>
            ) : null}
          </span>
        </Link>

        {variantes > 0 ? (
          // Con opciones no se sabe de cuál sumar: el stock se cambia en el
          // producto, en cada una.
          <Link
            href={`${href}#variantes`}
            className="flex min-h-10 items-center gap-1.5 self-end border border-tinta px-3 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel @2xl:self-auto"
          >
            <span
              className={cn(
                "tabular font-titular text-base font-bold",
                agotado && "text-senal"
              )}
            >
              {formatNumber(stock)}
            </span>
            en {variantes} opciones
          </Link>
        ) : (
          <div
            role="group"
            aria-label={`Unidades de ${producto.name}`}
            className="flex items-center self-end @2xl:self-auto"
          >
            <Paso
              etiqueta="Una unidad menos"
              apagado={stock === 0}
              alTocar={() => cambiar(stock - 1)}
            >
              <Minus aria-hidden="true" className="size-5" />
            </Paso>
            <span
              aria-live="polite"
              className={cn(
                "tabular flex h-10 min-w-12 items-center justify-center border-y border-tinta px-1 font-titular text-base font-bold",
                agotado && "text-senal"
              )}
            >
              {guardando ? (
                <span className="opacity-40">{formatNumber(stock)}</span>
              ) : (
                formatNumber(stock)
              )}
            </span>
            <Paso etiqueta="Una unidad más" alTocar={() => cambiar(stock + 1)}>
              <Plus aria-hidden="true" className="size-5" />
            </Paso>
          </div>
        )}
      </div>
    </li>
  )
}

function Paso({
  etiqueta,
  apagado = false,
  alTocar,
  children,
}: {
  etiqueta: string
  apagado?: boolean
  alTocar: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={alTocar}
      disabled={apagado}
      aria-label={etiqueta}
      className="flex h-10 w-11 items-center justify-center border border-tinta transition-colors hover:bg-tinta/[0.06] active:bg-tinta active:text-papel disabled:opacity-30"
    >
      {children}
    </button>
  )
}
