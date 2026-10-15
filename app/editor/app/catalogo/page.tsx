import {
  getCatalogo,
  getMaterialDelCatalogo,
  plantillasDeCatalogoVisibles,
} from "@/lib/data/catalogos"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import {
  EditorDeCatalogoDeLaApp,
  SinCatalogoParaLaApp,
} from "@/components/catalogos/editor/editor-de-la-app"

export const metadata = {
  title: "Editar catálogo",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

/**
 * El editor de catálogos para la app móvil: las hojas del catálogo, o la
 * galería de plantillas, sin los controles de la web. `?id=` abre uno
 * guardado; sin él, empieza uno nuevo con los productos que mande la app.
 */
export default async function EditorDeCatalogoDeLaAppPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  const [abierto, material, funciones, plantillas] = await Promise.all([
    id ? getCatalogo(id) : Promise.resolve(null),
    getMaterialDelCatalogo(),
    funcionesDeMiTienda(),
    plantillasDeCatalogoVisibles(),
  ])

  if (funciones.catalogos !== "activa" || material.esDemo || (id && !abierto)) {
    return <SinCatalogoParaLaApp />
  }

  return (
    <EditorDeCatalogoDeLaApp
      datos={material.datos}
      estiloDeTienda={material.estiloDeTienda}
      plantillaDeLaTienda={material.plantillaDeLaTienda}
      plantillas={plantillas}
      inicial={abierto?.catalogo ?? null}
    />
  )
}
