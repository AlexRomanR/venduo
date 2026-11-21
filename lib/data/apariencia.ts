import { huellaDeDiseno } from "@/lib/editor/igual-a-hoy"
import { isSupabaseConfigured } from "@/lib/env"
import {
  PLANTILLAS,
  plantillaDeTienda,
  type ClavePlantilla,
} from "@/lib/plantillas"
import {
  resolverApariencia,
  type Apariencia,
} from "@/lib/plantillas/apariencia"
import type { DatosDeMiniatura } from "@/components/plantillas/miniatura"
import { muestraDeTienda } from "@/lib/plantillas/muestra"
import { getMiTienda } from "@/lib/data/panel"
import { createClient } from "@/lib/supabase/server"
import { urlDeTienda } from "@/lib/tienda"
import type { DesignOrigin } from "@/types"

export interface PlantillaElegible {
  clave: string
  /** Con qué kit se dibuja. */
  base: ClavePlantilla
  nombre: string
  descripcion: string | null
  rubro: string | null
  rasgos: string[]
  /** Lo que Venduo marcó desde la administración. */
  nueva: boolean
  recomendada: boolean
}

export interface VersionDeDiseno {
  id: string
  numero: number
  origen: DesignOrigin
  nota: string | null
  plantilla: string
  fecha: string
  /** Es igual a cómo está la tienda hoy: restaurarla no cambiaría nada. */
  igualAHoy: boolean
}

export interface AparienciaDeMiTienda {
  tienda: { nombre: string; slug: string; url: string }
  actual: PlantillaElegible & {
    /** Si su plantilla ya no se ofrece y se dibuja con la base editorial. */
    retirada: boolean
    /** Si la tienda cambió algo respecto de la base. */
    personalizada: boolean
  }
  /** Las que se pueden elegir, sin la actual. */
  disponibles: PlantillaElegible[]
  versiones: VersionDeDiseno[]
  /** La tienda para dibujar dentro de cada miniatura: su nombre y sus productos. */
  muestra: DatosDeMiniatura
  /** Si los productos de la muestra son de ejemplo: la tienda no tiene a la vista. */
  muestraDeEjemplo: boolean
  /** Su plantilla con sus colores, para la miniatura de "Tu plantilla". */
  aparienciaActual: Apariencia
  esDemo: boolean
}

function elegible(
  clave: string,
  nombre: string | null,
  descripcion: string | null,
  rubro: string | null,
  marcas: { nueva?: boolean; recomendada?: boolean } = {}
): PlantillaElegible {
  const base = plantillaDeTienda(clave)
  const definicion = PLANTILLAS[base]

  return {
    clave,
    base,
    nombre: nombre ?? definicion.nombre,
    descripcion: descripcion ?? definicion.descripcion,
    rubro,
    rasgos: definicion.rasgos,
    nueva: marcas.nueva ?? false,
    recomendada: marcas.recomendada ?? false,
  }
}

function aparienciaDeDemostracion(): AparienciaDeMiTienda {
  return {
    tienda: {
      nombre: "Rosa Deportes",
      slug: "rosa-deportes",
      url: urlDeTienda("rosa-deportes"),
    },
    actual: {
      ...elegible("fashion", null, null, "Moda"),
      retirada: false,
      personalizada: false,
    },
    disponibles: [
      elegible("calle", null, null, "Moda"),
      elegible("probador", null, null, "Moda"),
      elegible("atelier", null, null, "Moda"),
      elegible("correa", null, null, "Moda"),
      elegible("taco", null, null, "Moda"),
      elegible("pisada", null, null, "Moda"),
      elegible("perfume", null, null, "Belleza"),
      elegible("formula", null, null, "Belleza"),
      elegible("ambar", null, null, "Belleza"),
      elegible("tocador", null, null, "Belleza"),
      elegible("crayon", null, null, "Niños"),
      elegible("quilate", null, null, "Joyas"),
      elegible("bazar", null, null, "Variedades"),
    ],
    versiones: [
      {
        id: "demo",
        numero: 1,
        origen: "alta",
        nota: null,
        plantilla: "Pasarela",
        fecha: new Date().toISOString(),
        igualAHoy: false,
      },
    ],
    ...(() => {
      const { muestra } = muestraDeTienda("Rosa Deportes", null, "fashion", [])
      // En la demo la tienda sí tiene productos: los de ejemplo, sin aviso.
      return { muestra, muestraDeEjemplo: false }
    })(),
    aparienciaActual: PLANTILLAS.fashion.apariencia,
    esDemo: true,
  }
}

/**
 * La apariencia de la tienda del usuario: qué plantilla usa, a cuáles puede
 * pasarse y qué quedó guardado antes de cada cambio.
 *
 * Las plantillas que se ofrecen salen de la base —`templates.is_active`— y se
 * cruzan con las que tienen kit en código: una fila activa sin componentes no
 * se ofrece, porque elegirla dibujaría la base editorial por sorpresa.
 */
