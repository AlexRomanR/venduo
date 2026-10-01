import { notFound, redirect } from "next/navigation"

import { getCatalogo, getProducto } from "@/lib/data/catalogo"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { formatDate } from "@/lib/format"
import { Cabecera, Volver } from "@/components/panel/piezas"
import { FormularioProducto } from "@/components/productos/formulario"
import { guardarProducto } from "../acciones"

export const metadata = { title: "Editar producto" }

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Las tres a la vez: el producto y las categorías esperan a la misma
  // tienda, que se lee una sola vez por pedido.
  const [tienda, producto, { categorias }] = await Promise.all([
    getMiTienda(),
    getProducto(id),
    getCatalogo(),
  ])
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  // `getProducto` ya filtra por tienda, así que un identificador de otro
  // comercio llega acá como inexistente y no como prohibido: es lo mismo para
  // quien lo pide, y no confirma que ese producto exista en algún lado.
  if (!producto) notFound()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8">
      <Volver href="/panel/productos">Tu catálogo</Volver>

      <Cabecera
        etiqueta="Editar producto"
        titulo={producto.name}
        bajada={
          <>
            Cargado el {formatDate(producto.created_at)}
            {producto.updated_at !== producto.created_at
              ? ` · última edición el ${formatDate(producto.updated_at)}`
              : ""}
          </>
        }
      />

      <FormularioProducto
        tiendaId={tienda?.id ?? "demo"}
        categorias={categorias}
        producto={producto}
        guardar={guardarProducto}
      />
    </div>
  )
}
