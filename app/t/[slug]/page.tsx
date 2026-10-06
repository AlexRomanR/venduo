import { notFound } from "next/navigation"

import { leerFiltros } from "@/lib/catalogo"
import { getTiendaPublica, marcoDeTienda } from "@/lib/data/tienda-publica"
import { kitDePlantilla } from "@/components/plantillas"
import { BarraDelCarrito } from "@/components/tienda/barra-del-carrito"

/**
 * La portada de la tienda pública.
 *
 * Esta página no sabe qué plantilla tiene la tienda: pide su kit y compone las
 * piezas. Cómo se ordenan los bloques, qué va alrededor y si el catálogo entra
 * en la portada lo decide el kit.
 */
export default async function TiendaPage({
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

  const kit = kitDePlantilla(tienda.plantilla)
  const marco = marcoDeTienda(tienda)

  return (
    <>
      <kit.Cabecera marco={marco} />

      <main className="flex-1">
        <kit.Inicio tienda={tienda} filtros={leerFiltros(consulta)} />
      </main>

      <kit.Pie marco={marco} />
      <BarraDelCarrito slug={tienda.slug} />
    </>
  )
}
