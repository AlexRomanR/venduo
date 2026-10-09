import { renderToBuffer } from "@react-pdf/renderer"

import { exigirFuncion } from "@/lib/data/funciones"
import { getGraficoConDatos, getGraficosGuardados } from "@/lib/data/insights"
import { getMiTienda } from "@/lib/data/panel"
import { formatDate } from "@/lib/format"
import {
  construirInforme,
  type GraficoDelInforme,
} from "@/lib/insights/documento"

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
 *
 * `?g={id}` limita el informe a un solo gráfico. Las consultas corren con la
 * sesión de quien pide, así que RLS sigue puesta: esta ruta no ve nada que no
 * vea el panel.
 */
export async function GET(peticion: Request) {
  const [tienda, permiso] = await Promise.all([
    getMiTienda(),
    exigirFuncion("estadisticas"),
  ])
  if (!tienda) {
    return new Response("No tienes una tienda.", { status: 404 })
  }
  if (!permiso.ok) return new Response(permiso.error, { status: 403 })

  const uno = new URL(peticion.url).searchParams.get("g")

  const guardados = await getGraficosGuardados()
  const elegidos = uno ? guardados.filter((g) => g.id === uno) : guardados

  if (elegidos.length === 0) {
    return new Response("No hay gráficos guardados todavía.", { status: 404 })
  }

  const graficos: GraficoDelInforme[] = await Promise.all(
    elegidos.map(getGraficoConDatos)
  )

  const fecha = formatDate(new Date())
  const cuerpo = await renderToBuffer(
    construirInforme({ graficos, tienda: tienda.name, fecha })
  )

  const nombre = uno
    ? `${archivable(graficos[0].titulo)}.pdf`
    : `venduo-${archivable(tienda.name)}.pdf`

  return new Response(new Uint8Array(cuerpo), {
    headers: {
      "Content-Type": "application/pdf",
      // `inline` es lo que hace que la pestaña muestre el visor del navegador
      // en vez de bajar el archivo de una: desde ahí se descarga si se quiere.
      "Content-Disposition": `inline; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  })
}

/** Un nombre de archivo que sobreviva a cualquier sistema de archivos. */
function archivable(texto: string) {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "informe"
  )
}
