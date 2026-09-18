import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BadgeCheck, MessageCircle } from "lucide-react"

import { TarjetaMarketplace } from "@/components/marketplace/producto"
import { getNegocioMarketplace } from "@/lib/data/marketplace"

export default async function NegocioMarketplacePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const encontrado = await getNegocioMarketplace(slug)
  if (!encontrado) notFound()

  const { negocio, productos } = encontrado
  const whatsapp = negocio.whatsapp?.replace(/\D/g, "")

  return (
    <div className="px-5 py-8 lg:px-10 lg:py-10">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold opacity-65 hover:text-senal hover:opacity-100"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Volver al Marketplace
      </Link>

      <header className="mt-6 grid gap-8 border-y-2 border-tinta py-9 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-senal">
            <BadgeCheck aria-hidden="true" className="size-4" />
            Negocio en Venduo
          </div>
          <h1 className="mt-3 max-w-[16ch] font-titular text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.92] font-extrabold tracking-[-0.04em] text-balance">
            {negocio.nombre}
          </h1>
          {negocio.descripcion ? (
            <p className="mt-5 max-w-[58ch] text-lg leading-relaxed opacity-65">
              {negocio.descripcion}
            </p>
          ) : null}
        </div>
        {whatsapp ? (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noreferrer noopener"
            className="flex min-h-12 items-center justify-center gap-2 rounded-plantilla border-2 border-tinta px-5 font-semibold hover:bg-tinta hover:text-papel"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Consultar al negocio
          </a>
        ) : null}
      </header>

      <section className="mt-10">
        <h2 className="font-titular text-2xl font-extrabold tracking-[-0.03em]">
          {productos.length}{" "}
          {productos.length === 1
            ? "producto disponible"
            : "productos disponibles"}
        </h2>
        <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-3 2xl:grid-cols-4">
          {productos.map((producto) => (
            <TarjetaMarketplace key={producto.id} producto={producto} />
          ))}
        </div>
      </section>
    </div>
  )
}
