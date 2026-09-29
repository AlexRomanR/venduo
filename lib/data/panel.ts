import { createClient } from "@/lib/supabase/server"
import type { ResumenPanel, Suscripcion } from "@/lib/demo-data"
import type { SubscriptionStatus } from "@/types"

export type { ResumenPanel, Suscripcion } from "@/lib/demo-data"

const DIAS = 30

/** Faltando esto o menos para que venza la prueba, el panel lo avisa. */
export const DIAS_DE_AVISO = 7

/**
 * El perfil del usuario.
 *
 * `primary_role` es una intención, no un permiso: sirve para elegir a qué
 * pantalla llevar a alguien, nunca para decidir si puede algo. Eso lo decide
 * RLS sobre los datos.
 */
export async function getPerfil() {
  const supabase = await createClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, primary_role")
    .eq("id", user.id)
    .maybeSingle()

  return data
}

/**
 * A dónde corresponde entrar, resuelto de una sola vez.
 *
 * Existe para que no haya un salto visible: antes el ingreso mandaba a
 * `/panel`, esa pantalla miraba los datos y recién ahí redirigía, así que se
 * veía el panel un segundo antes de rebotar. Acá se decide en el servidor y
 * el navegador navega una vez sola.
 */
export async function resolverDestino(): Promise<string> {
  const [tienda, vinculos, perfil] = await Promise.all([
    getMiTienda(),
    getVinculosDeVendedor(),
    getPerfil(),
  ])

  // Ser dueño gana: es el vínculo más fuerte con la plataforma.
  if (tienda?.template_key) return "/panel"
  if (tienda) return "/crear"
  if (vinculos.length > 0) return "/vendedor"
  if (perfil?.primary_role === "vendedor") return "/sumarme"

  return "/crear"
}

/**
 * La tienda del usuario, o `null` si todavía no creó ninguna.
 *
 * Es lo que decide a qué pantalla entra un emprendedor: sin tienda, o con una
 * tienda sin plantilla, va al alta; con plantilla elegida, va al panel.
 */
export async function getMiTienda() {
  const supabase = await createClient()
  if (!supabase) return null

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Una tienda por usuario: el índice único sobre owner_id lo garantiza.
  const { data } = await supabase
    .from("stores")
    .select(
      "id, name, slug, is_published, template_key, commission_bps, seller_network_enabled"
    )
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  return data
}

/**
 * Todo lo que el panel muestra de un vistazo.
 *
 * Una sola función y no cinco porque la pantalla las necesita todas juntas:
 * repartirlas obligaría a esperar cinco viajes en serie.
 */
export async function getResumenPanel(): Promise<ResumenPanel | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const tienda = await getMiTienda()
  if (!tienda) return null

  const desde = new Date()
  desde.setDate(desde.getDate() - (DIAS - 1))
  desde.setHours(0, 0, 0, 0)

  const [pedidos, pendientes, vendedores, productos, suscripcion] =
    await Promise.all([
      supabase
        .from("orders")
        .select("total_cents, status")
        .eq("store_id", tienda.id)
        .gte("created_at", desde.toISOString()),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", tienda.id)
        .in("status", ["pendiente", "pagado"]),
      supabase
        .from("store_sellers")
        .select("status")
        .eq("store_id", tienda.id)
        .is("deleted_at", null),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", tienda.id)
        .is("deleted_at", null),
      supabase
        .from("subscriptions")
        .select("status, trial_ends_at")
        .eq("store_id", tienda.id)
        .maybeSingle(),
    ])

  // Un pedido cancelado no es una venta: no suma al período ni al conteo.
  const vivos = (pedidos.data ?? []).filter((p) => p.status !== "cancelado")
  const vinculos = vendedores.data ?? []

  return {
    tienda: {
      id: tienda.id,
      name: tienda.name,
      slug: tienda.slug,
      isPublished: tienda.is_published,
      templateKey: tienda.template_key,
    },
    ventasCents: vivos.reduce((acc, p) => acc + p.total_cents, 0),
    pedidos: vivos.length,
    pedidosPendientes: pendientes.count ?? 0,
    vendedoresActivos: vinculos.filter((v) => v.status === "activo").length,
    vendedoresPendientes: vinculos.filter((v) => v.status === "pendiente")
      .length,
    productos: productos.count ?? 0,
    suscripcion: resolverSuscripcion(suscripcion.data),
    esDemo: false,
  }
}

