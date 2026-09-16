import { createClient } from "@/lib/supabase/server"
import { RUBROS_DEMO, type RubroConPlantillas } from "@/lib/demo-data"

export type { PlantillaResumen, RubroConPlantillas } from "@/lib/demo-data"

/**
 * El catálogo de plantillas agrupado por rubro, para la galería del paso 1.
 *
 * Los bloques vienen de `template_pages`, que es lo mismo que `apply_template`
 * copia a la tienda. Así la vista previa muestra la estructura real y no una
 * ilustración que se desactualiza sola en cuanto alguien edita la plantilla.
 */
export async function getPlantillasPorRubro(): Promise<RubroConPlantillas[]> {
  const supabase = await createClient()
  if (!supabase) return RUBROS_DEMO

  const [rubrosResult, plantillasResult, paginasResult] = await Promise.all([
    supabase
      .from("sectors")
      .select("key, name, position")
      .eq("is_active", true)
      .order("position"),
    supabase
      .from("templates")
      .select("key, name, sector, description")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("template_pages")
      .select("template_key, blocks")
      .eq("is_home", true),
  ])

  const rubros = rubrosResult.data ?? []
  const plantillas = plantillasResult.data ?? []

  if (rubros.length === 0 || plantillas.length === 0) return RUBROS_DEMO

  const bloquesPorPlantilla = new Map<string, string[]>()
  for (const pagina of paginasResult.data ?? []) {
    // `blocks` es jsonb: llega como unknown y se estrecha acá, no con `any`.
    const lista = Array.isArray(pagina.blocks) ? pagina.blocks : []
    bloquesPorPlantilla.set(
      pagina.template_key,
      lista
        .map((bloque) =>
          bloque && typeof bloque === "object" && "block_type_key" in bloque
            ? String((bloque as { block_type_key: unknown }).block_type_key)
            : null
        )
        .filter((clave): clave is string => Boolean(clave))
    )
  }

  return rubros
    .map((rubro) => ({
      key: rubro.key,
      name: rubro.name,
      plantillas: plantillas
        .filter((plantilla) => plantilla.sector === rubro.key)
        .map((plantilla) => ({
          key: plantilla.key,
          name: plantilla.name,
          sector: plantilla.sector,
          description: plantilla.description,
          bloques: bloquesPorPlantilla.get(plantilla.key) ?? [],
        })),
    }))
    .filter((rubro) => rubro.plantillas.length > 0)
}

/** Nombre visible de cada tipo de bloque, para rotular la vista previa. */
export async function getNombresDeBloque(): Promise<Record<string, string>> {
  const supabase = await createClient()
  if (!supabase) return NOMBRES_DE_BLOQUE_DEMO

  const { data } = await supabase
    .from("block_types")
    .select("key, name")
    .eq("is_active", true)

  if (!data || data.length === 0) return NOMBRES_DE_BLOQUE_DEMO

  return Object.fromEntries(data.map((tipo) => [tipo.key, tipo.name]))
}

export const NOMBRES_DE_BLOQUE_DEMO: Record<string, string> = {
  hero: "Portada",
  product_grid: "Grilla de productos",
  about: "Sobre el negocio",
  testimonials: "Testimonios",
  cta: "Llamado a la acción",
  contact: "Contacto",
  faq: "Preguntas frecuentes",
}
