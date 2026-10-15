import { respuesta } from "@/lib/api/respuestas"
import { FUENTES, type ClaveFuente } from "@/lib/plantillas/fuentes"

// Una semana: Google cambia los archivos de una letra muy de vez en cuando,
// y la app los pide cada vez que abre un editor.
export const revalidate = 604800

interface FuenteParaLaApp {
  clave: ClaveFuente
  nombre: string
  /** El archivo TTF de cada grosor que la tienda puede usar. */
  archivos: Record<string, string>
}

/** Los archivos de una letra, leídos de la hoja de estilos de Google Fonts. */
async function archivosDe(nombre: string, pesos: readonly number[]) {
  const familia = encodeURIComponent(nombre).replace(/%20/g, "+")
  const direccion = `https://fonts.googleapis.com/css2?family=${familia}:wght@${pesos.join(";")}&display=swap`
  try {
    // Sin un navegador moderno en la cabecera, Google responde con TTF: el
    // formato que lee un celular. WOFF2 no.
    const css = await fetch(direccion, { next: { revalidate } }).then((r) =>
      r.ok ? r.text() : ""
    )
    const archivos: Record<string, string> = {}
    for (const bloque of css.split("@font-face").slice(1)) {
      const peso = /font-weight:\s*(\d+)/.exec(bloque)?.[1]
      const url = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/.exec(
        bloque
      )?.[1]
      if (peso && url && !/font-style:\s*italic/.test(bloque))
        archivos[peso] = url
    }
    return archivos
  } catch {
    return {}
  }
}

/**
 * Las letras que puede usar una tienda, con sus archivos para la app.
 *
 * Salen de `FUENTES`, la misma tabla que valida lo que se guarda: una letra
 * que la web sume ahí aparece sola en los editores de la app, que la descarga
 * para mostrar cada opción escrita con su propia letra. Es información
 * pública, como la hoja de estilos de cualquier tienda.
 */
export async function GET() {
  const fuentes: FuenteParaLaApp[] = await Promise.all(
    (Object.keys(FUENTES) as ClaveFuente[]).map(async (clave) => ({
      clave,
      nombre: FUENTES[clave].nombre,
      archivos: await archivosDe(FUENTES[clave].nombre, FUENTES[clave].pesos),
    }))
  )
  return respuesta({ fuentes })
}
