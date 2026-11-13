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
 * La cabecera de Taco: el nombre en minúsculas a la izquierda, el catálogo y
 * la bolsa a la derecha, y una regla fina abajo. Lo mínimo.
 */
export function Cabecera({ marco, enlaceDelCarrito = true }: PropsCabecera) {
  const { unidades, listo } = useCarrito()
  const enCatalogo = usePathname().endsWith("/catalogo")

  return (
    <header className="sticky top-0 z-30 border-b border-tinta/15 bg-papel">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5">
        <Link
          href={rutaDeTienda(marco.slug, "")}
          className="flex min-h-16 min-w-0 items-center"
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
            <span className="truncate font-titular text-xl leading-none lowercase md:text-2xl">
              {marco.nombre}
            </span>
          )}
        </Link>

        <div className="-mr-3 flex items-center">
          <Link
            href={rutaDeTienda(marco.slug, "/catalogo")}
            className={cn(
              "flex min-h-11 items-center px-3 text-sm lowercase transition-colors hover:text-senal",
              enCatalogo && "underline decoration-tinta underline-offset-[6px]"
            )}
          >
            catálogo
          </Link>
          {enlaceDelCarrito ? (
            <BotonDelCarrito
              slug={marco.slug}
              unidades={listo ? unidades : 0}
            />
          ) : null}
        </div>
      </div>
    </header>
  )
}
