import { createClient } from "@/lib/supabase/server"
import type { Json, Product, ProductCondition } from "@/types"

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
  aceptaVendedores: boolean
  comisionBps: number
  bloques: BloquePublico[]
  productos: Product[]
  categorias: CategoriaPublica[]
  esDemo: boolean
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
export async function getTiendaPublica(
  slug: string
): Promise<TiendaPublica | null> {
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
      aceptaVendedores: true,
      comisionBps: 1200,
      bloques: bloquesDeDemostracion(),
      productos: [],
      categorias: [],
      esDemo: true,
    }
  }

  const { data: tienda } = await supabase
    .from("stores")
    .select(
      "id, slug, name, description, logo_url, seller_network_enabled, commission_bps, is_published"
    )
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle()

  if (!tienda) return null

  // La política de lectura ya exige `store_is_live`, así que llegar acá con la
  // fila significa que se sirve. Se comprueba igual porque el dueño sí puede
  // leer la suya aunque esté despublicada, y no tiene que verla como pública.
  if (!tienda.is_published) return null

  const [{ data: pagina }, { data: productos }, { data: categorias }] =
    await Promise.all([
      supabase
        .from("store_pages")
        .select("id")
        .eq("store_id", tienda.id)
        .eq("is_home", true)
        .is("deleted_at", null)
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

  let bloques: BloquePublico[] = []
  if (pagina) {
    const { data } = await supabase
      .from("store_blocks")
      .select("id, block_type_key, props")
      .eq("page_id", pagina.id)
      .eq("is_visible", true)
      .is("deleted_at", null)
      .order("position")

    bloques = (data ?? []).map((bloque) => ({
      id: bloque.id,
      tipo: bloque.block_type_key,
      props: (bloque.props ?? {}) as Record<string, Json | undefined>,
    }))
  }

  const catalogo = productos ?? []

  return {
    id: tienda.id,
    slug: tienda.slug,
    nombre: tienda.name,
    descripcion: tienda.description,
    logoUrl: tienda.logo_url,
    aceptaVendedores: tienda.seller_network_enabled,
    comisionBps: tienda.commission_bps,
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

/** Los filtros de la vitrina pública. */
export function filtrarCatalogo(
  productos: Product[],
  filtros: { categoria?: string; condicion?: string; buscar?: string }
): Product[] {
  let salida = productos

  if (filtros.categoria) {
    salida = salida.filter((p) => p.category_id === filtros.categoria)
  }

  if (filtros.condicion) {
    salida = salida.filter(
      (p) => p.condition === (filtros.condicion as ProductCondition)
    )
  }

  const buscar = filtros.buscar?.trim().toLowerCase()
  if (buscar) {
    salida = salida.filter(
      (p) =>
        p.name.toLowerCase().includes(buscar) ||
        p.description?.toLowerCase().includes(buscar)
    )
  }

  return salida
}
