"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { LayoutGrid } from "lucide-react"

import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { BotonDelCarrito } from "@/components/plantillas/clasica/marco"
import type { PropsCabecera } from "@/components/plantillas/kit"
import { useCarrito } from "@/components/tienda/carrito"

/**
 * La cabecera de Esencia.
 *
 * Simétrica, como la fachada de una perfumería: el nombre al centro en
 * cursiva, la colección y el carrito a los lados, y las líneas de la tienda
 * debajo en versalitas con mucho espacio entre letras. Nada en negrita.
 */
export function Cabecera({ marco, enlaceDelCarrito = true }: PropsCabecera) {
  const { unidades, listo } = useCarrito()
  const ruta = usePathname()
  const parametros = useSearchParams()

  const enCatalogo = ruta.endsWith("/catalogo")
  const categoriaActiva = enCatalogo ? parametros.get("categoria") : null
  const catalogo = rutaDeTienda(marco.slug, "/catalogo")

  return (
    <header className="sticky top-0 z-30 border-b border-tinta/10 bg-papel/95 backdrop-blur">
      <p className="border-b border-tinta/10 px-5 py-2 text-center text-[10px] tracking-[0.28em] uppercase opacity-65">
        Asesoría personalizada por WhatsApp
      </p>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-5">
        <nav aria-label="Tienda" className="-ml-3 flex items-center">
          <Link
            href={catalogo}
            aria-label="Ver la colección"
            className={cn(
              "flex min-h-11 min-w-11 items-center justify-center px-3 text-[11px] tracking-[0.24em] uppercase transition-colors hover:text-senal",
              enCatalogo && !categoriaActiva && "text-senal"
            )}
          >
            <LayoutGrid
              aria-hidden="true"
              className="size-5 stroke-[1.5] md:hidden"
            />
            <span className="hidden md:inline">La colección</span>
          </Link>
        </nav>

        <Link
          href={rutaDeTienda(marco.slug, "")}
          className="flex min-h-16 max-w-[58vw] items-center justify-center md:max-w-md"
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
            <span className="truncate font-titular text-[1.75rem] leading-none italic md:text-[2.125rem]">
              {marco.nombre}
            </span>
          )}
        </Link>

        <div className="-mr-3 flex justify-end">
          {enlaceDelCarrito ? (
            <BotonDelCarrito
              slug={marco.slug}
              unidades={listo ? unidades : 0}
            />
          ) : null}
        </div>
      </div>

      {marco.categorias.length > 0 ? (
        <nav aria-label="Colecciones" className="border-t border-tinta/10">
          <div className="mx-auto w-full max-w-6xl [scrollbar-width:none] overflow-x-auto px-5 [&::-webkit-scrollbar]:hidden">
            <ul className="mx-auto flex w-max gap-7 md:gap-10">
              <li>
                <Enlace href={catalogo} activo={enCatalogo && !categoriaActiva}>
                  Todo
                </Enlace>
              </li>
              {marco.categorias.map((categoria) => (
                <li key={categoria.id}>
                  <Enlace
                    href={rutaDeTienda(marco.slug, "/catalogo", {
                      categoria: categoria.id,
                    })}
                    activo={categoriaActiva === categoria.id}
                  >
                    {categoria.nombre}
                  </Enlace>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      ) : null}
    </header>
  )
}

function Enlace({
  href,
  activo,
  children,
}: {
  href: string
  activo: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center text-[11px] tracking-[0.22em] whitespace-nowrap uppercase transition-colors hover:text-senal",
        activo ? "text-senal" : "opacity-75 hover:opacity-100"
      )}
    >
      {children}
    </Link>
  )
}
