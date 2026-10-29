import { fotoDemo } from "@/lib/demo-data"
import { getMiTienda } from "@/lib/data/panel"
import { createClient } from "@/lib/supabase/server"
import { limitesDe, PERIODOS, type Periodo } from "@/lib/exportar"
import { inicioDelDia } from "@/lib/format"
import { noSeConcreto } from "@/lib/pedidos"
import type { OrderStatus } from "@/types"

export interface LineaPedido {
  productoId: string | null
  /** La foto del producto hoy; `null` si no tiene o ya no está. */
  foto: string | null
  nombre: string
  /** La opción que se pidió —"M · Negro"—, copiada al pedir. */
  variante: string | null
  cantidad: number
  precioCents: number
  totalCents: number
}

export interface Pedido {
  id: string
  numero: number
  estado: OrderStatus
  /**
   * Quién compró. Los pedidos que llegan por WhatsApp no lo traen —la tienda
   * lo tiene en el chat—; solo los anteriores a ese cambio.
   */
  comprador: string | null
  telefono: string | null
  totalCents: number
  creado: string
  pagado: string | null
  items: LineaPedido[]
  /** La foto del primer producto que tenga una: con eso se reconoce el pedido. */
  foto: string | null
  /** La registró la tienda: se vendió en el chat o en persona, no en la tienda. */
  directa: boolean
  /** La nota interna de la tienda. Nunca la ve quien compra. */
  nota: string | null
}

export interface ResumenPedidos {
  total: number
  /** Los pendientes dentro del plazo: los que esperan a la tienda. */
  pendientes: number
  /** Los pendientes que pasaron el plazo sin cobrarse. */
  noConcretados: number
  pagados: number
  cancelados: number
  porCobrarCents: number
  cobradoCents: number
}

export interface Pedidos {
  pedidos: Pedido[]
  resumen: ResumenPedidos
  /** Cuántos hay en cada período de la descarga, sobre todos y no lo filtrado. */
  porPeriodo: Record<Periodo, number>
  esDemo: boolean
}

function contarPorPeriodo(pedidos: Pedido[]): Record<Periodo, number> {
  const ahora = new Date()
  return Object.fromEntries(
    PERIODOS.map(({ valor }) => {
      const { desde, hasta } = limitesDe(valor, ahora)
      return [
        valor,
        pedidos.filter(
          (p) =>
            (!desde || p.creado >= inicioDelDia(desde)) &&
            (!hasta || p.creado < inicioDelDia(hasta))
        ).length,
      ]
    })
  ) as Record<Periodo, number>
}

function pedidosDeDemostracion(filtro?: FiltroPedidos): Pedidos {
  const hace = (minutos: number) =>
    new Date(Date.now() - minutos * 60_000).toISOString()
  const linea = (
    nombre: string,
    cantidad: number,
    precioCents: number,
    foto: string
  ): LineaPedido => ({
    productoId: null,
    foto: fotoDemo(foto),
    nombre,
    variante: null,
    cantidad,
    precioCents,
    totalCents: cantidad * precioCents,
  })
  const pedido = (
    datos: Omit<
      Pedido,
      | "comprador"
      | "telefono"
      | "pagado"
      | "foto"
      | "totalCents"
      | "directa"
      | "nota"
    > & { nota?: string }
  ): Pedido => ({
    comprador: null,
    telefono: null,
    directa: false,
    nota: null,
    pagado: datos.estado === "pagado" ? datos.creado : null,
    ...datos,
    totalCents: datos.items.reduce((t, i) => t + i.totalCents, 0),
    foto: datos.items[0]?.foto ?? null,
  })

  const pedidos: Pedido[] = [
    pedido({
      id: "demo-pedido-1",
      numero: 148,
      estado: "pendiente",
      creado: hace(26),
      nota: "Lo recoge el sábado en la tienda. Paga al recoger.",
      items: [linea("Mochila urbana", 1, 52_000, "1553062407-98eeb64c6a62")],
    }),
    pedido({
      id: "demo-pedido-2",
      numero: 147,
      estado: "pagado",
      creado: hace(134),
      items: [
        linea("Polera básica", 1, 6_500, "1521572163474-6864f9cf17ab"),
        linea("Gorra deportiva", 1, 5_500, "1588850561407-ed78c282e89b"),
        linea("Buzo oversize", 1, 12_500, "1556905055-8f358a7a47b2"),
      ],
    }),
    pedido({
      id: "demo-pedido-3",
      numero: 146,
      estado: "pagado",
      creado: hace(60 * 27),
      items: [
        linea("Zapatillas running", 1, 18_000, "1542291026-7eec264c27ff"),
      ],
    }),
    pedido({
      id: "demo-pedido-4",
      numero: 145,
      estado: "pagado",
      creado: hace(60 * 24 * 3 + 95),
      items: [
        linea("Campera rompeviento", 1, 64_000, "1548883354-7622d03aca27"),
        linea("Polera básica", 1, 6_500, "1521572163474-6864f9cf17ab"),
      ],
    }),
    pedido({
      id: "demo-pedido-5",
      numero: 144,
      estado: "cancelado",
      creado: hace(60 * 24 * 4 + 300),
      items: [linea("Gorra deportiva", 1, 6_500, "1588850561407-ed78c282e89b")],
    }),
    pedido({
      id: "demo-pedido-6",
      numero: 139,
      estado: "pendiente",
      creado: hace(60 * 24 * 10),
      items: [linea("Mochila urbana", 1, 52_000, "1553062407-98eeb64c6a62")],
    }),
  ]

  return {
    pedidos: filtro ? pedidos.filter((p) => enFiltro(p, filtro)) : pedidos,
    resumen: resumir(pedidos),
    porPeriodo: contarPorPeriodo(pedidos),
    esDemo: true,
  }
}

