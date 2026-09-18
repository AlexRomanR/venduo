import { cache } from "react"

import {
  PRODUCTOS_MARKETPLACE_DEMO,
  categoriasDe,
  type CatalogoMarketplace,
  type FiltrosMarketplace,
  type NegocioMarketplace,
  type ProductoMarketplace,
} from "@/lib/marketplace"
import { createClient } from "@/lib/supabase/server"
import { rpcMigrado } from "@/lib/supabase/rpc"
import type { Referido } from "@/lib/data/tienda-publica"
import { resolverImagenProducto } from "@/lib/imagenes-producto"

const POR_PAGINA = 24

/** Resuelve un referido únicamente contra el producto cuyo enlace se abrió. */
export async function getReferidoProducto(
  productoId: string,
  codigo: string | null
): Promise<Referido | null> {
  if (!codigo) return null

  const supabase = await createClient()
  if (!supabase) return null

  const { data, error } = await rpcMigrado(
    supabase,
    "referido_producto_publico",
    { p_product_id: productoId, p_codigo: codigo }
  )
  if (error || !Array.isArray(data)) return null

  const fila = data[0]
  if (
    !fila ||
    typeof fila !== "object" ||
    !("codigo" in fila) ||
    typeof fila.codigo !== "string"
  ) {
    return null
  }

  return {
    codigo: fila.codigo,
    nombre:
      "nombre" in fila && typeof fila.nombre === "string" ? fila.nombre : null,
  }
}

function limpiar(texto?: string, largo = 80) {
  return (texto ?? "").trim().slice(0, largo)
}

function filtrarDemo(filtros: FiltrosMarketplace): CatalogoMarketplace {
  const q = limpiar(filtros.q).toLocaleLowerCase("es")
  let productos = PRODUCTOS_MARKETPLACE_DEMO.filter((producto) => {
    if (
      q &&
      ![
        producto.nombre,
        producto.descripcion,
        producto.categoria,
        producto.negocio.nombre,
      ]
        .filter(Boolean)
        .some((valor) => valor?.toLocaleLowerCase("es").includes(q))
    ) {
      return false
    }
    if (filtros.categoria && producto.categoria !== filtros.categoria) {
      return false
    }
    if (filtros.condicion && producto.condicion !== filtros.condicion) {
      return false
    }
    return true
  })

  productos = [...productos].sort((a, b) => {
    if (filtros.orden === "precio_asc") return a.precioCents - b.precioCents
    if (filtros.orden === "precio_desc") return b.precioCents - a.precioCents
    if (filtros.orden === "ofertas") {
      return (
        Number(Boolean(b.precioAnteriorCents)) -
        Number(Boolean(a.precioAnteriorCents))
      )
    }
    return Number(b.destacado) - Number(a.destacado)
  })

  return {
    productos,
    categorias: categoriasDe(PRODUCTOS_MARKETPLACE_DEMO),
    total: productos.length,
    pagina: 1,
    paginas: 1,
    esDemo: true,
  }
}

type FilaProducto = {
  id: string
  name: string
  description: string | null
  price_cents: number
  compare_at_price_cents: number | null
  image_url: string | null
  images: string[]
  category: string | null
  condition: ProductoMarketplace["condicion"]
  condition_note: string | null
  stock: number
  is_featured: boolean
  stores: {
    id: string
    name: string
    slug: string
    description: string | null
    logo_url: string | null
    whatsapp: string | null
  } | null
}

function mapearProducto(fila: FilaProducto): ProductoMarketplace {
  const imagenUrl =
    fila.image_url || resolverImagenProducto(fila.name, fila.category)
  const imagenes =
    fila.images && fila.images.length > 0
      ? fila.images
      : imagenUrl
        ? [imagenUrl]
        : []

  return {
    id: fila.id,
    nombre: fila.name,
    descripcion: fila.description,
    precioCents: fila.price_cents,
    precioAnteriorCents: fila.compare_at_price_cents,
    imagenUrl,
    imagenes,
    categoria: fila.category,
    condicion: fila.condition,
    notaCondicion: fila.condition_note,
    stock: fila.stock,
    destacado: fila.is_featured,
    negocio: {
      id: fila.stores?.id ?? "",
      nombre: fila.stores?.name ?? "Negocio local",
      slug: fila.stores?.slug ?? "",
      descripcion: fila.stores?.description ?? null,
      logoUrl: fila.stores?.logo_url ?? null,
      whatsapp: fila.stores?.whatsapp ?? null,
    },
  }
}

