import { darDeBajaLaCuenta, DIAS_HASTA_EL_BORRADO } from "@/lib/cuenta"
import { exigirSesion, fallo, respuesta } from "@/lib/api/respuestas"

export const dynamic = "force-dynamic"

/**
 * Da de baja la cuenta de la sesión, desde la app.
 *
 * Es lo mismo que el botón de `/cuenta`: la tienda sale del aire en el acto,
 * el ingreso queda bloqueado y el borrado lógico corre a los 90 días. La app
 * cierra su sesión cuando esto responde bien.
 */
export async function DELETE() {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const resultado = await darDeBajaLaCuenta()
  if (!resultado.ok) return fallo(resultado.error, 500)

  return respuesta({ ok: true, diasHastaElBorrado: DIAS_HASTA_EL_BORRADO })
}
