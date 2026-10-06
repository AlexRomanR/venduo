import { CURRENCY, diaEnBolivia } from "@/lib/format"
import { diasVacios, type Tablero } from "@/lib/tablero"
import type { ProductoDelCatalogo } from "@/lib/catalogos/datos"
import type { Product, SubscriptionStatus } from "@/types"

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
    name: "Audífonos inalámbricos",
    unitsSold: 64,
    revenueCents: 1_088_000,
  },
  { name: "Cargador rápido 20W", unitsSold: 118, revenueCents: 1_026_000 },
  {
    name: "Celular reacondicionado",
    unitsSold: 7,
    revenueCents: 462_000,
  },
  { name: "Funda de silicona", unitsSold: 71, revenueCents: 461_500 },
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
  created_at: NOW,
  updated_at: NOW,
  deleted_at: null,
}

export const DEMO_PRODUCTS: Product[] = [
  {
    ...DEMO_PRODUCT_BASE,
    id: "demo-1",
    name: "Audífonos inalámbricos",
    description: "Bluetooth 5.3, estuche de carga y 24 horas de batería.",
    price_cents: 17000,
    stock: 42,
    category: "Audio",
    is_active: true,
  },
  {
    ...DEMO_PRODUCT_BASE,
    id: "demo-2",
    name: "Cargador rápido 20W",
    description: "USB-C, compatible con iPhone y Android.",
    price_cents: 9000,
    stock: 12,
    category: "Accesorios",
    is_active: true,
  },
  {
    ...DEMO_PRODUCT_BASE,
    id: "demo-3",
    name: "Celular reacondicionado",
    description: "128 GB, batería al 89% y seis meses de garantía.",
    price_cents: 66000,
    compare_at_price_cents: 89000,
    condition: "reacondicionado",
    condition_note: "Marcas leves en el borde, pantalla impecable.",
    stock: 3,
    category: "Celulares",
    is_active: true,
  },
  {
    ...DEMO_PRODUCT_BASE,
    id: "demo-4",
    name: "Funda de silicona",
    description: "Para iPhone 13 y 14. Varios colores.",
    price_cents: 4500,
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
    return { ...dia, pedidos, ventasCents: pedidos * ticket }
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
        comprador: null,
        telefono: null,
        totalCents: 52_000,
        estado: "pendiente",
        creado: hace(26),
        articulos: 1,
      },
      {
        id: "demo-pedido-2",
        numero: 147,
        comprador: null,
        telefono: null,
        totalCents: 24_500,
        estado: "pagado",
        creado: hace(134),
        articulos: 3,
      },
      {
        id: "demo-pedido-3",
        numero: 146,
        comprador: null,
        telefono: null,
        totalCents: 18_000,
        estado: "pagado",
        creado: hace(60 * 27),
        articulos: 1,
      },
      {
        id: "demo-pedido-4",
        numero: 145,
        comprador: null,
        telefono: null,
        totalCents: 70_500,
        estado: "pagado",
        creado: hace(60 * 24 * 3 + 95),
        articulos: 2,
      },
      {
        id: "demo-pedido-5",
        numero: 144,
        comprador: null,
        telefono: null,
        totalCents: 6_500,
        estado: "cancelado",
        creado: hace(60 * 24 * 4 + 300),
        articulos: 1,
      },
    ],
    porGestionar: { pendientes: 1 },
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
    pasos: { producto: true, estilo: true, primerPedido: true },
    esDemo: true,
  }
}

/* -------------------------------------------------------------------------
 * Los catálogos en PDF, en modo demo
 * ---------------------------------------------------------------------- */

function productoDeCatalogo(
  id: string,
  nombre: string,
  categoria: string,
  foto: string,
  precioCents: number,
  extra: Partial<ProductoDelCatalogo> = {}
): ProductoDelCatalogo {
  return {
    id: `demo-c-${id}`,
    nombre,
    descripcion: null,
    precioCents,
    precioAnteriorCents: null,
    stock: 6,
    categoriaId: `demo-cat-${categoria.toLowerCase()}`,
    categoria,
    condicion: "nuevo",
    codigo: `RD-${id.toUpperCase()}`,
    foto: fotoDemo(foto),
    destacado: false,
    ...extra,
  }
}

/**
 * El catálogo de Rosa Deportes: con fotos, categorías, rebajas, una prenda de
 * segunda mano y una agotada, para que cada plantilla tenga qué mostrar.
 */
