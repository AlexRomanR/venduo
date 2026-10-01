import { redirect } from "next/navigation"

import { getCatalogo } from "@/lib/data/catalogo"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { Cabecera, Volver } from "@/components/panel/piezas"
import { Categorias } from "@/components/productos/categorias"
import { borrarCategoria, guardarCategoria } from "../acciones"

export const metadata = { title: "Categorías" }

export default async function CategoriasPage() {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const { categorias, esDemo } = await getCatalogo()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8">
      <Volver href="/panel/productos">Tu catálogo</Volver>

      <Cabecera
        titulo="Categorías."
        bajada="Son los cajones de tu tienda: quien entra las usa para encontrar lo que busca sin recorrer todo."
        demo={esDemo && "Estás en modo demo: los cambios no se guardan."}
      />

      <Categorias
        categorias={categorias}
        soloLectura={esDemo}
        guardar={guardarCategoria}
        borrar={borrarCategoria}
      />
    </div>
  )
}
