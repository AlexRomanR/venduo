import { CURRENCY } from "@/lib/format"
import type {
  Comision,
  CompraConEnlace,
  Comprador,
  Enlace,
  PromotorRanking,
  TipoComision,
} from "@/lib/promotor"
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

export interface CategoriaVentas {
  categoria: string
  ventas: number
  volumenCents: number
  productos: string[]
}

export interface PerfilPublico {
  userId?: string
  slug: string
  displayName: string
  city: string | null
  bio: string | null
  avatarUrl: string | null
  phone: string | null
  ventas: number
  volumenCents: number
  tiendas: number
  indirectas?: number
  desde: string | null
  historial: Array<{ storeName: string; ventas: number; desde: string | null }>
  competencias?: string[]
  categorias?: CategoriaVentas[]
}

const HACE = (dias: number) =>
  new Date(Date.now() - dias * 86_400_000).toISOString()

export interface ProductoVitrina {
  id: string
  name: string
  description: string | null
  priceCents: number
  compareAtPriceCents: number | null
  imageUrl: string | null
  images: string[]
  condition: string
  conditionNote: string | null
  category: string | null
  publishedAt: string
  featured: boolean
  storeName: string
  storeSlug: string
  categoria?: string
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
    name: "Buzo oversize unisex",
    description:
      "Buzo de algodón grueso boliviano, corte amplio y terminación reforzada.",
    priceCents: 18000,
    compareAtPriceCents: null,
    imageUrl:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1600&q=85",
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1600&q=85",
    ],
    condition: "nuevo",
    conditionNote: null,
    category: "Ropa",
    publishedAt: HACE(2),
    featured: true,
    storeName: "Rosa Deportes",
    storeSlug: "rosa-deportes",
    categoria: "Ropa y Moda",
    gananciaCents: 2880,
    stock: 12,
    tomado: false,
    codigo: null,
  },
  {
    id: "demo-v-2",
    name: "Mochila urbana impermeable",
    description:
      "Mochila impermeable con compartimento acolchado para portátil.",
    priceCents: 24000,
    compareAtPriceCents: 30000,
    imageUrl:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1600&q=85",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1600&q=85",
    ],
    condition: "nuevo",
    conditionNote: null,
    category: "Accesorios",
    publishedAt: HACE(8),
    featured: false,
    storeName: "Rosa Deportes",
    storeSlug: "rosa-deportes",
    categoria: "Calzados y Accesorios",
    gananciaCents: 3270,
    stock: 12,
    tomado: false,
    codigo: null,
  },
  {
    id: "demo-v-3",
    name: "Café de especialidad Yungas 250g",
    description: "Café boliviano tostado en lotes pequeños, listo para moler.",
    priceCents: 8500,
    compareAtPriceCents: null,
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=85",
    images: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=85",
    ],
    condition: "nuevo",
    conditionNote: null,
    category: "Alimentos",
    publishedAt: HACE(15),
    featured: true,
    storeName: "Café Illimani",
    storeSlug: "cafe-illimani",
    categoria: "Café y Alimentos",
    gananciaCents: 1360,
    stock: 25,
    tomado: false,
    codigo: null,
  },
  {
    id: "demo-v-4",
    name: "Molinillo manual de muelas cónicas",
    description:
      "Molinillo revisado y calibrado, con muela de acero regulable.",
    priceCents: 14000,
    compareAtPriceCents: 24000,
    imageUrl:
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=85",
    images: [
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1600&q=85",
    ],
    condition: "reacondicionado",
    conditionNote: "Revisado y probado; tiene marcas leves de uso.",
    category: "Hogar",
    publishedAt: HACE(45),
    featured: false,
    storeName: "Café Illimani",
    storeSlug: "cafe-illimani",
    categoria: "Hogar y Café",
    gananciaCents: 2240,
    stock: 8,
    tomado: false,
    codigo: null,
  },
  {
    id: "demo-v-5",
    name: "Campera rompeviento técnica",
    description: "Campera ultraligera resistente al viento y lluvia ligera.",
    priceCents: 26000,
    compareAtPriceCents: 32000,
    imageUrl:
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1600&q=85",
    images: [
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1600&q=85",
    ],
    condition: "nuevo",
    conditionNote: null,
    category: "Ropa",
    publishedAt: HACE(5),
    featured: false,
    storeName: "Rosa Deportes",
    storeSlug: "rosa-deportes",
    categoria: "Ropa y Moda",
    gananciaCents: 3500,
    stock: 15,
    tomado: false,
    codigo: null,
  },
  {
    id: "demo-v-6",
    name: "Sérum facial hidratante ácido hialurónico",
    description:
      "Hidratación profunda con ácido hialurónico puro de rápida absorción.",
    priceCents: 12500,
    compareAtPriceCents: 16000,
    imageUrl:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1600&q=85",
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1600&q=85",
    ],
    condition: "nuevo",
    conditionNote: null,
    category: "Belleza",
    publishedAt: HACE(12),
    featured: true,
    storeName: "Bella Piel",
    storeSlug: "bella-piel",
    categoria: "Cuidado Personal",
    gananciaCents: 1950,
    stock: 30,
    tomado: false,
    codigo: null,
  },
  {
    id: "demo-v-7",
    name: "Auriculares inalámbricos Bluetooth ANC",
    description:
      "Cancelación activa de ruido, 28 horas de batería y micrófono HD.",
    priceCents: 21000,
    compareAtPriceCents: 27000,
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=85",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=85",
    ],
    condition: "nuevo",
    conditionNote: null,
    category: "Tecnología",
    publishedAt: HACE(20),
    featured: false,
    storeName: "TecnoBolivia",
    storeSlug: "tecno-bolivia",
    categoria: "Tecnología",
    gananciaCents: 2900,
    stock: 20,
    tomado: false,
    codigo: null,
  },
  {
    id: "demo-v-8",
    name: "Miel pura de abeja silvestre 500g",
    description: "Miel 100% pura cosechada de manera artesanal y sustentable.",
    priceCents: 6500,
    compareAtPriceCents: null,
    imageUrl:
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1600&q=85",
    images: [
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1600&q=85",
    ],
    condition: "nuevo",
    conditionNote: null,
    category: "Alimentos",
    publishedAt: HACE(3),
    featured: false,
    storeName: "Café Illimani",
    storeSlug: "cafe-illimani",
    categoria: "Café y Alimentos",
    gananciaCents: 980,
    stock: 40,
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
    imagenUrl:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1600&q=85",
    precioCents: 18_000,
    gananciaCents: 2_880,
    negocio: "Rosa Deportes",
    negocioSlug: "rosa-deportes",
    codigo: "BZ7K2M4Q",
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
    imagenUrl:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1600&q=85",
    precioCents: 24_000,
    gananciaCents: 3_270,
    negocio: "Rosa Deportes",
    negocioSlug: "rosa-deportes",
    codigo: "MH8P3R6T",
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
    imagenUrl:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1600&q=85",
    precioCents: 8_500,
    gananciaCents: 1_360,
    negocio: "Café Illimani",
    negocioSlug: "cafe-illimani",
    codigo: "CF9W4N7K",
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
    imagenUrl:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1600&q=85",
    precioCents: 14_000,
    gananciaCents: 2_240,
    negocio: "Café Illimani",
    negocioSlug: "cafe-illimani",
    codigo: "ML6Q8V3P",
    url: "",
    tomadoEn: HACE(9),
    unidades: 0,
    ventasCents: 0,
    stock: 0,
    disponible: false,
  },
]

