import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ImageOff } from "lucide-react"

import {
  codigoDeReferido,
  getProductoPublico,
  getReferido,
} from "@/lib/data/tienda-publica"
import { formatMoney } from "@/lib/format"
import { AgregarAlCarrito } from "@/components/tienda/agregar"
import { BarraDelCarrito, Cabecera, Pie } from "@/components/tienda/marco"

const CONDICION: Record<string, string> = {
  nuevo: "Nuevo",
  segunda_mano: "Segunda mano",
  reacondicionado: "Reacondicionado",
}

/**
 * Un producto de la tienda pública.
 *
 * Tiene URL propia porque es lo que reparte un vendedor cuando toma un producto
 * suelto: comparte este enlace con su código, no la tienda entera.
 */
export default async function ProductoPublicoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug, id } = await params
  const encontrado = await getProductoPublico(slug, id)
  if (!encontrado) notFound()

  const { tienda, producto } = encontrado

  const consulta = await searchParams
  const codigo = codigoDeReferido(consulta.ref)
  const referido = await getReferido(tienda.id, codigo)

  const volver = codigo
    ? `/t/${slug}?ref=${encodeURIComponent(codigo)}`
    : `/t/${slug}`

  const descuento =
    producto.compare_at_price_cents &&
    producto.compare_at_price_cents > producto.price_cents
      ? Math.round(
          (1 - producto.price_cents / producto.compare_at_price_cents) * 100
        )
      : null

  return (
    <>
      <Cabecera
        nombre={tienda.nombre}
        slug={tienda.slug}
        logoUrl={tienda.logoUrl}
        referido={referido}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:py-14">
        <Link
          href={volver}
          className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
        >
          <ArrowLeft
            aria-hidden="true"
            className="size-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none"
          />
          Seguir viendo
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="relative aspect-square w-full overflow-hidden border border-tinta/15 bg-tinta/5">
              {producto.image_url ? (
                <Image
                  src={producto.image_url}
                  alt={producto.name}
                  fill
                  unoptimized
                  priority
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <ImageOff aria-hidden="true" className="size-10 opacity-20" />
                </div>
              )}
            </div>

            {producto.images.length > 1 ? (
              <div className="mt-3 grid grid-cols-5 gap-3">
                {producto.images.slice(1, 6).map((url, i) => (
                  <div
                    key={url}
                    className="relative aspect-square overflow-hidden border border-tinta/15 bg-tinta/5"
                  >
                    <Image
                      src={url}
                      alt={`${producto.name}, foto ${i + 2}`}
                      fill
                      unoptimized
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
              {producto.category ?? tienda.nombre}
            </p>

            <h1 className="mt-2 max-w-[20ch] font-titular text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.03] font-extrabold tracking-[-0.03em]">
              {producto.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="tabular font-titular text-3xl font-extrabold tracking-[-0.03em]">
                {formatMoney(producto.price_cents)}
              </span>
              {producto.compare_at_price_cents ? (
                <span className="tabular text-lg line-through opacity-40">
                  {formatMoney(producto.compare_at_price_cents)}
                </span>
              ) : null}
              {descuento ? (
                <span className="bg-senal px-2 py-0.5 text-xs font-semibold tracking-[0.1em] text-white uppercase">
                  −{descuento}%
                </span>
              ) : null}
            </div>

            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm opacity-55">
              <span>{CONDICION[producto.condition] ?? producto.condition}</span>
              <span aria-hidden="true">·</span>
              <span>
                {producto.stock > 0
                  ? `${producto.stock} disponibles`
                  : "Sin stock"}
              </span>
            </p>

            {producto.description ? (
              <p className="mt-6 max-w-[56ch] leading-relaxed opacity-75">
                {producto.description}
              </p>
            ) : null}

            {producto.condition !== "nuevo" && producto.condition_note ? (
              <div className="mt-6 border-l-2 border-senal pl-4">
                <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                  Estado del artículo
                </p>
                <p className="mt-2 max-w-[52ch] leading-relaxed opacity-75">
                  {producto.condition_note}
                </p>
              </div>
            ) : null}

            <div className="mt-10">
              <AgregarAlCarrito producto={producto} slug={slug} />
            </div>
          </div>
        </div>
      </main>

      <Pie nombre={tienda.nombre} />
      <BarraDelCarrito slug={tienda.slug} />
    </>
  )
}
