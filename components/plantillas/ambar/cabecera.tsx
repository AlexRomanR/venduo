"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { ReglaDeEstrellas } from "@/components/plantillas/ambar/piezas"
import { BotonDelCarrito } from "@/components/plantillas/clasica/marco"
import type { PropsCabecera } from "@/components/plantillas/kit"
import { useCarrito } from "@/components/tienda/carrito"

/**
 * La cabecera de Ámbar.
 *
 * Una banda de tinta: una tira fina con cómo se compra, el nombre al centro
 * en el cúfico y la regla de estrellas abajo. En la portada sigue la banda
 * del titular, y juntas son la noche de la tienda.
 */
export function Cabecera({ marco, enlaceDelCarrito = true }: PropsCabecera) {
  const { unidades, listo } = useCarrito()
  const enCatalogo = usePathname().endsWith("/catalogo")

  return (
    <header className="sticky top-0 z-30 bg-tinta text-papel">
      <p className="border-b border-papel/15 px-5 py-1.5 text-center text-xs opacity-75">
        Pedidos y asesoría por WhatsApp
      </p>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-5">
        <Link
          href={rutaDeTienda(marco.slug, "/catalogo")}
          className={cn(
            "-ml-1 flex min-h-11 items-center justify-self-start px-1 text-sm opacity-85 transition-opacity hover:opacity-100",
            enCatalogo && "underline decoration-papel/50 underline-offset-[6px]"
          )}
        >
          Catálogo
        </Link>

        <Link
          href={rutaDeTienda(marco.slug, "")}
          className="flex min-h-14 max-w-[52vw] min-w-0 items-center justify-center md:max-w-md"
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

        <div className="-mr-3 justify-self-end">
          {enlaceDelCarrito ? (
            <BotonDelCarrito
              slug={marco.slug}
              unidades={listo ? unidades : 0}
              className="hover:text-papel"
            />
          ) : (
            <span className="block size-11" />
          )}
        </div>
      </div>
      <ReglaDeEstrellas className="text-papel/35" />
    </header>
  )
}
