import { createClient, getUsuario } from "@/lib/supabase/server"
import { PRODUCTOS_VITRINA_DEMO, TIENDAS_ABIERTAS_DEMO } from "@/lib/demo-data"
import type { ProductoVitrina, TiendaAbierta } from "@/lib/demo-data"

export type { ProductoVitrina, TiendaAbierta } from "@/lib/demo-data"

/** Cuántos se traen por página. Alto para el pulgar, bajo para la consulta. */
export const POR_PAGINA = 12

export interface Pagina<T> {
  items: T[]
  total: number
  pagina: number
  paginas: number
}

/** Las búsquedas llegan de la URL, así que se limpian antes de usarse. */
function normalizar(q?: string) {
  const limpio = (q ?? "").trim().slice(0, 60)
  // `%` y `_` son comodines de LIKE: sin escaparlos, buscar "100%" devuelve
  // cualquier cosa.
  return limpio.replace(/[%_\\]/g, (c) => `\\${c}`)
}

function vacia<T>(pagina: number): Pagina<T> {
  return { items: [], total: 0, pagina, paginas: 0 }
}

function paginaDemo<T>(items: T[], pagina: number): Pagina<T> {
  const desde = (pagina - 1) * POR_PAGINA
  return {
    items: items.slice(desde, desde + POR_PAGINA),
    total: items.length,
    pagina,
    paginas: Math.max(1, Math.ceil(items.length / POR_PAGINA)),
  }
}

/**
 * Las tiendas que aceptan vendedores.
 *
 * Consulta pública que cruza todos los tenants a propósito: un vendedor
 * pertenece a varias tiendas y para elegir la primera necesita ver las que
 * hay. RLS la permite porque solo expone tiendas publicadas.
 *
 * Se excluyen la tienda propia —nadie vende para sí mismo— y aquellas donde ya
 * hay vínculo, que no son un descubrimiento sino su panel. Ese filtro se hace
 * después de traer la página, así que el total es el del catálogo y no el de
 * lo que queda: es una diferencia asumida a cambio de no arrastrar la lista de
 * exclusiones a cada consulta.
 */
export async function getTiendasAbiertas({
  q,
  pagina = 1,
}: { q?: string; pagina?: number } = {}): Promise<Pagina<TiendaAbierta>> {
  const supabase = await createClient()
  if (!supabase) return paginaDemo(TIENDAS_ABIERTAS_DEMO, pagina)

  const busqueda = normalizar(q)
  const desde = (pagina - 1) * POR_PAGINA

  const user = await getUsuario()

  let consulta = supabase
    .from("stores")
    .select(
      "id, name, slug, tagline, description, seller_join_mode, commission_bps",
      { count: "exact" }
    )
    .eq("is_published", true)
    .eq("seller_network_enabled", true)
    .is("deleted_at", null)

  if (busqueda) consulta = consulta.ilike("name", `%${busqueda}%`)

  const [tiendasResult, miTiendaResult, vinculosResult] = await Promise.all([
    consulta
      .order("created_at", { ascending: false })
      .range(desde, desde + POR_PAGINA - 1),
    user
      ? supabase
          .from("stores")
          .select("id")
          .eq("owner_id", user.id)
          .is("deleted_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("store_sellers")
          .select("store_id")
          .eq("user_id", user.id)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] }),
  ])

  if (!tiendasResult.data) return vacia(pagina)

  const excluidas = new Set<string>()
  if (miTiendaResult.data?.id) excluidas.add(miTiendaResult.data.id)
  for (const vinculo of vinculosResult.data ?? [])
    excluidas.add(vinculo.store_id)

  const total = tiendasResult.count ?? 0

  return {
    items: tiendasResult.data
      .filter((tienda) => !excluidas.has(tienda.id))
      .map((tienda) => ({
        id: tienda.id,
        name: tienda.name,
        slug: tienda.slug,
        tagline: tienda.tagline ?? tienda.description,
        joinMode: tienda.seller_join_mode,
        commissionBps: tienda.commission_bps,
      })),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
  }
}

/**
 * El nombre de una tienda publicada, por su slug.
 *
 * Buscar por slug no filtra nada: el slug ya es público, está impreso en el
 * código QR. Por eso el enlace de invitación lleva la tienda y el código
 * juntos, y no hace falta traducir código a tienda — ese sí sería el endpoint
 * para averiguar por descarte qué códigos valen.
 */
export async function getNombreDeTienda(slug: string): Promise<string | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const { data } = await supabase
    .from("stores")
    .select("name")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .maybeSingle()

  return data?.name ?? null
}

/**
 * La vitrina de productos abiertos a vendedores.
 *
 * Cruza todas las tiendas: lo que la arma no es una tienda sino la decisión
 * por producto de cada emprendedor. El `!inner` sobre `stores` deja fuera los
 * productos de tiendas despublicadas o con la red apagada sin traerlos para
 * descartarlos después.
 */
export async function getProductosVitrina({
  q,
  pagina = 1,
}: { q?: string; pagina?: number } = {}): Promise<Pagina<ProductoVitrina>> {
  const supabase = await createClient()
  if (!supabase) return paginaDemo(PRODUCTOS_VITRINA_DEMO, pagina)

  const busqueda = normalizar(q)
  const desde = (pagina - 1) * POR_PAGINA

  const user = await getUsuario()

  let consulta = supabase
    .from("products")
    .select(
      "id, name, price_cents, compare_at_price_cents, image_url, condition, store_id, stores!inner(name, slug, commission_bps, is_published, seller_network_enabled, owner_id, deleted_at)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .eq("seller_enabled", true)
    .is("deleted_at", null)
    .eq("stores.is_published", true)
    .eq("stores.seller_network_enabled", true)
    .is("stores.deleted_at", null)
    .gt("stock", 0)

  if (busqueda) consulta = consulta.ilike("name", `%${busqueda}%`)

  const { data, count } = await consulta
    .order("created_at", { ascending: false })
    .range(desde, desde + POR_PAGINA - 1)

  if (!data) return vacia(pagina)

  const total = count ?? 0

  return {
    items: data
      .filter((producto) => producto.stores?.owner_id !== user?.id)
      .map((producto) => ({
        id: producto.id,
        name: producto.name,
        priceCents: producto.price_cents,
        compareAtPriceCents: producto.compare_at_price_cents,
        imageUrl: producto.image_url,
        condition: producto.condition,
        storeName: producto.stores?.name ?? "Tienda",
        storeSlug: producto.stores?.slug ?? "",
        commissionBps: producto.stores?.commission_bps ?? 0,
      })),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
  }
}
