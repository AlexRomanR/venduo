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

/** Devuelve el usuario autenticado o `null`. */
export async function getUser() {
  const supabase = await createClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
