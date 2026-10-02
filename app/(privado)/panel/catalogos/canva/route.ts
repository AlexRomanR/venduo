import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  catalogoACanva,
  COOKIE_DE_CANVA,
  direccionDeVuelta,
  guardarConexion,
  leerPedido,
  pedirPermiso,
} from "@/lib/canva"
import { getMiTienda } from "@/lib/data/panel"

export const dynamic = "force-dynamic"
/** Armar el PDF y esperar a que Canva lo importe puede tardar más que lo de siempre. */
export const maxDuration = 60

/**
 * La vuelta desde Canva: cambia el código por un permiso, guarda la conexión
 * para no volver a pedir la aprobación, arma el PDF del catálogo con los
 * precios de hoy, lo importa como diseño de la persona y la manda al editor de
 * Canva.
 *
 * Cualquier tropiezo la devuelve al catálogo con un aviso, nunca a una página
 * de error: lo que ve es "no se pudo, llévalo a mano".
 */
export async function GET(peticion: Request) {
  const direccion = new URL(peticion.url)
  const origen = direccion.origin
  const [almacen, tienda] = await Promise.all([cookies(), getMiTienda()])
  const pedido = leerPedido(almacen.get(COOKIE_DE_CANVA)?.value)

  const ir = (ruta: string) => {
    const respuesta = NextResponse.redirect(new URL(ruta, origen))
    // El pedido sirve una sola vez.
    respuesta.cookies.set(COOKIE_DE_CANVA, "", {
      path: "/panel/catalogos",
      maxAge: 0,
    })
    return respuesta
  }

  if (!pedido || !tienda) return ir("/panel/catalogos")
  const volver = (motivo: string) =>
    ir(`/panel/catalogos/${pedido.catalogo}?canva=${motivo}`)

  const error = direccion.searchParams.get("error")
  if (error) {
    // `access_denied` es la persona diciendo que no. Lo demás es Canva
    // rechazando el pedido: una integración sin aprobar, por ejemplo.
    if (error === "access_denied") return volver("cancelado")
    console.error(
      "[catalogos] Canva rechazó la autorización:",
      error,
      direccion.searchParams.get("error_description")
    )
    return volver("rechazado")
  }
  const codigo = direccion.searchParams.get("code")
  if (!codigo || direccion.searchParams.get("state") !== pedido.estado) {
    return volver("fallo")
  }

  try {
    const permiso = await pedirPermiso(
      codigo,
      pedido.verificador,
      direccionDeVuelta(origen)
    )
    const [edicion] = await Promise.all([
      catalogoACanva(permiso.acceso, pedido.catalogo),
      permiso.renovacion
        ? guardarConexion(tienda.id, permiso.renovacion)
        : null,
    ])
    if (!edicion) return volver("fallo")

    const respuesta = NextResponse.redirect(edicion)
    respuesta.cookies.set(COOKIE_DE_CANVA, "", {
      path: "/panel/catalogos",
      maxAge: 0,
    })
    return respuesta
  } catch (error) {
    // Se registra en el servidor: sin esto, un rechazo de Canva no se
    // distingue de un PDF que no se pudo armar.
    console.error("[catalogos] no se pudo abrir en Canva:", error)
    return volver("fallo")
  }
}
