import { createClient, getUsuario } from "@/lib/supabase/server"
import { DEMO_PRODUCTS } from "@/lib/demo-data"
import { CURRENCY } from "@/lib/format"
import type { Product } from "@/types"

export interface ProductsResult {
  products: Product[]
  storeId: string | null
  currency: string
  isDemo: boolean
}

/**
 * Productos de la tienda del usuario.
 * Sin sesión o sin tienda devuelve el catálogo de ejemplo.
 */
export async function getProducts(): Promise<ProductsResult> {
  const supabase = await createClient()

  const demo: ProductsResult = {
    products: DEMO_PRODUCTS,
    storeId: null,
    currency: CURRENCY,
    isDemo: true,
  }

  if (!supabase) return demo

  const user = await getUsuario()
  if (!user) return demo

  // Una tienda por usuario: el índice único sobre owner_id lo garantiza.
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!store) return demo

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  return {
    products: products ?? [],
    storeId: store.id,
    currency: CURRENCY,
    isDemo: false,
  }
}
