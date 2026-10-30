import { cache } from "react"

import {
  aparienciaDeTienda,
  plantillaDeTienda,
  type ClavePlantilla,
} from "@/lib/plantillas"
import type { Apariencia } from "@/lib/plantillas/apariencia"
import { createClient } from "@/lib/supabase/server"
import type { Json, Product } from "@/types"
import { deVacaciones } from "@/lib/vacaciones"
import { leerValores, type VariantePublica } from "@/lib/variantes"

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

/**
 * Un producto de la tienda pública, con sus variantes si las tiene. Los kits
 * lo reciben como `Product`: las variantes viajan con él y las leen las piezas
 * compartidas —el precio "Desde", el selector, la barra de compra—, nunca el
 * kit.
 */
export type ProductoPublico = Product & { variantes?: VariantePublica[] }

export interface TiendaPublica {
  id: string
  slug: string
  nombre: string
  descripcion: string | null
  logoUrl: string | null
  /** A donde llega cada pedido. Sin él, la tienda no puede vender. */
  whatsapp: string | null
  /**
   * De vacaciones: se ve, pero no recibe pedidos. `hasta` es el día que
   * vuelve. `null`: atiende.
   */
  vacaciones: { hasta: string | null } | null
  /** Con qué kit se dibuja. Una clave retirada ya llega resuelta a la base. */
  plantilla: ClavePlantilla
  /** La base de la plantilla con la personalización de la tienda encima. */
  apariencia: Apariencia
  bloques: BloquePublico[]
  productos: ProductoPublico[]
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
        body: "Vendemos ropa para entrenar y para el día a día. Haz tu pedido y lo coordinamos contigo por WhatsApp.",
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
      vacaciones: null,
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
  "id, slug, name, description, logo_url, whatsapp, is_published, template_key, theme_overrides, vacaciones_desde, vacaciones_hasta"

type FilaDeTienda = {
  id: string
  slug: string
  name: string
  description: string | null
  logo_url: string | null
  whatsapp: string | null
  template_key: string | null
  theme_overrides: Json
  vacaciones_desde?: string | null
  vacaciones_hasta?: string | null
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
  const [
    { data: pagina },
    { data: productos },
    { data: categorias },
    { data: variantes },
  ] = await Promise.all([
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
      // La política ya lo esconde al comprador; el dueño mirando su tienda
      // entra por la suya, que no lo filtra.
      .is("moderated_at", null)
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
    // Las variantes van en la misma tanda: son de la misma tienda y la
    // política ya las acota a una que se sirve.
    supabase
      .from("product_variants")
      .select("id, product_id, valores, nombre, price_cents, stock, image_url")
      .eq("store_id", tienda.id)
      .is("deleted_at", null)
      .order("position"),
  ])

  const bloques: BloquePublico[] = (pagina?.store_blocks ?? []).map(
    (bloque) => ({
      id: bloque.id,
      tipo: bloque.block_type_key,
      props: (bloque.props ?? {}) as Record<string, Json | undefined>,
    })
  )

  const porProducto = new Map<string, VariantePublica[]>()
  for (const fila of variantes ?? []) {
    const lista = porProducto.get(fila.product_id) ?? []
    lista.push({
      id: fila.id,
      valores: leerValores(fila.valores),
      nombre: fila.nombre,
      precioCents: fila.price_cents,
      stock: fila.stock,
      imagen: fila.image_url,
    })
    porProducto.set(fila.product_id, lista)
  }

  const catalogo: ProductoPublico[] = (productos ?? []).map((producto) => {
    const propias = porProducto.get(producto.id)
    return propias ? { ...producto, variantes: propias } : producto
  })

  return {
    id: tienda.id,
    slug: tienda.slug,
    nombre: tienda.name,
    descripcion: tienda.description,
    logoUrl: tienda.logo_url,
    whatsapp: tienda.whatsapp,
    vacaciones: deVacaciones({
      desde: tienda.vacaciones_desde ?? null,
      hasta: tienda.vacaciones_hasta ?? null,
    })
      ? { hasta: tienda.vacaciones_hasta ?? null }
      : null,
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
): Promise<{ tienda: TiendaPublica; producto: ProductoPublico } | null> {
  const tienda = await getTiendaPublica(slug)
  if (!tienda) return null

  const producto = tienda.productos.find((p) => p.id === productoId)
  return producto ? { tienda, producto } : null
}
