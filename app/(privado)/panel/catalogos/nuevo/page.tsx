import { redirect } from "next/navigation"

import { getMaterialDelCatalogo } from "@/lib/data/catalogos"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { Constructor } from "@/components/catalogos/editor/constructor"

export const metadata = { title: "Nuevo catálogo" }

/** Armar un catálogo: productos, plantilla y edición, en la misma pantalla. */
export default async function NuevoCatalogoPage() {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const { datos, estiloDeTienda, esDemo } = await getMaterialDelCatalogo()

  return (
    <Constructor
      datos={datos}
      estiloDeTienda={estiloDeTienda}
      esDemo={esDemo}
      inicial={null}
    />
  )
}
