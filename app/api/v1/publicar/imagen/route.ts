import { exigirSesion } from "@/lib/api/respuestas"
import { respuestaDeImagen } from "@/lib/publicar-imagen"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * La imagen de un producto para redes, en PNG, para la app: la misma que la
 * del panel (`/panel/marketing/imagen`), con los mismos parámetros. La app la
 * muestra y la baja para compartirla.
 */
export async function GET(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta
  return respuestaDeImagen(peticion)
}
