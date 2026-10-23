import { respuestaDeImagen } from "@/lib/publicar-imagen"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * La imagen de un producto para redes, en PNG: 1080 × 1920 para historias y
 * estados, 1080 × 1080 para publicaciones. Se dibuja en el servidor para que
 * salga nítida y con la letra de la tienda en cualquier teléfono. La app pide
 * la misma por `/api/v1/publicar/imagen`.
 */
export function GET(peticion: Request) {
  return respuestaDeImagen(peticion)
}
