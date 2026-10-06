import { createClient, getUsuario } from "@/lib/supabase/server"

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
    whatsapp: string | null
  } | null
}

/** Todo lo editable de una cuenta: la persona y su tienda, a la vez. */
export async function getCuenta(): Promise<Cuenta | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const user = await getUsuario()
  if (!user) return null

  const [perfilResult, tiendaResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("stores")
      .select(
        "id, name, slug, tagline, description, logo_url, is_published, whatsapp"
      )
      .eq("owner_id", user.id)
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
          whatsapp: tiendaResult.data.whatsapp,
        }
      : null,
  }
}
