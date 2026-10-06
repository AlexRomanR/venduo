import { notFound } from "next/navigation"

import { filtrarCatalogo, leerFiltros } from "@/lib/catalogo"
import { getTiendaPublica, marcoDeTienda } from "@/lib/data/tienda-publica"
import { kitDePlantilla } from "@/components/plantillas"
import { BarraDelCarrito } from "@/components/tienda/barra-del-carrito"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tienda = await getTiendaPublica(slug)
  return {
    title: { absolute: tienda ? `Catálogo · ${tienda.nombre}` : "Catálogo" },
  }
}

/**
 * El catálogo completo, con filtros, búsqueda y orden.
 *
 * Los filtros viven en la URL: "solo segunda mano, de menor a mayor precio" es
 * un enlace que la tienda puede mandar por WhatsApp tal cual.
 */
export default async function CatalogoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const tienda = await getTiendaPublica(slug)
  if (!tienda) notFound()

  const consulta = await searchParams
  const filtros = leerFiltros(consulta)

  const kit = kitDePlantilla(tienda.plantilla)
  const marco = marcoDeTienda(tienda)

  return (
    <>
      <kit.Cabecera marco={marco} />

      <main className="flex-1">
        <kit.Catalogo
          tienda={tienda}
          filtros={filtros}
          productos={filtrarCatalogo(tienda.productos, filtros)}
        />
      </main>

      <kit.Pie marco={marco} />
      <BarraDelCarrito slug={tienda.slug} />
    </>
  )
}
