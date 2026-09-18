import Link from "next/link"
import { ImagePlus } from "lucide-react"

import { getCatalogo } from "@/lib/data/catalogo"
import {
  getMiTienda,
  getPromotoresDeMiNegocio,
  getRankingPromotoresGlobal,
} from "@/lib/data/panel"
import { getTramos } from "@/lib/data/precios"
import { formatMoney, formatNumber } from "@/lib/format"
import { porcentaje } from "@/lib/precio"
import { transformarARankingMiNegocio } from "@/lib/promotor"
import { Cifra, Encabezado } from "@/components/panel/piezas"
import { RankingPromotores } from "@/components/panel/ranking-promotores"

export const metadata = { title: "Promotores y Ranking" }

/**
 * Quién promociona lo del negocio y tabla de líderes.
 *
 * No hay nada que aprobar ni invitaciones que mandar: publicar un producto ya
 * es aceptar que cualquier promotor lo venda, y cada uno elige producto por
 * producto. Esta pantalla informa quién vende lo tuyo y muestra el ranking
 * comparativo tanto dentro de tu negocio como en toda la red Venduo.
 */
export default async function PromotoresPage() {
  const [
    { promotores, productosPromocionados },
    { ranking: rankingGlobal },
    catalogo,
    tramos,
    tienda,
  ] = await Promise.all([
    getPromotoresDeMiNegocio(),
    getRankingPromotoresGlobal(),
    getCatalogo(),
    getTramos(),
    getMiTienda(),
  ])

  const rankingMiNegocio = transformarARankingMiNegocio(promotores)
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
        <Encabezado
          etiqueta="Tabla de líderes"
          titulo="Ranking de promotores"
        />
        <div className="mt-6">
          <RankingPromotores
            rankingMiNegocio={rankingMiNegocio}
            rankingGlobal={rankingGlobal}
            nombreNegocio={tienda?.name ?? "tu tienda"}
          />
        </div>
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
