import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ShieldCheck, UserRound } from "lucide-react"

import { getPerfilPublico } from "@/lib/data/vendedor"
import { formatMoney, formatNumber } from "@/lib/format"
import { Logo } from "@/components/marca/logo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const perfil = await getPerfilPublico(slug)

  if (!perfil) return { title: "Perfil no encontrado" }

  return {
    title: `${perfil.displayName} — historial de ventas`,
    description: `${perfil.displayName} acumula ${perfil.ventas} ventas verificadas en Venduo.`,
  }
}

/**
 * Historial laboral verificable del vendedor.
 *
 * Es público y estable a propósito: se adjunta a una postulación y lo abre
 * alguien sin cuenta. Las cifras salen de `seller_public_stats`, que expone
 * solo el agregado — nunca el detalle por pedido ni quién compró.
 *
 * Lo que hace creíble esta página es que el vendedor no la escribe: los
 * números vienen de comisiones confirmadas, y las tiendas del nombre copiado
 * en cada una, que sobrevive aunque el comercio ya no exista.
 */
export default async function PerfilVendedorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const perfil = await getPerfilPublico(slug)

  if (!perfil) notFound()

  const desde = perfil.desde
    ? new Date(perfil.desde).toLocaleDateString("es-BO", {
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <div className="flex min-h-screen flex-col bg-papel text-tinta">
      <header className="border-b border-tinta/15">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3.5">
          <Link href="/" className="flex min-h-11 flex-1 items-center text-lg">
            <Logo />
          </Link>
          <Link
            href="/login?rol=vendedor"
            className="flex min-h-11 items-center rounded-sm bg-senal px-4 text-sm font-semibold text-white transition-colors hover:bg-senal-alta"
          >
            Quiero vender
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-5 py-12 lg:py-16">
          <div className="flex flex-wrap items-start gap-6">
            <div className="size-24 shrink-0 overflow-hidden border border-tinta bg-tinta/5">
              {perfil.avatarUrl ? (
                <Image
                  src={perfil.avatarUrl}
                  alt={perfil.displayName}
                  width={192}
                  height={192}
                  unoptimized
                  className="size-full object-cover grayscale"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <UserRound aria-hidden="true" className="size-9 opacity-25" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-senal uppercase">
                <ShieldCheck aria-hidden="true" className="size-4" />
                Historial verificado
              </p>
              <h1 className="mt-3 font-titular text-[clamp(2rem,6vw,3.25rem)] leading-[1] font-extrabold tracking-[-0.035em]">
                {perfil.displayName}
              </h1>
              {perfil.city ? (
                <p className="mt-2 text-sm tracking-[0.12em] uppercase opacity-55">
                  {perfil.city}
                </p>
              ) : null}
            </div>
          </div>

          {perfil.bio ? (
            <p className="mt-8 max-w-[56ch] text-lg leading-relaxed opacity-70">
              {perfil.bio}
            </p>
          ) : null}

          <div className="mt-12 grid gap-x-8 gap-y-8 border-t border-tinta/15 pt-2 sm:grid-cols-3">
            <Numeral
              valor={formatNumber(perfil.ventas)}
              detalle={
                perfil.ventas === 1 ? "Venta confirmada" : "Ventas confirmadas"
              }
            />
            <Numeral
              valor={formatMoney(perfil.volumenCents)}
              detalle="Vendidos en total"
            />
            <Numeral
              valor={formatNumber(perfil.tiendas)}
              detalle={
                perfil.tiendas === 1
                  ? "Tienda que lo empleó"
                  : "Tiendas que lo emplearon"
              }
            />
          </div>

          {desde ? (
            <p className="mt-8 text-sm opacity-55">
              Activo desde <span className="font-semibold">{desde}</span>.
            </p>
          ) : null}

          <section className="mt-16">
            <h2 className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
              Dónde vendió
            </h2>

            {perfil.historial.length === 0 ? (
              <p className="mt-6 max-w-[56ch] border-t-2 border-tinta pt-6 leading-relaxed opacity-70">
                Todavía no tiene ventas confirmadas. Este historial se llena
                solo, a medida que vende.
              </p>
            ) : (
              <ul className="mt-6">
                {perfil.historial.map((item) => (
                  <li
                    key={item.storeName}
                    className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-tinta/15 py-5"
                  >
                    <span className="flex-1 font-titular text-lg font-bold tracking-[-0.02em]">
                      {item.storeName}
                    </span>
                    <span className="tabular text-sm opacity-70">
                      {formatNumber(item.ventas)}{" "}
                      {item.ventas === 1 ? "venta" : "ventas"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="mt-16 max-w-[64ch] border-t border-tinta/15 pt-6 text-sm leading-relaxed opacity-55">
            Este historial lo construye Venduo a partir de ventas confirmadas.
            No lo edita la persona y no se puede inflar: cada cifra corresponde
            a un pedido cobrado por una tienda real. Se conserva aunque esa
            tienda deje la plataforma.
          </p>
        </div>
      </main>

      <footer className="border-t border-tinta/15">
        <div className="mx-auto max-w-6xl px-5 py-6 text-sm opacity-60">
          Venduo · Santa Cruz · La Paz · Cochabamba
        </div>
      </footer>
    </div>
  )
}

function Numeral({ valor, detalle }: { valor: string; detalle: string }) {
  return (
    <div className="border-t-2 border-tinta pt-4">
      <p className="tabular font-titular text-[clamp(2rem,6vw,3rem)] leading-none font-extrabold tracking-[-0.04em] text-senal">
        {valor}
      </p>
      <p className="mt-3 text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
        {detalle}
      </p>
    </div>
  )
}
