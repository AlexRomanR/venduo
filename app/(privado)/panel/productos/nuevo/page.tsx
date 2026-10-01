import { redirect } from "next/navigation"

import { getCatalogo } from "@/lib/data/catalogo"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { Cabecera, Volver } from "@/components/panel/piezas"
import { FormularioProducto } from "@/components/productos/formulario"
import { guardarProducto } from "../acciones"

export const metadata = { title: "Nuevo producto" }

export default async function NuevoProductoPage() {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const { categorias } = await getCatalogo()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8">
      <Volver href="/panel/productos">Tu catálogo</Volver>

      <Cabecera
        titulo="Un producto nuevo."
        bajada="Lo mínimo es el nombre, el precio y cuántas unidades tienes. Lo demás hace que se venda mejor, y lo puedes completar después."
      />

      <FormularioProducto
        tiendaId={tienda?.id ?? "demo"}
        categorias={categorias}
        guardar={guardarProducto}
      />
    </div>
  )
}
