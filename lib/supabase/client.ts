"use client"

import { createBrowserClient } from "@supabase/ssr"

import { env, isSupabaseConfigured } from "@/lib/env"
import type { Database } from "@/types/database"

/**
 * Cliente de Supabase para componentes de cliente ("use client").
 * Devuelve `null` si el proyecto todavía no tiene credenciales,
 * para que la UI pueda mostrar el aviso de configuración.
 */
export function createClient() {
  if (!isSupabaseConfigured) return null

  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
