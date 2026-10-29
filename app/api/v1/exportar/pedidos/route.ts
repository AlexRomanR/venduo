import { GET as planillaDePedidos } from "@/app/(privado)/panel/exportar/pedidos/route"
import { exigirSesion } from "@/lib/api/respuestas"

export const dynamic = "force-dynamic"

/**
 * La app: los pedidos en Excel, `?periodo=` como en el panel. Es la misma
 * planilla de `/panel/exportar/pedidos`, que corre con la sesión del token.
 */
export async function GET(peticion: Request) {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta
  return planillaDePedidos(peticion)
}
