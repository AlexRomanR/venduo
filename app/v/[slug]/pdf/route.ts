import { renderToBuffer } from "@react-pdf/renderer"

import { getPerfilPublico } from "@/lib/data/vendedor"
import { getSiteUrl } from "@/lib/env"
import { formatDate } from "@/lib/format"
import { toDataURL } from "@/lib/qr"
import { construirDocumentoCV } from "@/lib/cv/documento"

export const dynamic = "force-dynamic"

/**
 * Generación del CV del promotor en PDF con código QR de verificación.
 *
 * El documento certifica el historial laboral inalterable generado en Venduo.
 * El teléfono solo aparece si quien lo solicita es un negocio registrado o el propio
 * promotor, garantizando la privacidad de los jóvenes.
 */
export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const resultado = await getPerfilPublico(slug)

  if (!resultado) {
    return new Response("Perfil de promotor no encontrado.", { status: 404 })
  }

  const { perfil, puedeVerContacto } = resultado

  // Si no tiene permiso de negocio ni es el propio promotor, protegemos el teléfono en el PDF
  const perfilParaPDF = {
    ...perfil,
    phone: puedeVerContacto ? perfil.phone : null,
  }

  const urlPerfil = `${getSiteUrl()}/v/${slug}`
  const qrDataUrl = await toDataURL(urlPerfil, {
    size: 256,
    margin: 1,
    dark: "#16171a",
  })

  const fechaEmision = formatDate(new Date())
  const cuerpo = await renderToBuffer(
    construirDocumentoCV({
      perfil: perfilParaPDF,
      qrDataUrl,
      urlPerfil,
      fechaEmision,
    })
  )

  const nombreArchivo = `cv-${archivable(perfil.displayName)}.pdf`

  return new Response(new Uint8Array(cuerpo), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombreArchivo}"`,
      "Cache-Control": "no-store",
    },
  })
}

function archivable(texto: string) {
  return (
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "promotor"
  )
}
