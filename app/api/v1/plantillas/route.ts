import { miniaturaDePlantilla } from "@/lib/api/miniaturas"
import { exigirSesion, respuesta } from "@/lib/api/respuestas"
import { getPlantillasPorRubro } from "@/lib/data/plantillas"

export const dynamic = "force-dynamic"

/**
 * Las plantillas de tienda que se ofrecen en el alta, para la app.
 *
 * Son las mismas de `/crear`, en el orden y con las marcas que eligió Venduo
 * desde la administración: una plantilla que se oculta allá deja de ofrecerse
 * también acá.
 */
export async function GET() {
  const sesion = await exigirSesion()
  if (!sesion.ok) return sesion.respuesta

  const rubros = await getPlantillasPorRubro()

  return respuesta({
    rubros: rubros.map((rubro) => ({ clave: rubro.key, nombre: rubro.name })),
    plantillas: rubros.flatMap((rubro) =>
      rubro.plantillas.map((plantilla) => ({
        clave: plantilla.key,
        nombre: plantilla.name,
        rubro: rubro.key,
        descripcion: plantilla.description,
        nueva: plantilla.nueva ?? false,
        recomendada: plantilla.recomendada ?? false,
        miniatura: miniaturaDePlantilla(plantilla.key),
      }))
    ),
  })
}
