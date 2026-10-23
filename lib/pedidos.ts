import { diaEnBolivia, formatMoney, formatRelative } from "@/lib/format"
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
 * Los días que un pedido pendiente espera antes de quedar "no concretado".
 *
 * Cada toque al botón del carrito crea un pedido, y muchos no se concretan:
 * el comprador no manda el mensaje o no vuelve a escribir. Pasado el plazo
 * dejan de contar como algo que espera a la tienda —salen de "Por cobrar" y
 * de los contadores rojos—, pero **no se cancelan**: un cancelado ya no se
 * puede marcar pagado, y el comprador que paga el día ocho tiene que poder.
 * Por eso tampoco hay una tarea que los cambie en la base: se decide al leer.
 */
export const DIAS_PARA_CONCRETAR = 7

/** Desde cuándo un pedido pendiente todavía cuenta como por cobrar, en ISO. */
export function limiteParaConcretar(ahora: Date = new Date()): string {
  return new Date(
    ahora.getTime() - DIAS_PARA_CONCRETAR * 24 * 60 * 60 * 1000
  ).toISOString()
}

/** Si un pedido pendiente ya pasó el plazo sin que la tienda lo cobrara. */
export function noSeConcreto(
  pedido: { estado: OrderStatus; creado: string },
  ahora: Date = new Date()
): boolean {
  return (
    pedido.estado === "pendiente" &&
    // Se comparan instantes y no textos: la base escribe "+00:00" y
    // `toISOString` escribe "Z".
    new Date(pedido.creado).getTime() <
      new Date(limiteParaConcretar(ahora)).getTime()
  )
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

/**
 * Cómo se nombra un pedido en una lista: quién compró o, si no se sabe —los
 * que llegan por WhatsApp no lo traen—, qué pidió: "2× Polera y 1 más". Es lo
 * mismo que dice la app.
 */
export function tituloDePedido(pedido: {
  comprador: string | null
  items: Array<{ nombre: string; cantidad: number }>
}): string {
  if (pedido.comprador) return pedido.comprador

  const [primera, ...resto] = pedido.items
  if (!primera) return "Pedido por WhatsApp"

  const nombre =
    primera.cantidad > 1
      ? `${primera.cantidad}× ${primera.nombre}`
      : primera.nombre
  return resto.length > 0 ? `${nombre} y ${resto.length} más` : nombre
}

/** Los grupos de una lista de pedidos, del más nuevo al más viejo. */
export type GrupoDeFecha = "Hoy" | "Ayer" | "Esta semana" | "Este mes" | "Antes"

/**
 * En qué grupo va un pedido: con eso la lista se recorre sin leer fechas. Los
 * días se cuentan en hora de Bolivia, no en la del servidor.
 */
export function grupoDeFecha(
  creado: string,
  ahora: Date = new Date()
): GrupoDeFecha {
  const dias =
    (Date.parse(diaEnBolivia(ahora)) - Date.parse(diaEnBolivia(creado))) /
    86_400_000
  if (dias <= 0) return "Hoy"
  if (dias === 1) return "Ayer"
  if (dias < 7) return "Esta semana"
  if (dias < 30) return "Este mes"
  return "Antes"
}

/**
 * Un pedido listo para su fila, con todo lo que depende de la hora ya
 * calculado: "hace 26 min" y "no concretado" se deciden una vez, en el
 * servidor. Si los calculara el navegador podía salir otro minuto, y React
 * marcaba la diferencia como error de hidratación.
 */
export interface PedidoEnFila {
  id: string
  numero: number
  titulo: string
  telefono: string | null
  totalCents: number
  estado: OrderStatus
  articulos: number
  foto: string | null
  relativo: string
  noConcretado: boolean
}

export function pedidoEnFila(
  pedido: {
    id: string
    numero: number
    titulo: string
    telefono: string | null
    totalCents: number
    estado: OrderStatus
    creado: string
    articulos: number
    foto: string | null
  },
  ahora: Date = new Date()
): PedidoEnFila {
  return {
    id: pedido.id,
    numero: pedido.numero,
    titulo: pedido.titulo,
    telefono: pedido.telefono,
    totalCents: pedido.totalCents,
    estado: pedido.estado,
    articulos: pedido.articulos,
    foto: pedido.foto,
    relativo: formatRelative(pedido.creado, ahora),
    noConcretado: noSeConcreto(pedido, ahora),
  }
}
