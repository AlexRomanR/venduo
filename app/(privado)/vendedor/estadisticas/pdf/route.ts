import { getGraficosGuardadosPromotor } from "@/lib/data/insights"
import { getPerfilPromotor } from "@/lib/data/promotor"
import { responderInforme } from "@/lib/insights/documento"

export const dynamic = "force-dynamic"

/** El informe del tablero del promotor, con su nombre en la cabecera. */
export async function GET(peticion: Request) {
  const [guardados, perfil] = await Promise.all([
    getGraficosGuardadosPromotor(),
    getPerfilPromotor(),
  ])

  return responderInforme({ peticion, guardados, nombre: perfil.nombre })
}
