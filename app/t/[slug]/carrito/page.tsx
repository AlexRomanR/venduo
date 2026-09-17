import { notFound } from "next/navigation"

import { getTiendaPublica, marcoDeTienda } from "@/lib/data/tienda-publica"
import { kitDePlantilla } from "@/components/plantillas"
import { Checkout } from "@/components/tienda/checkout"
import { crearPedido, type PedidoInput } from "../acciones"

export const metadata = { title: "Tu carrito" }

/**
 * El carrito y el checkout.
 *
 * El marco y el título son de la plantilla; el formulario es el mismo en todas,
 * porque lo que pide —quién eres y cómo te contactan— no cambia con el rubro.
 * Toma la identidad de los tokens.
 */
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

  const kit = kitDePlantilla(tienda.plantilla)
  const marco = marcoDeTienda(tienda)

  return (
    <>
      <kit.Cabecera
        marco={marco}
        referido={null}
        codigo={null}
        enlaceDelCarrito={false}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:py-14">
        <kit.Encabezado titulo="Tu pedido" />

        <div className="mt-10">
          <Checkout slug={slug} nombreTienda={tienda.nombre} crear={pedir} />
        </div>
      </main>

      <kit.Pie marco={marco} codigo={null} />
    </>
  )
}
