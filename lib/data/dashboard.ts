import { createClient } from "@/lib/supabase/server"
import {
  getDemoMetrics,
  type DashboardMetrics,
  type SalesPoint,
} from "@/lib/demo-data"
import { CURRENCY } from "@/lib/format"

const DAYS = 30

/**
 * Métricas del dashboard.
 *
 * Si Supabase no está configurado —o el usuario todavía no tiene tienda—
 * devuelve datos de ejemplo, para que la pantalla sirva de demo desde el
 * primer `npm run dev`.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient()
  if (!supabase) return getDemoMetrics()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return getDemoMetrics()

  // Una tienda por usuario: el índice único sobre owner_id lo garantiza.
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!store) return getDemoMetrics()

  const since = new Date()
  since.setDate(since.getDate() - (DAYS - 1))
  since.setHours(0, 0, 0, 0)

  const [ordersResult, productsResult, itemsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("total_cents, created_at, status")
      .eq("store_id", store.id)
      .gte("created_at", since.toISOString()),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", store.id)
      .is("deleted_at", null),
    supabase
      .from("order_items")
      .select(
        "product_name, quantity, unit_price_cents, orders!inner(store_id)"
      )
      .eq("orders.store_id", store.id)
      .limit(500),
  ])

  const orders = (ordersResult.data ?? []).filter(
    (o) => o.status !== "cancelado"
  )

  const buckets = new Map<string, SalesPoint>()
  for (let i = 0; i < DAYS; i++) {
    const date = new Date(since)
    date.setDate(since.getDate() + i)
    const key = date.toISOString().slice(0, 10)
    buckets.set(key, { date: key, revenueCents: 0, orders: 0 })
  }

  for (const order of orders) {
    const key = order.created_at.slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) continue
    bucket.revenueCents += order.total_cents
    bucket.orders += 1
  }

  const series = [...buckets.values()]
  const revenueCents = series.reduce((acc, p) => acc + p.revenueCents, 0)
  const orderCount = series.reduce((acc, p) => acc + p.orders, 0)

  const byProduct = new Map<
    string,
    { unitsSold: number; revenueCents: number }
  >()
  for (const item of itemsResult.data ?? []) {
    const current = byProduct.get(item.product_name) ?? {
      unitsSold: 0,
      revenueCents: 0,
    }
    current.unitsSold += item.quantity
    current.revenueCents += item.quantity * item.unit_price_cents
    byProduct.set(item.product_name, current)
  }

  const topProducts = [...byProduct.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5)

  return {
    revenueCents,
    orders: orderCount,
    products: productsResult.count ?? 0,
    averageTicketCents: orderCount ? Math.round(revenueCents / orderCount) : 0,
    series,
    topProducts,
    currency: CURRENCY,
    isDemo: false,
  }
}
