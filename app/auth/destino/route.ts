import { NextResponse, type NextRequest } from "next/server"

import { resolverDestino } from "@/lib/data/panel"
import { createClient } from "@/lib/supabase/server"

/**
 * Resuelve a dónde entra una cuenta y redirige una sola vez.
 *
 * El ingreso manda acá en vez de adivinar. Antes empujaba a `/panel`, esa
 * pantalla consultaba los datos y recién entonces redirigía: se veía el panel
 * un instante antes del rebote, y el vendedor pasaba por una pantalla que no
 * era suya.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const url = request.nextUrl.clone()
  const pedido = url.searchParams.get("next")

  // Sin credenciales no hay a quién resolverle nada: el modo demo entra al
  // panel, que es lo que tiene datos de ejemplo que mostrar.
  if (!supabase) {
    return NextResponse.redirect(new URL("/panel", request.url))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Solo se honra una ruta interna: un `next` absoluto convertiría este
  // endpoint en un redirector abierto hacia cualquier dominio.
  if (pedido && pedido.startsWith("/") && !pedido.startsWith("//")) {
    return NextResponse.redirect(new URL(pedido, request.url))
  }

  return NextResponse.redirect(new URL(await resolverDestino(), request.url))
}
