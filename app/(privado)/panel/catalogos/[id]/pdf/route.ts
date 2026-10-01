import { aviso, respuestaDePdf } from "@/lib/catalogos/pdf"
import { getCatalogo, getMaterialDelCatalogo } from "@/lib/data/catalogos"

/** Los precios y el stock se leen en el momento: nunca de caché. */
export const dynamic = "force-dynamic"

/** Un catálogo guardado, armado con los precios y el stock de hoy. */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const [abierto, { datos }] = await Promise.all([
    getCatalogo(id),
    getMaterialDelCatalogo(),
  ])
  if (!abierto) return aviso("No encontramos ese catálogo.", 404)

  return respuestaDePdf(abierto.catalogo, datos)
}
