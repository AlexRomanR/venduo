import { NextResponse, type NextRequest } from "next/server"

import { COOKIE_DEL_ALTA } from "@/lib/data/alta"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase?.auth.signOut()

  const respuesta = NextResponse.redirect(
    new URL("/", request.nextUrl.origin),
    {
      status: 303,
    }
  )
  // El borrador del alta lleva el WhatsApp de quien salió: no se queda.
  respuesta.cookies.delete({ name: COOKIE_DEL_ALTA, path: "/crear" })
  return respuesta
}
