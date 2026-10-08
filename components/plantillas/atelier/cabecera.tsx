"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { BotonDelCarrito } from "@/components/plantillas/clasica/marco"
import type { PropsCabecera } from "@/components/plantillas/kit"
import { useCarrito } from "@/components/tienda/carrito"

/**
 * La cabecera de Atelier.
 *
 * El nombre en la didona a la izquierda, como una firma, y las líneas de la
 * casa —"Carteras", "Billeteras", "Cinturones"— debajo, en versalitas, sobre
 * una regla doble. Es la cabecera de una tienda de la que se recorre todo:
 * pocas categorías y todas a la vista.
 */
export function Cabecera({ marco, enlaceDelCarrito = true }: PropsCabecera) {
  const { unidades, listo } = useCarrito()
  const ruta = usePathname()
  const parametros = useSearchParams()
  const enCatalogo = ruta.endsWith("/catalogo")
  const categoriaActiva = enCatalogo ? parametros.get("categoria") : null
  const catalogo = rutaDeTienda(marco.slug, "/catalogo")

  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-double border-tinta/40 bg-papel">
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
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="truncate font-titular text-2xl leading-none italic md:text-[1.75rem]">
              {marco.nombre}
            </span>
          )}
        </Link>

        <div className="-mr-3 flex items-center">
          <Link
            href={catalogo}
            className={cn(
              "hidden min-h-11 items-center px-3 text-[11px] tracking-[0.22em] uppercase transition-colors hover:text-senal sm:flex",
              enCatalogo && !categoriaActiva && "text-senal"
            )}
          >
            Colección
          </Link>
          {enlaceDelCarrito ? (
            <BotonDelCarrito
              slug={marco.slug}
              unidades={listo ? unidades : 0}
            />
          ) : null}
        </div>
      </div>

      <nav aria-label="Categorías" className="border-t border-tinta/15">
        <div className="mx-auto w-full max-w-7xl [scrollbar-width:none] overflow-x-auto px-5 [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max gap-6 md:gap-8">
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
        "flex min-h-11 items-center text-[11px] tracking-[0.22em] whitespace-nowrap uppercase transition-[color,opacity]",
        activo
          ? "text-senal underline decoration-senal underline-offset-[6px]"
          : "opacity-75 hover:opacity-100"
      )}
    >
      {children}
    </Link>
  )
}
