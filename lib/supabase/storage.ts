import { createClient } from "./client"

/** Buckets del proyecto. Se crean con la migración `0002_app_schema.sql`. */
export const BUCKETS = {
  /** Público: fotos de productos y logos de tienda. */
  productImages: "product-images",
  /** Privado: comprobantes de pago subidos por el comprador. */
  paymentProofs: "payment-proofs",
} as const

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS]

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]

export interface UploadResult {
  path: string
  /** URL pública (buckets públicos) o firmada por 1 hora (privados). */
  url: string
}

function safeName(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin"
  return `${crypto.randomUUID()}.${ext}`
}

/**
 * Sube un archivo a Supabase Storage y devuelve la ruta y la URL para mostrarlo.
 * Lanza si Supabase no está configurado o si el archivo no pasa las validaciones.
 */
export async function uploadFile(
  bucket: BucketName,
  file: File,
  folder: string
): Promise<UploadResult> {
  const supabase = createClient()
  if (!supabase) {
    throw new Error(
      "Supabase no está configurado. Completá .env.local para poder subir archivos."
    )
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("El archivo supera los 5 MB.")
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Formato no admitido. Usá JPG, PNG, WEBP o AVIF.")
  }

  const path = `${folder}/${safeName(file.name)}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: false })

  if (error) throw new Error(error.message)

  if (bucket === BUCKETS.productImages) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return { path, url: data.publicUrl }
  }

  const { data, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60)

  if (signError) throw new Error(signError.message)

  return { path, url: data.signedUrl }
}

/** Borra un archivo previamente subido. */
export async function removeFile(bucket: BucketName, path: string) {
  const supabase = createClient()
  if (!supabase) return

  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(error.message)
}
