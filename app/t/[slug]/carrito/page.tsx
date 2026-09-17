import { notFound } from "next/navigation"

import { getTiendaPublica } from "@/lib/data/tienda-publica"
import { Checkout } from "@/components/tienda/checkout"
import { Cabecera, Pie } from "@/components/tienda/marco"
import { crearPedido, type PedidoInput } from "../acciones"

export const metadata = { title: "Tu carrito" }

export default async function CarritoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tienda = await getTiendaPublica(slug)
  if (!tienda) notFound()

  // El slug se ata acá, del lado del servidor: así el cliente no puede mandar
  // su pedido al catálogo de otra tienda.
  async function pedir(entrada: PedidoInput) {
    "use server"
    return crearPedido(slug, entrada)
  }

  return (
    <>
      <Cabecera
        nombre={tienda.nombre}
        slug={tienda.slug}
        logoUrl={tienda.logoUrl}
        referido={null}
        enlaceDelCarrito={false}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:py-14">
        <h1 className="font-titular text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.03] font-extrabold tracking-[-0.03em]">
          Tu pedido.
        </h1>

        <div className="mt-10">
          <Checkout slug={slug} nombreTienda={tienda.nombre} crear={pedir} />
        </div>
      </main>

      <Pie nombre={tienda.nombre} />
    </>
  )
}