export async function getMarketplace(
  filtros: FiltrosMarketplace = {}
): Promise<CatalogoMarketplace> {
  const supabase = await createClient()
  if (!supabase) return filtrarDemo(filtros)

  const pagina = Math.max(1, filtros.pagina ?? 1)
  const desde = (pagina - 1) * POR_PAGINA
  const q = limpiar(filtros.q)

  let consulta = supabase
    .from("products")
    .select(
      "id, name, description, price_cents, compare_at_price_cents, image_url, images, category, condition, condition_note, stock, is_featured, created_at, stores!inner(id, name, slug, description, logo_url, whatsapp, is_published, deleted_at)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .gt("stock", 0)
    .is("deleted_at", null)
    .eq("stores.is_published", true)
    .is("stores.deleted_at", null)

  if (q) {
    const seguro = q.replace(/[%_\\]/g, (caracter) => `\\${caracter}`)
    consulta = consulta.or(
      `name.ilike.%${seguro}%,description.ilike.%${seguro}%,category.ilike.%${seguro}%`
    )
  }
  if (filtros.categoria) consulta = consulta.eq("category", filtros.categoria)
  if (filtros.condicion) consulta = consulta.eq("condition", filtros.condicion)

  if (filtros.orden === "precio_asc") {
    consulta = consulta.order("price_cents", { ascending: true })
  } else if (filtros.orden === "precio_desc") {
    consulta = consulta.order("price_cents", { ascending: false })
  } else if (filtros.orden === "ofertas") {
    consulta = consulta
      .not("compare_at_price_cents", "is", null)
      .order("compare_at_price_cents", { ascending: false })
  } else {
    consulta = consulta
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
  }

  const [{ data, count }, { data: categorias }] = await Promise.all([
    consulta.range(desde, desde + POR_PAGINA - 1),
    supabase
      .from("products")
      .select("category")
      .eq("is_active", true)
      .gt("stock", 0)
      .is("deleted_at", null)
      .not("category", "is", null)
      .limit(1000),
  ])

  const total = count ?? 0
  const conteoCategorias = new Map<string, number>()
  for (const fila of categorias ?? []) {
    if (!fila.category) continue
    conteoCategorias.set(
      fila.category,
      (conteoCategorias.get(fila.category) ?? 0) + 1
    )
  }

  return {
    productos: ((data ?? []) as FilaProducto[]).map(mapearProducto),
    categorias: [...conteoCategorias.entries()]
      .map(([nombre, productos]) => ({ nombre, productos }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    esDemo: false,
  }
}

export const getProductoMarketplace = cache(async function (
  id: string
): Promise<{
  producto: ProductoMarketplace
  relacionados: ProductoMarketplace[]
  esDemo: boolean
} | null> {
  const supabase = await createClient()
  if (!supabase) {
    const producto = PRODUCTOS_MARKETPLACE_DEMO.find((item) => item.id === id)
    if (!producto) return null
    return {
      producto,
      relacionados: PRODUCTOS_MARKETPLACE_DEMO.filter(
        (item) => item.id !== id && item.categoria === producto.categoria
      ).slice(0, 4),
      esDemo: true,
    }
  }

  const { data } = await supabase
    .from("products")
    .select(
      "id, name, description, price_cents, compare_at_price_cents, image_url, images, category, condition, condition_note, stock, is_featured, stores!inner(id, name, slug, description, logo_url, whatsapp, is_published, deleted_at)"
    )
    .eq("id", id)
    .eq("is_active", true)
    .gt("stock", 0)
    .is("deleted_at", null)
    .eq("stores.is_published", true)
    .is("stores.deleted_at", null)
    .maybeSingle()

  if (!data) return null
  const producto = mapearProducto(data as FilaProducto)

  let relacionadosQuery = supabase
    .from("products")
    .select(
      "id, name, description, price_cents, compare_at_price_cents, image_url, images, category, condition, condition_note, stock, is_featured, stores!inner(id, name, slug, description, logo_url, whatsapp, is_published, deleted_at)"
    )
    .neq("id", id)
    .eq("is_active", true)
    .gt("stock", 0)
    .is("deleted_at", null)
    .eq("stores.is_published", true)
    .is("stores.deleted_at", null)

  if (producto.categoria) {
    relacionadosQuery = relacionadosQuery.eq("category", producto.categoria)
  }

  const { data: relacionados } = await relacionadosQuery
    .order("is_featured", { ascending: false })
    .limit(4)

  return {
    producto,
    relacionados: ((relacionados ?? []) as FilaProducto[]).map(mapearProducto),
    esDemo: false,
  }
})

export const getNegocioMarketplace = cache(async function (
  slug: string
): Promise<{
  negocio: NegocioMarketplace
  productos: ProductoMarketplace[]
  esDemo: boolean
} | null> {
  const supabase = await createClient()
  if (!supabase) {
    const productos = PRODUCTOS_MARKETPLACE_DEMO.filter(
      (producto) => producto.negocio.slug === slug
    )
    return productos[0]
      ? { negocio: productos[0].negocio, productos, esDemo: true }
      : null
  }

  const { data: tienda } = await supabase
    .from("stores")
    .select("id, name, slug, description, logo_url, whatsapp, is_published")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .maybeSingle()

  if (!tienda) return null

  const { data } = await supabase
    .from("products")
    .select(
      "id, name, description, price_cents, compare_at_price_cents, image_url, images, category, condition, condition_note, stock, is_featured, stores!inner(id, name, slug, description, logo_url, whatsapp, is_published, deleted_at)"
    )
    .eq("store_id", tienda.id)
    .eq("is_active", true)
    .gt("stock", 0)
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })

  return {
    negocio: {
      id: tienda.id,
      nombre: tienda.name,
      slug: tienda.slug,
      descripcion: tienda.description,
      logoUrl: tienda.logo_url,
      whatsapp: tienda.whatsapp,
    },
    productos: ((data ?? []) as FilaProducto[]).map(mapearProducto),
    esDemo: false,
  }
})
