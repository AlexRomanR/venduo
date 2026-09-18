"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

/**
 * Tomar un producto del catálogo.
 *
 * No espera aprobación de nadie: publicar el producto ya fue el consentimiento
 * del negocio. `take_product` devuelve el código y la pantalla se refresca,
 * así el enlace aparece donde estaba el botón.
 */
export function TomarProducto({
  productoId,
  nombre,
  className,
}: {
  productoId: string
  nombre: string
  className?: string
}) {
  const router = useRouter()
  const [enCurso, setEnCurso] = React.useState(false)

  async function tomar() {
    const supabase = createClient()
    if (!supabase) {
      toast.error("En modo demo no se guardan enlaces nuevos.")
      return
    }

    setEnCurso(true)
    const { error } = await supabase.rpc("take_product", {
      p_product_id: productoId,
    })

    if (error) {
      setEnCurso(false)
      toast.error(
        error.message.includes("propio")
          ? "Ese producto es de tu propio negocio."
          : "No pudimos crear tu enlace. Intenta de nuevo."
      )
      return
    }

    toast.success(`${nombre} ya es parte de lo que promocionas.`)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={tomar}
      disabled={enCurso}
      className={cn(
        "flex min-h-11 w-full items-center justify-center gap-2 rounded-plantilla bg-senal px-4 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-senal-alta active:scale-[0.98] disabled:opacity-60 motion-reduce:active:scale-100",
        className
      )}
    >
      {enCurso ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Plus aria-hidden="true" className="size-4" />
      )}
      Promocionar
    </button>
  )
}

/**
 * Dejar de promocionar. Dos toques: el primero pregunta.
 *
 * El enlace que ya circula sigue pagando; solo sale de la lista. Por eso no
 * hace falta un diálogo que asuste: no se pierde nada.
 */
export function SoltarProducto({
  productoId,
  nombre,
}: {
  productoId: string
  nombre: string
}) {
  const router = useRouter()
  const [confirmando, setConfirmando] = React.useState(false)
  const [enCurso, setEnCurso] = React.useState(false)

  React.useEffect(() => {
    if (!confirmando) return
    const t = setTimeout(() => setConfirmando(false), 4000)
    return () => clearTimeout(t)
  }, [confirmando])

  async function soltar() {
    if (!confirmando) {
      setConfirmando(true)
      return
    }

    const supabase = createClient()
    if (!supabase) {
      toast.error("En modo demo no se guardan cambios.")
      return
    }

    setEnCurso(true)
    const { error } = await supabase.rpc("release_product", {
      p_product_id: productoId,
    })
    setEnCurso(false)

    if (error) {
      toast.error("No pudimos quitarlo. Intenta de nuevo.")
      return
    }

    toast.success(`Quitaste ${nombre} de tu lista.`)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={soltar}
      disabled={enCurso}
      className={cn(
        "flex min-h-11 items-center gap-1.5 px-2 text-xs font-semibold transition-colors",
        confirmando ? "text-senal" : "opacity-55 hover:opacity-100"
      )}
    >
      {enCurso ? (
        <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
      ) : confirmando ? (
        <Check aria-hidden="true" className="size-3.5" />
      ) : null}
      {confirmando ? "Toca otra vez para quitarlo" : "Dejar de promocionar"}
    </button>
  )
}
