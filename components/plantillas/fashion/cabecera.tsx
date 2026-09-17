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
 * La cabecera de Pasarela.
 *
 * Tres pisos, como una tienda de ropa: una franja negra con el servicio —o con
 * quién trajo la visita—, el nombre centrado, y las categorías debajo. Las
 * categorías van a la vista y no en un menú porque en moda se compra por
 * sección: quien busca zapatillas no quiere abrir nada para encontrarlas.
 */
export function Cabecera({
  marco,
  referido,
  codigo,
  enlaceDelCarrito = true,
}: PropsCabecera) {
  const { unidades, listo, recordarReferido } = useCarrito()
  const ruta = usePathname()
  const parametros = useSearchParams()

  React.useEffect(() => {
    if (referido) recordarReferido(referido.codigo)
  }, [referido, recordarReferido])

  const enCatalogo = ruta.endsWith("/catalogo")
  const categoriaActiva = enCatalogo ? parametros.get("categoria") : null
  const catalogo = rutaDeTienda(marco.slug, "/catalogo", { ref: codigo })

  return (
    <header className="sticky top-0 z-30 bg-papel">
      <p className="bg-tinta px-5 py-2 text-center text-[11px] font-semibold tracking-[0.18em] text-papel uppercase">
        {referido ? (
          <>
            Te trajo{" "}
            <span className="underline decoration-senal-alta decoration-2 underline-offset-4">
              {referido.nombre ?? referido.codigo}
            </span>
          </>
        ) : (
          "Entrega coordinada por WhatsApp"
        )}
      </p>

      <div className="border-b border-tinta">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-5">
          <nav aria-label="Tienda" className="-ml-3 flex items-center">
            <Link
              href={catalogo}
              aria-label="Ver el catálogo"
              className={cn(
                "flex min-h-11 min-w-11 items-center justify-center gap-2 px-3 text-xs font-semibold tracking-[0.16em] uppercase transition-colors hover:text-senal",
                enCatalogo && !categoriaActiva && "text-senal"
              )}
            >
              <LayoutGrid aria-hidden="true" className="size-5 md:hidden" />
              <span className="hidden md:inline">Catálogo</span>
            </Link>
          </nav>

          <Link
            href={rutaDeTienda(marco.slug, "", { ref: codigo })}
            className="flex min-h-14 max-w-[58vw] items-center justify-center md:max-w-md"
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
              <span className="truncate font-titular text-xl tracking-[0.08em] md:text-2xl">
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
      </div>

      {marco.categorias.length > 0 ? (
        <nav aria-label="Categorías" className="border-b border-tinta/15">
          <div className="mx-auto w-full max-w-7xl [scrollbar-width:none] overflow-x-auto px-5 [&::-webkit-scrollbar]:hidden">
            <ul className="mx-auto flex w-max gap-6">
              <li>
                <EnlaceDeCategoria
                  href={catalogo}
                  activo={enCatalogo && !categoriaActiva}
                >
                  Todo
                </EnlaceDeCategoria>
              </li>
              {marco.categorias.map((categoria) => (
                <li key={categoria.id}>
                  <EnlaceDeCategoria
                    href={rutaDeTienda(marco.slug, "/catalogo", {
                      categoria: categoria.id,
                      ref: codigo,
                    })}
                    activo={categoriaActiva === categoria.id}
                  >
                    {categoria.nombre}
                  </EnlaceDeCategoria>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      ) : null}
    </header>
  )
}

function EnlaceDeCategoria({
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
        "flex min-h-11 items-center border-b-2 text-xs font-semibold tracking-[0.14em] whitespace-nowrap uppercase transition-colors hover:border-tinta",
        activo
          ? "border-tinta"
          : "border-transparent opacity-70 hover:opacity-100"
      )}
    >
      {children}
    </Link>
  )
}
