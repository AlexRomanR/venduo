import { createClient } from "@/lib/supabase/server"
import { getDemoPerfilPublico, type PerfilPublico } from "@/lib/demo-data"

export type { PerfilPublico } from "@/lib/demo-data"

/**
 * El historial laboral y CV visto por visitantes o negocios.
 *
 * Expone el agregado de ventas, tiendas y desde cuándo.
 * El teléfono de contacto comercial SOLO se incluye si quien consulta es el
 * propio promotor o un comercio registrado con tienda activa en Venduo.
 */
export async function getPerfilPublico(
  slug: string
): Promise<{ perfil: PerfilPublico; puedeVerContacto: boolean } | null> {
  const supabase = await createClient()
  if (!supabase) {
    const demo = getDemoPerfilPublico(slug)
    if (!demo) return null
    // En modo demo, consideramos acceso habilitado para demostración
    return { perfil: demo, puedeVerContacto: true }
  }

  // Identificar quién consulta (si es dueño de tienda o el mismo promotor)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let esNegocio = false
  if (user) {
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .maybeSingle()
    esNegocio = !!store
  }

  const [sellerRow, statsResult, tiendasResult] = await Promise.all([
    supabase
      .from("seller_profiles")
      .select("user_id, display_name, slug, city, bio, phone, created_at")
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase.rpc("seller_public_stats", { p_slug: slug }),
    supabase.rpc("seller_public_stores", { p_slug: slug }),
  ])

  const seller = sellerRow.data
  const stats = statsResult.data?.[0]

  if (!seller && !stats) {
    const demo = getDemoPerfilPublico(slug)
    if (demo) return { perfil: demo, puedeVerContacto: true }
    return null
  }

  const esDuenio = !!user && user.id === seller?.user_id
  const puedeVerContacto = esDuenio || esNegocio

  // Indirectas (recompra por compradores que volvieron)
  let indirectas = 0
  if (seller?.user_id) {
    const { count } = await supabase
      .from("commissions")
      .select("id", { count: "exact", head: true })
      .eq("seller_user_id", seller.user_id)
      .eq("kind", "indirecta")
      .in("status", ["confirmada", "pagada"])
    indirectas = count ?? 0
  }

  const perfil: PerfilPublico = {
    userId: seller?.user_id,
    slug,
    displayName: seller?.display_name ?? stats?.display_name ?? "Promotor",
    city: seller?.city ?? stats?.city ?? null,
    bio: seller?.bio ?? stats?.bio ?? null,
    avatarUrl: stats?.avatar_url ?? null,
    phone: puedeVerContacto ? (seller?.phone ?? null) : null,
    ventas: Number(stats?.ventas ?? 0),
    volumenCents: Number(stats?.volumen_cents ?? 0),
    tiendas: Number(stats?.tiendas ?? 0),
    indirectas,
    desde: stats?.desde ?? seller?.created_at ?? null,
    historial: (tiendasResult.data ?? []).map((fila) => ({
      storeName: fila.store_name,
      ventas: Number(fila.ventas ?? 0),
      desde: fila.desde,
    })),
    competencias: [
      "Venta conversacional por WhatsApp",
      "Campañas orgánicas en redes sociales",
      "Fidelización y retención de clientes",
      "Gestión y difusión de catálogo digital",
    ],
  }

  return { perfil, puedeVerContacto }
}
