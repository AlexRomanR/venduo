import { createClient } from "@/lib/supabase/server"
import { PRODUCTOS_VITRINA_DEMO } from "@/lib/demo-data"
import type { ProductoVitrina } from "@/lib/demo-data"
import { gananciaPorUnidad } from "@/lib/promotor"

export type { ProductoVitrina } from "@/lib/demo-data"

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
 * El catálogo que puede promocionar cualquier promotor.
 *
 * Cruza todos los negocios: publicar un producto ya es el consentimiento del
 * negocio a que se venda, así que no se mira si la tienda "acepta vendedores",
 * que era del modelo anterior. Manda `seller_enabled`, el interruptor por
 * producto.
 *
 * Los productos del propio negocio se dejan fuera después de traer la página:
 * el total es el del catálogo. Es una diferencia asumida a cambio de no
 * arrastrar una exclusión a cada consulta.
 */
export async function getProductosVitrina({
  q,
  pagina = 1,
  porPagina = POR_PAGINA,
}: { q?: string; pagina?: number; porPagina?: number } = {}): Promise<
  Pagina<ProductoVitrina>
> {
  const supabase = await createClient()
  if (!supabase) return paginaDemo(PRODUCTOS_VITRINA_DEMO, pagina)

  const busqueda = normalizar(q)
  const desde = (pagina - 1) * porPagina

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let consulta = supabase
    .from("products")
    .select(
      "id, name, price_cents, base_cost_cents, take_bps, compare_at_price_cents, image_url, condition, stock, stores!inner(name, slug, is_published, owner_id, deleted_at)",
      { count: "exact" }
    )
    .eq("is_active", true)
    .eq("seller_enabled", true)
    .is("deleted_at", null)
    .eq("stores.is_published", true)
    .is("stores.deleted_at", null)
    .gt("stock", 0)

  if (busqueda) consulta = consulta.ilike("name", `%${busqueda}%`)

  const [{ data, count }, tomados] = await Promise.all([
    consulta
      .order("created_at", { ascending: false })
      .range(desde, desde + porPagina - 1),
    user
      ? supabase
          .from("seller_products")
          .select("product_id, store_sellers(referral_code)")
          .eq("user_id", user.id)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] }),
  ])

  if (!data) return { items: [], total: 0, pagina, paginas: 0 }

  const codigos = new Map<string, string | null>()
  for (const fila of tomados.data ?? []) {
    codigos.set(fila.product_id, fila.store_sellers?.referral_code ?? null)
  }

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
        storeName: producto.stores?.name ?? "Negocio",
        storeSlug: producto.stores?.slug ?? "",
        gananciaCents: gananciaPorUnidad(
          producto.price_cents,
          producto.base_cost_cents,
          producto.take_bps
        ),
        stock: producto.stock,
        tomado: codigos.has(producto.id),
        codigo: codigos.get(producto.id) ?? null,
      })),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  }
}
