"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Copy, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

/**
 * El enlace de invitación de la tienda, como cuerpo de su panel.
 *
 * Lleva la tienda y el código juntos (`?t=slug&inv=codigo`) para que aceptar
 * la invitación no necesite traducir código a tienda: ese endpoint sería justo
 * la herramienta para averiguar por descarte qué códigos son válidos.
 */
export function EnlaceInvitacion({
  slug,
  codigo,
  siteUrl,
  soloLectura = false,
}: {
  slug: string
  codigo: string
  siteUrl: string
  soloLectura?: boolean
}) {
  const router = useRouter()
  const [actual, setActual] = React.useState(codigo)
  const [rotando, setRotando] = React.useState(false)

  const enlace = `${siteUrl}/sumarme?t=${slug}&inv=${actual}`

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace)
      toast.success("Enlace copiado.")
    } catch {
      toast.error("No pudimos copiarlo. Selecciónalo y cópialo a mano.")
    }
  }

  async function rotar() {
    const supabase = createClient()
    if (!supabase || soloLectura) {
      toast.info("Estás en modo demo: los cambios no se guardan.")
      return
    }

    setRotando(true)
    const { data, error } = await supabase.rpc("rotate_seller_invite")
    setRotando(false)

    if (error) {
      toast.error("No pudimos generar un enlace nuevo. Intenta de nuevo.")
      return
    }

    setActual(String(data))
    toast.success("Enlace nuevo. El anterior dejó de servir.")
    // El navegador guarda la pantalla un rato: sin esto, volver a ella
    // mostraría el enlace que acaba de dejar de servir.
    router.refresh()
  }

  return (
    <>
      <p className="border border-tinta/15 bg-tinta/[0.03] px-3 py-3 font-mono text-xs leading-relaxed break-all">
        {enlace}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copiar}
          className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
        >
          <Copy aria-hidden="true" className="size-4" />
          Copiar enlace
        </button>
        <button
          type="button"
          onClick={rotar}
          disabled={rotando}
          className="flex min-h-11 items-center gap-2 px-2 text-sm font-semibold transition-colors hover:text-senal disabled:opacity-60"
        >
          {rotando ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <RefreshCw aria-hidden="true" className="size-4" />
          )}
          Generar uno nuevo
        </button>
      </div>

      <p className="text-xs leading-relaxed opacity-70">
        Si se filtró, genera uno nuevo: el anterior deja de funcionar en el acto
        y quienes ya entraron siguen dentro.
      </p>
    </>
  )
}
