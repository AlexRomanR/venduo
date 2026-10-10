import { exigirSesion } from "@/lib/api/respuestas"
import { aviso, respuestaDePdf } from "@/lib/catalogos/pdf"
import { getCatalogo, getMaterialDelCatalogo } from "@/lib/data/catalogos"
import { exigirFuncion } from "@/lib/data/funciones"

/** Los precios y el stock se leen en el momento: nunca de caché. */
export const dynamic = "force-dynamic"

/**
 * Un catálogo guardado en PDF, para la app: el archivo que el emprendedor
 * manda por WhatsApp desde el celular.
 *
 * Es la misma ruta que `/panel/catalogos/{id}/pdf`, con el token de la app en
 * vez de la sesión del navegador. Se arma cada vez con los precios y el stock
 * del día, y siempre se baja como archivo: la app lo guarda y lo comparte.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const { id } = await params
  const [abierto, { datos }, permiso] = await Promise.all([
    getCatalogo(id),
    getMaterialDelCatalogo(),
    exigirFuncion("catalogos"),
  ])
  if (!permiso.ok) return aviso(permiso.error, 403)
  if (!abierto) return aviso("No encontramos ese catálogo.", 404)

  return respuestaDePdf(abierto.catalogo, datos, { descarga: "1" })
}
