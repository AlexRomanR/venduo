import {
  catalogoACanva,
  direccionDeAutorizacion,
  direccionDeVuelta,
  isCanvaConfigured,
  pedidoDeLaApp,
  permisoGuardado,
} from "@/lib/canva"
import { exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"
import { getCatalogo } from "@/lib/data/catalogos"
import { exigirFuncion } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"

export const dynamic = "force-dynamic"
/** Con la aprobación ya dada, acá mismo se arma el PDF y se espera a Canva. */
export const maxDuration = 60

/**
 * Llevar un catálogo guardado a Canva desde la app.
 *
 * Tres respuestas posibles:
 * - `abrir`: la tienda ya aprobó a Venduo; el diseño está armado y la app abre
 *   su enlace, que abre la app de Canva si está instalada.
 * - `autorizar`: hay que aprobar una vez. La app abre la dirección en el
 *   navegador y vuelve sola (`venduo://canva`); después pide de nuevo.
 * - `a-mano`: la integración no está configurada. La app comparte el PDF y la
 *   persona lo abre en Canva.
 */
export async function POST(
  peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const { id } = await params
  const [permiso, tienda, abierto] = await Promise.all([
    exigirFuncion("canva"),
    getMiTienda(),
    getCatalogo(id),
  ])
  if (!permiso.ok) return fallo(permiso.error, 403)
  if (!tienda || !abierto) return fallo("Ese catálogo ya no existe.", 404)

  if (!isCanvaConfigured) return respuesta({ modo: "a-mano" })

  const acceso = await permisoGuardado(tienda.id)
  if (acceso) {
    try {
      const url = await catalogoACanva(acceso, abierto.id)
      if (!url) {
        return fallo(
          "No pudimos armar este catálogo para Canva. Revisa que sus colores se lean.",
          422
        )
      }
      return respuesta({ modo: "abrir", url })
    } catch (error) {
      console.error("[catalogos] la app no pudo abrir Canva:", error)
      return fallo("Canva no respondió. Inténtalo de nuevo en un rato.", 502)
    }
  }

  const origen = new URL(peticion.url).origin
  const pedido = pedidoDeLaApp(abierto.id, tienda.id)
  return respuesta({
    modo: "autorizar",
    url: direccionDeAutorizacion(pedido, direccionDeVuelta(origen)),
  })
}