function resolverSuscripcion(
  fila: { status: SubscriptionStatus; trial_ends_at: string | null } | null
): Suscripcion | null {
  if (!fila) return null

  const diasRestantes = fila.trial_ends_at
    ? Math.ceil(
        (new Date(fila.trial_ends_at).getTime() - Date.now()) / 86_400_000
      )
    : null

  return {
    status: fila.status,
    trialEndsAt: fila.trial_ends_at,
    diasRestantes,
    // Solo la prueba vence: una suscripción activa no tiene cuenta regresiva.
    porVencer:
      fila.status === "prueba" &&
      diasRestantes !== null &&
      diasRestantes <= DIAS_DE_AVISO,
  }
}

/**
 * El código de invitación de mi tienda.
 *
 * Pasa por la función y no por un `select`: `store_invites` tiene RLS activo y
 * cero políticas, así que ni el dueño la lee directamente. Si fuera una
 * columna de `stores`, la política de lectura pública la expondría a
 * cualquiera que consulte una tienda publicada.
 */
export async function getMiInvitacion(): Promise<string | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const { data } = await supabase.rpc("my_seller_invite")
  return data ?? null
}

export interface VendedorDeMiTienda {
  id: string
  nombre: string
  status: string
  referralCode: string
  joinedAt: string
}

/** Los vendedores vinculados a mi tienda, para aprobarlos y seguirlos. */
export async function getVendedoresDeMiTienda(): Promise<VendedorDeMiTienda[]> {
  const supabase = await createClient()
  if (!supabase) return []

  const tienda = await getMiTienda()
  if (!tienda) return []

  const { data } = await supabase
    .from("store_sellers")
    .select("id, user_id, status, referral_code, joined_at")
    .eq("store_id", tienda.id)
    .is("deleted_at", null)
    .order("joined_at", { ascending: false })

  if (!data || data.length === 0) return []

  // El nombre sale de `seller_profiles` y no de `profiles`: la política de
  // `profiles` solo deja leer el propio, mientras que el perfil de vendedor es
  // público a propósito —es su historial laboral verificable—. Son dos
  // consultas porque no hay relación declarada entre las tablas.
  const { data: perfiles } = await supabase
    .from("seller_profiles")
    .select("user_id, display_name")
    .in(
      "user_id",
      data.map((vinculo) => vinculo.user_id)
    )
    .is("deleted_at", null)

  const nombres = new Map(
    (perfiles ?? []).map((perfil) => [perfil.user_id, perfil.display_name])
  )

  return data.map((vinculo) => ({
    id: vinculo.id,
    nombre: nombres.get(vinculo.user_id) ?? "Vendedor",
    status: vinculo.status,
    referralCode: vinculo.referral_code,
    joinedAt: vinculo.joined_at,
  }))
}

export interface VinculoVendedor {
  id: string
  storeId: string
  storeName: string
  storeSlug: string
  status: string
  referralCode: string
}

/**
 * Las tiendas donde la persona trabaja como vendedora.
 *
 * Acá es donde el modelo cruza tenants: un vendedor pertenece a varias
 * tiendas, así que esto no es una comparación contra `my_store_id()`.
 * Devuelve también los vínculos pendientes de aprobación, porque quien está
 * esperando necesita ver que su solicitud existe.
 */
export async function getVinculosDeVendedor(): Promise<VinculoVendedor[]> {
  const supabase = await createClient()
  if (!supabase) return []

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("store_sellers")
    .select("id, store_id, status, referral_code, stores(name, slug)")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("joined_at", { ascending: false })

  return (data ?? []).map((vinculo) => ({
    id: vinculo.id,
    storeId: vinculo.store_id,
    storeName: vinculo.stores?.name ?? "Tienda",
    storeSlug: vinculo.stores?.slug ?? "",
    status: vinculo.status,
    referralCode: vinculo.referral_code,
  }))
}
