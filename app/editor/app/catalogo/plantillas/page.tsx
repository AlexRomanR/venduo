import { estilosDeLaTienda } from "@/lib/catalogos/plantillas"
import {
  getMaterialDelCatalogo,
  plantillasDeCatalogoVisibles,
} from "@/lib/data/catalogos"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import {
  ListaParaLaApp,
  NadaParaLaApp,
} from "@/components/catalogos/lista-para-la-app"
import { PlantillasDeLaLista } from "@/components/catalogos/plantillas-de-la-lista"

export const metadata = {
  title: "Plantillas de catálogo",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

/**
 * Las plantillas de la lista de catálogos, para la app: las mismas dos
 * secciones que la web, dibujadas con los productos y los colores de la
 * tienda. La app no las copia: las muestra en su lista y abre su editor con la
 * que se toque.
 */
export default async function PlantillasParaLaAppPage() {
  const [material, funciones, plantillas] = await Promise.all([
    getMaterialDelCatalogo(),
    funcionesDeMiTienda(),
    plantillasDeCatalogoVisibles(),
  ])

  if (funciones.catalogos !== "activa" || material.esDemo) {
    return <NadaParaLaApp />
  }

  const { datos, estiloDeTienda, plantillaDeLaTienda } = material
  const sugeridos = estilosDeLaTienda(
    estiloDeTienda,
    plantillaDeLaTienda
  ).filter((sugerido) => plantillas.includes(sugerido.plantilla))

  return (
    <ListaParaLaApp>
      <PlantillasDeLaLista
        datos={datos}
        estiloDeTienda={estiloDeTienda}
        sugeridos={sugeridos}
        plantillas={plantillas}
      />
    </ListaParaLaApp>
  )
}
