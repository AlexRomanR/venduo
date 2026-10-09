import { notFound } from "next/navigation"

import { relacionados } from "@/lib/plantillas/bloques"
import { getProductoPublico, marcoDeTienda } from "@/lib/data/tienda-publica"
import { kitDePlantilla } from "@/components/plantillas"
import { BarraDeCompra } from "@/components/tienda/barra-de-compra"
import { BarraDelCarrito } from "@/components/tienda/barra-del-carrito"
import { RegistroDeVisita } from "@/components/tienda/visita"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const encontrado = await getProductoPublico(slug, id)
  if (!encontrado) return { title: "Producto no encontrado" }

  const { tienda, producto } = encontrado
  return {
    title: { absolute: `${producto.name} · ${tienda.nombre}` },
    description: producto.description ?? undefined,
    openGraph: {
      title: producto.name,
      description: producto.description ?? undefined,
      images: producto.image_url ? [{ url: producto.image_url }] : undefined,
    },
  }
}

/**
 * Un producto de la tienda pública.
 *
 * Tiene URL propia porque es lo que se reparte cuando alguien pregunta por un
 * producto: se comparte este enlace, no la tienda entera. Por eso lleva
 * también su propia tarjeta para WhatsApp, con la foto del producto.
 */
export default async function ProductoPublicoPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const encontrado = await getProductoPublico(slug, id)
  if (!encontrado) notFound()

  const { tienda, producto } = encontrado

  const kit = kitDePlantilla(tienda.plantilla)
  const marco = marcoDeTienda(tienda)

  return (
    <>
      <kit.Cabecera marco={marco} />

      <main className="flex-1">
        <kit.Ficha
          tienda={tienda}
          producto={producto}
          relacionados={relacionados(producto, tienda.productos)}
        />
      </main>

      <kit.Pie marco={marco} />
      {/* Una sola barra abajo: la de compra ya lleva al carrito. */}
      {tienda.apariencia.ficha.barraFija ? (
        <BarraDeCompra producto={producto} slug={tienda.slug} />
      ) : (
        <BarraDelCarrito slug={tienda.slug} />
      )}
      {tienda.esDemo ? null : (
        <RegistroDeVisita
          tienda={tienda.id}
          tipo="producto"
          producto={producto.id}
        />
      )}
    </>
  )
}
