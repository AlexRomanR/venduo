import { GET as planillaDeProductos } from "@/app/(privado)/panel/exportar/productos/route"
import { exigirSesion } from "@/lib/api/respuestas"

export const dynamic = "force-dynamic"

/**
 * La app: los productos en Excel. Es la misma planilla de
 * `/panel/exportar/productos`, que corre con la sesión del token.
 */
export async function GET() {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta
  return planillaDeProductos()
}