export const PRODUCTOS_DE_CATALOGO_DEMO: ProductoDelCatalogo[] = [
  productoDeCatalogo(
    "z1",
    "Zapatilla running roja",
    "Zapatillas",
    "1542291026-7eec264c27ff",
    45000,
    {
      precioAnteriorCents: 52000,
      stock: 8,
      destacado: true,
      descripcion:
        "Liviana y con buena amortiguación, para correr o para todos los días. Tallas 36 a 43.",
    }
  ),
  productoDeCatalogo(
    "z2",
    "Zapatilla Air gris",
    "Zapatillas",
    "1460353581641-37baddab0fa2",
    52000,
    {
      stock: 5,
      descripcion:
        "Cámara de aire en el talón y capellada de malla que respira.",
    }
  ),
  productoDeCatalogo(
    "z3",
    "Zapatilla pastel",
    "Zapatillas",
    "1595950653106-6c9ebd614d3a",
    48000,
    {
      stock: 3,
      destacado: true,
      descripcion: "Plataforma baja en tonos pastel. Combina con todo.",
    }
  ),
  productoDeCatalogo(
    "z4",
    "Zapatilla blanca de cuero",
    "Zapatillas",
    "1608231387042-66d1773070a5",
    39000,
    {
      stock: 12,
      descripcion: "Cuero sintético fácil de limpiar. El clásico que no falla.",
    }
  ),
  productoDeCatalogo(
    "z5",
    "Zapatilla de entrenamiento",
    "Zapatillas",
    "1606107557195-0e29a4b5b4aa",
    43000,
    {
      precioAnteriorCents: 49000,
      stock: 6,
      descripcion:
        "Suela firme para el gimnasio y los entrenamientos funcionales.",
    }
  ),
  productoDeCatalogo(
    "z6",
    "Zapatilla caña alta",
    "Zapatillas",
    "1556906781-9a412961c28c",
    38000,
    {
      condicion: "segunda_mano",
      stock: 1,
      descripcion:
        "Usada dos veces, talla 41. Sin marcas ni desgaste en la suela.",
    }
  ),
  productoDeCatalogo(
    "p1",
    "Polera básica blanca",
    "Poleras",
    "1521572163474-6864f9cf17ab",
    8500,
    {
      stock: 30,
      descripcion: "Algodón peinado, corte recto. De la S a la XXL.",
    }
  ),
  productoDeCatalogo(
    "p2",
    "Polera estampada",
    "Poleras",
    "1576566588028-4147f3842f27",
    11000,
    {
      stock: 14,
      descripcion: "Estampado al frente que no se cuartea con el lavado.",
    }
  ),
  productoDeCatalogo(
    "p3",
    "Polera negra",
    "Poleras",
    "1618354691373-d851c5c3a990",
    9000,
    {
      stock: 0,
      descripcion: "Algodón grueso con logo bordado en el pecho.",
    }
  ),
  productoDeCatalogo(
    "a1",
    "Buzo con capucha",
    "Abrigos",
    "1556821840-3a63f95609a7",
    22000,
    {
      precioAnteriorCents: 26000,
      stock: 9,
      descripcion: "Frisa por dentro y bolsillo canguro. Gris jaspeado.",
    }
  ),
  productoDeCatalogo(
    "a2",
    "Chamarra bomber",
    "Abrigos",
    "1591047139829-d91aecb6caea",
    34000,
    {
      stock: 4,
      descripcion: "Tela satinada, puños elásticos y forro liviano.",
    }
  ),
  productoDeCatalogo(
    "a3",
    "Pantalón cargo",
    "Abrigos",
    "1548883354-7622d03aca27",
    24000,
    {
      stock: 7,
      categoriaId: "demo-cat-pantalones",
      categoria: "Pantalones",
      descripcion: "Seis bolsillos y tela resistente. Negro.",
    }
  ),
  productoDeCatalogo(
    "c1",
    "Mochila urbana",
    "Accesorios",
    "1553062407-98eeb64c6a62",
    19000,
    {
      stock: 10,
      descripcion:
        "Compartimento para laptop de 15 pulgadas y bolsillo oculto.",
    }
  ),
  productoDeCatalogo(
    "c2",
    "Gorra trucker",
    "Accesorios",
    "1588850561407-ed78c282e89b",
    7500,
    {
      stock: 20,
      descripcion: "Malla atrás y broche regulable.",
    }
  ),
]
