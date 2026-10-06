import { getMiTienda } from "@/lib/data/panel"
import { createClient } from "@/lib/supabase/server"
import { noSeConcreto } from "@/lib/pedidos"
import type { OrderStatus } from "@/types"

export interface LineaPedido {
  nombre: string
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
  esDemo: boolean
}

function pedidosDeDemostracion(filtro?: FiltroPedidos): Pedidos {
  const base = {
    comprador: null,
    telefono: null,
    pagado: null,
    creado: new Date().toISOString(),
  }

  const pedidos: Pedido[] = [
    {
      ...base,
      id: "demo-1",
      numero: 104,
      estado: "pendiente",
      totalCents: 24000,
      items: [
        {
          nombre: "Mochila urbana",
          cantidad: 1,
          precioCents: 24000,
          totalCents: 24000,
        },
      ],
    },
    {
      ...base,
      id: "demo-2",
      numero: 103,
      estado: "pagado",
      totalCents: 13000,
      pagado: new Date().toISOString(),
      items: [
        {
          nombre: "Polera básica",
          cantidad: 2,
          precioCents: 6500,
          totalCents: 13000,
        },
      ],
    },
    {
      ...base,
      id: "demo-3",
      numero: 101,
      estado: "pendiente",
      totalCents: 5500,
      creado: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        { nombre: "Gorra", cantidad: 1, precioCents: 5500, totalCents: 5500 },
      ],
    },
  ]

  return {
    pedidos: filtro ? pedidos.filter((p) => enFiltro(p, filtro)) : pedidos,
    resumen: resumir(pedidos),
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
       created_at, paid_at,
       order_items ( product_name, quantity, unit_price_cents )`
    )
    .eq("store_id", tienda.id)
    .order("created_at", { ascending: false })

  const pedidos: Pedido[] = (filas ?? []).map((fila) => ({
    id: fila.id,
    numero: fila.order_number,
    estado: fila.status,
    comprador: fila.buyer_name,
    telefono: fila.buyer_phone,
    totalCents: fila.total_cents,
    creado: fila.created_at,
    pagado: fila.paid_at,
    items: (fila.order_items ?? []).map((item) => ({
      nombre: item.product_name,
      cantidad: item.quantity,
      precioCents: item.unit_price_cents,
      totalCents: item.quantity * item.unit_price_cents,
    })),
  }))

  return {
    // El resumen se calcula sobre todo, no sobre lo filtrado: es el estado del
    // negocio y no el pie de la tabla.
    pedidos: filtro ? pedidos.filter((p) => enFiltro(p, filtro)) : pedidos,
    resumen: resumir(pedidos),
    esDemo: false,
  }
}

/** Un pedido para verlo en detalle. `null` si no es de mi tienda. */
export async function getPedido(id: string): Promise<Pedido | null> {
  const { pedidos } = await getPedidos()
  return pedidos.find((p) => p.id === id) ?? null
}
