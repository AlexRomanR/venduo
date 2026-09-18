import { CURRENCY } from "@/lib/format"
import type { Comision, Comprador, Enlace, TipoComision } from "@/lib/promotor"
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

export interface ProductoVitrina {
  id: string
  name: string
  priceCents: number
  compareAtPriceCents: number | null
  imageUrl: string | null
  condition: string
  storeName: string
  storeSlug: string
  /** Lo que gana el promotor por unidad: el componente de comisión del precio. */
  gananciaCents: number
  stock: number
  /** Si este promotor ya lo tomó, y el código de su enlace. */
  tomado: boolean
  codigo: string | null
}

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
    gananciaCents: 2880,
    stock: 12,
    tomado: false,
    codigo: null,
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
    gananciaCents: 3270,
    stock: 12,
    tomado: false,
    codigo: null,
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
    gananciaCents: 1360,
    stock: 12,
    tomado: false,
    codigo: null,
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
    gananciaCents: 2240,
    stock: 12,
    tomado: false,
    codigo: null,
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

// ----------------------------------------------------------------------------
// El panel del promotor, con historial ya empezado.
//
// Las URL se arman en `lib/data/promotor.ts`: este archivo lo importan
// componentes de cliente y no puede depender del entorno.
// ----------------------------------------------------------------------------

export const ENLACES_DEMO: Enlace[] = [
  {
    id: "demo-e-1",
    productoId: "demo-v-1",
    nombre: "Buzo oversize",
    imagenUrl: null,
    precioCents: 18_000,
    gananciaCents: 2_880,
    negocio: "Rosa Deportes",
    negocioSlug: "rosa-deportes",
    codigo: "ANA7K2M",
    url: "",
    tomadoEn: HACE(64),
    unidades: 11,
    ventasCents: 198_000,
    stock: 14,
    disponible: true,
  },
  {
    id: "demo-e-2",
    productoId: "demo-v-2",
    nombre: "Mochila urbana",
    imagenUrl: null,
    precioCents: 24_000,
    gananciaCents: 3_270,
    negocio: "Rosa Deportes",
    negocioSlug: "rosa-deportes",
    codigo: "ANA7K2M",
    url: "",
    tomadoEn: HACE(41),
    unidades: 4,
    ventasCents: 96_000,
    stock: 3,
    disponible: true,
  },
  {
    id: "demo-e-3",
    productoId: "demo-v-3",
    nombre: "Café de especialidad 250g",
    imagenUrl: null,
    precioCents: 8_500,
    gananciaCents: 1_360,
    negocio: "Café Illimani",
    negocioSlug: "cafe-illimani",
    codigo: "ANA4QPW",
    url: "",
    tomadoEn: HACE(23),
    unidades: 9,
    ventasCents: 76_500,
    stock: 40,
    disponible: true,
  },
  {
    id: "demo-e-4",
    productoId: "demo-v-4",
    nombre: "Molinillo manual reacondicionado",
    imagenUrl: null,
    precioCents: 14_000,
    gananciaCents: 2_240,
    negocio: "Café Illimani",
    negocioSlug: "cafe-illimani",
    codigo: "ANA4QPW",
    url: "",
    tomadoEn: HACE(9),
    unidades: 0,
    ventasCents: 0,
    stock: 0,
    disponible: false,
  },
]

export const COMPRADORES_DEMO: Comprador[] = [
  {
    id: "demo-b-1",
    comprador: "7•••••48",
    registrado: false,
    desde: HACE(58),
    vence: HACE(-32),
    vigente: true,
    primeraTienda: "Rosa Deportes",
    primeraCompraCents: 18_000,
    comprasIndirectas: 2,
    comisionIndirectaCents: 2_590,
  },
  {
    id: "demo-b-2",
    comprador: "Valeria Quispe",
    registrado: true,
    desde: HACE(37),
    vence: HACE(-53),
    vigente: true,
    primeraTienda: "Café Illimani",
    primeraCompraCents: 17_000,
    comprasIndirectas: 1,
    comisionIndirectaCents: 850,
  },
  {
    id: "demo-b-3",
    comprador: "6•••••13",
    registrado: false,
    desde: HACE(12),
    vence: HACE(-78),
    vigente: true,
    primeraTienda: "Rosa Deportes",
    primeraCompraCents: 24_000,
    comprasIndirectas: 0,
    comisionIndirectaCents: 0,
  },
  {
    id: "demo-b-4",
    comprador: "7•••••91",
    registrado: false,
    desde: HACE(104),
    vence: HACE(14),
    vigente: false,
    primeraTienda: "Rosa Deportes",
    primeraCompraCents: 36_000,
    comprasIndirectas: 1,
    comisionIndirectaCents: 1_440,
  },
]

const COMISION = (
  id: number,
  dias: number,
  negocio: string,
  montoCents: number,
  baseCents: number,
  tipo: TipoComision = "directa",
  estado: CommissionStatus = "confirmada"
): Comision => ({
  id: `demo-k-${id}`,
  negocio,
  montoCents,
  baseCents,
  tasaBps: Math.round((montoCents * 10000) / baseCents),
  estado,
  tipo,
  fecha: HACE(dias),
})

export const COMISIONES_PROMOTOR_DEMO: Comision[] = [
  COMISION(1, 1, "Rosa Deportes", 2_880, 14_400, "directa", "pendiente"),
  COMISION(2, 3, "Café Illimani", 1_360, 6_800),
  COMISION(3, 5, "Rosa Deportes", 1_295, 16_190, "indirecta"),
  COMISION(4, 9, "Rosa Deportes", 5_760, 28_800),
  COMISION(5, 12, "Café Illimani", 2_720, 13_600),
  COMISION(6, 16, "Rosa Deportes", 3_270, 19_230),
  COMISION(7, 20, "Café Illimani", 850, 8_500, "indirecta"),
  COMISION(8, 24, "Rosa Deportes", 2_880, 14_400, "directa", "pagada"),
  COMISION(9, 29, "Café Illimani", 1_360, 6_800, "directa", "pagada"),
  COMISION(10, 33, "Rosa Deportes", 2_880, 14_400, "directa", "anulada"),
  COMISION(11, 38, "Rosa Deportes", 6_540, 38_460, "directa", "pagada"),
  COMISION(12, 45, "Rosa Deportes", 1_295, 16_190, "indirecta", "pagada"),
  COMISION(13, 52, "Rosa Deportes", 2_880, 14_400, "directa", "pagada"),
  COMISION(14, 60, "Rosa Deportes", 5_760, 28_800, "directa", "pagada"),
]
