import { redirect } from "next/navigation"

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
  void slug
  redirect(`/pedido/${id}`)
}
