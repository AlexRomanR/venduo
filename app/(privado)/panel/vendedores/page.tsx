import Link from "next/link"
import { ArrowUpRight, ImagePlus } from "lucide-react"

import { getCatalogo } from "@/lib/data/catalogo"
import { getPromotoresDeMiNegocio } from "@/lib/data/panel"
import { getTramos } from "@/lib/data/precios"
import { formatDate, formatMoney, formatNumber } from "@/lib/format"
import { porcentaje } from "@/lib/precio"
import { Cifra, Encabezado, Vacio } from "@/components/panel/piezas"

export const metadata = { title: "Promotores" }

/**
 * Quién promociona lo del negocio.
 *
 * No hay nada que aprobar ni invitaciones que mandar: publicar un producto ya
 * es aceptar que cualquier promotor lo venda, y cada uno elige producto por
 * producto. Esta pantalla solo informa, y señala lo único que el negocio puede
 * hacer para tener más promotores: que sus productos den ganas de compartir.
 */
export default async function PromotoresPage() {
  const [{ promotores, productosPromocionados }, catalogo, tramos] =
    await Promise.all([getPromotoresDeMiNegocio(), getCatalogo(), getTramos()])

  const activos = catalogo.productos.filter((p) => p.is_active)
  const tomados = new Set(promotores.flatMap((p) => p.productos))
  const sinPromotor = activos.filter((p) => !tomados.has(p.name)).slice(0, 6)
  const ventas = promotores.reduce((a, p) => a + p.ventas + p.indirectas, 0)
  const comisiones = promotores.reduce((a, p) => a + p.comisionCents, 0)
  const maximo = Math.max(...tramos.map((t) => t.comisionBps), 0)

  return (
    <div className="flex flex-col gap-12">
      <div>
        <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          Promotores
        </p>
        <h1 className="mt-3 max-w-[20ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em]">
          Quién promociona lo tuyo.
        </h1>
        <p className="mt-3 max-w-[58ch] leading-relaxed opacity-70">
          Cada promotor elige tus productos uno por uno y los comparte con su
          enlace. No tienes que aprobar a nadie: tu producto publicado ya está
          abierto a todos, y su comisión (hasta {porcentaje(maximo)}) ya está
          dentro del precio.
        </p>
      </div>

      <section className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          etiqueta="Promotores"
          valor={formatNumber(promotores.length)}
          detalle="Promocionan o vendieron lo tuyo"
        />
        <Cifra
          etiqueta="Productos elegidos"
          valor={`${formatNumber(productosPromocionados)} de ${formatNumber(activos.length)}`}
          detalle="Tienen al menos un promotor"
        />
        <Cifra
          etiqueta="Ventas que trajeron"
          valor={formatNumber(ventas)}
          detalle="Con enlace o por compradores que volvieron"
        />
        <Cifra
          etiqueta="Comisiones"
          valor={formatMoney(comisiones)}
          detalle="Salieron del precio, no de lo tuyo"
        />
      </section>

      <section>
        <Encabezado etiqueta="Tus promotores" />
        {promotores.length === 0 ? (
          <div className="mt-6">
            <Vacio
              titulo="Todavía nadie eligió tus productos"
              detalle="Ya están en el catálogo de los promotores. Lo que más ayuda a que alguien los tome: una buena foto, un nombre claro y stock disponible."
              accion={{
                href: "/panel/productos",
                texto: "Revisar mis productos",
              }}
            />
          </div>
        ) : (
          <ul className="mt-4 border-t-2 border-tinta">
            {promotores.map((promotor) => (
              <li
                key={promotor.userId}
                className="grid gap-4 border-b border-tinta/15 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-titular text-lg font-bold tracking-[-0.02em]">
                    {promotor.slug ? (
                      <Link
                        href={`/v/${promotor.slug}`}
                        className="group inline-flex min-h-11 items-center gap-1.5 transition-colors hover:text-senal"
                      >
                        {promotor.nombre}
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4 opacity-40 transition-opacity group-hover:opacity-100"
                        />
                      </Link>
                    ) : (
                      promotor.nombre
                    )}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed opacity-60">
                    {promotor.productos.length > 0
                      ? promotor.productos.slice(0, 4).join(" · ") +
                        (promotor.productos.length > 4
                          ? ` y ${promotor.productos.length - 4} más`
                          : "")
                      : "Ya no promociona productos tuyos"}
                  </p>
                  {promotor.desde ? (
                    <p className="mt-1 text-xs opacity-45">
                      Desde el {formatDate(promotor.desde)}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-baseline gap-6 sm:block sm:text-right">
                  <p className="tabular font-titular text-xl font-extrabold tracking-[-0.03em]">
                    {formatNumber(promotor.ventas + promotor.indirectas)}{" "}
                    <span className="text-sm font-semibold opacity-55">
                      {promotor.ventas + promotor.indirectas === 1
                        ? "venta"
                        : "ventas"}
                    </span>
                  </p>
                  <p className="tabular text-xs opacity-55">
                    {formatMoney(promotor.comisionCents)} de comisión
                    {promotor.indirectas > 0
                      ? ` · ${formatNumber(promotor.indirectas)} de compradores que volvieron`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {sinPromotor.length > 0 ? (
        <section>
          <Encabezado
            etiqueta="Sin promotor todavía"
            titulo="Estos productos nadie los eligió"
            accion={{ href: "/panel/productos", texto: "Ver catálogo" }}
          />
          <p className="mt-3 max-w-[58ch] text-sm leading-relaxed opacity-70">
            Un producto sin foto casi nunca se elige: el promotor tiene que
            poder mostrarlo. Súmale una foto clara y aparece mejor en el
            catálogo.
          </p>
          <ul className="mt-6 border-t border-tinta/15">
            {sinPromotor.map((producto) => (
              <li key={producto.id} className="border-b border-tinta/15">
                <Link
                  href={`/panel/productos/${producto.id}`}
                  className="group flex min-h-14 items-center justify-between gap-4 py-3 transition-colors hover:text-senal"
                >
                  <span className="font-titular font-bold tracking-[-0.01em]">
                    {producto.name}
                  </span>
                  <span className="flex items-center gap-2 text-xs font-semibold opacity-55 group-hover:opacity-100">
                    {producto.images.length === 0 ? (
                      <>
                        <ImagePlus aria-hidden="true" className="size-4" />
                        Sin foto
                      </>
                    ) : (
                      formatMoney(producto.price_cents)
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
