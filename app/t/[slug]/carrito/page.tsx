import { notFound } from "next/navigation"

import { sugerenciasDelCarrito } from "@/lib/catalogo"
import { getTiendaPublica, marcoDeTienda } from "@/lib/data/tienda-publica"
import { kitDePlantilla } from "@/components/plantillas"
import { Checkout } from "@/components/tienda/checkout"
import { crearPedido, revisarCombos, type PedidoInput } from "../acciones"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // La misma lectura que la página: está en memoria por pedido.
  const tienda = await getTiendaPublica(slug)
  return {
    title: {
      absolute: tienda ? `Tu carrito · ${tienda.nombre}` : "Tu carrito",
    },
  }
}

/**
 * El carrito, y el pedido que sale por WhatsApp.
 *
 * El marco y el título son de la plantilla; el carrito es el mismo en todas,
 * porque lo que hace —mostrar el pedido y mandarlo— no cambia con el rubro.
 * Toma la identidad de los tokens, y cómo se ordena lo elige la tienda.
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

  async function revisar(combos: { catalogo: string; id: string }[]) {
    "use server"
    return revisarCombos(slug, combos)
  }

  const kit = kitDePlantilla(tienda.plantilla)
  const marco = marcoDeTienda(tienda)

  return (
    <>
      <kit.Cabecera marco={marco} enlaceDelCarrito={false} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:py-14">
        <kit.Encabezado titulo="Tu pedido" />

        <div className="mt-10">
          <Checkout
            slug={slug}
            tienda={tienda.esDemo ? undefined : tienda.id}
            nombreTienda={tienda.nombre}
            whatsapp={tienda.whatsapp}
            demo={tienda.esDemo}
            crear={pedir}
            revisarCombos={revisar}
            opciones={tienda.apariencia.carrito}
            sugeridos={
              tienda.apariencia.carrito.sugerencias
                ? sugerenciasDelCarrito(tienda.productos)
                : []
            }
          />
        </div>
      </main>

      <kit.Pie marco={marco} />
    </>
  )
}
