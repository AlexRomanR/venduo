import { CURRENCY, diaEnBolivia } from "@/lib/format"
import { diasVacios, type Tablero } from "@/lib/tablero"
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
  // La misma tienda que muestra la barra lateral en modo demo.
  tienda: {
    id: "demo-store",
    name: "Rosa Deportes",
    slug: "rosa-deportes",
    isPublished: true,
    templateKey: "fashion",
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
    stock: 42,
    category: "Café",
    is_active: true,
  },
  {
    ...DEMO_PRODUCT_BASE,
    id: "demo-2",
    name: "Cafetera prensa francesa",
    description: "600 ml, vidrio borosilicato y filtro de acero.",
    price_cents: 19000,
    stock: 12,
    category: "Equipamiento",
    is_active: true,
  },
  {
    ...DEMO_PRODUCT_BASE,
    id: "demo-3",
    name: "Molinillo manual reacondicionado",
    description: "Revisado y calibrado. Muelas de cerámica en buen estado.",
    price_cents: 14000,
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
    price_cents: 2200,
    stock: 0,
    category: "Accesorios",
    is_active: false,
  },
]

/* -------------------------------------------------------------------------
 * El tablero del Resumen, en modo demo
 * ---------------------------------------------------------------------- */

const fotoDemo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=85`

/** Un número entre 0 y 1 que depende solo de la semilla: mismo día, mismo valor. */
function azarFijo(semilla: number) {
  let x = (semilla + 0x6d2b79f5) | 0
  x = Math.imul(x ^ (x >>> 15), x | 1)
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296
}

/**
 * El tablero de Rosa Deportes sin base de datos.
 *
 * La serie sale de la fecha de cada día y no de `Math.random`: recargar no
 * cambia el gráfico, y cada fecha conserva sus ventas aunque pase el tiempo.
 * Tiene fines de semana más movidos, días sin ventas y una subida en el
 * último mes, que es como se ve una tienda chica de verdad.
 */
export function tableroDeDemostracion(): Tablero {
  const hoy = diaEnBolivia()
  const serie = diasVacios(hoy).map((dia, indice, todos) => {
    const numero = Date.parse(dia.dia) / 86_400_000
    const semana = new Date(`${dia.dia}T12:00:00Z`).getUTCDay()
    const finde = semana === 0 || semana === 6 ? 1.7 : 1
    const subida = 1 + Math.max(indice - (todos.length - 30), 0) / 30
    const pedidos = Math.floor(azarFijo(numero) * 3.4 * finde * subida)
    const ticket = 9_000 + Math.round(azarFijo(numero * 7) * 30) * 1_000
    const ventasCents = pedidos * ticket
    const deLaRed = Math.floor(pedidos * azarFijo(numero * 13) * 0.6)
    return {
      ...dia,
      pedidos,
      ventasCents,
      redCents: deLaRed * ticket,
    }
  })

  const hace = (minutos: number) =>
    new Date(Date.now() - minutos * 60_000).toISOString()

  return {
    hoy,
    serie,
    ultimosPedidos: [
      {
        id: "demo-pedido-1",
        numero: 148,
        comprador: "Valeria Quispe Mamani",
        telefono: "70145823",
        totalCents: 52_000,
        estado: "pendiente",
        creado: hace(26),
        articulos: 1,
      },
      {
        id: "demo-pedido-2",
        numero: 147,
        comprador: "Jhonny Céspedes",
        telefono: "76820417",
        totalCents: 24_500,
        estado: "pagado",
        creado: hace(134),
        articulos: 3,
      },
      {
        id: "demo-pedido-3",
        numero: 146,
        comprador: "Carla Arteaga Ribera",
        telefono: "69034751",
        totalCents: 18_000,
        estado: "enviado",
        creado: hace(60 * 27),
        articulos: 1,
      },
      {
        id: "demo-pedido-4",
        numero: 145,
        comprador: "Rodrigo Mendoza Flores",
        telefono: "71598306",
        totalCents: 70_500,
        estado: "entregado",
        creado: hace(60 * 24 * 3 + 95),
        articulos: 2,
      },
      {
        id: "demo-pedido-5",
        numero: 144,
        comprador: "Daniela Rojas",
        telefono: "78241169",
        totalCents: 6_500,
        estado: "cancelado",
        creado: hace(60 * 24 * 4 + 300),
        articulos: 1,
      },
    ],
    porGestionar: { pendientes: 2, pagados: 1 },
    masVendidos: [
      {
        id: "demo-polera",
        nombre: "Polera básica",
        foto: fotoDemo("1521572163474-6864f9cf17ab"),
        unidades: 23,
        montoCents: 149_500,
      },
      {
        id: "demo-zapatilla",
        nombre: "Zapatilla running",
        foto: fotoDemo("1542291026-7eec264c27ff"),
        unidades: 14,
        montoCents: 728_000,
      },
      {
        id: "demo-gorra",
        nombre: "Gorra deportiva",
        foto: fotoDemo("1588850561407-ed78c282e89b"),
        unidades: 11,
        montoCents: 60_500,
      },
      {
        id: "demo-buzo",
        nombre: "Buzo oversize",
        foto: fotoDemo("1556905055-8f358a7a47b2"),
        unidades: 9,
        montoCents: 162_000,
      },
      {
        id: "demo-mochila",
        nombre: "Mochila urbana",
        foto: fotoDemo("1553062407-98eeb64c6a62"),
        unidades: 6,
        montoCents: 144_000,
      },
    ],
    porAcabarse: [
      {
        id: "demo-campera",
        nombre: "Campera rompeviento",
        foto: fotoDemo("1548883354-7622d03aca27"),
        stock: 0,
      },
      {
        id: "demo-zapatilla",
        nombre: "Zapatilla running",
        foto: fotoDemo("1542291026-7eec264c27ff"),
        stock: 2,
      },
      {
        id: "demo-gorra",
        nombre: "Gorra deportiva",
        foto: fotoDemo("1588850561407-ed78c282e89b"),
        stock: 3,
      },
    ],
    red: {
      activa: true,
      activos: 6,
      pendientes: 2,
      destacados: [
        {
          id: "demo-ana",
          nombre: "Ana Gutiérrez",
          ventasCents: 234_000,
          pedidos: 9,
        },
        {
          id: "demo-luis",
          nombre: "Luis Fernando Vaca",
          ventasCents: 118_500,
          pedidos: 5,
        },
        {
          id: "demo-micaela",
          nombre: "Micaela Suárez",
          ventasCents: 64_000,
          pedidos: 3,
        },
      ],
    },
    pasos: { producto: true, estilo: true, primerPedido: true, vendedor: true },
    esDemo: true,
  }
}
