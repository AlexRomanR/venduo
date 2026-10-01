import { notFound } from "next/navigation"

import { getTiendaParaVistaPrevia } from "@/lib/data/editor"
import { productosDeEjemplo } from "@/lib/editor/muestras"
import { VistaPrevia } from "@/components/editor/vista-previa"

export const metadata = {
  title: "Vista previa",
  robots: { index: false, follow: false },
}

// Es la tienda de quien edita: nunca puede salir del build como página fija.
// Sin credenciales —el CI, el modo demo— no lee cookies, así que Next
// intentaba dibujarla de antemano y el build se caía en la cabecera, que lee
// la URL del navegador.
export const dynamic = "force-dynamic"

/**
 * La tienda de quien edita, para el `<iframe>` del editor.
 *
 * El carrito de muestra lleva dos productos con stock: el paso del carrito
 * tiene que mostrar un pedido armado, no la pantalla vacía. Sin productos
 * propios, salen de los de ejemplo de su plantilla.
 */
export default async function VistaPreviaPage() {
  const tienda = await getTiendaParaVistaPrevia()
  if (!tienda) notFound()

  const ejemplos = productosDeEjemplo(tienda.plantilla, tienda.id)
  const conStock = tienda.productos.filter((producto) => producto.stock > 0)

  const muestra = (conStock.length > 0 ? conStock : ejemplos)
    .slice(0, 2)
    .map((producto) => ({
      productoId: producto.id,
      nombre: producto.name,
      precioCents: producto.price_cents,
      imagen: producto.image_url,
      cantidad: 1,
      stock: producto.stock,
    }))

  return <VistaPrevia tienda={tienda} muestra={muestra} ejemplos={ejemplos} />
}
