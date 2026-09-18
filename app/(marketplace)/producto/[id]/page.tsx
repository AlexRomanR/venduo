import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  BadgeCheck,
  MessageCircle,
  Package,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"

import { AgregarProductoMarketplace } from "@/components/marketplace/agregar-producto"
import { TarjetaMarketplace } from "@/components/marketplace/producto"
import {
  getProductoMarketplace,
  getReferidoProducto,
} from "@/lib/data/marketplace"
import { codigoDeReferido } from "@/lib/data/tienda-publica"
import { formatMoney, formatNumber } from "@/lib/format"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const encontrado = await getProductoMarketplace(id)
  if (!encontrado) return { title: "Producto no encontrado" }
  return {
    title: `${encontrado.producto.nombre} · Venduo`,
    description: encontrado.producto.descripcion ?? undefined,
    openGraph: {
      title: encontrado.producto.nombre,
      description: encontrado.producto.descripcion ?? undefined,
      images: encontrado.producto.imagenUrl
        ? [{ url: encontrado.producto.imagenUrl }]
        : undefined,
    },
  }
}

export default async function ProductoMarketplacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const encontrado = await getProductoMarketplace(id)
  if (!encontrado) notFound()

  const consulta = await searchParams
  const codigo = codigoDeReferido(consulta.ref)
  const referido = await getReferidoProducto(encontrado.producto.id, codigo)
  const { producto, relacionados } = encontrado
  const imagenes =
    producto.imagenes.length > 0
      ? producto.imagenes
      : producto.imagenUrl
        ? [producto.imagenUrl]
        : []

  return (
    <div className="px-5 py-7 lg:px-10 lg:py-10">
      <nav
        aria-label="Ruta del producto"
        className="flex flex-wrap items-center gap-2 text-xs opacity-55"
      >
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 hover:text-senal hover:opacity-100"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Marketplace
        </Link>
        <span>/</span>
        {producto.categoria ? (
          <>
            <Link
              href={`/?categoria=${encodeURIComponent(producto.categoria)}`}
              className="min-h-11 py-3 hover:text-senal"
            >
              {producto.categoria}
            </Link>
            <span>/</span>
          </>
        ) : null}
        <span className="truncate">{producto.nombre}</span>
      </nav>

      {referido ? (
        <div className="mb-6 flex items-center gap-3 border-y border-tinta/15 py-3 text-sm">
          <BadgeCheck aria-hidden="true" className="size-4 text-senal" />
          <p>
            Llegaste por el enlace de{" "}
            <span className="font-semibold">
              {referido.nombre ?? "un promotor"}
            </span>
            . El precio no cambia.
          </p>
        </div>
      ) : null}

      <div className="grid gap-9 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] xl:gap-14">
        <section>
          <div className="grid gap-3 sm:grid-cols-2">
            {imagenes.length > 0 ? (
              imagenes.slice(0, 4).map((imagen, indice) => (
                <div
                  key={`${imagen}-${indice}`}
                  className={`relative overflow-hidden bg-tinta/[0.06] ${
                    imagenes.length === 1
                      ? "aspect-[4/5] sm:col-span-2"
                      : indice === 0
                        ? "aspect-[4/5] sm:row-span-2 sm:aspect-auto"
                        : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={imagen}
                    alt={
                      indice === 0
                        ? producto.nombre
                        : `${producto.nombre}, vista ${indice + 1}`
                    }
                    fill
                    priority={indice === 0}
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 420px"
                    className="object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-tinta/[0.06] sm:col-span-2">
                <Package aria-hidden="true" className="size-10 opacity-20" />
              </div>
            )}
          </div>
        </section>

        <section className="xl:sticky xl:top-24 xl:self-start">
          <Link
            href={`/negocio/${producto.negocio.slug}`}
            className="text-xs font-semibold tracking-[0.11em] text-senal uppercase hover:underline hover:underline-offset-4"
          >
            {producto.negocio.nombre}
          </Link>
          <h1 className="mt-3 max-w-[18ch] font-titular text-[clamp(2.25rem,6vw,4rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-balance">
            {producto.nombre}
          </h1>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <p className="tabular font-titular text-3xl font-extrabold tracking-[-0.04em] text-senal sm:text-4xl">
              {formatMoney(producto.precioCents)}
            </p>
            {producto.precioAnteriorCents ? (
              <p className="tabular text-sm line-through opacity-45">
                {formatMoney(producto.precioAnteriorCents)}
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold uppercase opacity-55">
            <span>
              {producto.condicion === "nuevo"
                ? "Nuevo"
                : producto.condicion === "segunda_mano"
                  ? "Segunda mano"
                  : "Reacondicionado"}
            </span>
            <span className="tabular">
              {formatNumber(producto.stock)} disponibles
            </span>
          </div>

          {producto.descripcion ? (
            <p className="mt-7 max-w-[58ch] text-base leading-relaxed opacity-72">
              {producto.descripcion}
            </p>
          ) : null}
          {producto.notaCondicion ? (
            <p className="mt-4 border-t border-tinta/15 pt-4 text-sm leading-relaxed">
              <span className="font-semibold">Estado: </span>
              <span className="opacity-65">{producto.notaCondicion}</span>
            </p>
          ) : null}

          <div className="mt-8">
            <AgregarProductoMarketplace producto={producto} referido={codigo} />
          </div>

          <dl className="mt-7 border-t border-tinta/15">
            <div className="flex gap-3 border-b border-tinta/15 py-4">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-senal"
              />
              <div>
                <dt className="text-sm font-semibold">Pago protegido</dt>
                <dd className="mt-1 text-xs leading-relaxed opacity-60">
                  PagoFácil retiene el dinero hasta la entrega.
                </dd>
              </div>
            </div>
            <div className="flex gap-3 border-b border-tinta/15 py-4">
              <MessageCircle
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0"
              />
              <div>
                <dt className="text-sm font-semibold">Entrega coordinada</dt>
                <dd className="mt-1 text-xs leading-relaxed opacity-60">
                  El negocio acuerda contigo el lugar y momento por WhatsApp.
                </dd>
              </div>
            </div>
            <div className="flex gap-3 border-b border-tinta/15 py-4">
              <RotateCcw
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0"
              />
              <div>
                <dt className="text-sm font-semibold">
                  Puedes reclamar antes de liberar
                </dt>
                <dd className="mt-1 text-xs leading-relaxed opacity-60">
                  Si algo no llega bien, el pago queda congelado mientras se
                  revisa.
                </dd>
              </div>
            </div>
          </dl>
        </section>
      </div>

      <section className="mt-16 border-t border-tinta/15 pt-10">
        <div className="flex items-end justify-between gap-5">
          <div>
            <h2 className="font-titular text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">
              También te puede interesar
            </h2>
            <p className="mt-2 text-sm opacity-55">
              Productos disponibles en el mismo Marketplace.
            </p>
          </div>
          <Link
            href="/"
            className="hidden min-h-11 items-center text-sm font-semibold hover:text-senal sm:flex"
          >
            Ver todo
          </Link>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 xl:grid-cols-4">
          {relacionados.map((relacionado) => (
            <TarjetaMarketplace key={relacionado.id} producto={relacionado} />
          ))}
        </div>
      </section>
    </div>
  )
}
