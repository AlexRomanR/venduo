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
  const [tienda, promociona, perfil] = await Promise.all([
    getMiTienda(),
    tieneEnlaces(),
    getPerfil(),
  ])

  // Ser dueño gana: es el vínculo más fuerte con la plataforma.
  if (tienda?.template_key) return "/panel"
  if (tienda) return "/crear"
  // El promotor entra a su panel tenga o no productos: sin ellos, el panel es
  // la bienvenida que le explica cómo empezar.
  if (promociona || perfil?.primary_role === "vendedor") return "/vendedor"

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
      "id, name, slug, is_published, template_key, commission_bps, seller_network_enabled, onboarded_at"
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
        .from("seller_products")
        .select("user_id")
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
    // Nadie aprueba promotores: activo es quien tomó al menos un producto.
    vendedoresActivos: new Set((vendedores.data ?? []).map((v) => v.user_id))
      .size,
    vendedoresPendientes: 0,
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

export interface PromotorDeMiNegocio {
  userId: string
  nombre: string
  /** Su perfil público, si lo armó. */
  slug: string | null
  productos: string[]
  desde: string | null
  ventas: number
  indirectas: number
  comisionCents: number
}

/**
 * Quién promociona lo mío, qué productos y cuánto me vendió.
 *
 * Nadie se suma al negocio entero ni espera aprobación: un promotor aparece
 * acá cuando toma un producto, o cuando cobró una comisión de este negocio
 * aunque ya no lo tenga en su lista. El nombre sale de `seller_profiles`, que
 * es público a propósito; `profiles` solo deja leer el propio.
 */
export async function getPromotoresDeMiNegocio(): Promise<{
  promotores: PromotorDeMiNegocio[]
  productosPromocionados: number
}> {
  const vacio = { promotores: [], productosPromocionados: 0 }
  const supabase = await createClient()
  if (!supabase) return vacio

  const tienda = await getMiTienda()
  if (!tienda) return vacio

  const [tomados, comisiones] = await Promise.all([
    supabase
      .from("seller_products")
      .select("user_id, product_id, taken_at, products(name)")
      .eq("store_id", tienda.id)
      .is("deleted_at", null)
      .order("taken_at"),
    supabase
      .from("commissions")
      .select("seller_user_id, amount_cents, kind, status")
      .eq("store_id", tienda.id)
      .neq("status", "anulada"),
  ])

  const porPromotor = new Map<string, PromotorDeMiNegocio>()
  const fila = (userId: string) => {
    let actual = porPromotor.get(userId)
    if (!actual) {
      actual = {
        userId,
        nombre: "Promotor",
        slug: null,
        productos: [],
        desde: null,
        ventas: 0,
        indirectas: 0,
        comisionCents: 0,
      }
      porPromotor.set(userId, actual)
    }
    return actual
  }

  for (const t of tomados.data ?? []) {
    const actual = fila(t.user_id)
    if (t.products?.name) actual.productos.push(t.products.name)
    actual.desde ??= t.taken_at
  }

  for (const c of comisiones.data ?? []) {
    const actual = fila(c.seller_user_id)
    if (c.kind === "directa") actual.ventas += 1
    else actual.indirectas += 1
    actual.comisionCents += c.amount_cents
  }

  if (porPromotor.size > 0) {
    const { data: perfiles } = await supabase
      .from("seller_profiles")
      .select("user_id, display_name, slug")
      .in("user_id", [...porPromotor.keys()])
      .is("deleted_at", null)

    for (const perfil of perfiles ?? []) {
      const actual = porPromotor.get(perfil.user_id)
      if (!actual) continue
      actual.nombre = perfil.display_name
      actual.slug = perfil.slug
    }
  }

  return {
    promotores: [...porPromotor.values()].sort(
      (a, b) =>
        b.comisionCents - a.comisionCents ||
        b.productos.length - a.productos.length
    ),
    productosPromocionados: new Set(
      (tomados.data ?? []).map((t) => t.product_id)
    ).size,
  }
}

/** Si la persona promociona algún producto. Decide a dónde entra. */
export async function tieneEnlaces(): Promise<boolean> {
  const supabase = await createClient()
  if (!supabase) return false

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  const { count } = await supabase
    .from("seller_products")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("deleted_at", null)

  return (count ?? 0) > 0
}
