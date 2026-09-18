import { createClient } from "@/lib/supabase/server"
import { PRODUCTOS_VITRINA_DEMO, type ProductoVitrina } from "@/lib/demo-data"
import { gananciaPorUnidad } from "@/lib/promotor"

export type { ProductoVitrina } from "@/lib/demo-data"

/** Cuántos se traen por página. Alto para el pulgar, bajo para la consulta. */
export const POR_PAGINA = 12

export type OrdenVitrina =
  "recientes" | "precio_asc" | "precio_desc" | "stock_desc" | "ofertas"
export type PrecioVitrina = "hasta_100" | "100_300" | "300_700" | "700_mas"
export type PublicadoVitrina = "7" | "30" | "90"

export interface FiltrosVitrina {
  q?: string
  pagina?: number
  porPagina?: number
  categoria?: string
  condicion?: "nuevo" | "segunda_mano" | "reacondicionado"
  precio?: PrecioVitrina
  publicado?: PublicadoVitrina
  orden?: OrdenVitrina
}

export interface PaginaVitrina {
  items: ProductoVitrina[]
  total: number
  pagina: number
  paginas: number
  categorias: string[]
}

type FilaProducto = {
  id: string
  name: string
  description: string | null
  price_cents: number
  base_cost_cents: number
  take_bps: number | null
  compare_at_price_cents: number | null
  image_url: string | null
  images: string[]
  condition: ProductoVitrina["condition"]
  condition_note: string | null
  category: string | null
  created_at: string
  is_featured: boolean
  stock: number
  stores: {
    name: string
    slug: string
    owner_id: string
  } | null
}

/** Las búsquedas llegan de la URL, así que se limpian antes de usarse. */
function normalizar(q?: string, largo = 60) {
  const limpio = (q ?? "").trim().slice(0, largo)
  // `%` y `_` son comodines de LIKE: sin escaparlos, buscar "100%" devuelve
  // cualquier cosa.
  return limpio.replace(/[%_\\]/g, (c) => `\\${c}`)
}

function rangoPrecio(precio?: PrecioVitrina) {
  if (precio === "hasta_100") return { max: 10_000 }
  if (precio === "100_300") return { min: 10_000, max: 30_000 }
  if (precio === "300_700") return { min: 30_000, max: 70_000 }
  if (precio === "700_mas") return { min: 70_000 }
  return null
}

function mapearProducto(producto: FilaProducto, codigo: string | null) {
  return {
    id: producto.id,
    name: producto.name,
    description: producto.description,
    priceCents: producto.price_cents,
    compareAtPriceCents: producto.compare_at_price_cents,
    imageUrl: producto.image_url,
    images: producto.images,
    condition: producto.condition,
    conditionNote: producto.condition_note,
    category: producto.category,
    publishedAt: producto.created_at,
    featured: producto.is_featured,
    storeName: producto.stores?.name ?? "Negocio",
    storeSlug: producto.stores?.slug ?? "",
    gananciaCents: gananciaPorUnidad(
      producto.price_cents,
      producto.base_cost_cents,
      producto.take_bps
    ),
    stock: producto.stock,
    tomado: codigo !== null,
    codigo,
  } satisfies ProductoVitrina
}

