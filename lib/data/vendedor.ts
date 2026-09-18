import { createClient } from "@/lib/supabase/server"
import type { PerfilPublico } from "@/lib/demo-data"

export type { PerfilPublico } from "@/lib/demo-data"

/**
 * El historial laboral visto desde afuera.
 *
 * Pasa por `seller_public_stats`, que es `security definer`: la política de
 * `commissions` no deja que un visitante anónimo las lea, y está bien que no
 * lo haga. La función expone solo el agregado —cuánto, para cuántas tiendas,
 * desde cuándo—, nunca el detalle por pedido.
 */
export async function getPerfilPublico(
  slug: string
): Promise<PerfilPublico | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const [statsResult, tiendasResult] = await Promise.all([
    supabase.rpc("seller_public_stats", { p_slug: slug }),
    supabase.rpc("seller_public_stores", { p_slug: slug }),
  ])

  const stats = statsResult.data?.[0]
  if (!stats) return null

  return {
    slug,
    displayName: stats.display_name,
    city: stats.city,
    bio: stats.bio,
    avatarUrl: stats.avatar_url,
    ventas: Number(stats.ventas ?? 0),
    volumenCents: Number(stats.volumen_cents ?? 0),
    tiendas: Number(stats.tiendas ?? 0),
    desde: stats.desde,
    historial: (tiendasResult.data ?? []).map((fila) => ({
      storeName: fila.store_name,
      ventas: Number(fila.ventas ?? 0),
      desde: fila.desde,
    })),
  }
}
