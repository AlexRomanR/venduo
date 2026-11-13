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
 * La cabecera de Tocador: el nombre en la serif suave a la izquierda y la
 * bolsa en una píldora a la derecha.
 */
export function Cabecera({ marco, enlaceDelCarrito = true }: PropsCabecera) {
  const { unidades, listo } = useCarrito()
  const enCatalogo = usePathname().endsWith("/catalogo")

  return (
    <header className="sticky top-0 z-30 border-b border-tinta/10 bg-papel">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-2.5">
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

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={rutaDeTienda(marco.slug, "/catalogo")}
            className={cn(
              "flex min-h-11 items-center px-3 text-sm font-medium transition-colors hover:text-senal",
              enCatalogo && "text-senal"
            )}
          >
            Productos
          </Link>
          {enlaceDelCarrito ? (
            <BotonDelCarrito
              slug={marco.slug}
              unidades={listo ? unidades : 0}
              className="rounded-full bg-tinta/[0.05]"
            />
          ) : null}
        </div>
      </div>
    </header>
  )
}
