import { BookOpen, LayoutTemplate } from "lucide-react"

import { exigirAdmin } from "@/lib/admin"
import { plantillasDeAdmin } from "@/lib/data/admin"
import { Cabecera, Seccion } from "@/components/panel/piezas"
import {
  PlantillasDeCatalogoAdmin,
  PlantillasDeTiendaAdmin,
} from "@/components/admin/plantillas"

export const metadata = { title: "Plantillas" }

export default async function PlantillasPage() {
  const { db } = await exigirAdmin()
  const { deTienda, deCatalogo } = await plantillasDeAdmin(db)

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
        <PlantillasDeTiendaAdmin plantillas={deTienda} />
      </Seccion>

      <Seccion
        id="catalogo"
        icono={BookOpen}
        titulo="Plantillas de catálogo"
        bajada="Las que se ofrecen al armar un catálogo en PDF."
      >
        <PlantillasDeCatalogoAdmin plantillas={deCatalogo} />
      </Seccion>
    </div>
  )
}
