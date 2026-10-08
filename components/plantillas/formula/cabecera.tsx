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
 * La cabecera de Fórmula: un renglón, como el membrete de una botica.
 *
 * El nombre en la romana, y a la derecha los datos a máquina. Las familias de
 * aromas no van arriba: están en el índice de la portada y en los filtros del
 * catálogo, y en una perfumería de autor se entra por el frasco, no por el menú.
 */
export function Cabecera({ marco, enlaceDelCarrito = true }: PropsCabecera) {
  const { unidades, listo } = useCarrito()
  const ruta = usePathname()
  const enCatalogo = ruta.endsWith("/catalogo")

  return (
    <header className="sticky top-0 z-30 border-b border-tinta bg-papel">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5">
        <Link
          href={rutaDeTienda(marco.slug, "")}
          className="flex min-h-14 min-w-0 items-center"
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
            <span className="truncate font-titular text-[1.65rem] leading-none">
              {marco.nombre}
            </span>
          )}
        </Link>

        <p className="hidden font-mono text-[11px] tracking-[0.06em] uppercase opacity-70 lg:block">
          Pedidos y asesoría por WhatsApp
        </p>

        <div className="-mr-3 flex items-center">
          <Link
            href={rutaDeTienda(marco.slug, "/catalogo")}
            aria-current={enCatalogo ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center px-3 font-mono text-[11px] tracking-[0.06em] uppercase underline-offset-4 transition-colors hover:text-senal",
              enCatalogo && "underline"
            )}
          >
            Catálogo
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
