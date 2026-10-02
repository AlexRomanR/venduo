import { NextResponse } from "next/server"

import {
  catalogoACanva,
  COOKIE_DE_CANVA,
  direccionDeAutorizacion,
  direccionDeVuelta,
  isCanvaConfigured,
  pedidoNuevo,
  permisoGuardado,
} from "@/lib/canva"
import { getCatalogo } from "@/lib/data/catalogos"
import { getMiTienda } from "@/lib/data/panel"

export const dynamic = "force-dynamic"
/** Con la aprobación ya dada, acá mismo se arma el PDF y se espera a Canva. */
export const maxDuration = 60

/**
 * El primer paso para editar un catálogo en Canva.
 *
 * Si la persona ya aprobó a Venduo, se renueva su permiso y se va directo al
 * editor de Canva, sin su pantalla. Si no, se le pide que autorice, y la vuelta
 * la atiende `/panel/catalogos/canva`.
 *
 * El catálogo tiene que estar guardado: el PDF se arma del lado del servidor,
 * con lo que hay en la base.
 */
export async function GET(
  peticion: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const direccion = new URL(peticion.url)
  const origen = direccion.origin
  const volver = (motivo: string) =>
    NextResponse.redirect(
      new URL(`/panel/catalogos/${id}?canva=${motivo}`, origen)
    )

  if (!isCanvaConfigured) return volver("sin-conectar")
  // Canva solo acepta 127.0.0.1 como dirección de vuelta local. Desde
  // localhost respondía que la dirección no coincide y devolvía a la persona
  // a producción, sin sesión: mejor decirlo antes de salir.
  if (direccion.hostname === "localhost") return volver("local")

  const [tienda, abierto] = await Promise.all([getMiTienda(), getCatalogo(id)])
  if (!tienda || !abierto) {
    return NextResponse.redirect(new URL("/panel/catalogos", origen))
  }

  const acceso = await permisoGuardado(tienda.id)
  if (acceso) {
    try {
      const edicion = await catalogoACanva(acceso, abierto.id)
      return edicion ? NextResponse.redirect(edicion) : volver("fallo")
    } catch (error) {
      console.error("[catalogos] no se pudo abrir en Canva:", error)
      return volver("fallo")
    }
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
