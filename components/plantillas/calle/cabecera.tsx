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
 * La cabecera de Calle.
 *
 * Arriba corre una cinta, como la marquesina de un local: cómo se compra y
 * las categorías de la tienda, una detrás de otra. Debajo, el nombre en letra
 * de afiche a la izquierda y el carrito en su cuadro. La cinta es decorado:
 * lo que dice está también en la navegación, así que no se lee dos veces.
 */
export function Cabecera({ marco, enlaceDelCarrito = true }: PropsCabecera) {
  const { unidades, listo } = useCarrito()
  const ruta = usePathname()
  const enCatalogo = ruta.endsWith("/catalogo")

  const frases = [
    "Pedidos por WhatsApp",
    ...marco.categorias.slice(0, 6).map((categoria) => categoria.nombre),
  ]

  return (
    <header className="sticky top-0 z-30 bg-papel">
      <div
        aria-hidden="true"
        className="overflow-hidden bg-tinta py-1.5 text-papel"
      >
        <div className="cinta flex w-max">
          {[0, 1].map((vuelta) => (
            <div key={vuelta} className="flex shrink-0">
              {Array.from({ length: 3 }, () => frases)
                .flat()
                .map((frase, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-4 pr-4 font-titular text-[13px] tracking-[0.06em] whitespace-nowrap"
                  >
                    {frase}
                    <span className="size-1.5 bg-senal-alta" />
                  </span>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="border-b-2 border-tinta">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5">
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
              <span className="truncate font-titular text-2xl leading-none md:text-3xl">
                {marco.nombre}
              </span>
            )}
          </Link>

          <nav aria-label="Tienda" className="-mr-1 flex items-center gap-2">
            <Link
              href={rutaDeTienda(marco.slug, "/catalogo")}
              aria-current={enCatalogo ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center border-2 px-3 text-[11px] font-bold tracking-[0.12em] uppercase transition-colors",
                enCatalogo
                  ? "border-tinta bg-tinta text-papel"
                  : "border-tinta hover:bg-tinta hover:text-papel"
              )}
            >
              Catálogo
            </Link>
            {enlaceDelCarrito ? (
              <BotonDelCarrito
                slug={marco.slug}
                unidades={listo ? unidades : 0}
                className="border-2 border-tinta hover:bg-tinta hover:text-papel"
              />
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  )
}
