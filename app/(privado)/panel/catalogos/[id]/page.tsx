import { notFound } from "next/navigation"

import {
  enlaceDeCatalogo,
  getCatalogo,
  getMaterialDelCatalogo,
} from "@/lib/data/catalogos"
import { Constructor } from "@/components/catalogos/editor/constructor"

export const metadata = { title: "Editar catálogo" }

/** Un catálogo guardado, abierto en el editor con los productos de hoy. */
export default async function CatalogoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [abierto, { datos, estiloDeTienda, esDemo }] = await Promise.all([
    getCatalogo(id),
    getMaterialDelCatalogo(),
  ])
  if (!abierto) notFound()

  return (
    <Constructor
      datos={datos}
      estiloDeTienda={estiloDeTienda}
      esDemo={esDemo}
      inicial={{
        id: abierto.id,
        catalogo: abierto.catalogo,
        enlace: enlaceDeCatalogo(abierto.token),
      }}
    />
  )
}
