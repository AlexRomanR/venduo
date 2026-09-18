import { formatMoney } from "@/lib/format"
import { construirPrecio, porcentaje, type Tramo } from "@/lib/precio"

/**
 * El mecanismo del producto, con números.
 *
 * La pregunta que aparece primero, de los dos lados, es la misma: "¿y cuánto
 * me queda a mí?". Se contesta con una cuenta hecha, no con un párrafo.
 *
 * Los porcentajes salen de los tramos reales (`pricing_tiers`), así que si
 * cambian, cambia esto. El producto del ejemplo es inventado y lo dice al pie.
 */
export function PrecioEjemplo({
  tramos,
  baseCents = 15000,
  nombre = "Mochila artesanal",
}: {
  tramos: Tramo[]
  baseCents?: number
  nombre?: string
}) {
  const precio = construirPrecio(baseCents, tramos)

  return (
    <div className="border-2 border-tinta bg-papel">
      <div className="border-b border-tinta/15 px-6 py-4">
        <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          Así se arma un precio
        </p>
        <p className="mt-2 font-titular text-lg font-bold tracking-[-0.02em]">
          {nombre}
        </p>
      </div>

      <dl className="px-6 py-5">
        <Fila
          etiqueta="Lo que el negocio quiere recibir"
          valor={formatMoney(precio.baseCents)}
          fuerte
        />
        <Fila
          etiqueta={`Comisión del promotor · ${porcentaje(precio.comisionBps)}`}
          valor={formatMoney(precio.comisionCents)}
        />
        <Fila
          etiqueta={`Venduo · ${porcentaje(precio.takeBps)}`}
          valor={formatMoney(precio.takeCents)}
        />
      </dl>

      <div className="flex items-baseline justify-between gap-4 border-t-2 border-tinta px-6 py-5">
        <span className="font-titular text-lg font-bold tracking-[-0.02em]">
          Precio publicado
        </span>
        <span className="tabular font-titular text-[clamp(1.75rem,5vw,2.25rem)] leading-none font-extrabold tracking-[-0.03em] text-senal">
          {formatMoney(precio.precioCents)}
        </span>
      </div>

      <p className="border-t border-tinta/15 px-6 py-4 text-xs leading-relaxed opacity-55">
        El porcentaje baja cuando sube el precio. Producto de ejemplo; los
        porcentajes son los que usa Venduo hoy.
      </p>
    </div>
  )
}

function Fila({
  etiqueta,
  valor,
  fuerte = false,
}: {
  etiqueta: string
  valor: string
  fuerte?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-tinta/15 py-3 last:border-b-0">
      <dt className={fuerte ? "text-sm" : "text-sm opacity-70"}>{etiqueta}</dt>
      <dd
        className={
          fuerte
            ? "tabular text-sm font-semibold"
            : "tabular text-sm opacity-70"
        }
      >
        {valor}
      </dd>
    </div>
  )
}
