import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  COOKIE_DE_CANVA,
  direccionDeVuelta,
  importarEnCanva,
  leerPedido,
  pedirPermiso,
} from "@/lib/canva"
import { hojasDe } from "@/lib/catalogos/datos"
import { problemasDeEstilo } from "@/lib/catalogos/estilo"
import { catalogoEnPdf } from "@/lib/catalogos/pdf"
import { getCatalogo, getMaterialDelCatalogo } from "@/lib/data/catalogos"

export const dynamic = "force-dynamic"
/** Armar el PDF y esperar a que Canva lo importe puede tardar más que lo de siempre. */
export const maxDuration = 60

/**
 * La vuelta desde Canva: cambia el código por un permiso, arma el PDF del
 * catálogo con los precios de hoy, lo importa como diseño de la persona y la
 * manda al editor de Canva.
 *
 * Cualquier tropiezo la devuelve al catálogo con un aviso, nunca a una página
 * de error: lo que ve es "no se pudo, bájalo y súbelo a mano".
 */
export async function GET(peticion: Request) {
  const direccion = new URL(peticion.url)
  const origen = direccion.origin
  const almacen = await cookies()
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

  if (!pedido) return ir("/panel/catalogos")
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
    const [abierto, { datos }] = await Promise.all([
      getCatalogo(pedido.catalogo),
      getMaterialDelCatalogo(),
    ])
    if (
      !abierto ||
      problemasDeEstilo(abierto.catalogo.estilo).length > 0 ||
      hojasDe(abierto.catalogo, datos).length === 0
    ) {
      return volver("fallo")
    }

    const [permiso, pdf] = await Promise.all([
      pedirPermiso(codigo, pedido.verificador, direccionDeVuelta(origen)),
      catalogoEnPdf(abierto.catalogo, datos),
    ])
    const edicion = await importarEnCanva(permiso, pdf, abierto.catalogo.nombre)

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
