import "server-only"

import { cache } from "react"
import { notFound } from "next/navigation"

import {
  createAdminClient,
  createClient,
  getUsuario,
  type Usuario,
} from "@/lib/supabase/server"
import type { Json } from "@/types"

/**
 * La administración de Venduo, del lado del servidor.
 *
 * `/admin` lee y escribe con la clave de servicio, que salta RLS. Por eso hay
 * una sola puerta, `exigirAdmin()`, y ninguna pantalla ni acción del
 * administrador usa `createAdminClient()` sin pasar antes por ella.
 */

/** Si quien pregunta es administrador. Una vez por pedido. */
export const esAdmin = cache(async function esAdmin(): Promise<boolean> {
  const supabase = await createClient()
  if (!supabase) return false
  const usuario = await getUsuario()
  if (!usuario) return false
  const { data } = await supabase.rpc("is_platform_admin")
  return data === true
})

export interface SesionDeAdmin {
  usuario: Usuario
  db: NonNullable<ReturnType<typeof createAdminClient>>
}

/**
 * La puerta de `/admin`. Para cualquier otra cuenta, la página no existe: un
 * 404 y no un "acceso denegado", que contaría que hay algo detrás.
 */
export async function exigirAdmin(): Promise<SesionDeAdmin> {
  const [usuario, admin] = await Promise.all([getUsuario(), esAdmin()])
  const db = createAdminClient()
  if (!usuario || !admin || !db) notFound()
  return { usuario, db }
}

/**
 * Lo mismo para una acción del servidor: en vez de un 404, un error que la
 * pantalla muestra. Una acción la puede llamar cualquiera que conozca su id.
 */
export async function exigirAdminEnAccion(): Promise<
  { ok: true; sesion: SesionDeAdmin } | { ok: false; error: string }
> {
  const [usuario, admin] = await Promise.all([getUsuario(), esAdmin()])
  const db = createAdminClient()
  if (!usuario || !admin || !db) {
    return { ok: false, error: "No tienes permiso para hacer esto." }
  }
  return { ok: true, sesion: { usuario, db } }
}

/**
 * Deja constancia de un cambio del administrador: qué, sobre qué, y el antes
 * y el después. Si se apagó algo por error, acá se ve qué era.
 */
export async function registrarCambio(
  sesion: SesionDeAdmin,
  cambio: {
    accion: string
    tipo: string
    id?: string | null
    antes?: Json | null
    despues?: Json | null
    nota?: string | null
  }
): Promise<void> {
  const { error } = await sesion.db.from("admin_audit_log").insert({
    admin_id: sesion.usuario.id,
    action: cambio.accion,
    target_type: cambio.tipo,
    target_id: cambio.id ?? null,
    before: cambio.antes ?? null,
    after: cambio.despues ?? null,
    note: cambio.nota ?? null,
  })
  if (error) console.error("[admin] no se pudo registrar el cambio:", error)
}
