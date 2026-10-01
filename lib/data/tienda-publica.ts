import { cache } from "react"

import {
  aparienciaDeTienda,
  plantillaDeTienda,
  type ClavePlantilla,
} from "@/lib/plantillas"
import type { Apariencia } from "@/lib/plantillas/apariencia"
import { createClient } from "@/lib/supabase/server"
import type { Json, Product } from "@/types"

export interface BloquePublico {
  id: string
  tipo: string
  props: Record<string, Json | undefined>
}

export interface CategoriaPublica {
  id: string
  nombre: string
  productos: number
}

export interface TiendaPublica {
  id: string
  slug: string
  nombre: string
  descripcion: string | null
  logoUrl: string | null
  whatsapp: string | null
  aceptaVendedores: boolean
  comisionBps: number
  /** Con qué kit se dibuja. Una clave retirada ya llega resuelta a la base. */
  plantilla: ClavePlantilla
  /** La base de la plantilla con la personalización de la tienda encima. */
  apariencia: Apariencia
  bloques: BloquePublico[]
  productos: Product[]
  categorias: CategoriaPublica[]
  esDemo: boolean
  /**
   * Se está dibujando dentro del editor. Cada sección de la portada lleva
   * entonces una marca con su id, para que tocarla la seleccione.
   */
  enEdicion?: boolean
  /**
   * Los productos son los de ejemplo del editor: la tienda todavía no cargó
   * los suyos. Llenan las vitrinas de la vista previa, nunca la tienda real.
   */
  productosDeEjemplo?: boolean
}

/**
 * Lo que necesitan la cabecera y el pie de la tienda.
 *
 * Existe para no pasarle la tienda entera a un componente de cliente: con ella
 * viajaría el catálogo completo dentro de la página, solo para dibujar un
 * nombre y un menú.
 */
export interface MarcoDeTienda {
  slug: string
  nombre: string
  logoUrl: string | null
  whatsapp: string | null
  categorias: CategoriaPublica[]
}

export function marcoDeTienda(tienda: TiendaPublica): MarcoDeTienda {
  return {
    slug: tienda.slug,
    nombre: tienda.nombre,
    logoUrl: tienda.logoUrl,
    whatsapp: tienda.whatsapp,
    categorias: tienda.categorias.filter((c) => c.productos > 0),
  }
}

/** El vendedor al que se le acredita la venta, si el enlace traía código. */
export interface Referido {
  codigo: string
  nombre: string | null
}

function bloquesDeDemostracion(): BloquePublico[] {
  return [
    {
      id: "demo-hero",
      tipo: "hero",
      props: {
        title: "Rosa Deportes",
        subtitle:
          "Ropa deportiva en Santa Cruz: buzos, poleras, mochilas y gorras.",
        ctaText: "Ver el catálogo",
      },
    },
    {
      id: "demo-grid",
      tipo: "product_grid",
      props: { title: "Nuestros productos", columns: 3, limit: 12 },
    },
    {
      id: "demo-about",
      tipo: "about",
      props: {
        title: "Sobre nosotros",
        body: "Vendemos ropa para entrenar y para el día a día. Coordinamos la entrega por WhatsApp.",
      },
    },
  ]
}

/**
 * La tienda que ve cualquiera, por su slug.
 *
 * Devuelve `null` solo cuando la tienda no existe o no se sirve al público;
 * esa diferencia no se le cuenta a quien pide, que recibe un 404 en los dos
 * casos. `store_is_live()` ya combina publicación y suscripción vigente, así
 * que una tienda con la prueba vencida deja de verse sin código extra.
 */
