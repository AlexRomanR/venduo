import { pedidosParaPlanilla } from "@/lib/data/exportar"
import {
  esPeriodo,
  hojasDePedidos,
  limitesDe,
  nombreDeArchivo,
  TIPO_XLSX,
} from "@/lib/exportar"
import { crearXlsx } from "@/lib/planilla"

export const dynamic = "force-dynamic"

/**
 * Los pedidos de mi tienda en una planilla de Excel. `?periodo=este-mes`,
 * `mes-pasado` o `todo`. Anda también con la tienda bloqueada: es la forma de
 * llevarse los datos. Vive fuera de `/panel/pedidos` porque la app abre todo lo
 * que cuelga de ahí, y no tiene esta ruta.
 */
export async function GET(request: Request) {
  const pedido = new URL(request.url).searchParams.get("periodo")
  const periodo = esPeriodo(pedido) ? pedido : "todo"

  const ahora = new Date()
  const datos = await pedidosParaPlanilla(periodo, ahora).catch(() => null)
  if (!datos) {
    return new Response("No pudimos preparar la planilla.", { status: 404 })
  }

  const archivo = crearXlsx(hojasDePedidos(datos.filas, ahora))
  const nombre = nombreDeArchivo(
    "pedidos",
    datos.tienda,
    limitesDe(periodo, ahora).nombre
  )
  return new Response(archivo as BodyInit, {
    headers: {
      "Content-Type": TIPO_XLSX,
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  })
}
