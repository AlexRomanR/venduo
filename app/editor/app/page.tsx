import {
  getDisenoParaEditar,
  getTiendaParaVistaPrevia,
} from "@/lib/data/editor"
import { funcionesDeMiTienda } from "@/lib/data/funciones"
import { productosDeEjemplo } from "@/lib/editor/muestras"
import {
  EditorDeLaApp,
  SinTiendaParaLaApp,
} from "@/components/editor/editor-de-la-app"

export const metadata = {
  title: "Editar tu tienda",
  robots: { index: false, follow: false },
}

// Es la tienda de quien edita, con su token: nunca una página fija.
export const dynamic = "force-dynamic"

/**
 * El editor de la tienda para la app móvil: la vista previa con el borrador,
 * sin los controles de la web. La app la abre en un WebView con su token y le
 * manda operaciones (`lib/editor/protocolo-app.ts`).
 *
 * Mismos datos que `/editor` y que su vista previa, leídos a la vez.
 */
export default async function EditorDeLaAppPage() {
  const [diseno, tienda, funciones] = await Promise.all([
    getDisenoParaEditar(),
    getTiendaParaVistaPrevia(),
    funcionesDeMiTienda(),
  ])

  if (!diseno || !tienda || funciones.editor !== "activa") {
    return <SinTiendaParaLaApp />
  }

  const ejemplos = productosDeEjemplo(tienda.plantilla, tienda.id)
  const conStock = tienda.productos.filter((producto) => producto.stock > 0)
  const muestra = (conStock.length > 0 ? conStock : ejemplos)
    .slice(0, 2)
    .map((producto) => ({
      productoId: producto.id,
      nombre: producto.name,
      precioCents: producto.price_cents,
      imagen: producto.image_url,
      cantidad: 1,
      stock: producto.stock,
    }))

  return (
    <EditorDeLaApp
      diseno={diseno}
      tienda={tienda}
      muestra={muestra}
      ejemplos={ejemplos}
    />
  )
}
