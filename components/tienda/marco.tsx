import Image from "next/image"
import Link from "next/link"
import { Store } from "lucide-react"

import type { Referido } from "@/lib/data/tienda-publica"

/**
 * La cabecera de la tienda.
 *
 * Lleva el nombre del comercio, no el de Venduo: la marca de la plataforma va
 * abajo, en el pie. Quien compra le compra a ese negocio.
 */
export function Cabecera({
  nombre,
  slug,
  logoUrl,
  referido,
}: {
  nombre: string
  slug: string
  logoUrl: string | null
  referido: Referido | null
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-tinta/15 bg-papel/90 backdrop-blur">
      <div className="mx-auto w-full max-w-5xl px-5">
        <div className="flex items-center gap-3 py-3">
          <Link
            href={`/t/${slug}`}
            className="flex min-h-11 flex-1 items-center gap-3"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt=""
                width={72}
                height={72}
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

/** El pie: acá sí va Venduo, y la puerta para quien quiera su propia tienda. */
export function Pie({ nombre }: { nombre: string }) {
  return (
    <footer className="border-t-2 border-tinta py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-5">
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
