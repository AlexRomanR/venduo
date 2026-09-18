import Image from "next/image"
import { Package } from "lucide-react"

import type { ProductoVitrina } from "@/lib/demo-data"
import { formatMoney, formatNumber } from "@/lib/format"
import { mensajeParaCompartir } from "@/lib/promotor"
import { urlDeProducto } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { TomarProducto } from "@/components/promotor/acciones"
import { CompartirEnlace } from "@/components/promotor/compartir"

/**
 * La foto de un producto, o su lugar.
 *
 * Un negocio que cargó desde Excel todavía no tiene fotos, y es el estado
 * normal de la demostración: el marcador tiene que verse intencional, no roto.
 */
export function FotoProducto({
  src,
  alt,
  sizes,
  className,
}: {
  src: string | null
  alt: string
  sizes: string
  className?: string
}) {
  return (
    <div className={cn("relative overflow-hidden bg-tinta/[0.06]", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] motion-reduce:transform-none"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Package aria-hidden="true" className="size-6 opacity-25" />
        </div>
      )}
    </div>
  )
}

const CONDICION: Record<string, string> = {
  segunda_mano: "Segunda mano",
  reacondicionado: "Reacondicionado",
}

/**
 * Un producto del catálogo, visto por quien lo va a promocionar.
 *
 * La cifra grande es lo que gana, no el precio: es lo que decide si lo toma.
 * El precio va debajo porque es lo que va a tener que defender en un chat.
 */
export function TarjetaProducto({
  producto,
  indice = 0,
}: {
  producto: ProductoVitrina
  /** Para escalonar la entrada de la grilla. */
  indice?: number
}) {
  const url = producto.codigo
    ? urlDeProducto(producto.storeSlug, producto.id, producto.codigo)
    : null

  return (
    <article
      style={{ animationDelay: `${Math.min(indice, 8) * 60}ms` }}
      className="group flex animate-in flex-col duration-700 fill-mode-both fade-in slide-in-from-bottom-3 motion-reduce:animate-none"
    >
      <FotoProducto
        src={producto.imageUrl}
        alt={producto.name}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
        className="aspect-[4/3] w-full"
      />

      <div className="flex flex-1 flex-col border-b border-tinta/15 pt-4 pb-5">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
          {producto.storeName}
          {CONDICION[producto.condition] ? (
            <span className="text-senal">
              {" "}
              · {CONDICION[producto.condition]}
            </span>
          ) : null}
        </p>
        <h3 className="mt-1.5 line-clamp-2 font-titular text-lg leading-snug font-bold tracking-[-0.02em]">
          {producto.name}
        </h3>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.12em] uppercase opacity-55">
              Ganas por venta
            </p>
            <p className="tabular mt-1 font-titular text-[1.75rem] leading-none font-extrabold tracking-[-0.04em] text-senal">
              {formatMoney(producto.gananciaCents)}
            </p>
          </div>
          <div className="text-right">
            <p className="tabular text-sm font-semibold">
              {formatMoney(producto.priceCents)}
            </p>
            <p className="tabular text-xs opacity-55">
              {formatNumber(producto.stock)} en stock
            </p>
          </div>
        </div>

        <div className="mt-auto pt-5">
          {url ? (
            <div>
              <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                Ya lo promocionas
              </p>
              <CompartirEnlace
                url={url}
                producto={producto.name}
                mensaje={mensajeParaCompartir(
                  producto.name,
                  producto.storeName,
                  formatMoney(producto.priceCents),
                  url
                )}
                compacto
              />
            </div>
          ) : (
            <TomarProducto productoId={producto.id} nombre={producto.name} />
          )}
        </div>
      </div>
    </article>
  )
}
