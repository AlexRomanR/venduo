import { CURRENCY } from "@/lib/format"
import type { CommissionStatus, Product, SubscriptionStatus } from "@/types"

export interface Suscripcion {
  status: SubscriptionStatus
  trialEndsAt: string | null
  diasRestantes: number | null
  porVencer: boolean
}

export interface ResumenPanel {
  tienda: {
    id: string
    name: string
    slug: string
    isPublished: boolean
    templateKey: string | null
  }
  ventasCents: number
  pedidos: number
  pedidosPendientes: number
  vendedoresActivos: number
  vendedoresPendientes: number
  productos: number
  suscripcion: Suscripcion | null
  esDemo: boolean
}

/**
 * Panel de ejemplo.
 *
 * Con números, no en cero: el panel vacío ya tiene su propio estado y lo que
 * hace falta demostrar sin base de datos es cómo se ve funcionando.
 */
export const RESUMEN_DEMO: ResumenPanel = {
  tienda: {
    id: "demo-store",
    name: "Café Illimani",
    slug: "cafe-illimani",
    isPublished: true,
    templateKey: "abarrotes",
  },
  ventasCents: 1_284_500,
  pedidos: 37,
  pedidosPendientes: 4,
  vendedoresActivos: 6,
  vendedoresPendientes: 2,
  productos: 24,
  suscripcion: {
    status: "prueba",
    trialEndsAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
    diasRestantes: 5,
    porVencer: true,
  },
  esDemo: true,
}

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
  {
    name: "Molinillo manual reacondicionado",
    unitsSold: 33,
    revenueCents: 462_000,
  },
  { name: "Taza cerámica Venduo", unitsSold: 71, revenueCents: 461_500 },
  { name: "Filtros de papel x100", unitsSold: 97, revenueCents: 213_400 },
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
    currency: CURRENCY,
    isDemo: true,
  }
}

export interface ComisionItem {
  id: string
  storeName: string
  amountCents: number
  baseCents: number
  rateBps: number
  status: CommissionStatus
  createdAt: string
}

export interface ResumenVendedor {
  volumenCents: number
  ventas: number
  porEstado: Record<CommissionStatus, number>
  ganadoCents: number
  tiendasActivas: number
  tiendasPendientes: number
  tiendasEnHistorial: number
  desde: string | null
  perfil: {
    slug: string
    displayName: string
    city: string | null
    bio: string | null
  } | null
  esDemo: boolean
}

export interface PerfilPublico {
  slug: string
  displayName: string
  city: string | null
  bio: string | null
  avatarUrl: string | null
  ventas: number
  volumenCents: number
  tiendas: number
  desde: string | null
  historial: Array<{ storeName: string; ventas: number; desde: string | null }>
}

const HACE = (dias: number) =>
  new Date(Date.now() - dias * 86_400_000).toISOString()

/** Panel del vendedor de ejemplo, con historial ya empezado. */
export const RESUMEN_VENDEDOR_DEMO: ResumenVendedor = {
  volumenCents: 412_000,
  ventas: 17,
  porEstado: {
    pendiente: 8_400,
    confirmada: 26_600,
    pagada: 14_400,
    anulada: 3_600,
  },
  ganadoCents: 41_000,
  tiendasActivas: 2,
  tiendasPendientes: 1,
  tiendasEnHistorial: 3,
  desde: HACE(94),
  perfil: {
    slug: "ana-quispe-4f2c1a",
    displayName: "Ana Quispe",
    city: "El Alto",
    bio: "Vendo por WhatsApp y en ferias los fines de semana.",
  },
  esDemo: true,
}

export const COMISIONES_DEMO: ComisionItem[] = [
  {
    id: "demo-c-1",
    storeName: "Rosa Deportes",
    amountCents: 2_160,
    baseCents: 18_000,
    rateBps: 1200,
    status: "confirmada",
    createdAt: HACE(2),
  },
  {
    id: "demo-c-2",
    storeName: "Café Illimani",
    amountCents: 850,
    baseCents: 8_500,
    rateBps: 1000,
    status: "pendiente",
    createdAt: HACE(4),
  },
  {
    id: "demo-c-3",
    storeName: "Rosa Deportes",
    amountCents: 2_880,
    baseCents: 24_000,
    rateBps: 1200,
    status: "pagada",
    createdAt: HACE(11),
  },
  {
    id: "demo-c-4",
    storeName: "Panadería Doña Elsa",
    amountCents: 3_600,
    baseCents: 45_000,
    rateBps: 800,
    status: "anulada",
    createdAt: HACE(19),
  },
]

export interface TiendaAbierta {
  id: string
  name: string
  slug: string
  tagline: string | null
  joinMode: string
  commissionBps: number
}

export interface ProductoVitrina {
  id: string
  name: string
  priceCents: number
  compareAtPriceCents: number | null
  imageUrl: string | null
  condition: string
  storeName: string
  storeSlug: string
  commissionBps: number
}

/** Tiendas de ejemplo para que la vitrina del vendedor no salga vacía. */
export const TIENDAS_ABIERTAS_DEMO: TiendaAbierta[] = [
  {
    id: "demo-tienda-1",
    name: "Rosa Deportes",
    slug: "rosa-deportes",
    tagline: "Ropa deportiva en Santa Cruz. Buzos, poleras y mochilas.",
    joinMode: "abierta",
    commissionBps: 1200,
  },
  {
    id: "demo-tienda-2",
    name: "Panadería Doña Elsa",
    slug: "panaderia-dona-elsa",
    tagline: "Cuñapés, empanadas y masitas por encargo en La Paz.",
    joinMode: "con_aprobacion",
    commissionBps: 800,
  },
  {
    id: "demo-tienda-3",
    name: "Café Illimani",
    slug: "cafe-illimani",
    tagline: "Café de especialidad y equipamiento para prepararlo.",
    joinMode: "abierta",
    commissionBps: 1000,
  },
]

