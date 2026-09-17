import { isSupabaseConfigured } from "@/lib/env"
import { aparienciaDeTienda } from "@/lib/plantillas"
import type { Apariencia } from "@/lib/plantillas/apariencia"
import { createClient } from "@/lib/supabase/server"
import { urlDeTienda } from "@/lib/tienda"

export interface Contadores {
  /** Pedidos esperando que alguien confirme el pago. */
  pedidosPendientes: number
  /** De esos, los que ya trajeron comprobante: plata que ya está. */
  pedidosConComprobante: number
  productosSinStock: number
  productosPocoStock: number
  /** Solicitudes de vendedores esperando aprobación. */
  vendedoresPendientes: number
  /** Comisiones confirmadas que la tienda todavía no le pagó al vendedor. */
  comisionesPorCobrarCents: number
}

export interface BarraLateral {
  persona: {
    nombre: string
    correo: string | null
    avatarUrl: string | null
  }
  /** Solo si el alta de la tienda terminó: sin plantilla no hay panel. */
  tienda: {
    nombre: string
    slug: string
    logoUrl: string | null
    publicada: boolean
    url: string
  } | null
  vendedor: {
    /** El historial público, si ya armó su perfil. */
    perfilSlug: string | null
    tiendas: number
    pendientes: number
  } | null
  contadores: Contadores
  /**
   * La identidad de la plantilla de su tienda, para teñir el panel. `null`
   * para quien solo vende: su panel cruza tiendas y lleva el mundo de Venduo.
   */
  apariencia: Apariencia | null
  esDemo: boolean
}

const SIN_CONTADORES: Contadores = {
  pedidosPendientes: 0,
  pedidosConComprobante: 0,
  productosSinStock: 0,
  productosPocoStock: 0,
  vendedoresPendientes: 0,
  comisionesPorCobrarCents: 0,
}

function barraDeDemostracion(): BarraLateral {
  return {
    persona: { nombre: "Rosa Chávez", correo: null, avatarUrl: null },
    tienda: {
      nombre: "Rosa Deportes",
      slug: "rosa-deportes",
      logoUrl: null,
      publicada: true,
      url: urlDeTienda("rosa-deportes"),
    },
    vendedor: null,
    contadores: {
      ...SIN_CONTADORES,
      pedidosPendientes: 2,
      pedidosConComprobante: 1,
      productosPocoStock: 1,
    },
    apariencia: aparienciaDeTienda("fashion", {}),
    esDemo: true,
  }
}

/**
 * Todo lo que necesita la barra lateral, en un solo viaje.
 *
 * La barra se dibuja en todas las pantallas privadas, así que lo que cueste se
 * paga en cada navegación. Por eso los contadores son `count` sin traer filas,
 * salvo el stock: comparar `stock` contra `low_stock_threshold` es comparar dos
 * columnas, cosa que el filtro de PostgREST no sabe hacer, y un catálogo de
 * MVP son decenas de filas.
 *
 * Lo que muestra lo deciden los datos y no `primary_role`: quien tiene tienda y
 * además vende para otras ve las dos secciones.
 */
export async function getBarraLateral(): Promise<BarraLateral> {
  if (!isSupabaseConfigured) return barraDeDemostracion()

  const supabase = await createClient()
  if (!supabase) return barraDeDemostracion()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return barraDeDemostracion()

  const [perfilRes, tiendaRes, vinculosRes, perfilVendedorRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("stores")
        .select(
          "id, name, slug, logo_url, is_published, template_key, theme_overrides"
        )
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("store_sellers")
        .select("status")
        .eq("user_id", user.id)
        .is("deleted_at", null),
      supabase
        .from("seller_profiles")
        .select("slug")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .maybeSingle(),
    ])

  const tiendaFila = tiendaRes.data?.template_key ? tiendaRes.data : null
  const vinculos = vinculosRes.data ?? []

  const contadores: Contadores = { ...SIN_CONTADORES }

  if (tiendaFila) {
    const [pendientes, conComprobante, productos, solicitudes] =
      await Promise.all([
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("store_id", tiendaFila.id)
          .eq("status", "pendiente"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("store_id", tiendaFila.id)
          .eq("status", "pendiente")
          .not("payment_proof_url", "is", null),
        supabase
          .from("products")
          .select("stock, low_stock_threshold")
          .eq("store_id", tiendaFila.id)
          .eq("is_active", true)
          .is("deleted_at", null),
        supabase
          .from("store_sellers")
          .select("id", { count: "exact", head: true })
          .eq("store_id", tiendaFila.id)
          .eq("status", "pendiente")
          .is("deleted_at", null),
      ])

    const catalogo = productos.data ?? []
    contadores.pedidosPendientes = pendientes.count ?? 0
    contadores.pedidosConComprobante = conComprobante.count ?? 0
    contadores.productosSinStock = catalogo.filter((p) => p.stock === 0).length
    contadores.productosPocoStock = catalogo.filter(
      (p) => p.stock > 0 && p.stock <= p.low_stock_threshold
    ).length
    contadores.vendedoresPendientes = solicitudes.count ?? 0
  }

  if (vinculos.length > 0) {
    const { data: comisiones } = await supabase
      .from("commissions")
      .select("amount_cents")
      .eq("seller_user_id", user.id)
      .eq("status", "confirmada")

    contadores.comisionesPorCobrarCents = (comisiones ?? []).reduce(
      (total, c) => total + c.amount_cents,
      0
    )
  }

  const nombre =
    perfilRes.data?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Tu cuenta"

  return {
    persona: {
      nombre,
      correo: user.email ?? null,
      avatarUrl: perfilRes.data?.avatar_url ?? null,
    },
    tienda: tiendaFila
      ? {
          nombre: tiendaFila.name,
          slug: tiendaFila.slug,
          logoUrl: tiendaFila.logo_url,
          publicada: tiendaFila.is_published,
          url: urlDeTienda(tiendaFila.slug),
        }
      : null,
    vendedor:
      vinculos.length > 0
        ? {
            perfilSlug: perfilVendedorRes.data?.slug ?? null,
            tiendas: vinculos.filter((v) => v.status === "activo").length,
            pendientes: vinculos.filter((v) => v.status === "pendiente").length,
          }
        : null,
    contadores,
    apariencia: tiendaFila
      ? aparienciaDeTienda(tiendaFila.template_key, tiendaFila.theme_overrides)
      : null,
    esDemo: false,
  }
}
