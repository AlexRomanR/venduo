"use client"

import * as React from "react"
import { Copy, FileDown, MessageCircle, Share2 } from "lucide-react"
import { toast } from "sonner"

interface Props {
  slug: string
  telefono: string | null
  nombre: string
  puedeVerContacto: boolean
}

export function CVAcciones({
  slug,
  telefono,
  nombre,
  puedeVerContacto,
}: Props) {
  const [copiado, setCopiado] = React.useState(false)

  async function copiarEnlace() {
    try {
      const url = `${window.location.origin}/v/${slug}`
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      toast.success("Enlace del CV copiado al portapapeles")
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      toast.error("No se pudo copiar el enlace")
    }
  }

  const mensajeWhatsApp = encodeURIComponent(
    `Hola ${nombre}, vi tu perfil y CV comercial en Venduo. Me gustaría conversar sobre promocionar productos de mi negocio.`
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Botón Descargar PDF */}
      <a
        href={`/v/${slug}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-tinta px-5 text-sm font-semibold text-papel transition-colors hover:bg-tinta/85"
      >
        <FileDown className="size-4 text-senal" aria-hidden="true" />
        Descargar CV (PDF)
      </a>

      {/* Botón Contactar por WhatsApp si tiene acceso */}
      {puedeVerContacto && telefono ? (
        <a
          href={`https://wa.me/591${telefono}?text=${mensajeWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-tinta/25 bg-tinta/[0.04] px-4 text-sm font-semibold text-tinta transition-colors hover:border-tinta hover:bg-tinta/10"
        >
          <MessageCircle className="size-4 text-senal" aria-hidden="true" />
          Contactar por WhatsApp
        </a>
      ) : null}

      {/* Botón Copiar Enlace */}
      <button
        type="button"
        onClick={copiarEnlace}
        className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-tinta/25 bg-transparent px-4 text-sm font-semibold text-tinta transition-colors hover:border-tinta"
      >
        {copiado ? (
          <>
            <Share2 className="size-4 text-senal" aria-hidden="true" />
            Enlace copiado
          </>
        ) : (
          <>
            <Copy className="size-4 opacity-50" aria-hidden="true" />
            Compartir CV
          </>
        )}
      </button>
    </div>
  )
}
