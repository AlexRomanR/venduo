import { formatMoney } from "@/lib/format"
import type { OrderStatus } from "@/types"

/**
 * Los estados de un pedido, con su nombre en pantalla.
 *
 * Vive acá y no en `lib/data/pedidos.ts` porque lo leen componentes de cliente,
 * y ese módulo importa el cliente de servidor de Supabase: traerlo al navegador
 * rompe la compilación.
 *
 * Son tres porque la venta se cierra por WhatsApp: el comprador escribe, la
 * tienda le cobra en el chat y lo marca **pagado**, que es lo que descuenta el
 * stock. Todo lo demás se acuerda en el mismo chat y no se registra.
 */
export const ESTADOS: Array<{ valor: OrderStatus; etiqueta: string }> = [
  { valor: "pendiente", etiqueta: "Pendiente" },
  { valor: "pagado", etiqueta: "Pagado" },
  { valor: "cancelado", etiqueta: "Cancelado" },
]

/**
 * A qué estados puede pasar un pedido.
 *
 * El disparador `handle_order_status_change` es quien lo impone; esto es para
 * no ofrecer en pantalla un botón que la base va a rechazar.
 */
export const SIGUIENTES: Record<OrderStatus, OrderStatus[]> = {
  pendiente: ["pagado", "cancelado"],
  pagado: ["cancelado"],
  cancelado: [],
}

/**
 * El número para abrir un chat de WhatsApp, con el código de Bolivia.
 *
 * El número se escribe como se dicta —"70145823"— y `wa.me` pide el número
 * internacional: sin el 591 abría un chat con nadie. Un número que ya trae su
 * código de país se deja como está.
 */
export function numeroDeWhatsApp(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "")
  // Los celulares de Bolivia tienen ocho cifras y empiezan con 6 o 7.
  return /^[67]\d{7}$/.test(digitos) ? `591${digitos}` : digitos
}

export interface LineaDelMensaje {
  nombre: string
  cantidad: number
  totalCents: number
}

/**
 * El pedido escrito para mandarlo por WhatsApp a la tienda.
 *
 * Lleva el número del pedido para que la tienda lo encuentre en su panel, y
 * las líneas con los precios que calculó `create_order`, no los del carrito.
 */
export function mensajeDePedido(pedido: {
  numero: number
  tienda: string
  lineas: LineaDelMensaje[]
  totalCents: number
}): string {
  return [
    `Hola ${pedido.tienda}, quiero hacer este pedido (#${pedido.numero}):`,
    "",
    ...pedido.lineas.map(
      (l) => `· ${l.cantidad}× ${l.nombre} — ${formatMoney(l.totalCents)}`
    ),
    "",
    `Total: ${formatMoney(pedido.totalCents)}`,
  ].join("\n")
}

/** El enlace que abre WhatsApp con el mensaje ya escrito. */
export function enlaceDeWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/${numeroDeWhatsApp(telefono)}?text=${encodeURIComponent(mensaje)}`
}
