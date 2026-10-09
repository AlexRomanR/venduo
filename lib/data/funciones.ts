import "server-only"

import { cache } from "react"

import {
  AVISO_DE_NO_DISPONIBLE,
  TODAS_ACTIVAS,
  leerFunciones,
  type ClaveFuncion,
  type FuncionesDeTienda,
} from "@/lib/funciones"
import { createAdminClient, createClient } from "@/lib/supabase/server"

/**
 * Las funciones de la tienda de quien está mirando, ya resueltas: una consulta
 * por pedido, compartida entre la barra, la página y sus acciones.
 */
export const funcionesDeMiTienda = cache(
  async function funcionesDeMiTienda(): Promise<FuncionesDeTienda> {
    const supabase = await createClient()
    if (!supabase) return TODAS_ACTIVAS
    const { data, error } = await supabase.rpc("funciones_de_mi_tienda")
    // Si la base no responde, no se apaga nada: una caída no puede dejar a
    // todas las tiendas sin sus herramientas.
    if (error) return TODAS_ACTIVAS
    return leerFunciones(data)
  }
)

/**
 * La comprobación del servidor. Ocultar el botón no alcanza: una acción se
 * puede llamar sin pasar por él.
 */
export async function exigirFuncion(
  clave: ClaveFuncion
): Promise<{ ok: true } | { ok: false; error: string }> {
  const funciones = await funcionesDeMiTienda()
  return funciones[clave] === "activa"
    ? { ok: true }
    : { ok: false, error: AVISO_DE_NO_DISPONIBLE }
}

/**
 * El estado de una función en una tienda cualquiera, para lo que se abre sin
 * sesión: el enlace público de un catálogo.
 */
export async function funcionDeTienda(
  tienda: string,
  clave: ClaveFuncion
): Promise<boolean> {
  const db = createAdminClient()
  if (!db) return true
  const { data, error } = await db.rpc("funcion_de_tienda", {
    p_store_id: tienda,
    p_feature: clave,
  })
  if (error) return true
  return data === "activa"
}
