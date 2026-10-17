import { env } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const BUCKET = "store-assets"

/**
 * Las fotos que TikTok baja para publicar (`PULL_FROM_URL`).
 *
 * TikTok solo baja de un dominio que verificó, así que la foto se sirve desde
 * acá y no desde el almacenamiento: `/api/tiktok/foto/{tienda}/{archivo}.jpg`.
 * Es pública —TikTok entra sin sesión—, pero el nombre del archivo es un valor
 * al azar que solo conoce quien la publicó, y se borra al terminar.
 *
 * La misma ruta sirve el archivo con que TikTok verifica el dominio
 * (`TIKTOK_VERIFICACION`, "nombre.txt=contenido"), que tiene que estar en la
 * misma dirección que las fotos.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ ruta: string[] }> }
) {
  const { ruta } = await params

  if (ruta.length === 1 && env.TIKTOK_VERIFICACION) {
    const separador = env.TIKTOK_VERIFICACION.indexOf("=")
    const nombre = env.TIKTOK_VERIFICACION.slice(0, separador)
    if (separador > 0 && ruta[0] === nombre) {
      return new Response(env.TIKTOK_VERIFICACION.slice(separador + 1), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }
  }

  const [tienda, archivo] = ruta
  if (
    ruta.length !== 2 ||
    !/^[0-9a-f-]{36}$/.test(tienda ?? "") ||
    !/^[A-Za-z0-9_-]{20,64}\.jpg$/.test(archivo ?? "")
  ) {
    return new Response("No existe.", { status: 404 })
  }

  const admin = createAdminClient()
  if (!admin) return new Response("No existe.", { status: 404 })
  const { data } = await admin.storage
    .from(BUCKET)
    .download(`${tienda}/tiktok/${archivo}`)
  if (!data) return new Response("No existe.", { status: 404 })

  return new Response(data, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, no-store",
    },
  })
}
