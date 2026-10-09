import { BookOpen, LayoutTemplate } from "lucide-react"

import { exigirAdmin } from "@/lib/admin"
import { armarCatalogo } from "@/lib/catalogos/plantillas"
import { plantillasDeAdmin } from "@/lib/data/admin"
import { materialDeDemostracion } from "@/lib/data/catalogos"
import { Cabecera, Seccion } from "@/components/panel/piezas"
import { Miniatura } from "@/components/plantillas/miniatura"
import { VistaDeCatalogo } from "@/components/admin/vista-de-catalogo"
import {
  PlantillasDeCatalogoAdmin,
  PlantillasDeTiendaAdmin,
} from "@/components/admin/plantillas"

export const metadata = { title: "Plantillas" }

export default async function PlantillasPage() {
  const { db } = await exigirAdmin()
  const [{ deTienda, deCatalogo }, muestra] = await Promise.all([
    plantillasDeAdmin(db),
    materialDeDemostracion(),
  ])
  // Las de catálogo se arman con los productos de ejemplo, como las ve una
  // tienda en su editor: una plantilla vacía no dice cómo se ve.
  const productos = Object.values(muestra.datos.productos)
  const tienda = {
    nombre: muestra.datos.tienda.nombre,
    whatsapp: muestra.datos.tienda.whatsapp,
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Plantillas."
        bajada="Qué se ofrece al crear una tienda y al armar un catálogo, y en qué orden. Ocultar una no se la quita a quien ya la usa."
      />

      <Seccion
        id="tienda"
        icono={LayoutTemplate}
        titulo="Plantillas de tienda"
        bajada="La galería del alta y el cambio de plantilla en Apariencia."
      >
        <PlantillasDeTiendaAdmin
          plantillas={deTienda.map((p) => ({
            ...p,
            vista: (
              <Miniatura clave={p.clave} className="border border-tinta/25" />
            ),
          }))}
        />
      </Seccion>

      <Seccion
        id="catalogo"
        icono={BookOpen}
        titulo="Plantillas de catálogo"
        bajada="Las que se ofrecen al armar un catálogo en PDF."
      >
        <PlantillasDeCatalogoAdmin
          plantillas={deCatalogo.map((p) => ({
            ...p,
            vista: (
              <VistaDeCatalogo
                catalogo={armarCatalogo({
                  plantilla: p.clave,
                  nombre: "Catálogo de temporada",
                  productos,
                  tienda,
                  estilo: muestra.estiloDeTienda,
                })}
                datos={muestra.datos}
                alto={104}
              />
            ),
          }))}
        />
      </Seccion>
    </div>
  )
}
