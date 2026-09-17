import { notFound } from "next/navigation"

import { relacionados } from "@/lib/plantillas/bloques"
import {
  codigoDeReferido,
  getProductoPublico,
  getReferido,
  marcoDeTienda,
} from "@/lib/data/tienda-publica"
import { kitDePlantilla } from "@/components/plantillas"
import { BarraDelCarrito } from "@/components/tienda/barra-del-carrito"

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
 * Tiene URL propia porque es lo que reparte un vendedor cuando toma un producto
 * suelto: comparte este enlace con su código, no la tienda entera. Por eso
 * lleva también su propia tarjeta para WhatsApp, con la foto del producto.
 */
export default async function ProductoPublicoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug, id } = await params
  const encontrado = await getProductoPublico(slug, id)
  if (!encontrado) notFound()

  const { tienda, producto } = encontrado

  const consulta = await searchParams
  const codigo = codigoDeReferido(consulta.ref)
  const referido = await getReferido(tienda.id, codigo)

  const kit = kitDePlantilla(tienda.plantilla)
  const marco = marcoDeTienda(tienda)

  return (
    <>
      <kit.Cabecera marco={marco} referido={referido} codigo={codigo} />

      <main className="flex-1">
        <kit.Ficha
          tienda={tienda}
          producto={producto}
          codigo={codigo}
          relacionados={relacionados(producto, tienda.productos)}
        />
      </main>

      <kit.Pie marco={marco} codigo={codigo} />
      <BarraDelCarrito slug={tienda.slug} />
    </>
  )
}
