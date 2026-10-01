import { cache } from "react"

import {
  type DatosDelCatalogo,
  type ProductoDelCatalogo,
} from "@/lib/catalogos/datos"
import { estiloDeTienda } from "@/lib/catalogos/estilo"
import {
  catalogoSchema,
  type Catalogo,
  type ClaveHoja,
  type ClavePlantilla,
  type Estilo,
} from "@/lib/catalogos/modelo"
import { armarCatalogo } from "@/lib/catalogos/plantillas"
import { getMiTienda } from "@/lib/data/panel"
import { PRODUCTOS_DE_CATALOGO_DEMO } from "@/lib/demo-data"
import { getSiteUrl } from "@/lib/env"
import { formatFechaLarga } from "@/lib/format"
import { aparienciaDeTienda } from "@/lib/plantillas"
import { toDataURL } from "@/lib/qr"
import { createClient } from "@/lib/supabase/server"
import { enlaceLegible, urlDeTienda } from "@/lib/tienda"
import type { Product } from "@/types"

/*
 * Los catálogos en PDF, del lado del servidor.
 *
 * Lo que se guarda es la configuración; lo que se dibuja sale de acá, leído en
 * el momento: los productos con su precio y su stock de hoy, la tienda con su
 * WhatsApp y su QR. Por eso un catálogo guardado nunca muestra un precio viejo.
 */

export interface CatalogoGuardado {
  id: string
  nombre: string
  plantilla: ClavePlantilla
  hoja: ClaveHoja
  /** Cuántos productos eligió, para la lista. */
  productos: number
  actualizado: string
  /** El enlace para compartir, ya armado. */
  enlace: string
  /** Para dibujar su primera hoja en la lista. */
  catalogo: Catalogo
}

export interface CatalogoAbierto {
  id: string
  catalogo: Catalogo
  token: string
}

/** Lo que el editor necesita de la tienda, además del catálogo. */
export interface MaterialDelCatalogo {
  datos: DatosDelCatalogo
  /** Los colores y la letra de la tienda: el punto de partida del estilo. */
  estiloDeTienda: Estilo
  esDemo: boolean
}

/* ---------------------------------------------------------------------------
 * Lo que dibuja un catálogo
 * ------------------------------------------------------------------------ */

function aProducto(producto: Product): ProductoDelCatalogo {
  const anterior = producto.compare_at_price_cents
  return {
    id: producto.id,
    nombre: producto.name,
    descripcion: producto.description,
    precioCents: producto.price_cents,
    precioAnteriorCents:
      anterior && anterior > producto.price_cents ? anterior : null,
    stock: producto.stock,
    // Un producto viejo puede tener la categoría solo como texto: se agrupa
    // por ese nombre, que es lo que ve la persona.
    categoriaId:
      producto.category_id ??
      (producto.category ? `nombre:${producto.category}` : null),
    categoria: producto.category,
    condicion: producto.condition,
    codigo: producto.sku,
    foto: producto.image_url ?? producto.images[0] ?? null,
    destacado: producto.is_featured,
  }
}

/** Las categorías que tienen productos, en el orden en que aparecen. */
function categoriasDe(productos: ProductoDelCatalogo[]) {
  const vistas = new Map<string, string>()
  for (const producto of productos) {
    if (producto.categoriaId && !vistas.has(producto.categoriaId)) {
      vistas.set(producto.categoriaId, producto.categoria ?? "Sin nombre")
    }
  }
  return [...vistas].map(([id, nombre]) => ({ id, nombre }))
}

interface TiendaBasica {
  name: string
  slug: string
  logo_url: string | null
  whatsapp: string | null
}

async function armarDatos(
  tienda: TiendaBasica,
  filas: Product[]
): Promise<DatosDelCatalogo> {
  const url = urlDeTienda(tienda.slug)
  const productos = filas.map(aProducto)

  return {
    tienda: {
      nombre: tienda.name,
      logo: tienda.logo_url,
      whatsapp: tienda.whatsapp,
      url,
      enlace: enlaceLegible(url),
      qr: await toDataURL(url, { size: 480, margin: 2 }),
    },
    productos: Object.fromEntries(productos.map((p) => [p.id, p])),
    categorias: categoriasDe(productos),
    fecha: formatFechaLarga(new Date()),
  }
}

/* ---------------------------------------------------------------------------
 * Modo demo
 * ------------------------------------------------------------------------ */

const TIENDA_DEMO: TiendaBasica = {
  name: "Rosa Deportes",
  slug: "rosa-deportes",
  logo_url: null,
  whatsapp: "+591 712 34567",
}

async function materialDeDemostracion(): Promise<MaterialDelCatalogo> {
  const url = urlDeTienda(TIENDA_DEMO.slug)
  return {
    datos: {
      tienda: {
        nombre: TIENDA_DEMO.name,
        logo: null,
        whatsapp: TIENDA_DEMO.whatsapp,
        url,
        enlace: enlaceLegible(url),
        qr: await toDataURL(url, { size: 480, margin: 2 }),
      },
      productos: Object.fromEntries(
        PRODUCTOS_DE_CATALOGO_DEMO.map((p) => [p.id, p])
      ),
      categorias: categoriasDe(PRODUCTOS_DE_CATALOGO_DEMO),
      fecha: formatFechaLarga(new Date()),
    },
    estiloDeTienda: estiloDeTienda(aparienciaDeTienda("fashion", {})),
    esDemo: true,
  }
}

