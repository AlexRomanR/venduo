import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Package } from "lucide-react"

import { formatMoney } from "@/lib/format"
import type { ProductoMarketplace } from "@/lib/marketplace"
import { cn } from "@/lib/utils"

const CONDICIONES: Record<ProductoMarketplace["condicion"], string> = {
  nuevo: "Nuevo",
  segunda_mano: "Segunda mano",
  reacondicionado: "Reacondicionado",
}

export function TarjetaMarketplace({
  producto,
  prioridad = false,
  className,
}: {
  producto: ProductoMarketplace
  prioridad?: boolean
  className?: string
}) {
  const descuento = producto.precioAnteriorCents
    ? Math.max(
        0,
        Math.round(
          ((producto.precioAnteriorCents - producto.precioCents) * 100) /
            producto.precioAnteriorCents
        )
      )
    : 0

  return (
    <article className={cn("group min-w-0", className)}>
      <Link
        href={`/producto/${producto.id}`}
        className="block focus:outline-none"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-tinta/[0.06] ring-offset-4 ring-offset-papel group-focus-within:ring-2 group-focus-within:ring-senal">
          {producto.imagenUrl ? (
            <Image
              src={producto.imagenUrl}
              alt={producto.nombre}
              fill
              priority={prioridad}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 40vw, (max-width: 1280px) 30vw, 280px"
              className="object-cover grayscale transition-[filter,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025] group-hover:grayscale-0 motion-reduce:transform-none"
            />
          ) : (
            <span className="flex size-full items-center justify-center">
              <Package aria-hidden="true" className="size-7 opacity-20" />
            </span>
          )}

          <div className="absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
            {producto.destacado ? (
              <span className="bg-tinta px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-papel uppercase">
                Destacado
              </span>
            ) : null}
            {producto.condicion !== "nuevo" ? (
              <span className="bg-papel px-2 py-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
                {CONDICIONES[producto.condicion]}
              </span>
            ) : null}
          </div>

          {descuento > 0 ? (
            <span className="tabular absolute right-3 bottom-3 bg-senal px-2 py-1 text-xs font-bold text-white">
              −{descuento}%
            </span>
          ) : null}
        </div>

        <div className="border-b border-tinta/15 pt-3 pb-5">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-[11px] font-semibold tracking-[0.1em] text-senal uppercase">
              {producto.negocio.nombre}
            </p>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
          <h2 className="mt-1 line-clamp-2 min-h-[2.75rem] font-titular text-base leading-snug font-bold tracking-[-0.02em] sm:text-lg">
            {producto.nombre}
          </h2>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="tabular font-titular text-xl font-extrabold tracking-[-0.03em]">
              {formatMoney(producto.precioCents)}
            </p>
            {producto.precioAnteriorCents ? (
              <p className="tabular text-xs line-through opacity-45">
                {formatMoney(producto.precioAnteriorCents)}
              </p>
            ) : null}
          </div>
          <p className="mt-1.5 truncate text-xs opacity-50">
            {producto.categoria ?? "Otros"} · {CONDICIONES[producto.condicion]}
          </p>
        </div>
      </Link>
    </article>
  )
}
