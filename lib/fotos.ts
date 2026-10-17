import "server-only"

import fs from "node:fs"
import path from "node:path"

/*
 * Las fotos de la tienda, convertidas para dibujarlas en el servidor: el
 * catálogo en PDF y la imagen para redes. Solo servidor.
 */

/** Las fotos ya convertidas, por URL. Una exportación repetida no las vuelve a bajar. */
const memoria = new Map<string, string | null>()
const TOPE_DE_MEMORIA = 300

/**
 * Las carpetas de los binarios que `sharp` carga por su cuenta.
 *
 * En Linux, `sharp` abre libvips desde otro paquete con el enlazador del
 * sistema, y su versión WebAssembly lee el `.wasm` de al lado. Ninguno pasa
 * por un `require`, así que el rastreo de Turbopack no los veía: en Vercel la
 * función quedaba sin ellos y el PDF daba 500 con "Could not load the sharp
 * module". Nombrarlas con `process.cwd()`, como las letras, es lo que el
 * rastreo sí sigue.
 */
function binariosDeSharp(): string[] {
  const carpetas = [
    path.join(
      process.cwd(),
      "node_modules",
      "@img",
      "sharp-libvips-linux-x64",
      "lib"
    ),
    path.join(process.cwd(), "node_modules", "@img", "sharp-wasm32", "lib"),
  ]
  return carpetas.flatMap((carpeta) =>
    fs.existsSync(carpeta)
      ? fs.readdirSync(carpeta).map((archivo) => path.join(carpeta, archivo))
      : []
  )
}

type Sharp = (typeof import("sharp"))["default"]
let cargandoSharp: Promise<Sharp | null> | null = null

/**
 * `sharp`, cargado recién cuando hace falta y una sola vez.
 *
 * Si no carga, el catálogo se arma igual con las fotos que el PDF ya entiende:
 * mejor un catálogo con alguna foto vacía que una ruta que no responde.
 */
function cargarSharp(): Promise<Sharp | null> {
  cargandoSharp ??= import("sharp")
    .then((modulo) => modulo.default)
    .catch((error: unknown) => {
      console.error(
        "[fotos] sharp no cargó; las fotos que no son JPEG ni PNG quedan vacías",
        { error, binarios: binariosDeSharp().length }
      )
      return null
    })
  return cargandoSharp
}

/** JPEG o PNG por su firma, que es lo único que leen `@react-pdf` y `next/og`. */
function formatoLegible(datos: Buffer): "jpeg" | "png" | null {
  if (datos[0] === 0xff && datos[1] === 0xd8 && datos[2] === 0xff) {
    return "jpeg"
  }
  if (datos.subarray(0, 4).toString("hex") === "89504e47") return "png"
  return null
}

/**
 * Una foto lista para dibujar en el servidor: JPEG o PNG, achicada y en
 * base64.
 *
 * `@react-pdf` y `next/og` solo leen JPEG y PNG, y las fotos de la tienda se
 * guardan en WebP: se convierten acá. De paso se achican al lado que pida
 * quien la usa —el catálogo, liviano para WhatsApp; la imagen para redes,
 * nítida a 1080—. Una foto que no baja deja su lugar vacío en vez de tumbar
 * lo demás.
 */
export async function fotoEnBase64(
  url: string,
  {
    formato = "jpeg",
    lado,
    calidad = 72,
  }: { formato?: "jpeg" | "png"; lado: number; calidad?: number }
): Promise<string | null> {
  const clave = `${formato}:${lado}:${calidad}:${url}`
  if (memoria.has(clave)) return memoria.get(clave) ?? null

  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)
    const original = Buffer.from(await respuesta.arrayBuffer())

    const sharp = await cargarSharp()
    if (!sharp) {
      const tal = formatoLegible(original)
      const datos = tal
        ? `data:image/${tal};base64,${original.toString("base64")}`
        : null
      guardar(clave, datos)
      return datos
    }

    const imagen = sharp(original).rotate().resize({
      width: lado,
      height: lado,
      fit: "inside",
      withoutEnlargement: true,
    })
    const salida =
      formato === "png"
        ? await imagen.png({ compressionLevel: 9 }).toBuffer()
        : await imagen
            .flatten({ background: "#ffffff" })
            .jpeg({ quality: calidad, mozjpeg: true })
            .toBuffer()

    const datos = `data:image/${formato};base64,${salida.toString("base64")}`
    guardar(clave, datos)
    return datos
  } catch {
    guardar(clave, null)
    return null
  }
}

function guardar(clave: string, valor: string | null) {
  if (memoria.size >= TOPE_DE_MEMORIA) {
    const primera = memoria.keys().next().value
    if (primera !== undefined) memoria.delete(primera)
  }
  memoria.set(clave, valor)
}
