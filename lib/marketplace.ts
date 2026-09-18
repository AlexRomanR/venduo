import type { ProductCondition } from "@/types"

export interface NegocioMarketplace {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  logoUrl: string | null
  whatsapp: string | null
}

export interface ProductoMarketplace {
  id: string
  nombre: string
  descripcion: string | null
  precioCents: number
  precioAnteriorCents: number | null
  imagenUrl: string | null
  imagenes: string[]
  categoria: string | null
  condicion: ProductCondition
  notaCondicion: string | null
  stock: number
  destacado: boolean
  negocio: NegocioMarketplace
}

export interface FiltrosMarketplace {
  q?: string
  categoria?: string
  condicion?: ProductCondition
  orden?: "recientes" | "precio_asc" | "precio_desc" | "ofertas"
  pagina?: number
}

export interface CatalogoMarketplace {
  productos: ProductoMarketplace[]
  categorias: Array<{ nombre: string; productos: number }>
  total: number
  pagina: number
  paginas: number
  esDemo: boolean
}

const imagen = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=85`

const negocios = {
  rosa: {
    id: "demo-rosa",
    nombre: "Rosa Deportes",
    slug: "rosa-deportes",
    descripcion: "Ropa cómoda y accesorios para moverte todos los días.",
    logoUrl: null,
    whatsapp: null,
  },
  illimani: {
    id: "demo-illimani",
    nombre: "Café Illimani",
    slug: "cafe-illimani",
    descripcion: "Café boliviano tostado en lotes pequeños.",
    logoUrl: null,
    whatsapp: null,
  },
  andes: {
    id: "demo-andes",
    nombre: "Andes Gear",
    slug: "andes-gear",
    descripcion: "Equipo útil para estudiar, viajar y trabajar.",
    logoUrl: null,
    whatsapp: null,
  },
  elsa: {
    id: "demo-elsa",
    nombre: "Doña Elsa",
    slug: "dona-elsa",
    descripcion: "Horneados artesanales preparados cada mañana.",
    logoUrl: null,
    whatsapp: null,
  },
}

export const PRODUCTOS_MARKETPLACE_DEMO: ProductoMarketplace[] = [
  {
    id: "demo-buzo",
    nombre: "Buzo oversize urbano",
    descripcion:
      "Algodón rústico de alto gramaje, corte amplio y puños reforzados. Disponible en tallas S a XL.",
    precioCents: 18_000,
    precioAnteriorCents: 22_000,
    imagenUrl: imagen("1521572163474-6864f9cf17ab"),
    imagenes: [imagen("1521572163474-6864f9cf17ab")],
    categoria: "Ropa",
    condicion: "nuevo",
    notaCondicion: null,
    stock: 14,
    destacado: true,
    negocio: negocios.rosa,
  },
  {
    id: "demo-pan",
    nombre: "Cuñapés crujientes x12",
    descripcion:
      "Horneados el mismo día con queso chaqueño. La entrega se coordina para que lleguen frescos.",
    precioCents: 2_500,
    precioAnteriorCents: null,
    imagenUrl: imagen("1509440159596-0249088772ff"),
    imagenes: [imagen("1509440159596-0249088772ff")],
    categoria: "Alimentos",
    condicion: "nuevo",
    notaCondicion: null,
    stock: 28,
    destacado: true,
    negocio: negocios.elsa,
  },
  {
    id: "demo-mochila",
    nombre: "Mochila táctica 35L",
    descripcion:
      "Tela impermeable, compartimento acolchado para portátil y correas de compresión.",
    precioCents: 24_000,
    precioAnteriorCents: 30_000,
    imagenUrl: imagen("1553062407-98eeb64c6a62"),
    imagenes: [imagen("1553062407-98eeb64c6a62")],
    categoria: "Accesorios",
    condicion: "nuevo",
    notaCondicion: null,
    stock: 7,
    destacado: false,
    negocio: negocios.andes,
  },
  {
    id: "demo-cafe",
    nombre: "Café Yungas especial 500g",
    descripcion:
      "Grano entero, tueste medio artesanal, con notas a cacao, caramelo y frutos rojos.",
    precioCents: 8_500,
    precioAnteriorCents: null,
    imagenUrl: imagen("1495474472287-4d71bcdd2085"),
    imagenes: [imagen("1495474472287-4d71bcdd2085")],
    categoria: "Alimentos",
    condicion: "nuevo",
    notaCondicion: null,
    stock: 42,
    destacado: true,
    negocio: negocios.illimani,
  },
  {
    id: "demo-zapatillas",
    nombre: "Zapatillas de entrenamiento",
    descripcion:
      "Suela flexible y estable para gimnasio o caminatas. Horma cómoda y ligera.",
    precioCents: 31_900,
    precioAnteriorCents: 38_000,
    imagenUrl: imagen("1542291026-7eec264c27ff"),
    imagenes: [imagen("1542291026-7eec264c27ff")],
    categoria: "Calzado",
    condicion: "nuevo",
    notaCondicion: null,
    stock: 9,
    destacado: false,
    negocio: negocios.rosa,
  },
  {
    id: "demo-reloj",
    nombre: "Reloj minimalista reacondicionado",
    descripcion:
      "Revisado, con correa nueva y batería cambiada. Incluye 30 días de garantía del negocio.",
    precioCents: 42_000,
    precioAnteriorCents: 58_000,
    imagenUrl: imagen("1523275335684-37898b6baf30"),
    imagenes: [imagen("1523275335684-37898b6baf30")],
    categoria: "Accesorios",
    condicion: "reacondicionado",
    notaCondicion: "Revisado y funcionando correctamente. Marcas leves de uso.",
    stock: 1,
    destacado: false,
    negocio: negocios.andes,
  },
  {
    id: "demo-camiseta",
    nombre: "Polera de algodón pesado",
    descripcion:
      "Tejido suave de 240 g, cuello reforzado y caída recta. Hecha para durar.",
    precioCents: 12_900,
    precioAnteriorCents: null,
    imagenUrl: imagen("1521572163474-6864f9cf17ab"),
    imagenes: [imagen("1521572163474-6864f9cf17ab")],
    categoria: "Ropa",
    condicion: "segunda_mano",
    notaCondicion: "Usada dos veces, sin manchas ni desgaste visible.",
    stock: 1,
    destacado: false,
    negocio: negocios.rosa,
  },
  {
    id: "demo-molinillo",
    nombre: "Molinillo manual de cerámica",
    descripcion:
      "Molienda ajustable para prensa, V60 o espresso. Cuerpo compacto para llevar.",
    precioCents: 14_000,
    precioAnteriorCents: 17_500,
    imagenUrl: imagen("1447933601403-0c6688de566e"),
    imagenes: [imagen("1447933601403-0c6688de566e")],
    categoria: "Hogar",
    condicion: "nuevo",
    notaCondicion: null,
    stock: 5,
    destacado: false,
    negocio: negocios.illimani,
  },
]

export function categoriasDe(productos: ProductoMarketplace[]) {
  const totales = new Map<string, number>()
  for (const producto of productos) {
    if (!producto.categoria) continue
    totales.set(producto.categoria, (totales.get(producto.categoria) ?? 0) + 1)
  }
  return [...totales.entries()]
    .map(([nombre, productos]) => ({ nombre, productos }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
}
