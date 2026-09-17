import { notFound } from "next/navigation"

import { filtrarCatalogo, leerFiltros } from "@/lib/catalogo"
import {
  codigoDeReferido,
  getReferido,
  getTiendaPublica,
  marcoDeTienda,
} from "@/lib/data/tienda-publica"
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
 * un enlace que un vendedor puede mandar por WhatsApp tal cual.
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
  const codigo = codigoDeReferido(consulta.ref)
  const referido = await getReferido(tienda.id, codigo)
  const filtros = leerFiltros(consulta)

  const kit = kitDePlantilla(tienda.plantilla)
  const marco = marcoDeTienda(tienda)

  return (
    <>
      <kit.Cabecera marco={marco} referido={referido} codigo={codigo} />

      <main className="flex-1">
        <kit.Catalogo
          tienda={tienda}
          codigo={codigo}
          filtros={filtros}
          productos={filtrarCatalogo(tienda.productos, filtros)}
        />
      </main>

      <kit.Pie marco={marco} codigo={codigo} />
      <BarraDelCarrito slug={tienda.slug} />
    </>
  )
}