export const getTiendaPublica = cache(async function getTiendaPublica(
  slug: string
): Promise<TiendaPublica | null> {
  // `cache`: el layout la pide para teñir la tienda, la página para dibujarla
  // y los metadatos para la tarjeta de WhatsApp. Es una sola lectura por visita.
  const supabase = await createClient()

  if (!supabase) {
    // Modo demo: una sola tienda de ejemplo, para que el repositorio recién
    // clonado tenga una tienda que mirar.
    if (slug !== "rosa-deportes") return null
    return {
      id: "demo",
      slug,
      nombre: "Rosa Deportes",
      descripcion: "Ropa deportiva en Santa Cruz.",
      logoUrl: null,
      whatsapp: null,
      aceptaVendedores: true,
      comisionBps: 1200,
      plantilla: "fashion",
      apariencia: aparienciaDeTienda("fashion", {}),
      bloques: bloquesDeDemostracion(),
      productos: [],
      categorias: [],
      esDemo: true,
    }
  }

  const { data: tienda } = await supabase
    .from("stores")
    .select(COLUMNAS_DE_TIENDA)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle()

  if (!tienda) return null

  // La política de lectura ya exige `store_is_live`, así que llegar acá con la
  // fila significa que se sirve. Se comprueba igual porque el dueño sí puede
  // leer la suya aunque esté despublicada, y no tiene que verla como pública.
  if (!tienda.is_published) return null

  return completarTienda(supabase, tienda)
})

type Cliente = NonNullable<Awaited<ReturnType<typeof createClient>>>

/** Lo que se lee de `stores` para armar una tienda. */
export const COLUMNAS_DE_TIENDA =
  "id, slug, name, description, logo_url, whatsapp, seller_network_enabled, commission_bps, is_published, template_key, theme_overrides"

type FilaDeTienda = {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  whatsapp: string | null
  seller_network_enabled: boolean
  commission_bps: number
  template_key: string | null
  theme_overrides: Json
}

/**
 * Una tienda con su portada, su catálogo y sus categorías.
 *
 * Aparte de `getTiendaPublica` porque la vista previa del editor arma la misma
 * tienda para su dueño, publicada o no: lo que ve tiene que ser exactamente lo
 * que va a ver su comprador.
 */
export async function completarTienda(
  supabase: Cliente,
  tienda: FilaDeTienda
): Promise<TiendaPublica> {
  // Las secciones viajan dentro de su página: pedirlas aparte obligaba a
  // esperar la página para recién preguntar por ellas, un viaje más en cada
  // visita a la tienda.
  const [{ data: pagina }, { data: productos }, { data: categorias }] =
    await Promise.all([
      supabase
        .from("store_pages")
        .select("id, store_blocks(id, block_type_key, props)")
        .eq("store_id", tienda.id)
        .eq("is_home", true)
        .is("deleted_at", null)
        .eq("store_blocks.is_visible", true)
        .is("store_blocks.deleted_at", null)
        .order("position", { referencedTable: "store_blocks" })
        .maybeSingle(),
      supabase
        .from("products")
        .select("*")
        .eq("store_id", tienda.id)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("product_categories")
        .select("id, name")
        .eq("store_id", tienda.id)
        .is("deleted_at", null)
        .order("position")
        .order("name"),
    ])

  const bloques: BloquePublico[] = (pagina?.store_blocks ?? []).map(
    (bloque) => ({
      id: bloque.id,
      tipo: bloque.block_type_key,
      props: (bloque.props ?? {}) as Record<string, Json | undefined>,
    })
  )

  const catalogo = productos ?? []

  return {
    id: tienda.id,
    slug: tienda.slug,
    nombre: tienda.name,
    descripcion: tienda.description,
    logoUrl: tienda.logo_url,
    whatsapp: tienda.whatsapp,
    aceptaVendedores: tienda.seller_network_enabled,
    comisionBps: tienda.commission_bps,
    plantilla: plantillaDeTienda(tienda.template_key),
    apariencia: aparienciaDeTienda(tienda.template_key, tienda.theme_overrides),
    bloques,
    productos: catalogo,
    categorias: (categorias ?? []).map((categoria) => ({
      id: categoria.id,
      nombre: categoria.name,
      productos: catalogo.filter((p) => p.category_id === categoria.id).length,
    })),
    esDemo: false,
  }
}

/** Un producto de la tienda pública. Devuelve `null` si no se sirve. */
export async function getProductoPublico(
  slug: string,
  productoId: string
): Promise<{ tienda: TiendaPublica; producto: Product } | null> {
  const tienda = await getTiendaPublica(slug)
  if (!tienda) return null

  const producto = tienda.productos.find((p) => p.id === productoId)
  return producto ? { tienda, producto } : null
}