export const PRODUCTOS_VITRINA_DEMO: ProductoVitrina[] = [
  {
    id: "demo-v-1",
    name: "Buzo oversize",
    priceCents: 18000,
    compareAtPriceCents: null,
    imageUrl: null,
    condition: "nuevo",
    storeName: "Rosa Deportes",
    storeSlug: "rosa-deportes",
    commissionBps: 1200,
  },
  {
    id: "demo-v-2",
    name: "Mochila urbana",
    priceCents: 24000,
    compareAtPriceCents: 30000,
    imageUrl: null,
    condition: "nuevo",
    storeName: "Rosa Deportes",
    storeSlug: "rosa-deportes",
    commissionBps: 1200,
  },
  {
    id: "demo-v-3",
    name: "Café de especialidad 250g",
    priceCents: 8500,
    compareAtPriceCents: null,
    imageUrl: null,
    condition: "nuevo",
    storeName: "Café Illimani",
    storeSlug: "cafe-illimani",
    commissionBps: 1000,
  },
  {
    id: "demo-v-4",
    name: "Molinillo manual reacondicionado",
    priceCents: 14000,
    compareAtPriceCents: 24000,
    imageUrl: null,
    condition: "reacondicionado",
    storeName: "Café Illimani",
    storeSlug: "cafe-illimani",
    commissionBps: 1000,
  },
]

export interface PlantillaResumen {
  key: string
  name: string
  sector: string
  description: string | null
  bloques: string[]
}

export interface RubroConPlantillas {
  key: string
  name: string
  plantillas: PlantillaResumen[]
}

/**
 * Espejo del catálogo sembrado en la migración de plantillas de tienda.
 *
 * Existe para que la galería de plantillas se vea completa sin base de datos:
 * es la primera pantalla después del registro y un catálogo vacío ahí parece
 * un producto roto, no un producto sin configurar.
 */
export const RUBROS_DEMO: RubroConPlantillas[] = [
  {
    key: "moda",
    name: "Moda",
    plantillas: [
      {
        key: "fashion",
        name: "Pasarela",
        sector: "moda",
        description:
          "Ropa, calzado y carteras. Fotos grandes en retrato, las categorías a la vista y la segunda mano con vitrina propia.",
        bloques: [
          "hero",
          "categories",
          "product_grid",
          "product_grid",
          "product_grid",
        ],
      },
    ],
  },
  {
    key: "belleza",
    name: "Belleza",
    plantillas: [
      {
        key: "perfume",
        name: "Esencia",
        sector: "belleza",
        description:
          "Perfumes, fragancias y cuidado personal. Una vitrina serena, fichas con presencia y asesoría por WhatsApp.",
        bloques: ["hero", "product_grid", "categories", "product_grid", "faq"],
      },
    ],
  },
]

const NOW = new Date().toISOString()

/** Campos comunes a todo producto de ejemplo. */
const DEMO_PRODUCT_BASE = {
  store_id: "demo-store",
  compare_at_price_cents: null,
  condition: "nuevo" as const,
  condition_note: null,
  image_url: null,
  images: [],
  category_id: null,
  sku: null,
  low_stock_threshold: 3,
  is_featured: false,
  seller_enabled: true,
  // El precio se construye: el costo base es lo que el negocio recibe y el
  // resto lo suman la comisión del promotor y el take-rate del tramo.
  base_cost_cents: 0,
  commission_bps: 2000,
  take_bps: 800,
  created_at: NOW,
  updated_at: NOW,
  deleted_at: null,
}

export const DEMO_PRODUCTS: Product[] = [
  {
    ...DEMO_PRODUCT_BASE,
    id: "demo-1",
    name: "Café de especialidad 250g",
    description: "Tueste medio, notas a caramelo y almendra.",
    price_cents: 8500,
    base_cost_cents: 6641,
    stock: 42,
    category: "Café",
    is_active: true,
  },
  {
    ...DEMO_PRODUCT_BASE,
    id: "demo-2",
    name: "Cafetera prensa francesa",
    description: "600 ml, vidrio borosilicato y filtro de acero.",
    price_cents: 19001,
    base_cost_cents: 14844,
    stock: 12,
    category: "Equipamiento",
    is_active: true,
  },
  {
    ...DEMO_PRODUCT_BASE,
    id: "demo-3",
    name: "Molinillo manual reacondicionado",
    description: "Revisado y calibrado. Muelas de cerámica en buen estado.",
    price_cents: 14001,
    base_cost_cents: 10938,
    compare_at_price_cents: 24000,
    condition: "reacondicionado",
    condition_note: "Marcas de uso en la carcasa, mecanismo impecable.",
    stock: 3,
    category: "Equipamiento",
    is_active: true,
  },
  {
    ...DEMO_PRODUCT_BASE,
    id: "demo-4",
    name: "Filtros de papel x100",
    description: "Compatibles con V60 tamaño 02.",
    price_cents: 2201,
    base_cost_cents: 1719,
    stock: 0,
    category: "Accesorios",
    is_active: false,
  },
]
