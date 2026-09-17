"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { MessageCircle, ShoppingBag, Store } from "lucide-react"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Referido } from "@/lib/data/tienda-publica"
import { useCarrito } from "@/components/tienda/carrito"

/**
 * La cabecera de la tienda.
 *
 * Lleva el nombre del comercio, no el de Venduo: la marca de la plataforma va
 * abajo, en el pie. Quien compra le compra a ese negocio.
 *
 * Es cliente porque muestra el contador del carrito, que vive en el navegador.
 */
export function Cabecera({
  nombre,
  slug,
  logoUrl,
  referido,
  enlaceDelCarrito = true,
}: {
  nombre: string
  slug: string
  logoUrl: string | null
  referido: Referido | null
  enlaceDelCarrito?: boolean
}) {
  const { unidades, listo, recordarReferido } = useCarrito()

  // El código llega por la URL de cada pantalla; el carrito lo recuerda para
  // que sobreviva a navegar sin él.
  React.useEffect(() => {
    if (referido) recordarReferido(referido.codigo)
  }, [referido, recordarReferido])

  return (
    <header className="sticky top-0 z-30 border-b border-tinta/15 bg-papel/92 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="flex items-center gap-3 py-3">
          <Link
            href={`/t/${slug}`}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-3"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
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
              {nombre}
            </span>
          </Link>

          {enlaceDelCarrito ? (
            <Link
              href={`/t/${slug}/carrito`}
              className="relative flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal"
              aria-label={
                unidades > 0
                  ? `Tu carrito, ${unidades} ${unidades === 1 ? "artículo" : "artículos"}`
                  : "Tu carrito, vacío"
              }
            >
              <ShoppingBag aria-hidden="true" className="size-5" />
              {listo && unidades > 0 ? (
                <span className="tabular absolute top-1 right-0.5 flex size-5 items-center justify-center rounded-full bg-senal text-[10px] font-bold text-white">
                  {unidades > 9 ? "9+" : unidades}
                </span>
              ) : null}
            </Link>
          ) : null}
        </div>

        {/* Quien trajo la visita se muestra: da confianza, y deja claro que ese
            vendedor cobra por esta venta. */}
        {referido ? (
          <p className="border-t border-senal/25 py-2 text-xs tracking-[0.06em] text-senal">
            Te trajo{" "}
            <span className="font-semibold">
              {referido.nombre ?? `el código ${referido.codigo}`}
            </span>
          </p>
        ) : null}
      </div>
    </header>
  )
}

/**
 * La ficha del negocio, bajo la portada.
 *
 * Es lo que contesta "¿a quién le estoy comprando?" antes de dar un teléfono.
 * Una tienda sin esto se lee como un catálogo anónimo.
 */
export function DatosDeLaTienda({
  nombre,
  descripcion,
  whatsapp,
  productos,
  comisionBps,
  aceptaVendedores,
}: {
  nombre: string
  descripcion: string | null
  whatsapp: string | null
  productos: number
  comisionBps: number
  aceptaVendedores: boolean
}) {
  return (
    <section className="border-t border-tinta/15 py-10">
      <div className="mx-auto w-full max-w-6xl px-5">
        {/* Sin descripción no se dibuja la columna: un rótulo sin nada debajo
            se lee como contenido que no cargó. */}
        <div
          className={cn(
            "grid gap-x-10 gap-y-6",
            descripcion ? "md:grid-cols-[1.4fr_1fr]" : "md:grid-cols-2"
          )}
        >
          {descripcion ? (
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                Sobre {nombre}
              </p>
              <p className="mt-3 max-w-[58ch] leading-relaxed opacity-75">
                {descripcion}
              </p>
            </div>
          ) : (
            <div className="hidden md:block" />
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 self-start">
            <div>
              <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
                En catálogo
              </dt>
              <dd className="tabular mt-1 font-titular text-xl font-bold">
                {productos}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
                Entrega
              </dt>
              <dd className="mt-1 text-sm leading-snug">
                Coordinada por WhatsApp
              </dd>
            </div>

            {whatsapp ? (
              <div className="col-span-2">
                <dt className="sr-only">WhatsApp de la tienda</dt>
                <dd>
                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
                  >
                    <MessageCircle aria-hidden="true" className="size-4" />
                    Escribir a la tienda
                  </a>
                </dd>
              </div>
            ) : null}

            {aceptaVendedores && comisionBps > 0 ? (
              <div className="col-span-2 border-t border-tinta/15 pt-4">
                <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
                  ¿Quieres vender lo nuestro?
                </dt>
                <dd className="mt-1 text-sm leading-relaxed opacity-70">
                  Esta tienda paga {(comisionBps / 100).toFixed(0)}% por cada
                  venta que traigas.{" "}
                  <Link
                    href="/sumarme"
                    className="inline-flex min-h-11 items-center font-semibold text-senal underline-offset-4 hover:underline"
                  >
                    Súmate
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </section>
  )
}

/** El pie: acá sí va Venduo, y la puerta para quien quiera su propia tienda. */
export function Pie({ nombre }: { nombre: string }) {
  return (
    <footer className="border-t-2 border-tinta py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5">
        <p className="text-sm opacity-55">
          {nombre} · Entrega y pago se coordinan por WhatsApp
        </p>

        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
        >
          Hecho con <span className="font-titular font-extrabold">Venduo</span>
        </Link>
      </div>
    </footer>
  )
}

/** Una barra que sigue al pulgar con el subtotal y el paso siguiente. */
export function BarraDelCarrito({ slug }: { slug: string }) {
  const { unidades, subtotalCents, listo } = useCarrito()

  if (!listo || unidades === 0) return null

  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 border-t-2 border-tinta bg-papel/95 backdrop-blur",
        "supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-5 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
            {unidades} {unidades === 1 ? "artículo" : "artículos"}
          </p>
          <p className="tabular font-titular text-lg font-bold tracking-[-0.02em]">
            {formatMoney(subtotalCents)}
          </p>
        </div>

        <Link
          href={`/t/${slug}/carrito`}
          className="flex min-h-12 items-center gap-2 rounded-sm bg-senal px-5 font-semibold text-white transition-colors hover:bg-senal-alta"
        >
          Ver mi carrito
        </Link>
      </div>
    </div>
  )
}