/**
 * Los filtros de la lista: los tres estados y "no concretados", que no es un
 * estado de la base sino un pendiente viejo (`noSeConcreto`).
 */
export type FiltroPedidos = OrderStatus | "no_concretado"

function enFiltro(pedido: Pedido, filtro: FiltroPedidos): boolean {
  const viejo = noSeConcreto(pedido)
  if (filtro === "no_concretado") return viejo
  if (filtro === "pendiente") return pedido.estado === "pendiente" && !viejo
  return pedido.estado === filtro
}

function resumir(pedidos: Pedido[]): ResumenPedidos {
  const en = (filtro: FiltroPedidos) =>
    pedidos.filter((p) => enFiltro(p, filtro))
  const suma = (lista: Pedido[]) => lista.reduce((t, p) => t + p.totalCents, 0)

  return {
    total: pedidos.length,
    pendientes: en("pendiente").length,
    noConcretados: en("no_concretado").length,
    pagados: en("pagado").length,
    cancelados: en("cancelado").length,
    // Lo que no se concretó en una semana ya no es plata por cobrar.
    porCobrarCents: suma(en("pendiente")),
    cobradoCents: suma(en("pagado")),
  }
}

/**
 * Los pedidos de mi tienda.
 *
 * El `store_id` se escribe además de confiar en RLS. La política de `orders`
 * ya acota a `my_store_id()`, pero un filtro explícito es lo que hace que la
 * consulta siga siendo correcta si alguien toca la política.
 */
export async function getPedidos(filtro?: FiltroPedidos): Promise<Pedidos> {
  const supabase = await createClient()
  if (!supabase) return pedidosDeDemostracion(filtro)

  const tienda = await getMiTienda()
  if (!tienda) return pedidosDeDemostracion(filtro)

  const { data: filas } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, buyer_name, buyer_phone, total_cents,
       created_at, paid_at, origen, nota,
       order_items ( product_id, product_name, quantity, unit_price_cents,
                     variant_name, products ( image_url ) )`
    )
    .eq("store_id", tienda.id)
    .order("created_at", { ascending: false })

  const pedidos: Pedido[] = (filas ?? []).map((fila) => {
    const items = (fila.order_items ?? []).map((item) => ({
      productoId: item.product_id,
      foto: item.products?.image_url ?? null,
      nombre: item.product_name,
      variante: item.variant_name,
      cantidad: item.quantity,
      precioCents: item.unit_price_cents,
      totalCents: item.quantity * item.unit_price_cents,
    }))
    return {
      id: fila.id,
      numero: fila.order_number,
      estado: fila.status,
      comprador: fila.buyer_name,
      telefono: fila.buyer_phone,
      totalCents: fila.total_cents,
      creado: fila.created_at,
      pagado: fila.paid_at,
      items,
      foto: items.find((item) => item.foto)?.foto ?? null,
      directa: fila.origen === "directa",
      nota: fila.nota,
    }
  })

  return {
    // El resumen se calcula sobre todo, no sobre lo filtrado: es el estado del
    // negocio y no el pie de la tabla.
    pedidos: filtro ? pedidos.filter((p) => enFiltro(p, filtro)) : pedidos,
    resumen: resumir(pedidos),
    porPeriodo: contarPorPeriodo(pedidos),
    esDemo: false,
  }
}

/** Un pedido para verlo en detalle. `null` si no es de mi tienda. */
export async function getPedido(id: string): Promise<Pedido | null> {
  const { pedidos } = await getPedidos()
  return pedidos.find((p) => p.id === id) ?? null
}
