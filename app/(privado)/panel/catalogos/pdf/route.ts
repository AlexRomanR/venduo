import { catalogoSchema } from "@/lib/catalogos/modelo"
import { aviso, respuestaDePdf } from "@/lib/catalogos/pdf"
import { getMaterialDelCatalogo } from "@/lib/data/catalogos"

/** Los precios y el stock se leen en el momento: nunca de caché. */
export const dynamic = "force-dynamic"

/**
 * El PDF del catálogo que se está editando, guardado o no.
 *
 * El editor manda su borrador entero y se valida con el mismo esquema que al
 * guardar: de afuera no entra nada que no sea un catálogo. Los productos se
 * leen con la sesión de quien pide, así que RLS sigue puesta y el PDF no puede
 * mostrar un producto de otra tienda aunque el borrador nombre su id.
 */
export async function POST(peticion: Request) {
  let cuerpo: unknown
  try {
    cuerpo = await peticion.json()
  } catch {
    return aviso("No llegó el catálogo. Vuelve a intentarlo.", 400)
  }

  const catalogo = catalogoSchema.safeParse(cuerpo)
  if (!catalogo.success) {
    return aviso(
      "El catálogo tiene algo que no se puede dibujar. Revisa los textos y vuelve a intentarlo.",
      400
    )
  }

  const { datos } = await getMaterialDelCatalogo()
  return respuestaDePdf(catalogo.data, datos)
}
