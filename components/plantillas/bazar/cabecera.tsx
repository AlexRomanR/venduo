"use client"

import Image from "next/image"
import Link from "next/link"
import { Search } from "lucide-react"

import { rutaDeTienda } from "@/lib/tienda"
import { BotonDelCarrito } from "@/components/plantillas/clasica/marco"
import type { PropsCabecera } from "@/components/plantillas/kit"
import { useCarrito } from "@/components/tienda/carrito"

/**
 * La cabecera de Bazar.
 *
 * En una tienda de todo un poco, lo primero es buscar: el centro de la
 * cabecera es una barra redonda que lleva al buscador del catálogo. Arriba,
 * una franja en fucsia dice cómo se compra.
 */
export function Cabecera({ marco, enlaceDelCarrito = true }: PropsCabecera) {
  const { unidades, listo } = useCarrito()

  return (
    <header className="sticky top-0 z-30 bg-papel">
      <p className="bg-senal px-5 py-1.5 text-center text-xs font-semibold text-white">
        Arma tu pedido y mándalo por WhatsApp
      </p>

      <div className="border-b-2 border-tinta/10">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-5 py-2">
          <Link
            href={rutaDeTienda(marco.slug, "")}
            className="flex min-h-12 min-w-0 shrink items-center"
          >
            {marco.logoUrl ? (
              <Image
                src={marco.logoUrl}
                alt={marco.nombre}
                width={140}
                height={70}
                unoptimized
                className="h-9 w-auto object-contain"
              />
            ) : (
              <span className="truncate font-titular text-2xl leading-none">
                {marco.nombre}
              </span>
            )}
          </Link>

          <Link
            href={rutaDeTienda(marco.slug, "/catalogo")}
            className="ml-auto flex min-h-11 min-w-11 items-center justify-center gap-2.5 rounded-plantilla bg-tinta/[0.07] px-3 text-sm transition-colors hover:bg-tinta/[0.12] md:mx-auto md:w-full md:max-w-md md:justify-start md:px-4"
          >
            <Search aria-hidden="true" className="size-4 shrink-0" />
            <span className="hidden opacity-70 md:inline">
              Busca en la tienda
            </span>
            <span className="sr-only md:hidden">Buscar en la tienda</span>
          </Link>

          {enlaceDelCarrito ? (
            <BotonDelCarrito
              slug={marco.slug}
              unidades={listo ? unidades : 0}
              className="-mr-2 rounded-full hover:bg-tinta/[0.07]"
            />
          ) : null}
        </div>
      </div>
    </header>
  )
}
