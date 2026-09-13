import { createClient } from "@/lib/supabase/server"
import { DEMO_PRODUCTS } from "@/lib/demo-data"
import type { Product } from "@/types/database"

export interface ProductsResult {
  products: Product[]
  storeId: string | null
  currency: string
  isDemo: boolean
}

/**
 * Productos de la primera tienda del usuario.
 * Sin sesión o sin tienda devuelve el catálogo de ejemplo.
 */
export async function getProducts(): Promise<ProductsResult> {
  const supabase = await createClient()

  const demo: ProductsResult = {
    products: DEMO_PRODUCTS,
    storeId: null,
    currency: "ARS",
    isDemo: true,
  }

  if (!supabase) return demo

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return demo

  const { data: store } = await supabase
    .from("stores")
    .select("id, currency")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!store) return demo

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  return {
    products: products ?? [],
    storeId: store.id,
    currency: store.currency,
    isDemo: false,
  }
}
