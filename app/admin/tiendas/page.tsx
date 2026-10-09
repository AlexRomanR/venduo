import { Download, Store } from "lucide-react"

import { exigirAdmin } from "@/lib/admin"
import { tiendasDeAdmin } from "@/lib/data/admin"
import { PLANTILLAS, esClavePlantilla } from "@/lib/plantillas"
import { Cabecera, Seccion } from "@/components/panel/piezas"
import { TablaDeTiendas } from "@/components/admin/tiendas"

export const metadata = { title: "Tiendas" }

export default async function TiendasPage() {
  const { db } = await exigirAdmin()
  const filas = await tiendasDeAdmin(db)
  const tiendas = filas.map((t) => ({
    ...t,
    plantilla: esClavePlantilla(t.plantilla)
      ? PLANTILLAS[t.plantilla].nombre
      : t.plantilla || "Sin plantilla",
  }))
  const ahora = new Date().getTime()

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Tiendas."
        bajada="Todas las tiendas de Venduo. Las trabadas llevan más de tres días sin productos o sin publicar: son las que conviene llamar."
      >
        <a
          href="/admin/tiendas/exportar"
          download
          className="flex min-h-11 items-center gap-2 border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
        >
          <Download aria-hidden="true" className="size-4" />
          Exportar CSV
        </a>
      </Cabecera>

      <Seccion
        id="lista"
        icono={Store}
        titulo="Cada tienda"
        bajada="Toca una para ver su ficha: visitas, suscripción, funciones y notas."
      >
        <TablaDeTiendas tiendas={tiendas} ahora={ahora} />
      </Seccion>
    </div>
  )
}
