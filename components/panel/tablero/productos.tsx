"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Flame, Loader2, Minus, Package, PackageOpen, Plus } from "lucide-react"
import { toast } from "sonner"

import { formatNumber } from "@/lib/format"
import type { ProductoPorAcabarse, ProductoVendido } from "@/lib/tablero"
import { cn } from "@/lib/utils"
import { Seccion } from "@/components/panel/piezas"

/**
 * Lo que más se vendió en 30 días, en fotos: un producto se reconoce por su
 * foto antes que por su nombre. En el celular se deslizan de costado; en una
 * pantalla ancha van los cinco a la vista. Sin ventas no aparece: los primeros
 * pasos ya dicen qué hacer.
 */
export function MasVendidos({ productos }: { productos: ProductoVendido[] }) {
  if (productos.length === 0) return null

  return (
    <Seccion
      id="mas-vendidos"
      icono={Flame}
      titulo="Lo que más se vende"
      bajada="Tus productos con más unidades vendidas."
      className="@container"
    >
      <ol className="flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto px-4 py-4 sm:scroll-px-5 sm:px-5 @sm:grid @sm:grid-cols-5 @sm:overflow-visible">
        {productos.map((producto, indice) => {
          const tarjeta = (
            <>
              <span className="relative block aspect-square overflow-hidden border border-tinta/15 bg-tinta/[0.05]">
                {producto.foto ? (
                  <Image
                    src={producto.foto}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 110px, 40vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transform-none"
                  />
                ) : (
                  <Package
                    aria-hidden="true"
                    className="absolute inset-0 m-auto size-7 opacity-40"
                  />
                )}
                <span
                  className={cn(
                    "tabular absolute top-0 left-0 flex size-8 items-center justify-center font-titular text-base font-extrabold",
                    indice === 0 ? "bg-senal text-white" : "bg-tinta text-papel"
                  )}
                >
                  {indice + 1}
                </span>
              </span>
              <span className="mt-2 block truncate text-sm font-semibold">
                {producto.nombre}
              </span>
              <span className="tabular block text-xs opacity-70">
                {formatNumber(producto.unidades)}{" "}
                {producto.unidades === 1 ? "vendido" : "vendidos"}
              </span>
            </>
          )

          return (
            <li
              key={producto.id ?? producto.nombre}
              className="w-[40%] shrink-0 snap-start @sm:w-auto"
            >
              {producto.id ? (
                <Link
                  href={`/panel/productos/${producto.id}`}
                  className="group block"
                >
                  {tarjeta}
                </Link>
              ) : (
                // Un producto que ya no existe sigue contando como venta,
                // pero no tiene adónde llevar.
                <div>{tarjeta}</div>
              )}
            </li>
          )
        })}
      </ol>
    </Seccion>
  )
}

type Ajustar = (
  id: string,
  stock: number
) => Promise<{ ok: boolean; error?: string }>

/**
 * Lo que se quedó sin stock o está por quedarse, y se repone acá mismo: más y
 * menos al lado de cada foto, y se guarda solo cuando se deja de tocar. El que
 * queda por encima de su aviso sale de la lista. Agotado va en rojo porque
 * frena una venta; poco stock, en tinta. Con el stock bien, el panel no está.
 */
export function PorAcabarse({
  productos,
  ajustar,
  soloLectura = false,
}: {
  productos: ProductoPorAcabarse[]
  ajustar: Ajustar
  soloLectura?: boolean
}) {
  if (productos.length === 0) return null

  return (
    <Seccion
      id="por-acabarse"
      icono={PackageOpen}
      titulo="Se está acabando"
      bajada="Repón el stock aquí mismo, con más y menos."
      accion={{ href: "/panel/productos", texto: "Ver todos los productos" }}
    >
      <ul>
        {productos.map((producto) => (
          <FilaParaReponer
            key={producto.id}
            producto={producto}
            ajustar={ajustar}
            soloLectura={soloLectura}
          />
        ))}
      </ul>
    </Seccion>
  )
}

/** Cuánto se espera después del último toque antes de guardar. */
const ESPERA_MS = 700

function FilaParaReponer({
  producto,
  ajustar,
  soloLectura,
}: {
  producto: ProductoPorAcabarse
  ajustar: Ajustar
  soloLectura: boolean
}) {
  const router = useRouter()
  const [stock, setStock] = React.useState(producto.stock)
  const [guardando, setGuardando] = React.useState(false)
  const reloj = React.useRef<number | undefined>(undefined)

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

  return (
    <li className="flex min-h-[4.5rem] items-center gap-3 border-t border-tinta/15 px-4 py-2.5 first:border-t-0 sm:px-5">
      <Link
        href={`/panel/productos/${producto.id}`}
        className="group flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="relative size-12 shrink-0 overflow-hidden border border-tinta/15 bg-tinta/[0.05]">
          {producto.foto ? (
            <Image
              src={producto.foto}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <Package
              aria-hidden="true"
              className="absolute inset-0 m-auto size-5 opacity-50"
            />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold transition-colors group-hover:text-senal">
            {producto.nombre}
          </span>
          <span
            className={cn(
              "block text-xs",
              agotado ? "font-semibold text-senal" : "opacity-70"
            )}
          >
            {agotado ? "Agotado" : "Queda poco"}
          </span>
        </span>
      </Link>

      <div
        role="group"
        aria-label={`Unidades de ${producto.nombre}`}
        className="flex shrink-0 items-center border border-tinta"
      >
        <button
          type="button"
          onClick={() => cambiar(stock - 1)}
          disabled={stock === 0}
          aria-label="Una menos"
          className="flex size-11 items-center justify-center transition-colors hover:bg-tinta/[0.06] disabled:opacity-30 max-sm:w-9"
        >
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <span
          aria-live="polite"
          className={cn(
            "tabular flex w-9 items-center justify-center font-titular text-lg font-extrabold sm:w-10",
            agotado && "text-senal"
          )}
        >
          {guardando ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            formatNumber(stock)
          )}
        </span>
        <button
          type="button"
          onClick={() => cambiar(stock + 1)}
          aria-label="Una más"
          className="flex size-11 items-center justify-center transition-colors hover:bg-tinta/[0.06] max-sm:w-9"
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
    </li>
  )
}
