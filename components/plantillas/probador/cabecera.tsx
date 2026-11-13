"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { BotonDelCarrito } from "@/components/plantillas/clasica/marco"
import type { PropsCabecera } from "@/components/plantillas/kit"
import { useCarrito } from "@/components/tienda/carrito"

/**
 * La cabecera de Probador.
 *
 * Como la de una boutique: el catálogo a un lado, el nombre al centro en la
 * serif y la bolsa al otro. Pocas cosas y bien separadas, sobre el rosa.
 */
export function Cabecera({ marco, enlaceDelCarrito = true }: PropsCabecera) {
  const { unidades, listo } = useCarrito()
  const enCatalogo = usePathname().endsWith("/catalogo")

  return (
    <header className="sticky top-0 z-30 border-b border-tinta/15 bg-papel">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-5">
        <Link
          href={rutaDeTienda(marco.slug, "/catalogo")}
          className={cn(
            "-ml-1 flex min-h-11 items-center justify-self-start px-1 text-sm transition-colors hover:text-senal",
            enCatalogo && "underline decoration-tinta/40 underline-offset-[6px]"
          )}
        >
          Catálogo
        </Link>

        <Link
          href={rutaDeTienda(marco.slug, "")}
          className="flex min-h-16 max-w-[52vw] min-w-0 items-center justify-center md:max-w-md"
        >
          {marco.logoUrl ? (
            <Image
              src={marco.logoUrl}
              alt={marco.nombre}
              width={160}
              height={80}
              unoptimized
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="truncate font-titular text-[1.375rem] leading-none md:text-[1.75rem]">
              {marco.nombre}
            </span>
          )}
        </Link>

        <div className="-mr-3 justify-self-end">
          {enlaceDelCarrito ? (
            <BotonDelCarrito
              slug={marco.slug}
              unidades={listo ? unidades : 0}
            />
          ) : (
            <span className="block size-11" />
          )}
        </div>
      </div>
    </header>
  )
}
