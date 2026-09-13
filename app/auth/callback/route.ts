import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

/**
 * Callback de Supabase Auth: intercambia el `code` de OAuth / magic link
 * por una sesión y redirige al destino original.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/panel"

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Falta el código de acceso.")}`
    )
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Supabase no está configurado.")}`
    )
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    )
  }

  // Detrás de un proxy (Vercel) el host real viene en x-forwarded-host.
  const forwardedHost = request.headers.get("x-forwarded-host")
  const base =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `https://${forwardedHost}`

  return NextResponse.redirect(`${base}${next}`)
}
