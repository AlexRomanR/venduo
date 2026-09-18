import { Lock } from "lucide-react"

import { getMisComprasConEnlace } from "@/lib/data/promotor"
import { formatMoney, formatNumber } from "@/lib/format"
import { resumirCompras } from "@/lib/promotor"
import { Cifra, Vacio } from "@/components/panel/piezas"
import { FilaCompra } from "@/components/promotor/piezas"

export const metadata = { title: "Tus compradores" }

/**
 * Quienes compraron con alguno de sus enlaces, compra por compra.
 *
 * Solo las compras que traen su código: la atribución de 90 días y la
 * comisión indirecta siguen existiendo, pero se ven en ganancias.
 */
export default async function CompradoresPage() {
  const compras = await getMisComprasConEnlace()
  const resumen = resumirCompras(compras)

  return (
    <div className="flex flex-col gap-12">
      <div>
        <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          Compras con tu enlace
        </p>
        <h1 className="mt-3 max-w-[18ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance">
          Quienes compraron con tu enlace.
        </h1>
        <p className="mt-3 max-w-[52ch] leading-relaxed opacity-70">
          Cada compra que alguien hizo usando uno de tus enlaces, con lo que te
          dejó.
        </p>
        <p className="mt-4 flex max-w-[52ch] items-start gap-2 text-sm leading-relaxed opacity-70">
          <Lock
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-senal"
          />
          Por su privacidad solo ves su nombre de pila y los dos últimos dígitos
          de su teléfono.
        </p>
      </div>

      <section className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          etiqueta="Compras"
          valor={formatNumber(resumen.compras)}
          detalle="Sin contar las canceladas"
        />
        <Cifra
          etiqueta="Compradores"
          valor={formatNumber(resumen.compradores)}
          detalle={
            resumen.compradores === 1
              ? "persona distinta"
              : "personas distintas"
          }
        />
        <Cifra
          etiqueta="Vendido"
          valor={formatMoney(resumen.vendidoCents)}
          detalle="Al precio publicado"
        />
        <Cifra
          etiqueta="Te dejaron"
          valor={formatMoney(resumen.ganadoCents)}
          detalle="Retenido, por cobrar y cobrado"
        />
      </section>

      {compras.length === 0 ? (
        <Vacio
          titulo="Tu primer comprador está a un enlace de distancia"
          detalle="Aparece acá cuando alguien compra usando uno de tus enlaces."
          accion={{ href: "/vendedor/enlaces", texto: "Compartir mis enlaces" }}
        />
      ) : (
        <section>
          <div className="hidden grid-cols-[1fr_auto_auto] gap-8 border-b-2 border-tinta pb-3 text-xs font-semibold tracking-[0.12em] uppercase opacity-55 sm:grid">
            <span>Comprador</span>
            <span className="text-right">Compra</span>
            <span className="w-40 text-right">Te dejó</span>
          </div>
          <ul className="border-t-2 border-tinta sm:border-t-0">
            {compras.map((compra) => (
              <FilaCompra key={compra.id} compra={compra} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
