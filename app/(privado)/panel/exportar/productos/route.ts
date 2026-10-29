import { productosParaPlanilla } from "@/lib/data/exportar"
import { diaEnBolivia } from "@/lib/format"
import { hojaDeProductos, nombreDeArchivo, TIPO_XLSX } from "@/lib/exportar"
import { crearXlsx } from "@/lib/planilla"

export const dynamic = "force-dynamic"

/**
 * Los productos de mi tienda en una planilla de Excel, uno por fila y uno por
 * talla o color si los tiene. Fuera de `/panel/productos` por la misma razón
 * que la de pedidos: la app abre lo que cuelga de ahí.
 */
export async function GET() {
  const datos = await productosParaPlanilla().catch(() => null)
  if (!datos) {
    return new Response("No pudimos preparar la planilla.", { status: 404 })
  }

  const archivo = crearXlsx([hojaDeProductos(datos.filas)])
  const [anio, mes, dia] = diaEnBolivia().split("-")
  const nombre = nombreDeArchivo(
    "productos",
    datos.tienda,
    `${dia}-${mes}-${anio}`
  )
  return new Response(archivo as BodyInit, {
    headers: {
      "Content-Type": TIPO_XLSX,
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  })
}
