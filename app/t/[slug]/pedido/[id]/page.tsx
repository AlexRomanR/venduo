import { notFound } from "next/navigation"

import { getPedidoPublico } from "@/lib/data/tienda-publica"
import { Cabecera, Pie } from "@/components/tienda/marco"
import { Pago } from "@/components/tienda/pago"
import { adjuntarComprobante } from "../../acciones"

export const metadata = { title: "Tu pedido" }

/**
 * El pago de un pedido.
 *
 * La llave es el identificador del pedido, que es un uuid: quien tiene el
 * enlace es quien acaba de comprar. Es el mismo trato que hace cualquier
 * checkout de invitado, y evita pedirle una cuenta a alguien que solo quiere
 * comprar una polera.
 */
export default async function PagoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const pedido = await getPedidoPublico(id)

  // Se comprueba que el pedido sea de esta tienda: el identificador de otra no
  // abre una pantalla con el nombre y el QR equivocados.
  if (!pedido || pedido.tienda.slug !== slug) notFound()

  return (
    <>
      <Cabecera
        nombre={pedido.tienda.nombre}
        slug={pedido.tienda.slug}
        logoUrl={pedido.tienda.logoUrl}
        referido={null}
        enlaceDelCarrito={false}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:py-14">
        <Pago pedido={pedido} adjuntar={adjuntarComprobante} />
      </main>

      <Pie nombre={pedido.tienda.nombre} />
    </>
  )
}