export async function getAparienciaDeMiTienda(): Promise<AparienciaDeMiTienda | null> {
  if (!isSupabaseConfigured) return aparienciaDeDemostracion()

  const supabase = await createClient()
  if (!supabase) return aparienciaDeDemostracion()

  const tienda = await getMiTienda()
  if (!tienda?.template_key) return null

  const [plantillasRes, rubrosRes, versionesRes, productosRes, paginasRes] =
    await Promise.all([
      // La política solo deja leer las activas. Una plantilla retirada no llega,
      // y eso es lo que la marca como retirada.
      // En el orden que eligió Venduo desde la administración.
      supabase
        .from("templates")
        .select("key, name, description, sector, is_new, is_recommended")
        .order("position")
        .order("name"),
      supabase.from("sectors").select("key, name"),
      supabase
        .from("store_design_versions")
        .select(
          "id, number, origin, note, template_key, created_at, theme_overrides, logo_url, pages"
        )
        .eq("store_id", tienda.id)
        .is("deleted_at", null)
        .order("number", { ascending: false })
        .limit(8),
      // Lo que ve quien compra, para dibujar la tienda dentro de cada miniatura:
      // en la misma tanda, sin un viaje más.
      supabase
        .from("products")
        .select(
          "name, price_cents, compare_at_price_cents, image_url, product_variants(price_cents, deleted_at)"
        )
        .eq("store_id", tienda.id)
        .eq("is_active", true)
        .is("deleted_at", null)
        .is("moderated_at", null)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(12),
      // Las páginas de hoy, con la forma que guarda `capture_design_version`,
      // para saber qué versión es igual a lo de hoy.
      supabase
        .from("store_pages")
        .select(
          "key, title, is_home, status, store_blocks(block_type_key, position, props, is_visible, deleted_at)"
        )
        .eq("store_id", tienda.id)
        .is("deleted_at", null),
    ])

  const rubros = new Map(
    (rubrosRes.data ?? []).map((rubro) => [rubro.key, rubro.name])
  )
  const activas = (plantillasRes.data ?? []).filter(
    (fila) => plantillaDeTienda(fila.key) === fila.key
  )
  const porClave = new Map(activas.map((fila) => [fila.key, fila]))
  // Sin las páginas no se sabe: se ofrecen todas, como antes.
  const hoy = paginasRes.error
    ? null
    : huellaDeDiseno({
        template_key: tienda.template_key,
        theme_overrides: tienda.theme_overrides ?? {},
        logo_url: tienda.logo_url,
        pages: [...(paginasRes.data ?? [])]
          .sort(
            (a, b) =>
              Number(b.is_home) - Number(a.is_home) ||
              (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
          )
          .map((pagina) => ({
            key: pagina.key,
            title: pagina.title,
            is_home: pagina.is_home,
            status: pagina.status,
            blocks: (pagina.store_blocks ?? [])
              .filter((bloque) => !bloque.deleted_at)
              .sort((a, b) => a.position - b.position)
              .map((bloque) => ({
                block_type_key: bloque.block_type_key,
                position: bloque.position,
                props: bloque.props,
                is_visible: bloque.is_visible,
              })),
          })),
      })
  const fila = porClave.get(tienda.template_key)
  const personalizacion = tienda.theme_overrides

  return {
    tienda: {
      nombre: tienda.name,
      slug: tienda.slug,
      url: urlDeTienda(tienda.slug),
    },
    actual: {
      ...elegible(
        tienda.template_key,
        fila?.name ?? null,
        fila?.description ?? null,
        fila ? (rubros.get(fila.sector) ?? null) : null
      ),
      // Retirada es sin kit en código. Una que Venduo dejó de ofrecer no llega
      // en la lectura, pero se sigue dibujando con su kit: no está retirada.
      retirada: plantillaDeTienda(tienda.template_key) !== tienda.template_key,
      personalizada:
        typeof personalizacion === "object" &&
        personalizacion !== null &&
        Object.keys(personalizacion).length > 0,
    },
    disponibles: activas
      .filter((otra) => otra.key !== tienda.template_key)
      .map((otra) =>
        elegible(
          otra.key,
          otra.name,
          otra.description,
          rubros.get(otra.sector) ?? null,
          { nueva: otra.is_new, recomendada: otra.is_recommended }
        )
      ),
    ...(() => {
      const { muestra, deEjemplo } = muestraDeTienda(
        tienda.name,
        tienda.logo_url,
        plantillaDeTienda(tienda.template_key),
        productosRes.data ?? []
      )
      return { muestra, muestraDeEjemplo: deEjemplo }
    })(),
    // Lo que ve quien compra: la base de su plantilla con sus cambios encima.
    aparienciaActual: resolverApariencia(
      PLANTILLAS[plantillaDeTienda(tienda.template_key)].apariencia,
      personalizacion
    ),
    versiones: (versionesRes.data ?? []).map((version) => ({
      id: version.id,
      numero: version.number,
      origen: version.origin,
      nota: version.note,
      plantilla:
        (version.template_key && porClave.get(version.template_key)?.name) ??
        "Plantilla anterior",
      fecha: version.created_at,
      igualAHoy: hoy !== null && huellaDeDiseno(version) === hoy,
    })),
    esDemo: false,
  }
}
