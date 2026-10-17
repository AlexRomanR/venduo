import { NextResponse } from "next/server"

import { exigirFuncion } from "@/lib/data/funciones"
import {
  COOKIE_DE_TIKTOK,
  direccionDeAutorizacion,
  isTikTokConfigured,
  pedidoNuevo,
} from "@/lib/tiktok"

export const dynamic = "force-dynamic"

/**
 * Conectar la cuenta de TikTok: lleva a la pantalla de TikTok donde la persona
 * aprueba a Venduo. El pedido —el `state` contra falsificaciones y a dónde
 * volver— viaja cifrado en una cookie que vence en diez minutos.
 */
export async function GET(peticion: Request) {
  const direccion = new URL(peticion.url)
  const volver = direccion.searchParams.get("volver") ?? "/panel/marketing"

  const permiso = await exigirFuncion("tiktok")
  if (!permiso.ok || !isTikTokConfigured) {
    return NextResponse.redirect(new URL("/panel/marketing", direccion.origin))
  }

  const { estado, cookie } = pedidoNuevo(volver)
  const respuesta = NextResponse.redirect(
    direccionDeAutorizacion(direccion.origin, estado)
  )
  respuesta.cookies.set(COOKIE_DE_TIKTOK, cookie, {
    httpOnly: true,
    secure: direccion.protocol === "https:",
    sameSite: "lax",
    path: "/panel/marketing/tiktok",
    maxAge: 600,
  })
  return respuesta
}
