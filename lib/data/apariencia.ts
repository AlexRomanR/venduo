import { isSupabaseConfigured } from "@/lib/env"
import {
  PLANTILLAS,
  plantillaDeTienda,
  type ClavePlantilla,
} from "@/lib/plantillas"
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

  const [plantillasRes, rubrosRes, versionesRes] = await Promise.all([
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
