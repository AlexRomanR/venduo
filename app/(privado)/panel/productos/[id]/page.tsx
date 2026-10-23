import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Megaphone, MessageCircle } from "lucide-react"

import {
  getCatalogo,
  getCostoDeProducto,
  getProducto,
} from "@/lib/data/catalogo"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { getVariantesDeProducto } from "@/lib/data/variantes"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatDate } from "@/lib/format"
import { mensajeDeProducto } from "@/lib/publicar"
import { urlDeProducto } from "@/lib/tienda"
import { leerOpciones } from "@/lib/variantes"
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
  const [tienda, producto, { categorias }, funciones, costoCents, variantes] =
    await Promise.all([
      getMiTienda(),
      getProducto(id),
      getCatalogo(),
      funcionesDeMiTienda(),
      getCostoDeProducto(id),
      getVariantesDeProducto(id),
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
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              mensajeDeProducto(
                {
                  nombre: producto.name,
                  precioCents: producto.price_cents,
                  precioAnteriorCents: producto.compare_at_price_cents,
                },
                urlDeProducto(tienda?.slug ?? "demo", producto.id)
              )
            )}`}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Mandar por WhatsApp
          </a>
        ) : null}
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
        costoCents={costoCents}
        opciones={leerOpciones(producto.opciones)}
        variantes={variantes}
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
