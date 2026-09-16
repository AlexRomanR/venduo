"use client"

import * as React from "react"
import { Copy, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

/**
 * El enlace de invitación de la tienda.
 *
 * Lleva la tienda y el código juntos (`?t=slug&inv=codigo`) para que aceptar
 * la invitación no necesite traducir código a tienda: ese endpoint sería justo
 * la herramienta para averiguar por descarte qué códigos son válidos.
 */
export function EnlaceInvitacion({
  slug,
  codigo,
  siteUrl,
}: {
  slug: string
  codigo: string | null
  siteUrl: string
}) {
  const [actual, setActual] = React.useState(codigo)
  const [rotando, setRotando] = React.useState(false)

  const enlace = actual ? `${siteUrl}/sumarme?t=${slug}&inv=${actual}` : null

  async function copiar() {
    if (!enlace) return
    try {
      await navigator.clipboard.writeText(enlace)
      toast.success("Enlace copiado.")
    } catch {
      toast.error("No pudimos copiarlo. Selecciónalo y cópialo a mano.")
    }
  }

  async function rotar() {
    const supabase = createClient()
    if (!supabase) {
      toast.error("Falta configurar Supabase en .env.local")
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
  }

  if (!enlace) return null

  return (
    <div className="rounded-lg border p-4">
      <h2 className="font-medium">Tu enlace de invitación</h2>
      <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        Quien entre por aquí queda activo al instante, sin pasar por tu
        aprobación. Compártelo solo con quienes quieres que vendan para ti.
      </p>

      <p className="mt-4 rounded-md bg-muted/50 p-3 font-mono text-xs break-all">
        {enlace}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={copiar}>
          <Copy />
          Copiar enlace
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={rotar}
          disabled={rotando}
        >
          {rotando ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Generar uno nuevo
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Si el enlace se filtró, genera uno nuevo: el anterior deja de funcionar
        de inmediato y quienes ya entraron siguen dentro.
      </p>
    </div>
  )
}
