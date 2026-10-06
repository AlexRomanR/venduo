import { cache } from "react"

import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { limiteSinRespuesta } from "@/lib/pedidos"
import { aparienciaDeTienda } from "@/lib/plantillas"
import type { Apariencia } from "@/lib/plantillas/apariencia"
import { createClient, getUsuario } from "@/lib/supabase/server"
import { urlDeTienda } from "@/lib/tienda"

export interface Contadores {
  /** Pedidos esperando que la tienda confirme el pago. */
  pedidosPendientes: number
  productosSinStock: number
  productosPocoStock: number
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
  contadores: Contadores
  /**
   * La identidad de la plantilla de su tienda, para su tarjeta y su sello. El
   * panel ya no se tiñe con ella: es una herramienta de Venduo y se ve igual
   * para todos. `null` mientras no termine el alta.
   */
  apariencia: Apariencia | null
  esDemo: boolean
}

const SIN_CONTADORES: Contadores = {
  pedidosPendientes: 0,
  productosSinStock: 0,
  productosPocoStock: 0,
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
    contadores: {
      pedidosPendientes: 2,
      productosSinStock: 1,
      productosPocoStock: 2,
    },
    apariencia: aparienciaDeTienda("fashion", {}),
    esDemo: true,
  }
}

/**
 * Todo lo que necesita la barra lateral, en dos tandas: lo de la persona, y
 * después los contadores de su tienda, que necesitan saber cuál es.
 *
 * La barra se dibuja en todas las pantallas privadas, así que lo que cueste se
 * paga en cada carga. Por eso los contadores son `count` sin traer filas,
 * salvo el stock: comparar `stock` contra `low_stock_threshold` es comparar dos
 * columnas, cosa que el filtro de PostgREST no sabe hacer, y un catálogo de
 * MVP son decenas de filas.
 *
 * Con memoria por pedido: la pide el layout y la vuelve a pedir el Resumen,
 * que usa sus mismos contadores para que la barra y la pantalla no se
 * contradigan.
 */
export const getBarraLateral = cache(
  async function getBarraLateral(): Promise<BarraLateral> {
    if (!isSupabaseConfigured) return barraDeDemostracion()

    const [supabase, user] = await Promise.all([createClient(), getUsuario()])
    if (!supabase) return barraDeDemostracion()
    if (!user) return barraDeDemostracion()

    // La tienda es la misma lectura que hace la página: con memoria por
    // pedido, no es un viaje más.
    const [perfilRes, tienda] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
      getMiTienda(),
    ])

    const tiendaFila = tienda?.template_key ? tienda : null

    const contadores: Contadores = { ...SIN_CONTADORES }

    if (tiendaFila) {
      const [pendientes, productos] = await Promise.all([
        // Solo los pendientes dentro del plazo: uno que no respondió en una
        // semana ya no espera nada de la tienda (`quedoSinRespuesta`).
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("store_id", tiendaFila.id)
          .eq("status", "pendiente")
          .gte("created_at", limiteSinRespuesta()),
        supabase
          .from("products")
          .select("stock, low_stock_threshold")
          .eq("store_id", tiendaFila.id)
          .eq("is_active", true)
          .is("deleted_at", null),
      ])

      const catalogo = productos.data ?? []
      contadores.pedidosPendientes = pendientes.count ?? 0
      contadores.productosSinStock = catalogo.filter(
        (p) => p.stock === 0
      ).length
      contadores.productosPocoStock = catalogo.filter(
        (p) => p.stock > 0 && p.stock <= p.low_stock_threshold
      ).length
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
      contadores,
      apariencia: tiendaFila
        ? aparienciaDeTienda(
            tiendaFila.template_key,
            tiendaFila.theme_overrides
          )
        : null,
      esDemo: false,
    }
  }
)

/**
 * Si la persona ya tiene un panel al que volver: una tienda con su alta
 * terminada. Es lo que decide si una pantalla de la cuenta lleva la barra.
 */
export function tienePanel(barra: BarraLateral): boolean {
  return Boolean(barra.tienda)
}
