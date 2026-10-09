import { cache } from "react"

import { esAdmin } from "@/lib/admin"
import { createClient, getUsuario } from "@/lib/supabase/server"
import type { ResumenPanel, Suscripcion } from "@/lib/demo-data"
import type { SubscriptionStatus } from "@/types"

export type { ResumenPanel, Suscripcion } from "@/lib/demo-data"

const DIAS = 30

/** Faltando esto o menos para que venza la prueba, el panel lo avisa. */
export const DIAS_DE_AVISO = 7

/**
 * A dónde corresponde entrar, resuelto de una sola vez.
 *
 * Existe para que no haya un salto visible: antes el ingreso mandaba a
 * `/panel`, esa pantalla miraba los datos y recién ahí redirigía, así que se
 * veía el panel un segundo antes de rebotar. Acá se decide en el servidor y
 * el navegador navega una vez sola.
 *
 * La plantilla y no la fila es lo que marca que el alta terminó: sin tienda,
 * o con una a medio crear, se sigue en `/crear`.
 */
export async function resolverDestino(): Promise<string> {
  // El administrador de Venduo no tiene tienda: entra a su panel.
  const [tienda, admin] = await Promise.all([getMiTienda(), esAdmin()])
  if (admin) return "/admin"
  return tienda?.template_key ? "/panel" : "/crear"
}

/**
 * La tienda del usuario, o `null` si todavía no creó ninguna.
 *
 * Es lo que decide a qué pantalla entra un emprendedor: sin tienda, o con una
 * tienda sin plantilla, va al alta; con plantilla elegida, va al panel.
 *
 * Con memoria por pedido: el Resumen la pide desde la página, el tablero y la
 * barra, y sin esto eran tres viajes iguales a la base.
 */
export const getMiTienda = cache(async function getMiTienda() {
  const supabase = await createClient()
  if (!supabase) return null

  const user = await getUsuario()
  if (!user) return null

  // Una tienda por usuario: el índice único sobre owner_id lo garantiza.
  const { data } = await supabase
    .from("stores")
    .select(
      "id, name, slug, is_published, template_key, logo_url, theme_overrides, whatsapp, suspended_at"
    )
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  return data
})

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

  const [pedidos, pendientes, productos, suscripcion] = await Promise.all([
    supabase
      .from("orders")
      .select("total_cents, status")
      .eq("store_id", tienda.id)
      .gte("created_at", desde.toISOString()),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", tienda.id)
      .eq("status", "pendiente"),
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

  // Una venta es un pedido pagado. Un pendiente puede ser un carrito que se
  // mandó por WhatsApp y nunca se concretó: contarlo inflaría las ventas.
  const vivos = (pedidos.data ?? []).filter((p) => p.status === "pagado")

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
