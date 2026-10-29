import { exigirSesion } from "@/lib/api/respuestas"
import { HOJA_MODELO } from "@/lib/carga"
import { TIPO_XLSX } from "@/lib/exportar"
import { crearXlsx } from "@/lib/planilla"

export const dynamic = "force-dynamic"

/** La app: la planilla modelo de Cargar varios, la misma del panel. */
export async function GET() {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  return new Response(crearXlsx([HOJA_MODELO]) as BodyInit, {
    headers: {
      "Content-Type": TIPO_XLSX,
      "Content-Disposition":
        'attachment; filename="planilla-modelo-venduo.xlsx"',
      "Cache-Control": "no-store",
    },
  })
}