/**
 * Quién trae la visita, si el enlace traía un código.
 *
 * Pasa por `referido_publico` y no por un `select` a `store_sellers`: esa tabla
 * solo se lee `to authenticated`, y quien compra es anónimo. Con el select
 * directo el cartel solo lo veía el dueño mientras probaba.
 *
 * Esto es **solo para mostrarlo**. La validación que decide si alguien cobra la
 * hace `create_order`, que vuelve a resolver el código contra la tienda antes
 * de congelar la comisión.
 */
export async function getReferido(
  tiendaId: string,
  codigo: string | null
): Promise<Referido | null> {
  if (!codigo) return null

  const supabase = await createClient()
  if (!supabase) return null

  const { data } = await supabase.rpc("referido_publico", {
    p_store_id: tiendaId,
    p_codigo: codigo,
  })

  const fila = data?.[0]
  return fila ? { codigo: fila.codigo, nombre: fila.nombre } : null
}

/**
 * El código tal como se propaga por la tienda.
 *
 * Se limpia pero **no se valida**: validar exige leer `store_sellers`, que un
 * comprador anónimo no puede. Si solo se propagara el código ya resuelto, para
 * un comprador real se perdería al pasar de la tienda al producto, y con él la
 * comisión de quien trajo la venta. El árbitro es `create_order`: un código que
 * no exista se ignora ahí y la venta queda sin vendedor, que es lo correcto.
 */
export function codigoDeReferido(valor: unknown): string | null {
  if (typeof valor !== "string") return null

  const limpio = valor.trim().toUpperCase()
  return /^[A-Z0-9]{4,20}$/.test(limpio) ? limpio : null
}

/**
 * El pedido, para quien acaba de hacerlo.
 *
 * Pasa por `pedido_publico`, que es `security definer`: `orders` se lee solo
 * `to authenticated` y quien compró no tiene cuenta. Esa función devuelve lo
 * que el comprador ya sabe más los datos de pago de la tienda, y nunca la
 * comisión ni el vendedor: eso es del comercio.
 */
export async function getPedidoPublico(
  pedidoId: string
): Promise<PedidoPublicoConTienda | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const { data } = await supabase.rpc("pedido_publico", {
    p_order_id: pedidoId,
  })

  if (!data || typeof data !== "object") return null

  const crudo = data as Record<string, Json>
  const tienda = (crudo.tienda ?? {}) as Record<string, Json>
  const items = Array.isArray(crudo.items) ? crudo.items : []

  return {
    id: String(crudo.id),
    numero: Number(crudo.numero),
    estado: String(crudo.estado),
    totalCents: Number(crudo.total_cents),
    comprador: String(crudo.comprador),
    tieneComprobante: Boolean(crudo.tiene_comprobante),
    items: items.map((item) => {
      const fila = item as Record<string, Json>
      return {
        nombre: String(fila.nombre),
        cantidad: Number(fila.cantidad),
        precioCents: Number(fila.precio_cents),
        totalCents: Number(fila.total_cents),
      }
    }),
    tienda: {
      nombre: String(tienda.nombre),
      slug: String(tienda.slug),
      logoUrl: tienda.logo_url ? String(tienda.logo_url) : null,
      whatsapp: tienda.whatsapp ? String(tienda.whatsapp) : null,
      qrUrl: tienda.qr_url ? String(tienda.qr_url) : null,
      instrucciones: tienda.instrucciones ? String(tienda.instrucciones) : null,
    },
  }
}

export interface PedidoPublicoConTienda {
  id: string
  numero: number
  estado: string
  totalCents: number
  comprador: string
  tieneComprobante: boolean
  items: Array<{
    nombre: string
    cantidad: number
    precioCents: number
    totalCents: number
  }>
  tienda: {
    nombre: string
    slug: string
    logoUrl: string | null
    whatsapp: string | null
    qrUrl: string | null
    instrucciones: string | null
  }
}
