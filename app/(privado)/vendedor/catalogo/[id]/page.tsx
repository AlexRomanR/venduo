import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  CalendarDays,
  Package,
  ShieldCheck,
} from "lucide-react"

import { getProductoVitrina } from "@/lib/data/vitrina"
import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatDate, formatMoney, formatNumber } from "@/lib/format"
import { mensajeParaCompartir } from "@/lib/promotor"
import { urlDeProducto } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { TomarProducto } from "@/components/promotor/acciones"
import { CompartirEnlace } from "@/components/promotor/compartir"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const producto = await getProductoVitrina(id)
  return { title: producto ? `${producto.name} para promocionar` : "Producto" }
}

export default async function ProductoParaPromocionarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const producto = await getProductoVitrina(id)
  if (!producto) notFound()

  const url = producto.codigo
    ? urlDeProducto(producto.storeSlug, producto.id, producto.codigo)
    : null
  const descuento = producto.compareAtPriceCents
    ? Math.max(
        0,
        Math.round(
          (1 - producto.priceCents / producto.compareAtPriceCents) * 100
        )
      )
    : 0

  return (
    <div className="flex flex-col gap-10">
      <nav aria-label="Ruta del catálogo">
        <Link
          href="/vendedor/catalogo"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold opacity-60 transition-opacity hover:opacity-100"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver al catálogo
        </Link>
      </nav>

      <div className="grid gap-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:gap-14">
        <section>
          <div className="relative aspect-[4/3] overflow-hidden bg-tinta/[0.06]">
            {producto.imageUrl ? (
              <Image
                src={producto.imageUrl}
                alt={producto.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 54vw"
                className="object-cover grayscale transition-[filter] duration-500 hover:grayscale-0"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Package aria-hidden="true" className="size-12 opacity-20" />
              </div>
            )}
          </div>

          <dl className="grid grid-cols-2 border-b border-tinta/15 sm:grid-cols-3">
            <Dato icono={Boxes} termino="Stock">
              {formatNumber(producto.stock)} unidades
            </Dato>
            <Dato icono={CalendarDays} termino="Publicado">
              {formatDate(producto.publishedAt)}
            </Dato>
            <Dato icono={BadgeCheck} termino="Estado">
              {nombreCondicion(producto.condition)}
            </Dato>
          </dl>
        </section>

        <section className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-sm font-semibold opacity-55">
            {producto.storeName}
            {producto.category ? ` · ${producto.category}` : ""}
          </p>
          <h1 className="mt-3 max-w-[17ch] font-titular text-[clamp(2.1rem,6vw,4rem)] leading-[0.98] font-extrabold tracking-[-0.04em] text-balance">
            {producto.name}
          </h1>

          {producto.description ? (
            <p className="mt-5 max-w-[58ch] leading-relaxed opacity-70">
              {producto.description}
            </p>
          ) : null}

          <div className="mt-8 grid grid-cols-2 border-y-2 border-tinta py-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.1em] uppercase opacity-50">
                Tú ganas por venta
              </p>
              <p className="tabular mt-2 font-titular text-[clamp(2rem,7vw,3rem)] leading-none font-extrabold tracking-[-0.04em] text-senal">
                {formatMoney(producto.gananciaCents)}
              </p>
            </div>
            <div className="border-l border-tinta/15 pl-5">
              <p className="text-xs font-semibold tracking-[0.1em] uppercase opacity-50">
                Precio publicado
              </p>
              <p className="tabular mt-2 font-titular text-2xl font-extrabold tracking-[-0.03em]">
                {formatMoney(producto.priceCents)}
              </p>
              {descuento > 0 ? (
                <p className="mt-1 text-xs font-semibold text-senal">
                  {descuento}% debajo del precio anterior
                </p>
              ) : null}
            </div>
          </div>

          {producto.conditionNote ? (
            <p className="mt-5 text-sm leading-relaxed">
              <span className="font-semibold">Detalle del estado: </span>
              <span className="opacity-65">{producto.conditionNote}</span>
            </p>
          ) : null}

          <div className="mt-8">
            {url ? (
              <div className="border-2 border-tinta p-5">
                <p className="flex items-center gap-2 font-titular text-lg font-bold tracking-[-0.02em]">
                  <BadgeCheck
                    aria-hidden="true"
                    className="size-5 text-senal"
                  />
                  Ya tienes un enlace para este producto
                </p>
                <p className="mt-2 max-w-[48ch] text-sm leading-relaxed opacity-65">
                  Puedes volver a copiarlo aquí o encontrarlo siempre en Mis
                  enlaces.
                </p>
                <div className="mt-5">
                  <CompartirEnlace
                    url={url}
                    producto={producto.name}
                    mensaje={mensajeParaCompartir(
                      producto.name,
                      producto.storeName,
                      formatMoney(producto.priceCents),
                      url
                    )}
                  />
                </div>
                <Link
                  href="/vendedor/enlaces"
                  className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold transition-colors hover:text-senal"
                >
                  Ver todos mis enlaces
                </Link>
              </div>
            ) : (
              <div>
                <TomarProducto
                  productoId={producto.id}
                  nombre={producto.name}
                  destino={`/vendedor/enlaces?creado=${producto.id}`}
                  texto="Crear mi enlace de este producto"
                  className="min-h-14 text-base"
                />
                <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed opacity-60">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  No compras stock ni esperas aprobación. El enlace queda
                  guardado en Mis enlaces y puedes dejar de promocionarlo cuando
                  quieras.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <aside className="grid gap-5 border-t-2 border-tinta pt-7 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 className="font-titular text-xl font-bold tracking-[-0.02em]">
            ¿No es el producto correcto para tu público?
          </h2>
          <p className="mt-2 max-w-[58ch] text-sm leading-relaxed opacity-65">
            Prueba otra categoría o compara precios. No hay límite de productos
            y cada uno genera su propio enlace.
          </p>
        </div>
        <Link
          href="/vendedor/catalogo"
          className={cn(BOTON_SECUNDARIO, "w-full sm:w-auto")}
        >
          Seguir comparando
        </Link>
      </aside>
    </div>
  )
}

function Dato({
  icono: Icono,
  termino,
  children,
}: {
  icono: typeof Boxes
  termino: string
  children: React.ReactNode
}) {
  return (
    <div className="border-t border-tinta/15 py-4 pr-3 sm:border-t-0">
      <dt className="flex items-center gap-2 text-xs font-semibold tracking-[0.1em] uppercase opacity-50">
        <Icono aria-hidden="true" className="size-3.5" />
        {termino}
      </dt>
      <dd className="mt-1.5 text-sm font-semibold">{children}</dd>
    </div>
  )
}

function nombreCondicion(condicion: string) {
  if (condicion === "segunda_mano") return "Segunda mano"
  if (condicion === "reacondicionado") return "Reacondicionado"
  return "Nuevo"
}
