import { cache } from "react"

import { env } from "@/lib/env"
import {
  PLANTILLAS,
  plantillaDeTienda,
  type ClavePlantilla,
} from "@/lib/plantillas"
import {
  personalizacionSchema,
  type Apariencia,
} from "@/lib/plantillas/apariencia"
import { esTipoDeBloque } from "@/lib/plantillas/bloques"
import {
  contextoDeDiseno,
  type Borrador,
  type DatosDeContexto,
  type Seccion,
} from "@/lib/plantillas/borrador"
import { leerPropiedades } from "@/lib/plantillas/secciones"
import { createClient } from "@/lib/supabase/server"
import { urlDeTienda } from "@/lib/tienda"
import {
  COLUMNAS_DE_TIENDA,
  completarTienda,
  getTiendaPublica,
  type TiendaPublica,
} from "@/lib/data/tienda-publica"

export interface ProductoDeMuestra {
  id: string
  nombre: string
  foto: string | null
}

export interface DisenoParaEditar {
  tienda: {
    id: string
    slug: string
    nombre: string
    descripcion: string | null
    /** Sin número, la ficha no puede ofrecer preguntar por WhatsApp. */
    whatsapp: string | null
    url: string
    plantilla: ClavePlantilla
    nombrePlantilla: string
  }
  /** La base de su plantilla: contra ella se mide todo lo que cambia. */
  base: Apariencia
  /** Lo que ve hoy el comprador, leído como un borrador. */
  publicado: Borrador
  datos: DatosDeContexto
  /** Para elegir con cuál mirar la ficha de producto. */
  productos: ProductoDeMuestra[]
  esDemo: boolean
}

/** Dónde quedan las imágenes de una tienda en su bucket. */
function prefijoDeImagenes(tiendaId: string): string | null {
  const base = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "")
  return base
    ? `${base}/storage/v1/object/public/store-assets/${tiendaId}/`
    : null
}

function aSecciones(
  filas: Array<{
    id: string
    block_type_key: string
    is_visible: boolean
    props: unknown
  }>,
  base: Apariencia,
  datos: DatosDeContexto
): Seccion[] {
  const contexto = contextoDeDiseno(base, datos)

  return filas.flatMap((fila) =>
    esTipoDeBloque(fila.block_type_key)
      ? [
          {
            id: fila.id,
            tipo: fila.block_type_key,
            visible: fila.is_visible,
            props: leerPropiedades(fila.block_type_key, fila.props, contexto),
          },
        ]
      : []
  )
}

async function disenoDeDemostracion(): Promise<DisenoParaEditar | null> {
  const tienda = await getTiendaPublica("rosa-deportes")
  if (!tienda) return null

  const base = PLANTILLAS[tienda.plantilla].apariencia
  const datos: DatosDeContexto = {
    prefijoDeImagenes: null,
    fotosDeProductos: [],
    categorias: [],
  }

  return {
    tienda: {
      id: tienda.id,
      slug: tienda.slug,
      nombre: tienda.nombre,
      descripcion: tienda.descripcion,
      whatsapp: tienda.whatsapp,
      url: urlDeTienda(tienda.slug),
      plantilla: tienda.plantilla,
      nombrePlantilla: PLANTILLAS[tienda.plantilla].nombre,
    },
    base,
    publicado: {
      personalizacion: {},
      logoUrl: null,
      secciones: aSecciones(
        tienda.bloques.map((bloque) => ({
          id: bloque.id,
          block_type_key: bloque.tipo,
          is_visible: true,
          props: bloque.props,
        })),
        base,
        datos
      ),
    },
    datos,
    productos: [],
    esDemo: true,
  }
}

