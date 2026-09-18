import { Lock, Repeat, Timer } from "lucide-react"

import { getMisCompradores } from "@/lib/data/promotor"
import { getTramos } from "@/lib/data/precios"
import { formatMoney, formatNumber } from "@/lib/format"
import { porcentaje } from "@/lib/precio"
import { Cifra, Vacio } from "@/components/panel/piezas"
import { FilaComprador } from "@/components/promotor/piezas"

export const metadata = { title: "Compradores que trajiste" }

/**
 * Las ventas indirectas: a quién trajo y qué dejó cada uno.
 *
 * Es lo menos intuitivo del modelo —ganar por una compra que no hizo— así que
 * la explicación va antes que la lista y no en un pie de página.
 *
 * El teléfono llega censurado desde `mis_compradores()`: el promotor no
 * necesita el número de nadie para cobrar, y un comprador no dio su teléfono
 * para que lo tenga un tercero. Si esa persona tiene cuenta en Venduo, se ve
 * su nombre.
 */
export default async function CompradoresPage() {
  const [compradores, tramos] = await Promise.all([
    getMisCompradores(),
    getTramos(),
  ])

  const vigentes = compradores.filter((c) => c.vigente).length
  const compras = compradores.reduce((acc, c) => acc + c.comprasIndirectas, 0)
  const ganado = compradores.reduce(
    (acc, c) => acc + c.comisionIndirectaCents,
    0
  )
  const maxima = Math.max(...tramos.map((t) => t.indirectaBps), 0)

  return (
    <div className="flex flex-col gap-12">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            Ventas indirectas
          </p>
          <h1 className="mt-3 max-w-[16ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance">
            Los compradores que trajiste.
          </h1>
          <p className="mt-3 max-w-[52ch] leading-relaxed opacity-70">
            Quien compra por primera vez con tu enlace queda contigo. Si vuelve
            y compra por su cuenta, ganas igual, hasta {porcentaje(maxima)} de
            cada compra.
          </p>
        </div>

        <ul className="grid content-start gap-4 border-t-2 border-tinta pt-5 text-sm">
          {[
            {
              icono: Repeat,
              texto:
                "El primero que lo trae se lo queda. Si después entra con el enlace de otro, sigue siendo tuyo.",
            },
            {
              icono: Timer,
              texto:
                "Dura 90 días desde su primera compra. Pasado ese plazo, lo que compre vuelve al negocio.",
            },
            {
              icono: Lock,
              texto:
                "Por su privacidad solo ves los dos últimos dígitos de su teléfono, salvo que tenga cuenta en Venduo.",
            },
          ].map((regla) => (
            <li key={regla.texto} className="flex gap-3">
              <regla.icono
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-senal"
              />
              <span className="leading-relaxed opacity-80">{regla.texto}</span>
            </li>
          ))}
        </ul>
      </div>

      <section className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          etiqueta="Trajiste"
          valor={formatNumber(compradores.length)}
          detalle={
            compradores.length === 1 ? "comprador nuevo" : "compradores nuevos"
          }
        />
        <Cifra
          etiqueta="Siguen contigo"
          valor={formatNumber(vigentes)}
          detalle="Dentro de los 90 días"
        />
        <Cifra
          etiqueta="Volvieron a comprar"
          valor={formatNumber(compras)}
          detalle="Sin tu enlace"
        />
        <Cifra
          etiqueta="Ganado así"
          valor={formatMoney(ganado)}
          detalle="Sin hacer nada más"
        />
      </section>

      {compradores.length === 0 ? (
        <Vacio
          titulo="Tu primer comprador está a un enlace de distancia"
          detalle="Aparece acá cuando alguien compra por primera vez con tu enlace y el pago entra. Desde ese día, cada compra suya te deja algo."
          accion={{ href: "/vendedor/enlaces", texto: "Compartir mis enlaces" }}
        />
      ) : (
        <section>
          <div className="hidden grid-cols-[1fr_auto_auto] gap-8 border-b-2 border-tinta pb-3 text-xs font-semibold tracking-[0.12em] uppercase opacity-55 sm:grid">
            <span>Comprador</span>
            <span className="text-right">Te dejó</span>
            <span className="w-36">Sigue contigo</span>
          </div>
          <ul className="border-t-2 border-tinta sm:border-t-0">
            {compradores.map((comprador) => (
              <FilaComprador key={comprador.id} comprador={comprador} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
