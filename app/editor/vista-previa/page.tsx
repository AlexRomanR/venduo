import { notFound } from "next/navigation"

import { getTiendaParaVistaPrevia } from "@/lib/data/editor"
import { VistaPrevia } from "@/components/editor/vista-previa"

export const metadata = {
  title: "Vista previa",
  robots: { index: false, follow: false },
}

/**
 * La tienda de quien edita, para el `<iframe>` del editor.
 *
 * El carrito de muestra lleva dos productos con stock: el paso del carrito
 * tiene que mostrar un pedido armado, no la pantalla vacía.
 */
export default async function VistaPreviaPage() {
  const tienda = await getTiendaParaVistaPrevia()
  if (!tienda) notFound()

  const muestra = tienda.productos
    .filter((producto) => producto.stock > 0)
    .slice(0, 2)
    .map((producto) => ({
      productoId: producto.id,
      nombre: producto.name,
      precioCents: producto.price_cents,
      imagen: producto.image_url,
      cantidad: 1,
      stock: producto.stock,
    }))

  return <VistaPrevia tienda={tienda} muestra={muestra} />
}
