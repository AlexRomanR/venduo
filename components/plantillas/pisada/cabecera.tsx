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
 * La cabecera de Pisada.
 *
 * Una barra oscura con el nombre en cursiva y, debajo, las categorías como
 * fichas redondas que se pasan con el dedo: "Urbanas", "Running", "Botas".
 * En calzado se entra por el tipo de par, así que van a la vista.
 */
export function Cabecera({ marco, enlaceDelCarrito = true }: PropsCabecera) {
  const { unidades, listo } = useCarrito()
  const ruta = usePathname()
  const parametros = useSearchParams()
  const enCatalogo = ruta.endsWith("/catalogo")
  const categoriaActiva = enCatalogo ? parametros.get("categoria") : null
  const catalogo = rutaDeTienda(marco.slug, "/catalogo")

  return (
    <header className="sticky top-0 z-30 bg-papel">
      <div className="bg-tinta text-papel">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5">
          <Link
            href={rutaDeTienda(marco.slug, "")}
            className="flex min-h-14 min-w-0 items-center"
          >
            {marco.logoUrl ? (
              // El logo va sobre una pastilla clara: la barra es oscura y un
              // logo en tinta desaparecería.
              <span className="rounded-plantilla bg-papel px-3 py-1">
                <Image
                  src={marco.logoUrl}
                  alt={marco.nombre}
                  width={140}
                  height={70}
                  unoptimized
                  className="h-8 w-auto object-contain"
                />
              </span>
            ) : (
              <span className="truncate font-titular text-[1.65rem] leading-none italic">
                {marco.nombre}
              </span>
            )}
          </Link>

          <div className="-mr-2 flex items-center gap-1">
            <Link
              href={catalogo}
              className="hidden min-h-11 items-center rounded-plantilla px-4 text-xs font-bold tracking-[0.1em] uppercase transition-colors hover:bg-papel hover:text-tinta sm:flex"
            >
              Catálogo
            </Link>
            {enlaceDelCarrito ? (
              <BotonDelCarrito
                slug={marco.slug}
                unidades={listo ? unidades : 0}
                className="rounded-full hover:bg-papel hover:text-tinta"
              />
            ) : null}
          </div>
        </div>
      </div>

      <nav aria-label="Categorías" className="border-b border-tinta/10">
        <div className="mx-auto w-full max-w-7xl [scrollbar-width:none] overflow-x-auto px-5 py-2 [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max gap-2">
            <li>
              <Ficha href={catalogo} activa={enCatalogo && !categoriaActiva}>
                Todo
              </Ficha>
            </li>
            {marco.categorias.map((categoria) => (
              <li key={categoria.id}>
                <Ficha
                  href={rutaDeTienda(marco.slug, "/catalogo", {
                    categoria: categoria.id,
                  })}
                  activa={categoriaActiva === categoria.id}
                >
                  {categoria.nombre}
                </Ficha>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}

function Ficha({
  href,
  activa,
  children,
}: {
  href: string
  activa: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={activa ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center rounded-plantilla border-2 px-4 text-xs font-bold tracking-[0.06em] whitespace-nowrap uppercase transition-colors",
        activa
          ? "border-tinta bg-tinta text-papel"
          : "border-tinta/15 hover:border-tinta"
      )}
    >
      {children}
    </Link>
  )
}