/**
 * Todo lo que el editor necesita para abrir la tienda de quien entra.
 *
 * Las secciones llegan **todas**, también las ocultas: en el editor se ven y se
 * pueden volver a mostrar. Se leen campo por campo con `leerPropiedades`, así
 * que una sección vieja con un dato de más no impide abrir el editor.
 *
 * Devuelve `null` si no hay sesión o si la persona no terminó el alta.
 *
 * Sin memoria entre llamadas: después de publicar hay que releer de verdad.
 * Las pantallas usan `getDisenoParaEditar`, que sí la tiene por pedido.
 */
export async function leerDisenoParaEditar(): Promise<DisenoParaEditar | null> {
  const supabase = await createClient()
  if (!supabase) return disenoDeDemostracion()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: tienda } = await supabase
    .from("stores")
    .select(
      "id, slug, name, description, whatsapp, logo_url, template_key, theme_overrides"
    )
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!tienda?.template_key) return null

  const plantilla = plantillaDeTienda(tienda.template_key)
  const base = PLANTILLAS[plantilla].apariencia

  const [paginaRes, productosRes, categoriasRes, fichaRes] = await Promise.all([
    supabase
      .from("store_pages")
      .select("id")
      .eq("store_id", tienda.id)
      .eq("is_home", true)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("products")
      .select("id, name, images, image_url, is_active, is_featured")
      .eq("store_id", tienda.id)
      .is("deleted_at", null)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("product_categories")
      .select("name")
      .eq("store_id", tienda.id)
      .is("deleted_at", null)
      .order("position")
      .order("name"),
    supabase
      .from("templates")
      .select("name")
      .eq("key", tienda.template_key)
      .maybeSingle(),
  ])

  const bloquesRes = paginaRes.data
    ? await supabase
        .from("store_blocks")
        .select("id, block_type_key, is_visible, props")
        .eq("page_id", paginaRes.data.id)
        .is("deleted_at", null)
        .order("position")
    : { data: [] }

  const productos = productosRes.data ?? []
  const datos: DatosDeContexto = {
    prefijoDeImagenes: prefijoDeImagenes(tienda.id),
    fotosDeProductos: productos.flatMap((p) => p.images ?? []),
    categorias: (categoriasRes.data ?? []).map((c) => c.name),
  }

  // Una personalización que no cumple el esquema tampoco se dibuja en la
  // tienda: el editor arranca de la plantilla, igual que el comprador.
  const personalizacion = personalizacionSchema.safeParse(
    tienda.theme_overrides ?? {}
  )

  return {
    tienda: {
      id: tienda.id,
      slug: tienda.slug,
      nombre: tienda.name,
      descripcion: tienda.description,
      whatsapp: tienda.whatsapp,
      url: urlDeTienda(tienda.slug),
      plantilla,
      nombrePlantilla: fichaRes.data?.name ?? PLANTILLAS[plantilla].nombre,
    },
    base,
    publicado: {
      personalizacion: personalizacion.success ? personalizacion.data : {},
      logoUrl: tienda.logo_url,
      secciones: aSecciones(bloquesRes.data ?? [], base, datos),
    },
    datos,
    productos: productos
      .filter((p) => p.is_active)
      .map((p) => ({ id: p.id, nombre: p.name, foto: p.image_url })),
    esDemo: false,
  }
}

export const getDisenoParaEditar = cache(leerDisenoParaEditar)

/**
 * La tienda de quien edita, tal como la vería su comprador, para dibujarla
 * dentro del editor. A diferencia de `getTiendaPublica`, la trae aunque no esté
 * publicada: el dueño tiene que poder preparar su tienda antes de abrirla.
 */
export async function getTiendaParaVistaPrevia(): Promise<TiendaPublica | null> {
  const supabase = await createClient()
  if (!supabase) {
    const demo = await getTiendaPublica("rosa-deportes")
    return demo ? { ...demo, enEdicion: true } : null
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: tienda } = await supabase
    .from("stores")
    .select(COLUMNAS_DE_TIENDA)
    .eq("owner_id", user.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!tienda) return null

  return { ...(await completarTienda(supabase, tienda)), enEdicion: true }
}
