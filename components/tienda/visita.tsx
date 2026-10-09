"use client"

import * as React from "react"

import {
  PARAMETRO_DE_ORIGEN,
  detectarOrigen,
  type Origen,
  type TipoDeVisita,
} from "@/lib/visitas"

/**
 * De dónde vino esta visita, para toda la pestaña: la primera página que se
 * abre dice el origen, y las que siguen —el catálogo, un producto— lo
 * heredan. Si no, el catálogo abierto desde un QR contaría como "directo".
 */
function origenDeLaPestana(tienda: string): Origen {
  const clave = `venduo:origen:${tienda}`
  try {
    const guardado = sessionStorage.getItem(clave)
    if (guardado) return guardado as Origen
  } catch {
    // Sin sessionStorage (modo privado estricto) se calcula cada vez.
  }

  const origen = detectarOrigen(
    new URLSearchParams(location.search).get(PARAMETRO_DE_ORIGEN),
    document.referrer,
    navigator.userAgent,
    location.hostname
  )
  try {
    sessionStorage.setItem(clave, origen)
  } catch {
    // Ídem.
  }
  return origen
}

/**
 * Anota algo que pasó en la tienda: una página vista, algo agregado al
 * carrito, un pedido enviado. No espera respuesta ni frena nada, y si el
 * navegador no puede mandarlo, no pasa nada.
 */
export function registrarEvento(
  tienda: string,
  tipo: TipoDeVisita,
  producto?: string | null
) {
  try {
    const cuerpo = JSON.stringify({
      tienda,
      tipo,
      producto: producto ?? null,
      origen: origenDeLaPestana(tienda),
    })
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/visita",
        new Blob([cuerpo], { type: "application/json" })
      )
    } else {
      void fetch("/api/visita", {
        method: "POST",
        body: cuerpo,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch {
    // Contar una visita nunca puede romper la tienda.
  }
}

/**
 * La visita a una página de la tienda. Va en las páginas de `/t/[slug]`, no en
 * los kits: así la vista previa del editor, que dibuja los mismos kits, no
 * cuenta.
 */
export function RegistroDeVisita({
  tienda,
  tipo,
  producto,
}: {
  tienda: string
  tipo: TipoDeVisita
  producto?: string
}) {
  React.useEffect(() => {
    registrarEvento(tienda, tipo, producto)
  }, [tienda, tipo, producto])

  return null
}
