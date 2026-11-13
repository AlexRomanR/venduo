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
 * La cabecera de Correa: el nombre en la letra ancha y, a la derecha, el
 * catálogo y la bolsa en píldoras.
 */
export function Cabecera({ marco, enlaceDelCarrito = true }: PropsCabecera) {
  const { unidades, listo } = useCarrito()
  const enCatalogo = usePathname().endsWith("/catalogo")

  return (
    <header className="sticky top-0 z-30 bg-papel/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-2.5">
        <Link
          href={rutaDeTienda(marco.slug, "")}
          className="flex min-h-11 min-w-0 items-center"
        >
          {marco.logoUrl ? (
            <Image
              src={marco.logoUrl}
              alt={marco.nombre}
              width={160}
              height={80}
              unoptimized
              className="h-9 w-auto object-contain"
            />
          ) : (
            <span className="truncate font-titular text-[1.375rem] leading-none md:text-2xl">
              {marco.nombre}
            </span>
          )}
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={rutaDeTienda(marco.slug, "/catalogo")}
            className={cn(
              "flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors",
              enCatalogo
                ? "border-tinta bg-tinta text-papel"
                : "border-tinta/25 hover:border-tinta"
            )}
          >
            Catálogo
          </Link>
          {enlaceDelCarrito ? (
            <BotonDelCarrito
              slug={marco.slug}
              unidades={listo ? unidades : 0}
              className="rounded-full border border-tinta/25 hover:border-tinta hover:text-tinta"
            />
          ) : null}
        </div>
      </div>
    </header>
  )
}
