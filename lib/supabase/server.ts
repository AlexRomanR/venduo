import { cache } from "react"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { env, isSupabaseConfigured } from "@/lib/env"
import type { Database } from "@/types/database"

/**
 * Cliente de Supabase para Server Components, Route Handlers y Server Actions.
 * Devuelve `null` si faltan credenciales.
 */
export async function createClient() {
  if (!isSupabaseConfigured) return null

  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Llamado desde un Server Component: el middleware ya refresca
            // la sesión, así que se puede ignorar sin problema.
          }
        },
      },
    }
  )
}

/**
 * Cliente con service_role: salta RLS. Usar solo en el servidor,
 * nunca en código que llegue al navegador.
 */
export function createAdminClient() {
  if (!isSupabaseConfigured || !env.SUPABASE_SERVICE_ROLE_KEY) return null

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  )
}

export interface Usuario {
  id: string
  email: string | null
}

/**
 * Quién hace el pedido, o `null` sin sesión.
 *
 * `getClaims` verifica la firma del token con la clave pública del proyecto,
 * que se baja una vez y queda en memoria: no viaja a Supabase. `getUser()`
 * preguntaba al servidor de Auth cada vez, y cada consulta de una pantalla lo
 * llamaba por su cuenta antes de pedir un solo dato. Es la misma garantía que
 * da RLS, que también confía en la firma del token.
 *
 * Con memoria por pedido: la barra, la página y cada consulta lo piden, y se
 * resuelve una vez.
 */
export const getUsuario = cache(
  async function getUsuario(): Promise<Usuario | null> {
    const supabase = await createClient()
    if (!supabase) return null

    const { data } = await supabase.auth.getClaims()
    const claims = data?.claims
    if (!claims?.sub) return null

    return { id: claims.sub, email: claims.email ?? null }
  }
)
