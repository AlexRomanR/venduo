import { redirect } from "next/navigation"

import { PagoProtegido } from "@/components/marketplace/pago-protegido"
import { getPedidoPublico } from "@/lib/data/tienda-publica"

export const metadata = { title: "Pago protegido · Venduo" }

export default async function PagoMarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ pedidos?: string }>
}) {
  const { pedidos: parametro } = await searchParams
  const ids = (parametro ?? "")
    .split(",")
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id))
    .slice(0, 12)
  if (ids.length === 0) redirect("/carrito")

  const pedidos = (await Promise.all(ids.map(getPedidoPublico))).filter(
    (pedido) => pedido !== null
  )
  if (pedidos.length === 0) redirect("/carrito")

  return (
    <div className="px-5 py-8 lg:px-10 lg:py-10">
      <div className="grid gap-8 border-b border-tinta/15 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="max-w-[15ch] font-titular text-[clamp(2.5rem,7vw,4.75rem)] leading-[0.95] font-extrabold tracking-[-0.04em]">
            Paga. Recibe. Recién se libera.
          </h1>
          <p className="mt-4 max-w-[54ch] leading-relaxed opacity-65">
            Cada negocio tiene su propio pedido. PagoFácil retiene cada monto
            hasta que confirmas la entrega.
          </p>
        </div>
        <p className="tabular text-sm font-semibold opacity-55">
          {pedidos.length}{" "}
          {pedidos.length === 1 ? "pago protegido" : "pagos protegidos"}
        </p>
      </div>
      <div className="mt-10 grid gap-12 xl:grid-cols-2">
        {pedidos.map((pedido) => (
          <PagoProtegido key={pedido.id} pedido={pedido} />
        ))}
      </div>
    </div>
  )
}
