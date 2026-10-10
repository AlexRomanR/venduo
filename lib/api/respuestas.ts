import "server-only"

import { NextResponse } from "next/server"

import { getUsuario, type Usuario } from "@/lib/supabase/server"

/**
 * Las respuestas de `/api/v1`, la API que usa la app móvil.
 *
 * La app entra con el token de su sesión de Supabase (`lib/supabase/server.ts`),
 * así que cada ruta corre como esa persona y RLS impone lo mismo que en el
 * panel. Un error siempre es `{ error }` con un texto que la app puede mostrar
 * tal cual: en español y diciendo qué hacer.
 */

export function respuesta<T>(datos: T, estado = 200) {
  return NextResponse.json(datos, {
    status: estado,
    headers: { "Cache-Control": "no-store" },
  })
}

export function fallo(error: string, estado = 400) {
  return respuesta({ error }, estado)
}

export const SIN_SESION = "Tu sesión venció. Vuelve a ingresar."

/**
 * La puerta de cada ruta: sin una sesión válida, 401.
 *
 * Devuelve a la persona o la respuesta que hay que devolver. Las rutas no
 * confían en que la app "ya está adentro": cualquiera puede llamarlas.
 */
export async function exigirSesion(): Promise<
  { ok: true; usuario: Usuario } | { ok: false; respuesta: NextResponse }
> {
  const usuario = await getUsuario()
  if (!usuario) return { ok: false, respuesta: fallo(SIN_SESION, 401) }
  return { ok: true, usuario }
}

/** El cuerpo de un pedido como JSON, o `null` si no lo es. */
export async function cuerpo(peticion: Request): Promise<unknown> {
  try {
    return await peticion.json()
  } catch {
    return null
  }
}
