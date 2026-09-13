import type { Product } from "@/types/database"

export interface SalesPoint {
  date: string
  revenueCents: number
  orders: number
}

export interface DashboardMetrics {
  revenueCents: number
  orders: number
  products: number
  averageTicketCents: number
  series: SalesPoint[]
  topProducts: Array<{ name: string; unitsSold: number; revenueCents: number }>
  currency: string
  isDemo: boolean
}

/** Serie determinista: mismo gráfico en cada render, sin saltos raros. */
function buildSeries(days = 30): SalesPoint[] {
  const today = new Date()

  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - i))

    const weekday = date.getDay()
    const weekendBoost = weekday === 0 || weekday === 6 ? 1.6 : 1
    const wave = 1 + Math.sin(i / 3.5) * 0.25
    const trend = 1 + i / 60

    const orders = Math.max(
      1,
      Math.round(6 * weekendBoost * wave * trend + (i % 4))
    )

    return {
      date: date.toISOString().slice(0, 10),
      orders,
      revenueCents: orders * Math.round(4200 + (i % 7) * 380),
    }
  })
}

const DEMO_TOP_PRODUCTS = [
  {
    name: "Café de especialidad 250g",
    unitsSold: 128,
    revenueCents: 1_088_000,
  },
  { name: "Cafetera prensa francesa", unitsSold: 54, revenueCents: 1_026_000 },
  { name: "Filtros de papel x100", unitsSold: 97, revenueCents: 213_400 },
  { name: "Taza cerámica Venduo", unitsSold: 71, revenueCents: 461_500 },
  { name: "Molinillo manual", unitsSold: 33, revenueCents: 792_000 },
]

/** Métricas de ejemplo para poder ver el dashboard sin base de datos. */
export function getDemoMetrics(): DashboardMetrics {
  const series = buildSeries()
  const revenueCents = series.reduce((acc, p) => acc + p.revenueCents, 0)
  const orders = series.reduce((acc, p) => acc + p.orders, 0)

  return {
    revenueCents,
    orders,
    products: DEMO_TOP_PRODUCTS.length,
    averageTicketCents: orders ? Math.round(revenueCents / orders) : 0,
    series,
    topProducts: DEMO_TOP_PRODUCTS,
    currency: "ARS",
    isDemo: true,
  }
}

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "demo-1",
    store_id: "demo-store",
    name: "Café de especialidad 250g",
    description: "Tueste medio, notas a caramelo y almendra.",
    price_cents: 850000,
    stock: 42,
    category: "Café",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    store_id: "demo-store",
    name: "Cafetera prensa francesa",
    description: "600 ml, vidrio borosilicato y filtro de acero.",
    price_cents: 1900000,
    stock: 12,
    category: "Equipamiento",
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    store_id: "demo-store",
    name: "Filtros de papel x100",
    description: "Compatibles con V60 tamaño 02.",
    price_cents: 220000,
    stock: 0,
    category: "Accesorios",
    image_url: null,
    is_active: false,
    created_at: new Date().toISOString(),
  },
]
