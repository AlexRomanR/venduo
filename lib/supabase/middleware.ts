import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { env, isSupabaseConfigured } from "@/lib/env"

/** Rutas que exigen sesión iniciada. */
const PROTECTED_PREFIXES = ["/dashboard"]

/**
 * Refresca el token de Supabase en cada request y protege el dashboard.
 * Sin credenciales configuradas deja pasar todo (modo demo).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!isSupabaseConfigured) return response

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  // No poner lógica entre createServerClient y getUser: rompe el refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (!user && needsAuth) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return response
}
