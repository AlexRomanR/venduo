import Link from "next/link"
import { ArrowRight, Link2, Store, Tag } from "lucide-react"

import { getVinculosDeVendedor } from "@/lib/data/panel"
import { getNombreDeTienda } from "@/lib/data/vitrina"
import { slugify } from "@/lib/format"
import { FormularioSumarme } from "@/components/onboarding/formulario-sumarme"
import { Invitacion } from "@/components/onboarding/invitacion"
import { MarcoDeCuenta } from "@/components/panel/armazon"

export const metadata = { title: "Empezar a vender" }

const CAMINOS = [
  {
    href: "/explorar/tiendas",
    icono: Store,
    titulo: "Súmate a una tienda",
    detalle:
      "Vendes su catálogo completo. Algunas te aceptan al instante y otras revisan tu solicitud.",
    accion: "Ver tiendas",
  },
  {
    href: "/explorar/productos",
    icono: Tag,
    titulo: "Toma productos sueltos",
    detalle:
      "Eliges productos que cada tienda marcó como disponibles. Recibes tu enlace al instante.",
    accion: "Ver productos",
  },
]

/**
 * Onboarding del vendedor: el reparto de caminos.
 *
 * Las dos vitrinas son rutas propias y no pestañas de acá: cada una es un
 * catálogo que va a crecer, con su búsqueda y su paginación. Esta pantalla
 * solo explica y reparte.
 */
export default async function SumarmePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; inv?: string }>
}) {
  const { t, inv } = await searchParams

  // El enlace de invitación trae las dos cosas; una sola no alcanza.
  const slug = t ? slugify(t) : null
  const codigo = inv ? inv.trim().toUpperCase() : null

  const [vinculos, nombreTienda] = await Promise.all([
    getVinculosDeVendedor(),
    slug && codigo ? getNombreDeTienda(slug) : Promise.resolve(null),
  ])

  const invitacion = slug && codigo ? { slug, codigo, nombreTienda } : null

  return (
    <MarcoDeCuenta>
      {invitacion ? (
        <Invitacion
          slug={invitacion.slug}
          nombre={invitacion.nombreTienda}
          codigo={invitacion.codigo}
        />
      ) : null}

      <div>
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Empezar a vender
          </p>
          <h1 className="mt-5 max-w-[15ch] font-titular text-[clamp(2.25rem,7vw,3.75rem)] leading-[0.98] font-extrabold tracking-[-0.035em] text-balance">
            {vinculos.length > 0
              ? "Suma otra tienda a tu historial."
              : "Elige qué vas a vender."}
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg leading-relaxed opacity-70">
            Trabajas a comisión para uno o varios negocios. No pagas nada, no
            compras stock y no necesitas tener tu propia tienda. Cada venta
            queda registrada con tu nombre.
          </p>
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-2 border-t border-tinta/15 pt-2 sm:grid-cols-2">
          {CAMINOS.map((camino) => {
            const Icono = camino.icono

            return (
              <Link
                key={camino.href}
                href={camino.href}
                className="group flex flex-col border-t-2 border-tinta/15 py-8 transition-colors duration-300 hover:border-senal"
              >
                <Icono
                  aria-hidden="true"
                  className="size-5 opacity-40 transition-colors group-hover:text-senal group-hover:opacity-100"
                />
                <h2 className="mt-4 font-titular text-2xl font-extrabold tracking-[-0.03em] transition-colors group-hover:text-senal">
                  {camino.titulo}
                </h2>
                <p className="mt-3 max-w-[40ch] flex-1 leading-relaxed opacity-70">
                  {camino.detalle}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                  {camino.accion}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
                  />
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mt-16 grid gap-10 border-t border-tinta/15 pt-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-senal uppercase">
              <Link2 aria-hidden="true" className="size-4" />
              ¿Te pasaron un enlace?
            </p>
            <h2 className="mt-5 max-w-[18ch] font-titular text-[clamp(1.5rem,4vw,2rem)] leading-[1.06] font-extrabold tracking-[-0.03em]">
              Pégalo y te sumamos.
            </h2>
            <p className="mt-3 max-w-[46ch] leading-relaxed opacity-70">
              Es lo más común: alguien te habla de su tienda y te manda el
              enlace por WhatsApp. No hace falta buscarla en ningún listado.
            </p>
          </div>

          <div className="lg:pt-2">
            <FormularioSumarme />
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-tinta/15 pt-6">
          <p className="flex-1 text-sm opacity-55">
            Desde los 16 años. Sin inversión inicial, y la comisión la define
            cada tienda.
          </p>
          {/* El rol con el que alguien se registró es una intención, no una
              condena: si quiere su propia tienda, la puerta está a la vista. */}
          <Link
            href="/crear?abrir=1"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
          >
            ¿Prefieres abrir tu propia tienda?
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </MarcoDeCuenta>
  )
}
