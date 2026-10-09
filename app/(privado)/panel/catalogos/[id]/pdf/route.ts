import { aviso, respuestaDePdf } from "@/lib/catalogos/pdf"
import { getCatalogo, getMaterialDelCatalogo } from "@/lib/data/catalogos"
import { exigirFuncion } from "@/lib/data/funciones"

/** Los precios y el stock se leen en el momento: nunca de caché. */
export const dynamic = "force-dynamic"

/**
 * Un catálogo guardado, armado con los precios y el stock de hoy.
 *
 * Se abre en el visor del navegador; con `?descargar=1` se baja como archivo.
 */
export async function GET(
  peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [abierto, { datos }, permiso] = await Promise.all([
    getCatalogo(id),
    getMaterialDelCatalogo(),
    exigirFuncion("catalogos"),
  ])
  if (!permiso.ok) return aviso(permiso.error, 403)
  if (!abierto) return aviso("No encontramos ese catálogo.", 404)

  const descargar = new URL(peticion.url).searchParams.has("descargar")
  return respuestaDePdf(abierto.catalogo, datos, {
    descarga: descargar ? "1" : null,
  })
}
