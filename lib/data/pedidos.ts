import { createClient } from "@/lib/supabase/server"
import { formatMoney } from "@/lib/format"
import { numeroDeWhatsApp } from "@/lib/pedidos"
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
  comprador: string
  telefono: string
  correo: string | null
  totalCents: number
  comisionCents: number
  netoCents: number
  /** El vendedor que trajo la venta, o `null` si fue directa. */
  vendedor: { nombre: string; codigo: string } | null
  comprobante: string | null
  creado: string
  pagado: string | null
  items: LineaPedido[]
}

export interface ResumenPedidos {
  total: number
  pendientes: number
  pagados: number
  enCamino: number
  entregados: number
  cancelados: number
  porCobrarCents: number
  cobradoCents: number
  conComprobante: number
}

export interface Pedidos {
  pedidos: Pedido[]
  resumen: ResumenPedidos
  esDemo: boolean
}

function pedidosDeDemostracion(): Pedidos {
  const base = {
    comisionCents: 0,
    netoCents: 0,
    correo: null,
    comprobante: null,
    pagado: null,
    creado: new Date().toISOString(),
  }

  const pedidos: Pedido[] = [
    {
      ...base,
      id: "demo-1",
      numero: 104,
      estado: "pendiente",
      comprador: "Lucía Fernández",
      telefono: "76543210",
      totalCents: 24000,
      comisionCents: 2880,
      netoCents: 21120,
      vendedor: { nombre: "Ana Quispe", codigo: "JZCER68" },
      comprobante: "demo/comprobante.jpg",
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
      comprador: "Carlos Pérez",
      telefono: "71234567",
      totalCents: 13000,
      vendedor: null,
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

  return {
    total: pedidos.length,
    pendientes: enEstado("pendiente").length,
    pagados: enEstado("pagado").length,
    enCamino: enEstado("enviado").length,
    entregados: enEstado("entregado").length,
    cancelados: enEstado("cancelado").length,
    // Lo pendiente es lo que todavía no entró: cobrado es todo lo que pasó de
    // ahí, incluido lo ya entregado.
    porCobrarCents: enEstado("pendiente").reduce((t, p) => t + p.totalCents, 0),
    cobradoCents: pedidos
      .filter((p) => ["pagado", "enviado", "entregado"].includes(p.estado))
      .reduce((t, p) => t + p.totalCents, 0),
    conComprobante: pedidos.filter(
      (p) => p.estado === "pendiente" && p.comprobante
    ).length,
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

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return pedidosDeDemostracion()

  const { data: tienda } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!tienda) return pedidosDeDemostracion()

  const { data: filas } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, buyer_name, buyer_phone, buyer_email,
       total_cents, commission_cents, net_to_store_cents, referral_code,
       payment_proof_url, created_at, paid_at, seller_id,
       order_items ( product_name, quantity, unit_price_cents )`
    )
    .eq("store_id", tienda.id)
    .order("created_at", { ascending: false })

  const crudos = filas ?? []

  // Los nombres de los vendedores en una sola consulta: uno por pedido sería
  // una ida a la base por fila.
  const vinculos = [
    ...new Set(
      crudos.map((f) => f.seller_id).filter((id): id is string => !!id)
    ),
  ]

  const nombres = new Map<string, string>()
  if (vinculos.length > 0) {
    const { data: sellers } = await supabase
      .from("store_sellers")
      .select("id, user_id")
      .in("id", vinculos)

    const usuarios = (sellers ?? []).map((s) => s.user_id)
    const { data: perfiles } = await supabase
      .from("seller_profiles")
      .select("user_id, display_name")
      .in("user_id", usuarios)

    const porUsuario = new Map(
      (perfiles ?? []).map((p) => [p.user_id, p.display_name])
    )
    for (const s of sellers ?? []) {
      nombres.set(s.id, porUsuario.get(s.user_id) ?? "Vendedor")
    }
  }

  const pedidos: Pedido[] = crudos.map((fila) => ({
    id: fila.id,
    numero: fila.order_number,
    estado: fila.status,
    comprador: fila.buyer_name,
    telefono: fila.buyer_phone,
    correo: fila.buyer_email,
    totalCents: fila.total_cents,
    comisionCents: fila.commission_cents,
    netoCents: fila.net_to_store_cents,
    vendedor: fila.seller_id
      ? {
          nombre: nombres.get(fila.seller_id) ?? "Vendedor",
          codigo: fila.referral_code ?? "",
        }
      : null,
    comprobante: fila.payment_proof_url,
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

/**
 * El mensaje de WhatsApp con el pedido ya escrito.
 *
 * La plataforma no gestiona envíos: la entrega se coordina entre las dos
 * personas. Lo que sí hace es que nadie tenga que volver a tipear qué se
 * compró, que es donde se pierden los detalles.
 */
export function mensajeDeEntrega(pedido: Pedido, tienda: string): string {
  const lineas = [
    `Hola ${pedido.comprador}, te escribo de ${tienda}.`,
    "",
    `Tu pedido #${pedido.numero}:`,
    ...pedido.items.map(
      (i) => `· ${i.cantidad}× ${i.nombre} — ${formatMoney(i.totalCents)}`
    ),
    "",
    `Total: ${formatMoney(pedido.totalCents)}`,
    "",
    "¿Cuándo y dónde te queda bien recibirlo?",
  ]

  return `https://wa.me/${numeroDeWhatsApp(pedido.telefono)}?text=${encodeURIComponent(lineas.join("\n"))}`
}