/** Los dos catálogos que trae el modo demo, armados en el momento. */
function catalogosDeDemostracion(estilo: Estilo): CatalogoAbierto[] {
  const tienda = { nombre: TIENDA_DEMO.name, whatsapp: TIENDA_DEMO.whatsapp }
  return [
    {
      id: "demo-temporada",
      token: "demo-temporada",
      catalogo: armarCatalogo({
        plantilla: "revista",
        nombre: "Temporada de octubre",
        productos: PRODUCTOS_DE_CATALOGO_DEMO,
        tienda,
        estilo,
      }),
    },
    {
      id: "demo-precios",
      token: "demo-precios",
      catalogo: armarCatalogo({
        plantilla: "precios",
        nombre: "Lista de precios",
        productos: PRODUCTOS_DE_CATALOGO_DEMO,
        tienda,
        estilo,
      }),
    },
  ]
}

/* ---------------------------------------------------------------------------
 * Lecturas
 * ------------------------------------------------------------------------ */

/**
 * Los productos de hoy de mi tienda y lo que se dibuja con ellos.
 *
 * Con memoria por pedido: la página del editor y la descarga del PDF la piden
 * más de una vez en el mismo render.
 */
export const getMaterialDelCatalogo = cache(
  async function getMaterialDelCatalogo(): Promise<MaterialDelCatalogo> {
    const supabase = await createClient()
    if (!supabase) return materialDeDemostracion()

    const tienda = await getMiTienda()
    if (!tienda) return materialDeDemostracion()

    const { data: filas } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", tienda.id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })

    return {
      datos: await armarDatos(tienda, filas ?? []),
      estiloDeTienda: estiloDeTienda(
        aparienciaDeTienda(tienda.template_key, tienda.theme_overrides)
      ),
      esDemo: false,
    }
  }
)

/** Mis catálogos guardados, el último editado primero. */
export async function getCatalogos(): Promise<{
  catalogos: CatalogoGuardado[]
  esDemo: boolean
}> {
  const supabase = await createClient()
  const tienda = supabase ? await getMiTienda() : null

  if (!supabase || !tienda) {
    const { estiloDeTienda: estilo } = await materialDeDemostracion()
    return {
      catalogos: catalogosDeDemostracion(estilo).map(resumir),
      esDemo: true,
    }
  }

  const { data } = await supabase
    .from("catalogs")
    .select("id, config, share_token, updated_at")
    .eq("store_id", tienda.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })

  return {
    catalogos: (data ?? []).flatMap((fila) => {
      const catalogo = catalogoSchema.safeParse(fila.config)
      // Uno que no pasa la validación no se muestra en vez de romper la
      // lista: puede venir de una versión anterior del esquema.
      if (!catalogo.success) return []
      return [
        resumir({
          id: fila.id,
          catalogo: catalogo.data,
          token: fila.share_token,
          actualizado: fila.updated_at,
        }),
      ]
    }),
    esDemo: false,
  }
}

function resumir(
  abierto: CatalogoAbierto & { actualizado?: string }
): CatalogoGuardado {
  return {
    id: abierto.id,
    nombre: abierto.catalogo.nombre,
    plantilla: abierto.catalogo.plantilla,
    hoja: abierto.catalogo.hoja,
    productos: abierto.catalogo.productos.length,
    actualizado: abierto.actualizado ?? new Date().toISOString(),
    enlace: enlaceDeCatalogo(abierto.token),
    catalogo: abierto.catalogo,
  }
}

/** Uno de mis catálogos, validado. */
export async function getCatalogo(id: string): Promise<CatalogoAbierto | null> {
  const supabase = await createClient()
  const tienda = supabase ? await getMiTienda() : null

  if (!supabase || !tienda) {
    const { estiloDeTienda: estilo } = await materialDeDemostracion()
    return catalogosDeDemostracion(estilo).find((c) => c.id === id) ?? null
  }

  const { data } = await supabase
    .from("catalogs")
    .select("id, config, share_token")
    .eq("id", id)
    .eq("store_id", tienda.id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!data) return null
  const catalogo = catalogoSchema.safeParse(data.config)
  if (!catalogo.success) return null
  return { id: data.id, catalogo: catalogo.data, token: data.share_token }
}

/**
 * Un catálogo compartido, con los datos de hoy de su tienda.
 *
 * Lo abre cualquiera que tenga el enlace, sin cuenta. El catálogo llega por
 * `catalogo_compartido`; la tienda y sus productos, por las políticas de
 * siempre, que ya exponen lo de una tienda publicada.
 */
export async function getCatalogoCompartido(
  token: string
): Promise<{ catalogo: Catalogo; datos: DatosDelCatalogo } | null> {
  const supabase = await createClient()

  if (!supabase) {
    const material = await materialDeDemostracion()
    const demo = catalogosDeDemostracion(material.estiloDeTienda).find(
      (c) => c.token === token
    )
    return demo ? { catalogo: demo.catalogo, datos: material.datos } : null
  }

  const { data: filas } = await supabase.rpc("catalogo_compartido", {
    p_token: token,
  })
  const fila = filas?.[0]
  if (!fila) return null

  const catalogo = catalogoSchema.safeParse(fila.config)
  if (!catalogo.success) return null

  const [{ data: tienda }, { data: productos }] = await Promise.all([
    supabase
      .from("stores")
      .select("name, slug, logo_url, whatsapp")
      .eq("id", fila.store_id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("products")
      .select("*")
      .eq("store_id", fila.store_id)
      .eq("is_active", true)
      .is("deleted_at", null),
  ])
  if (!tienda) return null

  return {
    catalogo: catalogo.data,
    datos: await armarDatos(tienda, productos ?? []),
  }
}

/** El enlace que se manda por WhatsApp: abre el PDF con los precios de hoy. */
export function enlaceDeCatalogo(token: string): string {
  return `${getSiteUrl()}/c/${token}`
}
