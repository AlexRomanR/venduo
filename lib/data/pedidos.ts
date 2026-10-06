import { getMiTienda } from "@/lib/data/panel"
import { createClient } from "@/lib/supabase/server"
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
  pendientes: number
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

function pedidosDeDemostracion(): Pedidos {
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
  ]

  return { pedidos, resumen: resumir(pedidos), esDemo: true }
}

function resumir(pedidos: Pedido[]): ResumenPedidos {
  const enEstado = (estado: OrderStatus) =>
    pedidos.filter((p) => p.estado === estado)
  const suma = (lista: Pedido[]) => lista.reduce((t, p) => t + p.totalCents, 0)

  return {
    total: pedidos.length,
    pendientes: enEstado("pendiente").length,
    pagados: enEstado("pagado").length,
    cancelados: enEstado("cancelado").length,
    porCobrarCents: suma(enEstado("pendiente")),
    cobradoCents: suma(enEstado("pagado")),
  }
}

/**
 * Los pedidos de mi tienda.
 *
 * El `store_id` se escribe además de confiar en RLS. La política de `orders`
 * ya acota a `my_store_id()`, pero un filtro explícito es lo que hace que la
 * consulta siga siendo correcta si alguien toca la política.
 */
export async function getPedidos(filtro?: string): Promise<Pedidos> {
  const supabase = await createClient()
  if (!supabase) return pedidosDeDemostracion()

  const tienda = await getMiTienda()
  if (!tienda) return pedidosDeDemostracion()

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
    pedidos: filtro ? pedidos.filter((p) => p.estado === filtro) : pedidos,
    resumen: resumir(pedidos),
    esDemo: false,
  }
}

/** Un pedido para verlo en detalle. `null` si no es de mi tienda. */
export async function getPedido(id: string): Promise<Pedido | null> {
  const { pedidos } = await getPedidos()
  return pedidos.find((p) => p.id === id) ?? null
}