function filtrarDemo(filtros: FiltrosVitrina): PaginaVitrina {
  const q = normalizar(filtros.q).toLocaleLowerCase("es")
  const rango = rangoPrecio(filtros.precio)
  const limitePublicado = filtros.publicado
    ? Date.now() - Number(filtros.publicado) * 86_400_000
    : null

  let items = PRODUCTOS_VITRINA_DEMO.filter((producto) => {
    if (
      q &&
      ![producto.name, producto.storeName, producto.category]
        .filter(Boolean)
        .some((valor) => valor?.toLocaleLowerCase("es").includes(q))
    ) {
      return false
    }
    if (filtros.categoria && producto.category !== filtros.categoria)
      return false
    if (filtros.condicion && producto.condition !== filtros.condicion)
      return false
    if (rango?.min !== undefined && producto.priceCents < rango.min)
      return false
    if (rango?.max !== undefined && producto.priceCents > rango.max)
      return false
    if (
      limitePublicado !== null &&
      new Date(producto.publishedAt).getTime() < limitePublicado
    ) {
      return false
    }
    return true
  })

  items = [...items].sort((a, b) => {
    if (filtros.orden === "precio_asc") return a.priceCents - b.priceCents
    if (filtros.orden === "precio_desc") return b.priceCents - a.priceCents
    if (filtros.orden === "stock_desc") return b.stock - a.stock
    if (filtros.orden === "ofertas") {
      return (
        Number(Boolean(b.compareAtPriceCents)) -
        Number(Boolean(a.compareAtPriceCents))
      )
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  const pagina = filtros.pagina ?? 1
  const porPagina = filtros.porPagina ?? POR_PAGINA
  const desde = (pagina - 1) * porPagina
  return {
    items: items.slice(desde, desde + porPagina),
    total: items.length,
    pagina,
    paginas: Math.max(1, Math.ceil(items.length / porPagina)),
    categorias: [
      ...new Set(
        PRODUCTOS_VITRINA_DEMO.map((producto) => producto.category).filter(
          (categoria): categoria is string => Boolean(categoria)
        )
      ),
    ].sort((a, b) => a.localeCompare(b, "es")),
  }
}

/**
 * El catálogo que puede promocionar cualquier promotor.
 *
 * Cruza todos los negocios: publicar un producto ya es el consentimiento del
 * negocio a que se venda. Búsqueda, filtros, orden y página viven en la URL
 * para que volver atrás conserve exactamente la exploración.
 */
export async function getProductosVitrina(
  filtros: FiltrosVitrina = {}
): Promise<PaginaVitrina> {
  const supabase = await createClient()
  if (!supabase) return filtrarDemo(filtros)

  const pagina = filtros.pagina ?? 1
  const porPagina = filtros.porPagina ?? POR_PAGINA
  const busqueda = normalizar(filtros.q)
  const categoria = normalizar(filtros.categoria, 80)
  const desde = (pagina - 1) * porPagina
  const rango = rangoPrecio(filtros.precio)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const base = () =>
    supabase
      .from("products")
      .select(
        "id, name, description, price_cents, base_cost_cents, take_bps, compare_at_price_cents, image_url, images, condition, condition_note, category, created_at, is_featured, stock, stores!inner(name, slug, is_published, owner_id, deleted_at)",
        { count: "exact" }
      )
      .eq("is_active", true)
      .eq("seller_enabled", true)
      .is("deleted_at", null)
      .eq("stores.is_published", true)
      .is("stores.deleted_at", null)
      .gt("stock", 0)

  let consulta = base()
  if (user) consulta = consulta.neq("stores.owner_id", user.id)
  if (busqueda) {
    consulta = consulta.or(
      `name.ilike.%${busqueda}%,description.ilike.%${busqueda}%`
    )
  }
  if (categoria) consulta = consulta.eq("category", categoria)
  if (filtros.condicion) {
    consulta = consulta.eq("condition", filtros.condicion)
  }
  if (rango?.min !== undefined) {
    consulta = consulta.gte("price_cents", rango.min)
  }
  if (rango?.max !== undefined) {
    consulta = consulta.lte("price_cents", rango.max)
  }
  if (filtros.publicado) {
    const desdeFecha = new Date(
      Date.now() - Number(filtros.publicado) * 86_400_000
    ).toISOString()
    consulta = consulta.gte("created_at", desdeFecha)
  }

  if (filtros.orden === "precio_asc") {
    consulta = consulta.order("price_cents", { ascending: true })
  } else if (filtros.orden === "precio_desc") {
    consulta = consulta.order("price_cents", { ascending: false })
  } else if (filtros.orden === "stock_desc") {
    consulta = consulta.order("stock", { ascending: false })
  } else if (filtros.orden === "ofertas") {
    consulta = consulta
      .order("compare_at_price_cents", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
  } else {
    consulta = consulta.order("created_at", { ascending: false })
  }

  let categoriasQuery = base()
  if (user) categoriasQuery = categoriasQuery.neq("stores.owner_id", user.id)

  const [{ data, count }, tomados, categoriasData] = await Promise.all([
    consulta.range(desde, desde + porPagina - 1),
    user
      ? supabase
          .from("seller_products")
          .select("*, store_sellers(referral_code)")
          .eq("user_id", user.id)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] }),
    categoriasQuery,
  ])

  if (!data) {
    return { items: [], total: 0, pagina, paginas: 1, categorias: [] }
  }

  const codigos = new Map<string, string | null>()
  for (const fila of tomados.data ?? []) {
    const codigoProducto = (fila as unknown as { referral_code?: unknown })
      .referral_code
    codigos.set(
      fila.product_id,
      typeof codigoProducto === "string"
        ? codigoProducto
        : (fila.store_sellers?.referral_code ?? null)
    )
  }

  const categorias = [
    ...new Set(
      ((categoriasData.data ?? []) as Array<{ category: string | null }>)
        .map((producto) => producto.category?.trim())
        .filter((valor): valor is string => Boolean(valor))
    ),
  ].sort((a, b) => a.localeCompare(b, "es"))

  const total = count ?? 0
  return {
    items: (data as FilaProducto[]).map((producto) =>
      mapearProducto(producto, codigos.get(producto.id) ?? null)
    ),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
    categorias,
  }
}

/** Una ficha del catálogo, con el enlace actual del promotor si ya la tomó. */
export const getProductoVitrina = cache(async function getProductoVitrina(
  id: string
): Promise<ProductoVitrina | null> {
  const demo = PRODUCTOS_VITRINA_DEMO.find((producto) => producto.id === id)
  const supabase = await createClient()
  if (!supabase) return demo ?? null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("products")
    .select(
      "id, name, description, price_cents, base_cost_cents, take_bps, compare_at_price_cents, image_url, images, condition, condition_note, category, created_at, is_featured, stock, seller_enabled, is_active, deleted_at, stores!inner(name, slug, is_published, owner_id, deleted_at)"
    )
    .eq("id", id)
    .eq("is_active", true)
    .eq("seller_enabled", true)
    .is("deleted_at", null)
    .eq("stores.is_published", true)
    .is("stores.deleted_at", null)
    .gt("stock", 0)
    .maybeSingle()

  if (!data || data.stores?.owner_id === user.id) return null

  const { data: tomado } = await supabase
    .from("seller_products")
    .select("*, store_sellers(referral_code)")
    .eq("product_id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  const codigoPropio = (tomado as unknown as { referral_code?: unknown } | null)
    ?.referral_code
  const codigo =
    typeof codigoPropio === "string"
      ? codigoPropio
      : (tomado?.store_sellers?.referral_code ?? null)

  return mapearProducto(data as FilaProducto, codigo)
})
import { cache } from "react"
