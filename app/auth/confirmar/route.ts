import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"

/** Los enlaces de correo que se aceptan acá. */
const TIPOS: EmailOtpType[] = ["recovery", "email"]

/**
 * El enlace de un correo de Supabase con `token_hash`: el de elegir otra
 * contraseña, con la plantilla de `supabase/templates/recuperar.html`.
 *
 * A diferencia de `/auth/callback`, que cambia un `code` por la sesión y
 * necesita el mismo navegador que pidió el correo, este funciona en cualquiera:
 * quien pide el enlace en la computadora y lo abre desde el correo del celular
 * entra igual.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const tipo = searchParams.get("type") as EmailOtpType | null
  const pedido = searchParams.get("next") ?? "/nueva-clave"
  // Solo rutas de esta misma web: un `next` armado a mano no saca a nadie.
  const next =
    pedido.startsWith("/") && !pedido.startsWith("//") ? pedido : "/nueva-clave"

  // Detrás de un proxy (Vercel) el host real viene en x-forwarded-host, como
  // en `/auth/callback`.
  const forwardedHost = request.headers.get("x-forwarded-host")
  const base =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `https://${forwardedHost}`

  const supabase = await createClient()
  if (!tokenHash || !tipo || !TIPOS.includes(tipo) || !supabase) {
    return NextResponse.redirect(`${base}/nueva-clave`)
  }

  const { error } = await supabase.auth.verifyOtp({
    type: tipo,
    token_hash: tokenHash,
  })
  // Vencido o ya usado: la pantalla de la contraseña nueva, sin sesión, lo
  // dice y ofrece pedir otro.
  return NextResponse.redirect(`${base}${error ? "/nueva-clave" : next}`)
}
