import { NextResponse } from "next/server"

import {
  COOKIE_DE_CANVA,
  direccionDeAutorizacion,
  direccionDeVuelta,
  isCanvaConfigured,
  pedidoNuevo,
} from "@/lib/canva"
import { getCatalogo } from "@/lib/data/catalogos"

export const dynamic = "force-dynamic"

/**
 * El primer paso para editar un catálogo en Canva: pedirle a la persona que
 * autorice a Venduo. La vuelta la atiende `/panel/catalogos/canva`.
 *
 * El catálogo tiene que estar guardado: el PDF se arma del lado del servidor,
 * con lo que hay en la base.
 */
export async function GET(
  peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const origen = new URL(peticion.url).origin

  if (!isCanvaConfigured) {
    return NextResponse.redirect(
      new URL(`/panel/catalogos/${id}?canva=sin-conectar`, origen)
    )
  }

  const abierto = await getCatalogo(id)
  if (!abierto) {
    return NextResponse.redirect(new URL("/panel/catalogos", origen))
  }

  const { pedido, cookie } = pedidoNuevo(abierto.id)
  const respuesta = NextResponse.redirect(
    direccionDeAutorizacion(pedido, direccionDeVuelta(origen))
  )
  respuesta.cookies.set(COOKIE_DE_CANVA, cookie, {
    httpOnly: true,
    secure: origen.startsWith("https://"),
    // Lax alcanza: la vuelta desde Canva es una navegación, y la cookie viaja.
    sameSite: "lax",
    path: "/panel/catalogos",
    maxAge: 10 * 60,
  })
  return respuesta
}