export const COMPRAS_CON_ENLACE_DEMO: CompraConEnlace[] = [
  {
    id: "demo-c-1",
    compradorClave: "c1",
    comprador: "Valeria",
    telefono: "7•••••48",
    fecha: HACE(2),
    negocio: "Café Illimani",
    productos: "Café de especialidad 250g ×2",
    totalCents: 17_000,
    estado: "pagado",
    comision: { montoCents: 2_720, estado: "pendiente" },
  },
  {
    id: "demo-c-2",
    compradorClave: "c2",
    comprador: "Jorge",
    telefono: "6•••••13",
    fecha: HACE(5),
    negocio: "Rosa Deportes",
    productos: "Mochila urbana",
    totalCents: 24_000,
    estado: "entregado",
    comision: { montoCents: 3_270, estado: "confirmada" },
  },
  {
    id: "demo-c-3",
    compradorClave: "c3",
    comprador: "Mariela",
    telefono: "7•••••91",
    fecha: HACE(9),
    negocio: "Rosa Deportes",
    productos: "Short de entrenamiento",
    totalCents: 12_000,
    estado: "pendiente",
    comision: null,
  },
  {
    id: "demo-c-4",
    compradorClave: "c2",
    comprador: "Jorge",
    telefono: "6•••••13",
    fecha: HACE(21),
    negocio: "Café Illimani",
    productos: "Café de especialidad 250g",
    totalCents: 8_500,
    estado: "entregado",
    comision: { montoCents: 1_360, estado: "pagada" },
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

export const AVATARES_DEMO = {
  mateo:
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80&auto=format&fit=crop",
  camila:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&auto=format&fit=crop",
  jhoel:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop",
  luciana:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&auto=format&fit=crop",
  rodrigo:
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&auto=format&fit=crop",
  ana: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80&auto=format&fit=crop",
  carlos:
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80&auto=format&fit=crop",
  valeria:
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80&auto=format&fit=crop",
  kevin:
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&auto=format&fit=crop",
  mariana:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80&auto=format&fit=crop",
} as const

export const RANKING_GLOBAL_DEMO: PromotorRanking[] = [
  {
    posicion: 1,
    userId: "demo-u-mateo",
    nombre: "Mateo Flores",
    slug: "mateo-flores",
    ciudad: "La Paz",
    avatarUrl: AVATARES_DEMO.mateo,
    ventas: 52,
    volumenCents: 4_890_000,
    tiendasCount: 8,
    promocionaMiTienda: true,
    desde: HACE(120),
  },
  {
    posicion: 2,
    userId: "demo-u-camila",
    nombre: "Camila Ramos",
    slug: "camila-ramos",
    ciudad: "Santa Cruz",
    avatarUrl: AVATARES_DEMO.camila,
    ventas: 44,
    volumenCents: 3_920_000,
    tiendasCount: 6,
    promocionaMiTienda: false,
    desde: HACE(95),
  },
  {
    posicion: 3,
    userId: "demo-u-jhoel",
    nombre: "Jhoel Choque",
    slug: "jhoel-choque",
    ciudad: "El Alto",
    avatarUrl: AVATARES_DEMO.jhoel,
    ventas: 37,
    volumenCents: 3_145_000,
    tiendasCount: 5,
    promocionaMiTienda: true,
    desde: HACE(84),
  },
  {
    posicion: 4,
    userId: "demo-u-luciana",
    nombre: "Luciana Méndez",
    slug: "luciana-mendez",
    ciudad: "Cochabamba",
    avatarUrl: AVATARES_DEMO.luciana,
    ventas: 29,
    volumenCents: 2_610_000,
    tiendasCount: 4,
    promocionaMiTienda: false,
    desde: HACE(70),
  },
  {
    posicion: 5,
    userId: "demo-u-rodrigo",
    nombre: "Rodrigo Quispe",
    slug: "rodrigo-quispe",
    ciudad: "Sucre",
    avatarUrl: AVATARES_DEMO.rodrigo,
    ventas: 24,
    volumenCents: 2_180_000,
    tiendasCount: 3,
    promocionaMiTienda: false,
    desde: HACE(62),
  },
  {
    posicion: 6,
    userId: "demo-u-ana",
    nombre: "Ana Mamani",
    slug: "ana-mamani",
    ciudad: "La Paz",
    avatarUrl: AVATARES_DEMO.ana,
    ventas: 19,
    volumenCents: 1_750_000,
    tiendasCount: 2,
    promocionaMiTienda: true,
    desde: HACE(45),
  },
  {
    posicion: 7,
    userId: "demo-u-carlos",
    nombre: "Carlos Torrico",
    slug: "carlos-torrico",
    ciudad: "Cochabamba",
    avatarUrl: AVATARES_DEMO.carlos,
    ventas: 16,
    volumenCents: 1_420_000,
    tiendasCount: 3,
    promocionaMiTienda: false,
    desde: HACE(40),
  },
  {
    posicion: 8,
    userId: "demo-u-valeria",
    nombre: "Valeria Vaca",
    slug: "valeria-vaca",
    ciudad: "Tarija",
    avatarUrl: AVATARES_DEMO.valeria,
    ventas: 13,
    volumenCents: 1_190_000,
    tiendasCount: 2,
    promocionaMiTienda: false,
    desde: HACE(35),
  },
  {
    posicion: 9,
    userId: "demo-u-kevin",
    nombre: "Kevin Morales",
    slug: "kevin-morales",
    ciudad: "Santa Cruz",
    avatarUrl: AVATARES_DEMO.kevin,
    ventas: 11,
    volumenCents: 940_000,
    tiendasCount: 2,
    promocionaMiTienda: false,
    desde: HACE(28),
  },
  {
    posicion: 10,
    userId: "demo-u-mariana",
    nombre: "Mariana Rocha",
    slug: "mariana-rocha",
    ciudad: "La Paz",
    avatarUrl: AVATARES_DEMO.mariana,
    ventas: 9,
    volumenCents: 780_000,
    tiendasCount: 1,
    promocionaMiTienda: true,
    desde: HACE(18),
  },
]

export const RANKING_MI_NEGOCIO_DEMO: PromotorRanking[] = [
  {
    posicion: 1,
    userId: "demo-u-mateo",
    nombre: "Mateo Flores",
    slug: "mateo-flores",
    ciudad: "La Paz",
    avatarUrl: AVATARES_DEMO.mateo,
    ventas: 18,
    ventasDirectas: 14,
    ventasIndirectas: 4,
    volumenCents: 1_620_000,
    comisionCents: 245_000,
    productos: ["Buzo oversize", "Mochila urbana"],
    promocionaMiTienda: true,
    desde: HACE(120),
  },
  {
    posicion: 2,
    userId: "demo-u-jhoel",
    nombre: "Jhoel Choque",
    slug: "jhoel-choque",
    ciudad: "El Alto",
    avatarUrl: AVATARES_DEMO.jhoel,
    ventas: 12,
    ventasDirectas: 9,
    ventasIndirectas: 3,
    volumenCents: 1_180_000,
    comisionCents: 168_000,
    productos: ["Mochila urbana"],
    promocionaMiTienda: true,
    desde: HACE(84),
  },
  {
    posicion: 3,
    userId: "demo-u-ana",
    nombre: "Ana Mamani",
    slug: "ana-mamani",
    ciudad: "La Paz",
    avatarUrl: AVATARES_DEMO.ana,
    ventas: 8,
    ventasDirectas: 7,
    ventasIndirectas: 1,
    volumenCents: 740_000,
    comisionCents: 112_000,
    productos: ["Buzo oversize"],
    promocionaMiTienda: true,
    desde: HACE(45),
  },
  {
    posicion: 4,
    userId: "demo-u-mariana",
    nombre: "Mariana Rocha",
    slug: "mariana-rocha",
    ciudad: "La Paz",
    avatarUrl: AVATARES_DEMO.mariana,
    ventas: 4,
    ventasDirectas: 4,
    ventasIndirectas: 0,
    volumenCents: 360_000,
    comisionCents: 58_000,
    productos: ["Buzo oversize"],
    promocionaMiTienda: true,
    desde: HACE(18),
  },
]

export const PERFILES_PUBLICOS_DEMO: Record<string, PerfilPublico> = {
  "mateo-flores": {
    userId: "demo-u-mateo",
    slug: "mateo-flores",
    displayName: "Mateo Flores",
    city: "La Paz",
    bio: "Promotor comercial enfocado en indumentaria deportiva y café de especialidad. Especialista en campañas orgánicas de TikTok y atención personalizada por WhatsApp.",
    avatarUrl: AVATARES_DEMO.mateo,
    phone: "77218492",
    ventas: 52,
    volumenCents: 4_890_000,
    tiendas: 8,
    indirectas: 14,
    desde: HACE(120),
    historial: [
      { storeName: "Rosa Deportes", ventas: 28, desde: HACE(120) },
      { storeName: "Café Illimani", ventas: 14, desde: HACE(90) },
      { storeName: "Pasarela Calzados", ventas: 6, desde: HACE(60) },
      { storeName: "Arte Textil La Paz", ventas: 4, desde: HACE(35) },
    ],
    competencias: [
      "Cierre de ventas por WhatsApp",
      "Campañas orgánicas en TikTok y Reels",
      "Fidelización y retención de clientes",
      "Asesoramiento técnico de catálogo y tallas",
      "Gestión de pedidos en tiempo real",
    ],
    categorias: [
      {
        categoria: "Ropa y Moda",
        ventas: 32,
        volumenCents: 3_120_000,
        productos: ["Buzo oversize unisex", "Campera rompeviento técnica"],
      },
      {
        categoria: "Café y Alimentos",
        ventas: 14,
        volumenCents: 1_190_000,
        productos: [
          "Café de especialidad Yungas 250g",
          "Molinillo manual de muelas cónicas",
        ],
      },
      {
        categoria: "Calzados y Accesorios",
        ventas: 6,
        volumenCents: 580_000,
        productos: ["Mochila urbana impermeable"],
      },
    ],
  },
  "camila-ramos": {
    userId: "demo-u-camila",
    slug: "camila-ramos",
    displayName: "Camila Ramos",
    city: "Santa Cruz",
    bio: "Promotora de ventas digitales para marcas de moda y cuidado personal en Santa Cruz de la Sierra. Alto volumen de clientes recurrentes y venta consultiva.",
    avatarUrl: AVATARES_DEMO.camila,
    phone: "78451290",
    ventas: 44,
    volumenCents: 3_920_000,
    tiendas: 6,
    indirectas: 11,
    desde: HACE(95),
    historial: [
      { storeName: "Rosa Deportes", ventas: 24, desde: HACE(95) },
      { storeName: "Bella Piel", ventas: 12, desde: HACE(70) },
      { storeName: "Santa Cruz Moda", ventas: 8, desde: HACE(40) },
    ],
    competencias: [
      "Venta conversacional por WhatsApp",
      "Catálogos digitales y curaduría de producto",
      "Marketing de recomendación boca a boca",
      "Seguimiento y recompra a 90 días",
    ],
    categorias: [
      {
        categoria: "Ropa y Moda",
        ventas: 24,
        volumenCents: 2_240_000,
        productos: ["Buzo oversize unisex", "Campera rompeviento técnica"],
      },
      {
        categoria: "Cuidado Personal",
        ventas: 12,
        volumenCents: 1_080_000,
        productos: ["Sérum facial hidratante ácido hialurónico"],
      },
      {
        categoria: "Calzados y Accesorios",
        ventas: 8,
        volumenCents: 600_000,
        productos: ["Mochila urbana impermeable"],
      },
    ],
  },
  "jhoel-choque": {
    userId: "demo-u-jhoel",
    slug: "jhoel-choque",
    displayName: "Jhoel Choque",
    city: "El Alto",
    bio: "Especialista en distribución de productos urbanos, mochilas y calzados en La Paz y El Alto. Alta velocidad de respuesta y coordinación de envíos.",
    avatarUrl: AVATARES_DEMO.jhoel,
    phone: "69842105",
    ventas: 37,
    volumenCents: 3_145_000,
    tiendas: 5,
    indirectas: 8,
    desde: HACE(84),
    historial: [
      { storeName: "Rosa Deportes", ventas: 22, desde: HACE(84) },
      { storeName: "Calzados Illimani", ventas: 10, desde: HACE(50) },
      { storeName: "Equipos Andinos", ventas: 5, desde: HACE(30) },
    ],
    competencias: [
      "Venta y coordinación logística",
      "Activación de comunidades digitales",
      "Manejo de stock en tiempo real",
      "Atención postventa garantizada",
    ],
    categorias: [
      {
        categoria: "Calzados y Accesorios",
        ventas: 22,
        volumenCents: 1_840_000,
        productos: ["Mochila urbana impermeable"],
      },
      {
        categoria: "Ropa y Moda",
        ventas: 10,
        volumenCents: 920_000,
        productos: ["Buzo oversize unisex"],
      },
      {
        categoria: "Tecnología",
        ventas: 5,
        volumenCents: 385_000,
        productos: ["Auriculares inalámbricos Bluetooth ANC"],
      },
    ],
  },
  "ana-mamani": {
    userId: "demo-u-ana",
    slug: "ana-mamani",
    displayName: "Ana Mamani",
    city: "La Paz",
    bio: "Promotora activa de indumentaria deportiva y café de especialidad. Atención empática, cercana y asesoramiento detallado a cada comprador.",
    avatarUrl: AVATARES_DEMO.ana,
    phone: "71542389",
    ventas: 19,
    volumenCents: 1_750_000,
    tiendas: 2,
    indirectas: 5,
    desde: HACE(45),
    historial: [
      { storeName: "Rosa Deportes", ventas: 14, desde: HACE(45) },
      { storeName: "Café Illimani", ventas: 5, desde: HACE(25) },
    ],
    competencias: [
      "Ventas por catálogo digital",
      "Atención al cliente personalizada",
      "Seguimiento de pedidos por WhatsApp",
    ],
    categorias: [
      {
        categoria: "Ropa y Moda",
        ventas: 14,
        volumenCents: 1_320_000,
        productos: ["Buzo oversize unisex"],
      },
      {
        categoria: "Café y Alimentos",
        ventas: 5,
        volumenCents: 430_000,
        productos: [
          "Café de especialidad Yungas 250g",
          "Miel pura de abeja silvestre 500g",
        ],
      },
    ],
  },
  ana: {
    userId: "demo-u-ana",
    slug: "ana",
    displayName: "Ana Mamani",
    city: "La Paz",
    bio: "Promotora de Rosa Deportes y Café Illimani en Venduo. Atención personalizada a compradores de La Paz y todo el país.",
    avatarUrl: AVATARES_DEMO.ana,
    phone: "71542389",
    ventas: 19,
    volumenCents: 1_750_000,
    tiendas: 2,
    indirectas: 5,
    desde: HACE(45),
    historial: [
      { storeName: "Rosa Deportes", ventas: 14, desde: HACE(45) },
      { storeName: "Café Illimani", ventas: 5, desde: HACE(25) },
    ],
    competencias: [
      "Ventas por catálogo digital",
      "Atención al cliente personalizada",
      "Seguimiento de pedidos por WhatsApp",
    ],
    categorias: [
      {
        categoria: "Ropa y Moda",
        ventas: 14,
        volumenCents: 1_320_000,
        productos: ["Buzo oversize unisex"],
      },
      {
        categoria: "Café y Alimentos",
        ventas: 5,
        volumenCents: 430_000,
        productos: [
          "Café de especialidad Yungas 250g",
          "Miel pura de abeja silvestre 500g",
        ],
      },
    ],
  },
}

export function getDemoPerfilPublico(slug: string): PerfilPublico | null {
  const encontrado = PERFILES_PUBLICOS_DEMO[slug]
  if (encontrado) return encontrado

  // Si no coincide exactamente con una clave, intentar buscar por slug en ranking global
  const promotor = RANKING_GLOBAL_DEMO.find((p) => p.slug === slug)
  if (promotor) {
    return {
      userId: promotor.userId,
      slug: promotor.slug ?? slug,
      displayName: promotor.nombre,
      city: promotor.ciudad,
      bio: `Promotor oficial en Venduo con historial verificado en ${promotor.ciudad ?? "Bolivia"}.`,
      avatarUrl: promotor.avatarUrl,
      phone: "70012345",
      ventas: promotor.ventas,
      volumenCents: promotor.volumenCents,
      tiendas: promotor.tiendasCount ?? 1,
      indirectas: Math.round(promotor.ventas * 0.25),
      desde: promotor.desde ?? null,
      historial: [
        {
          storeName: "Rosa Deportes",
          ventas: Math.round(promotor.ventas * 0.7),
          desde: promotor.desde ?? null,
        },
      ],
      competencias: [
        "Ventas digitales por WhatsApp",
        "Difusión de catálogo en redes",
        "Fidelización de compradores",
      ],
    }
  }

  return null
}
