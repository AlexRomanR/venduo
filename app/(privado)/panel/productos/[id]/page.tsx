import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Megaphone } from "lucide-react"

import { getCatalogo, getProducto } from "@/lib/data/catalogo"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ConFuncion } from "@/components/panel/funcion"
import { Cabecera, Volver } from "@/components/panel/piezas"
import { TituloDeLaBarra } from "@/components/panel/titulo-de-barra"
import { FormularioProducto } from "@/components/productos/formulario"
import { BorrarProducto } from "@/components/productos/borrar"
import { borrarProducto, guardarProducto } from "../acciones"

export const metadata = { title: "Editar producto" }

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // Las tres a la vez: el producto y las categorías esperan a la misma
  // tienda, que se lee una sola vez por pedido.
  const [tienda, producto, { categorias }, funciones] = await Promise.all([
    getMiTienda(),
    getProducto(id),
    getCatalogo(),
    funcionesDeMiTienda(),
  ])
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  // `getProducto` ya filtra por tienda, así que un identificador de otro
  // comercio llega acá como inexistente y no como prohibido: es lo mismo para
  // quien lo pide, y no confirma que ese producto exista en algún lado.
  if (!producto) notFound()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 md:gap-8">
      <TituloDeLaBarra titulo={producto.name} volver="/panel/productos" />
      <Volver href="/panel/productos">Productos</Volver>

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
      >
        {/* Solo lo que se ve en la tienda se puede publicar: un producto
            oculto llevaría a un enlace que no abre. */}
        {producto.is_active && !producto.moderated_at ? (
          <ConFuncion estado={funciones.marketing}>
            <Link
              href={`/panel/marketing?producto=${producto.id}`}
              className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
            >
              <Megaphone aria-hidden="true" className="size-4" />
              Publicar en redes
            </Link>
          </ConFuncion>
        ) : null}
      </Cabecera>

      <FormularioProducto
        tiendaId={tienda?.id ?? "demo"}
        categorias={categorias}
        producto={producto}
        guardar={guardarProducto}
      />

      <BorrarProducto
        producto={producto}
        borrar={borrarProducto}
        soloLectura={!isSupabaseConfigured}
      />
    </div>
  )
}
