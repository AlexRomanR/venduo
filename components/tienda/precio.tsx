import { formatMoney } from "@/lib/format"
import { rangoDePrecio } from "@/lib/variantes"
import type { Product } from "@/types"

/**
 * El precio de un producto en la tienda: "Desde Bs 180" cuando sus variantes
 * cuestan distinto —la XL o los 100 ml valen más—, y el precio a secas si no.
 *
 * Lo usan las tarjetas y las fichas de todos los kits: el producto llega como
 * `Product` y sus variantes, si las trae, viajan con él.
 */
export function PrecioDeVitrina({
  producto,
}: {
  producto: Product & { variantes?: { precioCents: number | null }[] }
}) {
  const { desde, hasta } = rangoDePrecio(
    producto.price_cents,
    producto.variantes ?? []
  )
  return desde < hasta ? (
    <>
      <span className="font-normal opacity-70">Desde </span>
      {formatMoney(desde)}
    </>
  ) : (
    <>{formatMoney(producto.price_cents)}</>
  )
}
