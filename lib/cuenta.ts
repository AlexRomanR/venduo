import "server-only"

import {
  createAdminClient,
  createClient,
  getUsuario,
} from "@/lib/supabase/server"

/** Cuánto espera una cuenta dada de baja antes del borrado lógico. */
export const DIAS_HASTA_EL_BORRADO = 90

/** Cuánto dura el bloqueo del ingreso: para siempre, en la medida de Auth. */
const PARA_SIEMPRE = "876000h"

/**
 * Da de baja la cuenta de la sesión. La usan `/cuenta` y la app, por
 * `DELETE /api/v1/cuenta`, para que valga lo mismo por los dos caminos.
 *
 * La base hace lo suyo en `dar_de_baja_mi_cuenta`: la tienda sale del aire y
 * la persona deja de ver sus datos. Bloquear el ingreso es de Auth y solo lo
 * puede la clave de servicio; si eso falla la baja ya está hecha igual, porque
 * una cuenta sin tienda no tiene nada que ver.
 */
export async function darDeBajaLaCuenta(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const [supabase, usuario] = await Promise.all([createClient(), getUsuario()])
  if (!supabase || !usuario) {
    return { ok: false, error: "Tu sesión venció. Vuelve a entrar." }
  }

  const { error } = await supabase.rpc("dar_de_baja_mi_cuenta")
  if (error) {
    console.error("[cuenta] dar_de_baja_mi_cuenta:", error.message)
    return {
      ok: false,
      error: "No pudimos dar de baja tu cuenta. Inténtalo de nuevo en un rato.",
    }
  }

  const admin = createAdminClient()
  const bloqueo = await admin?.auth.admin.updateUserById(usuario.id, {
    ban_duration: PARA_SIEMPRE,
  })
  if (!admin || bloqueo?.error) {
    console.error(
      "[cuenta] no se pudo bloquear el ingreso:",
      bloqueo?.error?.message ?? "falta la clave de servicio"
    )
  }

  return { ok: true }
}
