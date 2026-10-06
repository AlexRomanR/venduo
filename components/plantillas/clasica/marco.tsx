"use client"

import Image from "next/image"
import Link from "next/link"
import { MessageCircle, ShoppingBag, Store } from "lucide-react"

import { numeroDeWhatsApp } from "@/lib/pedidos"
import { rutaDeTienda } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import type { PropsCabecera, PropsPie } from "@/components/plantillas/kit"
import { useCarrito } from "@/components/tienda/carrito"

/**
 * La cabecera de la tienda.
 *
 * Lleva el nombre del comercio, no el de Venduo: la marca de la plataforma va
 * abajo, en el pie. Quien compra le compra a ese negocio.
 *
 * Es cliente porque muestra el contador del carrito, que vive en el navegador.
 */
export function Cabecera({ marco, enlaceDelCarrito = true }: PropsCabecera) {
  const { unidades, listo } = useCarrito()

  return (
    <header className="sticky top-0 z-30 border-b border-tinta/15 bg-papel/92 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="flex items-center gap-3 py-3">
          <Link
            href={rutaDeTienda(marco.slug, "")}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-3"
          >
            {marco.logoUrl ? (
              <Image
                src={marco.logoUrl}
                alt=""
                width={80}
                height={80}
                unoptimized
                className="size-9 shrink-0 border border-tinta/20 object-cover"
              />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center border border-tinta/20">
                <Store aria-hidden="true" className="size-4 opacity-45" />
              </span>
            )}
            <span className="truncate font-titular text-lg font-extrabold tracking-[-0.02em]">
              {marco.nombre}
            </span>
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

/**
 * El acceso al carrito con su contador. Lo comparten las cabeceras de todas
 * las plantillas: cambia el marco alrededor, no lo que tiene que decir.
 */
export function BotonDelCarrito({
  slug,
  unidades,
  className,
}: {
  slug: string
  unidades: number
  className?: string
}) {
  return (
    <Link
      href={`/t/${slug}/carrito`}
      className={cn(
        "relative flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal",
        className
      )}
      aria-label={
        unidades > 0
          ? `Tu carrito, ${unidades} ${unidades === 1 ? "artículo" : "artículos"}`
          : "Tu carrito, vacío"
      }
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      {unidades > 0 ? (
        <span className="tabular absolute top-1 right-0.5 flex size-5 items-center justify-center rounded-full bg-senal text-[10px] font-bold text-white">
          {unidades > 9 ? "9+" : unidades}
        </span>
      ) : null}
    </Link>
  )
}

/** El pie: acá sí va Venduo, y la puerta para quien quiera su propia tienda. */
export function Pie({ marco }: PropsPie) {
  return (
    <footer className="border-t-2 border-tinta py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5">
        <p className="text-sm opacity-55">
          {marco.nombre} · Pedidos y pago por WhatsApp
        </p>

        <div className="flex flex-wrap items-center gap-x-6">
          {marco.whatsapp ? (
            <a
              href={`https://wa.me/${numeroDeWhatsApp(marco.whatsapp)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              WhatsApp
            </a>
          ) : null}

          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
          >
            Hecho con{" "}
            <span className="font-titular font-extrabold">Venduo</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
