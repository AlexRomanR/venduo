import { exigirSesion, respuesta } from "@/lib/api/respuestas"
import { getPlantillasPorRubro } from "@/lib/data/plantillas"
import { getSiteUrl } from "@/lib/env"

export const dynamic = "force-dynamic"

/**
 * Las plantillas que tienen su miniatura en `public/plantillas`.
 *
 * En la web la miniatura es un componente que se dibuja con los tokens de la
 * plantilla; la app necesita una imagen. Son capturas de ese mismo componente:
 * si cambia la base de una plantilla, o se suma una, se vuelve a capturar y se
 * agrega acá. Una plantilla sin miniatura se ofrece igual, sin imagen.
 */
const CON_MINIATURA = new Set([
  "atelier",
  "bazar",
  "calle",
  "fashion",
  "formula",
  "perfume",
  "pisada",
])

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
  const sitio = getSiteUrl()

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
        miniatura: CON_MINIATURA.has(plantilla.key)
          ? `${sitio}/plantillas/${plantilla.key}.webp`
          : null,
      }))
    ),
  })
}
