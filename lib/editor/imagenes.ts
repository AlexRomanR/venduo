import { createClient } from "@/lib/supabase/client"

/**
 * Las imágenes que sube quien edita su tienda: el logo y las fotos de sus
 * secciones.
 *
 * Se comprimen **en el navegador** antes de subir. Una foto de celular pesa 4
 * o 6 MB y la tienda la ve gente con datos móviles: reducirla acá ahorra la
 * subida y el bucket nunca guarda el original. Sin dependencias: el navegador
 * ya sabe decodificar y volver a codificar con `canvas`.
 *
 * Solo para el navegador.
 */

export const BUCKET = "store-assets"

/** Lo que el bucket acepta. SVG no: puede traer código. */
export const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp"]

/** El tope del bucket, 5 MB, ya comprimida. */
const PESO_MAXIMO = 5 * 1024 * 1024

export type Carpeta = "logo" | "imagenes"

export class ErrorDeImagen extends Error {}

export interface ImagenDeBiblioteca {
  url: string
  nombre: string
  fecha: string | null
}

function comoBlob(
  lienzo: HTMLCanvasElement,
  tipo: string,
  calidad: number
): Promise<Blob | null> {
  return new Promise((resolver) => lienzo.toBlob(resolver, tipo, calidad))
}

/**
 * La imagen reducida a `lado` píxeles del lado más largo, en WebP.
 *
 * WebP conserva la transparencia de un logo y pesa menos que JPG. Un navegador
 * que no sabe codificarlo devuelve PNG, y también sirve.
 */
export async function comprimirImagen(
  archivo: File,
  lado: number
): Promise<Blob> {
  if (!TIPOS_ACEPTADOS.includes(archivo.type)) {
    throw new ErrorDeImagen(
      "Usa una imagen JPG, PNG o WebP. Si es una foto de iPhone, compártela primero como JPG."
    )
  }

  let mapa: ImageBitmap
  try {
    mapa = await createImageBitmap(archivo)
  } catch {
    throw new ErrorDeImagen("No pudimos abrir esa imagen. Prueba con otra.")
  }

  const escala = Math.min(1, lado / Math.max(mapa.width, mapa.height))
  const lienzo = document.createElement("canvas")
  lienzo.width = Math.max(1, Math.round(mapa.width * escala))
  lienzo.height = Math.max(1, Math.round(mapa.height * escala))
  lienzo.getContext("2d")?.drawImage(mapa, 0, 0, lienzo.width, lienzo.height)
  mapa.close()

  for (const calidad of [0.85, 0.72, 0.6]) {
    const blob = await comoBlob(lienzo, "image/webp", calidad)
    if (blob && blob.size <= PESO_MAXIMO) return blob
  }

  throw new ErrorDeImagen(
    "Esa imagen sigue pesando más de 5 MB. Prueba con una más chica."
  )
}

function extensionDe(tipo: string) {
  if (tipo === "image/png") return "png"
  if (tipo === "image/jpeg") return "jpg"
  return "webp"
}

/**
 * Comprime y sube una imagen a la carpeta de la tienda. Devuelve su URL
 * pública, que es lo que se guarda en el borrador.
 */
export async function subirImagen(
  tiendaId: string,
  carpeta: Carpeta,
  archivo: File
): Promise<string> {
  const supabase = createClient()
  if (!supabase) {
    throw new ErrorDeImagen("En modo demo no se suben imágenes.")
  }

  const blob = await comprimirImagen(archivo, carpeta === "logo" ? 1024 : 2000)
  const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const ruta = `${tiendaId}/${carpeta}/${nombre}.${extensionDe(blob.type)}`

  const { error } = await supabase.storage.from(BUCKET).upload(ruta, blob, {
    contentType: blob.type,
    cacheControl: "31536000",
    upsert: false,
  })

  if (error) {
    const mensaje = error.message.toLowerCase()
    throw new ErrorDeImagen(
      mensaje.includes("size") || mensaje.includes("large")
        ? "La imagen pesa más de 5 MB. Prueba con una más chica."
        : mensaje.includes("mime") || mensaje.includes("type")
          ? "Ese formato no se acepta. Usa JPG, PNG o WebP."
          : "No pudimos subir la imagen. Revisa tu conexión e inténtalo de nuevo."
    )
  }

  return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl
}

/** Las fotos que ya subió la tienda, de la más nueva a la más vieja. */
export async function listarBiblioteca(
  tiendaId: string
): Promise<ImagenDeBiblioteca[]> {
  const supabase = createClient()
  if (!supabase) return []

  const carpeta = `${tiendaId}/imagenes`
  const { data, error } = await supabase.storage.from(BUCKET).list(carpeta, {
    limit: 60,
    sortBy: { column: "created_at", order: "desc" },
  })

  if (error || !data) return []

  return data
    .filter((archivo) => archivo.id && !archivo.name.startsWith("."))
    .map((archivo) => ({
      url: supabase.storage
        .from(BUCKET)
        .getPublicUrl(`${carpeta}/${archivo.name}`).data.publicUrl,
      nombre: archivo.name,
      fecha: archivo.created_at ?? null,
    }))
}
