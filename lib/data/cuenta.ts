import { createClient } from "@/lib/supabase/server"

export interface Cuenta {
  userId: string
  email: string | null
  perfil: { fullName: string | null; avatarUrl: string | null }
  tienda: {
    id: string
    name: string
    slug: string
    tagline: string | null
    description: string | null
    logoUrl: string | null
    isPublished: boolean
    sellerNetworkEnabled: boolean
    commissionBps: number
    sellerJoinMode: string
  } | null
  vendedor: {
    slug: string
    displayName: string
    city: string | null
    bio: string | null
    phone: string | null
  } | null
}

/**
 * Todo lo editable de una cuenta, en una sola lectura.
 *
 * Trae las tres piezas aunque la persona use una sola: quien tiene tienda y
 * además vende para otras edita las dos identidades en la misma pantalla, y
 * decidir cuál mostrar es de la interfaz, no de la consulta.
 */
export async function getCuenta(): Promise<Cuenta | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [perfilResult, tiendaResult, vendedorResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("stores")
      .select(
        "id, name, slug, tagline, description, logo_url, is_published, seller_network_enabled, commission_bps, seller_join_mode"
      )
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("seller_profiles")
      .select("slug, display_name, city, bio, phone")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle(),
  ])

  return {
    userId: user.id,
    email: user.email ?? null,
    perfil: {
      fullName: perfilResult.data?.full_name ?? null,
      avatarUrl: perfilResult.data?.avatar_url ?? null,
    },
    tienda: tiendaResult.data
      ? {
          id: tiendaResult.data.id,
          name: tiendaResult.data.name,
          slug: tiendaResult.data.slug,
          tagline: tiendaResult.data.tagline,
          description: tiendaResult.data.description,
          logoUrl: tiendaResult.data.logo_url,
          isPublished: tiendaResult.data.is_published,
          sellerNetworkEnabled: tiendaResult.data.seller_network_enabled,
          commissionBps: tiendaResult.data.commission_bps,
          sellerJoinMode: tiendaResult.data.seller_join_mode,
        }
      : null,
    vendedor: vendedorResult.data
      ? {
          slug: vendedorResult.data.slug,
          displayName: vendedorResult.data.display_name,
          city: vendedorResult.data.city,
          bio: vendedorResult.data.bio,
          phone: vendedorResult.data.phone,
        }
      : null,
  }
}
