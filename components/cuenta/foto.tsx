"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader2, Upload, UserRound } from "lucide-react"
import { toast } from "sonner"

import { BUCKETS, uploadFile } from "@/lib/supabase/storage"
import { createClient } from "@/lib/supabase/client"
import { BOTON_SECUNDARIO } from "@/lib/estilos"

/**
 * Foto de perfil.
 *
 * Sube primero al bucket y recién después guarda la URL: si el guardado
 * fallara, queda un archivo huérfano —barato— en vez de un perfil apuntando a
 * algo que no existe.
 */
export function Foto({
  userId,
  urlActual,
  nombre,
}: {
  userId: string
  urlActual: string | null
  nombre: string
}) {
  const router = useRouter()
  const entrada = React.useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = React.useState(false)
  const [url, setUrl] = React.useState(urlActual)

  async function elegir(archivo: File | undefined) {
    if (!archivo) return

    const supabase = createClient()
    if (!supabase) {
      toast.error("Falta configurar Supabase en .env.local")
      return
    }

    setSubiendo(true)

    try {
      const subida = await uploadFile(BUCKETS.avatars, archivo, userId)

      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: subida.url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) throw new Error(error.message)

      setUrl(subida.url)
      toast.success("Foto actualizada.")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.includes("MB")
          ? error.message
          : "No pudimos subir la foto. Intenta con otra imagen."
      )
    } finally {
      setSubiendo(false)
      if (entrada.current) entrada.current.value = ""
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="size-20 shrink-0 overflow-hidden border border-tinta bg-tinta/5">
        {url ? (
          <Image
            src={url}
            alt={`Foto de ${nombre}`}
            width={160}
            height={160}
            unoptimized
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <UserRound aria-hidden="true" className="size-7 opacity-25" />
          </div>
        )}
      </div>

      <div>
        <input
          ref={entrada}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(e) => elegir(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={subiendo}
          className={BOTON_SECUNDARIO}
        >
          {subiendo ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Upload aria-hidden="true" className="size-4" />
          )}
          {url ? "Cambiar foto" : "Subir foto"}
        </button>
        <p className="mt-2 text-xs opacity-55">JPG, PNG o WEBP. Hasta 5 MB.</p>
      </div>
    </div>
  )
}
