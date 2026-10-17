import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { exigirFuncion } from "@/lib/data/funciones"
import { getMiTienda } from "@/lib/data/panel"
import { COOKIE_DE_TIKTOK, conectar, leerPedido } from "@/lib/tiktok"

export const dynamic = "force-dynamic"

/**
 * La vuelta desde TikTok: comprueba el `state`, cambia el código por los
 * permisos y los guarda cifrados. Siempre termina en la pantalla de la que se
 * fue, con `?tiktok=` diciendo cómo le fue, nunca en una página de error.
 */
export async function GET(peticion: Request) {
  const direccion = new URL(peticion.url)
  const [almacen, tienda, permiso] = await Promise.all([
    cookies(),
    getMiTienda(),
    exigirFuncion("tiktok"),
  ])
  const pedido = leerPedido(almacen.get(COOKIE_DE_TIKTOK)?.value)

  const ir = (ruta: string, resultado?: string) => {
    const destino = new URL(ruta, direccion.origin)
    if (resultado) destino.searchParams.set("tiktok", resultado)
    const respuesta = NextResponse.redirect(destino)
    // El pedido sirve una sola vez.
    respuesta.cookies.set(COOKIE_DE_TIKTOK, "", {
      path: "/panel/marketing/tiktok",
      maxAge: 0,
    })
    return respuesta
  }

  if (!pedido || !tienda || !permiso.ok) return ir("/panel/marketing")

  // `access_denied` es la persona diciendo que no: vuelve sin aviso de error.
  const error = direccion.searchParams.get("error")
  if (error)
    return ir(pedido.volver, error === "access_denied" ? "no" : "error")

  const codigo = direccion.searchParams.get("code")
  if (!codigo || direccion.searchParams.get("state") !== pedido.estado) {
    return ir(pedido.volver, "error")
  }

  try {
    await conectar(tienda.id, codigo, direccion.origin)
  } catch (fallo) {
    console.error("[tiktok] no se pudo conectar la cuenta:", fallo)
    return ir(pedido.volver, "error")
  }
  return ir(pedido.volver, "conectado")
}
