import { getMiTienda } from "@/lib/data/panel"
import { createClient } from "@/lib/supabase/server"
import type { Product, ProductCategory, ProductCondition } from "@/types"

export interface FiltrosCatalogo {
  buscar?: string
  categoria?: string
  condicion?: ProductCondition
  /** `activos`, `ocultos`, `sin_stock`, `poco_stock`, `vendedores`, `destacados`. */
  estado?: string
  orden?: string
}

export interface ResumenCatalogo {
  total: number
  activos: number
  ocultos: number
  sinStock: number
  pocoStock: number
  conVendedores: number
  destacados: number
  /** Precio por stock, en centavos. Lo que vale lo que tienes guardado. */
  valorInventarioCents: number
  unidades: number
}

export interface Catalogo {
  productos: Product[]
  categorias: CategoriaConUso[]
  resumen: ResumenCatalogo
  esDemo: boolean
}

export interface CategoriaConUso extends ProductCategory {
  /** Cuántos productos vivos la usan. Es lo que decide si se puede borrar. */
  productos: number
}

/**
 * Productos de ejemplo para el modo demo.
 *
 * Sin credenciales la pantalla tiene que verse bien, no vacía: es lo que ve
 * quien clona el repositorio, y el respaldo si Supabase falla en la
 * demostración.
 */
function catalogoDeDemostracion(): Catalogo {
  const base = {
    store_id: "demo",
    description: null,
    compare_at_price_cents: null,
    condition_note: null,
    category_id: null,
    sku: null,
    images: [] as string[],
    image_url: null,
    low_stock_threshold: 3,
    is_featured: false,
    seller_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  }

  const productos = [
    {
      ...base,
      id: "demo-1",
      name: "Polera básica",
      category: "Poleras",
      condition: "nuevo" as const,
      price_cents: 9000,
      stock: 24,
      is_active: true,
      is_featured: true,
    },
    {
      ...base,
      id: "demo-2",
      name: "Campera rompeviento",
      category: "Camperas",
      condition: "nuevo" as const,
      price_cents: 32000,
      compare_at_price_cents: 38000,
      stock: 2,
      is_active: true,
    },
    {
      ...base,
      id: "demo-3",
      name: "Mochila urbana",
      category: "Mochilas",
      condition: "segunda_mano" as const,
      condition_note: "Usada una temporada, sin roturas.",
      price_cents: 21000,
      stock: 0,
      is_active: true,
    },
    {
      ...base,
      id: "demo-4",
      name: "Gorra deportiva",
      category: "Gorras",
      condition: "nuevo" as const,
      price_cents: 5500,
      stock: 12,
      is_active: false,
      seller_enabled: false,
    },
  ] as Product[]

  const categorias = ["Poleras", "Camperas", "Mochilas", "Gorras"].map(
    (name, i) => ({
      id: `demo-cat-${i}`,
      store_id: "demo",
      name,
      description: null,
      position: i,
      created_at: base.created_at,
      updated_at: base.updated_at,
      deleted_at: null,
      productos: 1,
    })
  )

  return {
    productos,
    categorias,
    resumen: resumir(productos),
    esDemo: true,
  }
}

function resumir(productos: Product[]): ResumenCatalogo {
  return {
    total: productos.length,
    activos: productos.filter((p) => p.is_active).length,
    ocultos: productos.filter((p) => !p.is_active).length,
    sinStock: productos.filter((p) => p.stock === 0).length,
    pocoStock: productos.filter(
      (p) => p.stock > 0 && p.stock <= p.low_stock_threshold
    ).length,
    conVendedores: productos.filter((p) => p.seller_enabled).length,
    destacados: productos.filter((p) => p.is_featured).length,
    valorInventarioCents: productos.reduce(
      (total, p) => total + p.price_cents * p.stock,
      0
    ),
    unidades: productos.reduce((total, p) => total + p.stock, 0),
  }
}

/**
 * El catálogo completo de mi tienda.
 *
 * El resumen se calcula sobre **todo** el catálogo y no sobre lo filtrado: si
 * las cifras de arriba cambiaran con cada filtro dejarían de ser el estado del
 * negocio y pasarían a ser el pie de una tabla.
 */
export async function getCatalogo(
  filtros: FiltrosCatalogo = {}
): Promise<Catalogo> {
  const supabase = await createClient()
  if (!supabase) return catalogoDeDemostracion()

  const tienda = await getMiTienda()
  if (!tienda) return catalogoDeDemostracion()

  const [{ data: productos }, { data: categorias }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("store_id", tienda.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_categories")
      .select("*")
      .eq("store_id", tienda.id)
      .is("deleted_at", null)
      .order("position")
      .order("name"),
  ])

  const todos = productos ?? []

  return {
    productos: filtrar(todos, filtros),
    categorias: (categorias ?? []).map((categoria) => ({
      ...categoria,
      productos: todos.filter((p) => p.category_id === categoria.id).length,
    })),
    resumen: resumir(todos),
    esDemo: false,
  }
}

/**
 * Los filtros se aplican en memoria y no en la consulta.
 *
 * Un catálogo de MVP son decenas de filas, ya vienen todas para calcular el
 * resumen, y hacerlo acá evita una segunda ida a la base por cada tecla del
 * buscador. Si un día son miles, esto se muda a la consulta.
 */
function filtrar(productos: Product[], filtros: FiltrosCatalogo): Product[] {
  let salida = productos

  const buscar = filtros.buscar?.trim().toLowerCase()
  if (buscar) {
    salida = salida.filter(
      (p) =>
        p.name.toLowerCase().includes(buscar) ||
        p.sku?.toLowerCase().includes(buscar) ||
        p.category?.toLowerCase().includes(buscar)
    )
  }

  if (filtros.categoria === "sin") {
    salida = salida.filter((p) => !p.category_id)
  } else if (filtros.categoria) {
    salida = salida.filter((p) => p.category_id === filtros.categoria)
  }

  if (filtros.condicion) {
    salida = salida.filter((p) => p.condition === filtros.condicion)
  }

  switch (filtros.estado) {
    case "activos":
      salida = salida.filter((p) => p.is_active)
      break
    case "ocultos":
      salida = salida.filter((p) => !p.is_active)
      break
    case "sin_stock":
      salida = salida.filter((p) => p.stock === 0)
      break
    case "poco_stock":
      salida = salida.filter(
        (p) => p.stock > 0 && p.stock <= p.low_stock_threshold
      )
      break
    case "vendedores":
      salida = salida.filter((p) => p.seller_enabled)
      break
    case "destacados":
      salida = salida.filter((p) => p.is_featured)
      break
  }

  const orden = [...salida]
  switch (filtros.orden) {
    case "nombre":
      return orden.sort((a, b) => a.name.localeCompare(b.name, "es"))
    case "precio":
      return orden.sort((a, b) => b.price_cents - a.price_cents)
    case "stock":
      return orden.sort((a, b) => a.stock - b.stock)
    default:
      return orden
  }
}

/**
 * Un producto para editarlo. Devuelve `null` si no es de mi tienda.
 *
 * El filtro por tienda va escrito y no se delega en RLS: la política de lectura
 * de `products` deja ver el catálogo de **toda tienda publicada** —hace falta
 * para que un comprador navegue—, así que sin esto un identificador ajeno
 * abriría el formulario con el producto de otro comercio. Guardar fallaría
 * después, pero para entonces ya se vio lo que no se debía.
 */
export async function getProducto(id: string): Promise<Product | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const tienda = await getMiTienda()
  if (!tienda) return null

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("store_id", tienda.id)
    .is("deleted_at", null)
    .maybeSingle()

  return data
}
