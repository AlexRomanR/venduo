"use client"

import * as React from "react"
import Image from "next/image"
import { Loader2, Store, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
  ErrorDeImagen,
  subirImagen,
  TIPOS_ACEPTADOS,
} from "@/lib/editor/imagenes"
import { cn } from "@/lib/utils"
import { useEditor } from "@/components/editor/contexto"

/**
 * El logo de la tienda: subirlo, cambiarlo o quitarlo.
 *
 * Se puede soltar encima o elegir del teléfono. Se comprime antes de subir y
 * entra al borrador como cualquier otro cambio: se ve al instante en la
 * cabecera de la vista previa y llega a la tienda recién al publicar.
 */
export function Logo() {
  const { borrador, tienda, esDemo } = useEditor()
  const [subiendo, setSubiendo] = React.useState(false)
  const [encima, setEncima] = React.useState(false)
  const entrada = React.useRef<HTMLInputElement>(null)
  const logo = borrador.presente.logoUrl

  async function usar(archivo: File) {
    if (esDemo) {
      toast.error("En modo demo no se suben imágenes.")
      return
    }
    setSubiendo(true)
    try {
      const url = await subirImagen(tienda.id, "logo", archivo)
      const resultado = borrador.aplicar([{ op: "logo", url }])
      if (resultado.ok) {
        toast.success("Tu logo ya se ve en la cabecera.")
      } else {
        toast.error(resultado.errores[0])
      }
    } catch (error) {
      toast.error(
        error instanceof ErrorDeImagen
          ? error.message
          : "No pudimos subir el logo. Inténtalo de nuevo."
      )
    } finally {
      setSubiendo(false)
      if (entrada.current) entrada.current.value = ""
    }
  }

  return (
    <div
      onDragOver={(evento) => {
        if (!evento.dataTransfer.types.includes("Files")) return
        evento.preventDefault()
        setEncima(true)
      }}
      onDragLeave={() => setEncima(false)}
      onDrop={(evento) => {
        evento.preventDefault()
        setEncima(false)
        const archivo = evento.dataTransfer.files[0]
        if (archivo) void usar(archivo)
      }}
      className={cn(
        "relative flex items-center gap-4 border border-dashed p-3 transition-colors",
        encima ? "border-senal bg-senal/[0.05]" : "border-tinta/25"
      )}
    >
      <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden border border-tinta/20 bg-white">
        {logo ? (
          <Image
            src={logo}
            alt="Tu logo"
            fill
            sizes="64px"
            className="object-contain p-1"
          />
        ) : (
          <Store aria-hidden="true" className="size-6 opacity-35" />
        )}
        {subiendo ? (
          <span className="absolute inset-0 flex items-center justify-center bg-papel/80">
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {subiendo
            ? "Subiendo tu logo…"
            : logo
              ? "Tu logo"
              : "Todavía sin logo"}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed opacity-55">
          {encima
            ? "Suéltalo para usarlo."
            : "Arrástralo acá o elígelo. JPG, PNG o WebP: lo achicamos por ti."}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-5">
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            disabled={subiendo}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal disabled:opacity-50"
          >
            <Upload aria-hidden="true" className="size-4" />
            {logo ? "Cambiar" : "Subir logo"}
          </button>
          {logo ? (
            <button
              type="button"
              onClick={() => borrador.aplicar([{ op: "logo", url: null }])}
              disabled={subiendo}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold opacity-70 transition-opacity hover:opacity-100 disabled:opacity-40"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Quitar
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={entrada}
        type="file"
        accept={TIPOS_ACEPTADOS.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(evento) => {
          const archivo = evento.target.files?.[0]
          if (archivo) void usar(archivo)
        }}
      />
    </div>
  )
}
