import { createClient, getUsuario } from "@/lib/supabase/server"
import {
  COMISIONES_DEMO,
  RESUMEN_VENDEDOR_DEMO,
  type ComisionItem,
  type PerfilPublico,
  type ResumenVendedor,
} from "@/lib/demo-data"
import type { CommissionStatus } from "@/types"

export type {
  ComisionItem,
  PerfilPublico,
  ResumenVendedor,
} from "@/lib/demo-data"

/** Solo lo confirmado cuenta como antecedente: lo pendiente todavía se anula. */
const CUENTAN: CommissionStatus[] = ["confirmada", "pagada"]

/**
 * Todo lo que el panel del vendedor resume de un vistazo.
 *
 * Las comisiones son la fuente y no los pedidos: una comisión nace cuando el
 * pedido se cobra, guarda el nombre de la tienda copiado y sobrevive a que esa
 * tienda se purgue. Contar desde `orders` daría un historial que se borra el
 * día que un emprendedor abandona la plataforma.
 */
export async function getResumenVendedor(): Promise<ResumenVendedor | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const user = await getUsuario()
  if (!user) return null

  const [comisionesResult, vinculosResult, perfilResult] = await Promise.all([
    supabase
      .from("commissions")
      .select("amount_cents, base_amount_cents, status, created_at, store_name")
      .eq("seller_user_id", user.id),
    supabase
      .from("store_sellers")
      .select("status")
      .eq("user_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("seller_profiles")
      .select("slug, display_name, city, bio")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle(),
  ])

  const comisiones = comisionesResult.data ?? []
  const vinculos = vinculosResult.data ?? []
  const cuentan = comisiones.filter((c) => CUENTAN.includes(c.status))

  const porEstado = {
    pendiente: 0,
    confirmada: 0,
    pagada: 0,
    anulada: 0,
  }
  for (const comision of comisiones) {
    porEstado[comision.status] += comision.amount_cents
  }

  const fechas = cuentan
    .map((c) => c.created_at)
    .sort((a, b) => a.localeCompare(b))

  return {
    volumenCents: cuentan.reduce((acc, c) => acc + c.base_amount_cents, 0),
    ventas: cuentan.length,
    porEstado,
    // Lo cobrable es lo confirmado más lo ya pagado; lo pendiente todavía no.
    ganadoCents: porEstado.confirmada + porEstado.pagada,
    tiendasActivas: vinculos.filter((v) => v.status === "activo").length,
    tiendasPendientes: vinculos.filter((v) => v.status === "pendiente").length,
    tiendasEnHistorial: new Set(cuentan.map((c) => c.store_name)).size,
    desde: fechas[0] ?? null,
    perfil: perfilResult.data
      ? {
          slug: perfilResult.data.slug,
          displayName: perfilResult.data.display_name,
          city: perfilResult.data.city,
          bio: perfilResult.data.bio,
        }
      : null,
    esDemo: false,
  }
}

/** Las comisiones del vendedor, de la más reciente a la más vieja. */
export async function getComisionesDeVendedor(
  limite = 12
): Promise<ComisionItem[]> {
  const supabase = await createClient()
  if (!supabase) return COMISIONES_DEMO.slice(0, limite)

  const user = await getUsuario()
  if (!user) return []

  const { data } = await supabase
    .from("commissions")
    .select(
      "id, store_name, amount_cents, base_amount_cents, rate_bps, status, created_at"
    )
    .eq("seller_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limite)

  return (data ?? []).map((comision) => ({
    id: comision.id,
    storeName: comision.store_name,
    amountCents: comision.amount_cents,
    baseCents: comision.base_amount_cents,
    rateBps: comision.rate_bps,
    status: comision.status,
    createdAt: comision.created_at,
  }))
}

/** Datos de ejemplo cuando no hay Supabase, para que el panel no salga vacío. */
export function getResumenVendedorDemo(): ResumenVendedor {
  return RESUMEN_VENDEDOR_DEMO
}

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
