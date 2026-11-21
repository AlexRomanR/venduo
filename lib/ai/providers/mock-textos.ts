import type { TextosATuMedida } from "@/lib/ai/schemas"

/**
 * Los textos a medida en modo demo.
 *
 * Arma la propuesta con lo que la tienda dijo que vende, que viene en el
 * contexto, para que el recorrido se pueda mostrar sin red y pase las mismas
 * validaciones que un modelo. Sigue las reglas de la tarea real: título corto,
 * cada campo con su trabajo y la tienda en plural.
 */

interface Contexto {
  descripcion: string
  campos: Array<{
    id: string
    tipo: string
    campo: TextosATuMedida["textos"][number]["campo"]
    max: number
  }>
}

function leerContexto(mensaje: string): Contexto | null {
  const crudo = mensaje.match(/<<CONTEXTO>>\s*([\s\S]*?)\s*<<\/CONTEXTO>>/)?.[1]
  try {
    const leido = JSON.parse(crudo ?? "") as Partial<Contexto>
    if (!leido.descripcion || !Array.isArray(leido.campos)) return null
    return { descripcion: leido.descripcion, campos: leido.campos }
  } catch {
    return null
  }
}

function conMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function conMinuscula(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1)
}

/** Lo que entra en `max`, sin cortar una palabra. */
function recortar(texto: string, max: number): string {
  if (texto.length <= max) return texto
  const corto = texto.slice(0, max + 1)
  return corto.slice(0, corto.lastIndexOf(" ")).trim()
}

export function textosDeDemostracion(mensaje: string): TextosATuMedida | null {
  const contexto = leerContexto(mensaje)
  if (!contexto) return null

  const queVende = conMinuscula(
    contexto.descripcion
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.!?]+$/, "")
      .replace(
        /^(yo\s+)?(vendo|vendemos|ofrezco|ofrecemos|tengo|tenemos|traigo|traemos)\s+/i,
        ""
      )
  )
  const producto = queVende
    .split(/\s+(?:para|con|en|a precios?)\s+|[,.;:]/i)[0]
    .trim()
  const descripcion = `Vendemos ${queVende}.`
  const cierre = "Pide aquí y lo coordinamos por WhatsApp."

  const textos = contexto.campos.flatMap((campo) => {
    const boton = `Ver ${producto}`
    const texto =
      campo.tipo === "hero" && campo.campo === "title"
        ? recortar(conMayuscula(producto), campo.max)
        : campo.tipo === "hero" && campo.campo === "subtitle"
          ? `${descripcion} ${cierre}`.length <= campo.max
            ? `${descripcion} ${cierre}`
            : descripcion
          : campo.campo === "ctaLabel" || campo.campo === "buttonLabel"
            ? boton.length <= campo.max
              ? boton
              : "Ver el catálogo"
            : null
    return texto && texto.length <= campo.max
      ? [{ id: campo.id, campo: campo.campo, texto }]
      : []
  })

  return { descripcion, textos }
}
