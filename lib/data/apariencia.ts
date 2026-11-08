import { isSupabaseConfigured } from "@/lib/env"
import { productosDeEjemplo } from "@/lib/editor/muestras"
import { formatMoney } from "@/lib/format"
import {
  PLANTILLAS,
  plantillaDeTienda,
  type ClavePlantilla,
} from "@/lib/plantillas"
import {
  resolverApariencia,
  type Apariencia,
} from "@/lib/plantillas/apariencia"
import type {
  DatosDeMiniatura,
  ProductoDeMiniatura,
} from "@/components/plantillas/miniatura"
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

interface FilaDeProducto {
  name: string
  price_cents: number
  compare_at_price_cents: number | null
  image_url: string | null
  product_variants: { price_cents: number | null; deleted_at: string | null }[]
}

/** Un producto como lo dibuja la miniatura: su foto, su precio y su rebaja. */
function productoDeMuestra(fila: FilaDeProducto): ProductoDeMiniatura {
  const precios = fila.product_variants
    .filter((v) => v.deleted_at === null)
    .map((v) => v.price_cents ?? fila.price_cents)
  const desde = precios.length ? Math.min(...precios) : fila.price_cents
  const hasta = precios.length ? Math.max(...precios) : fila.price_cents
  const antes = fila.compare_at_price_cents
  return {
    foto: fila.image_url,
    precio:
      desde === hasta ? formatMoney(desde) : `Desde ${formatMoney(desde)}`,
    rebaja:
      antes && antes > fila.price_cents
        ? Math.round(((antes - fila.price_cents) / antes) * 100)
        : null,
  }
}

/**
 * La tienda para la miniatura: tres productos —primero los que tienen foto— y
 * la portada, que es la foto de un cuarto producto o, si no hay, la del
 * primero. Sin productos a la vista, los de ejemplo de su plantilla: los
 * mismos en todas las miniaturas, para comparar lo mismo vestido distinto.
 */
function muestraDeTienda(
  nombre: string,
  logoUrl: string | null,
  plantilla: ClavePlantilla,
  filas: FilaDeProducto[]
): { muestra: DatosDeMiniatura; deEjemplo: boolean } {
  const ordenadas = [...filas].sort(
    (a, b) => Number(Boolean(b.image_url)) - Number(Boolean(a.image_url))
  )
  const deEjemplo = ordenadas.length === 0
  const fuente: FilaDeProducto[] = deEjemplo
    ? productosDeEjemplo(plantilla, "muestra").map((p) => ({
        name: p.name,
        price_cents: p.price_cents,
        compare_at_price_cents: p.compare_at_price_cents,
        image_url: p.image_url,
        product_variants: [],
      }))
    : ordenadas
  const productos = fuente.slice(0, 3).map(productoDeMuestra)
  return {
    muestra: {
      nombre,
      logoUrl,
      portada: fuente[3]?.image_url ?? fuente[0]?.image_url ?? null,
      productos,
    },
    deEjemplo,
  }
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
      elegible("atelier", null, null, "Moda"),
      elegible("pisada", null, null, "Moda"),
      elegible("perfume", null, null, "Belleza"),
      elegible("formula", null, null, "Belleza"),
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

  const [plantillasRes, rubrosRes, versionesRes, productosRes] =
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
        .select("id, number, origin, note, template_key, created_at")
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
    ])

  const rubros = new Map(
    (rubrosRes.data ?? []).map((rubro) => [rubro.key, rubro.name])
  )
  const activas = (plantillasRes.data ?? []).filter(
    (fila) => plantillaDeTienda(fila.key) === fila.key
  )
  const porClave = new Map(activas.map((fila) => [fila.key, fila]))
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
    })),
    esDemo: false,
  }
}
