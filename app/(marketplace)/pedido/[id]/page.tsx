import { notFound } from "next/navigation"

import { PagoProtegido } from "@/components/marketplace/pago-protegido"
import { getPedidoPublico } from "@/lib/data/tienda-publica"

export default async function PedidoMarketplacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pedido = await getPedidoPublico(id)
  if (!pedido) notFound()

  return (
    <div className="px-5 py-8 lg:px-10 lg:py-10">
      <div className="mb-8">
        <h1 className="max-w-[16ch] font-titular text-[clamp(2.5rem,7vw,4.75rem)] leading-[0.95] font-extrabold tracking-[-0.04em]">
          Pago y seguimiento
        </h1>
        <p className="mt-4 max-w-[52ch] leading-relaxed opacity-65">
          Desde aquí pagas, coordinas la entrega y decides cuándo se libera tu
          dinero.
        </p>
      </div>
      <div className="max-w-3xl">
        <PagoProtegido pedido={pedido} />
      </div>
    </div>
  )
}
