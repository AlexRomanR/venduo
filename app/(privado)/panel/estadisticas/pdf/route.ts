import { getGraficosGuardados } from "@/lib/data/insights"
import { getMiTienda } from "@/lib/data/panel"
import { responderInforme } from "@/lib/insights/documento"

/** El PDF se arma con los datos de hoy, así que nunca se sirve de caché. */
export const dynamic = "force-dynamic"

/**
 * El informe del tablero, en PDF.
 *
 * Se genera en el servidor y no en el navegador por dos razones: las fuentes y
 * la biblioteca —que juntas pesan más que varias pantallas— no viajan al
 * teléfono de nadie, y el documento sale por una URL propia, así que el
 * navegador lo abre con su visor y su botón de descarga sin que haya que
 * inventar ninguno.
 */
export async function GET(peticion: Request) {
  const tienda = await getMiTienda()
  if (!tienda) {
    return new Response("No tienes una tienda.", { status: 404 })
  }

  return responderInforme({
    peticion,
    guardados: await getGraficosGuardados(),
    nombre: tienda.name,
  })
}
