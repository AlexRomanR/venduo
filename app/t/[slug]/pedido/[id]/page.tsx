import { notFound } from "next/navigation"

import {
  getPedidoPublico,
  getTiendaPublica,
  marcoDeTienda,
  type MarcoDeTienda,
} from "@/lib/data/tienda-publica"
import { kitDePlantilla } from "@/components/plantillas"
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
  const [pedido, tienda] = await Promise.all([
    getPedidoPublico(id),
    getTiendaPublica(slug),
  ])

  // Se comprueba que el pedido sea de esta tienda: el identificador de otra no
  // abre una pantalla con el nombre y el QR equivocados.
  if (!pedido || pedido.tienda.slug !== slug) notFound()

  // Un pedido sigue siendo visible aunque la tienda haya dejado de servirse:
  // quien ya pagó tiene que poder volver a su comprobante. Sin tienda viva se
  // dibuja con la base.
  const marco: MarcoDeTienda = tienda
    ? marcoDeTienda(tienda)
    : {
        slug: pedido.tienda.slug,
        nombre: pedido.tienda.nombre,
        logoUrl: pedido.tienda.logoUrl,
        whatsapp: pedido.tienda.whatsapp,
        categorias: [],
      }
  const kit = kitDePlantilla(tienda?.plantilla)

  return (
    <>
      <kit.Cabecera
        marco={marco}
        referido={null}
        codigo={null}
        enlaceDelCarrito={false}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:py-14">
        <Pago pedido={pedido} adjuntar={adjuntarComprobante} />
      </main>

      <kit.Pie marco={marco} codigo={null} />
    </>
  )
}
