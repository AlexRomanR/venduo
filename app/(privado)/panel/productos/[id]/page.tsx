import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getCatalogo, getProducto } from "@/lib/data/catalogo"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { formatDate } from "@/lib/format"
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
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/panel/productos"
        className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
      >
        <ArrowLeft
          aria-hidden="true"
          className="size-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none"
        />
        Tu catálogo
      </Link>

      <h1 className="mt-6 max-w-[20ch] font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">
        {producto.name}
      </h1>
      <p className="mt-3 text-sm opacity-55">
        Cargado el {formatDate(producto.created_at)}
        {producto.updated_at !== producto.created_at
          ? ` · última edición el ${formatDate(producto.updated_at)}`
          : ""}
      </p>

      <div className="mt-12">
        <FormularioProducto
          tiendaId={tienda?.id ?? "demo"}
          categorias={categorias}
          producto={producto}
          guardar={guardarProducto}
        />
      </div>
    </div>
  )
}
