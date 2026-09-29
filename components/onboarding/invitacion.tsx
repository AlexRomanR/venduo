"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, MailCheck } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"

/**
 * Alguien llegó con un enlace de invitación.
 *
 * La tienda viaja en el mismo enlace (`?t=slug&inv=codigo`) en vez de
 * resolverse desde el código. Así no hace falta un endpoint que traduzca
 * código a tienda, que sería justo la herramienta para averiguar por descarte
 * qué código es válido.
 */
export function Invitacion({
  slug,
  nombre,
  codigo,
}: {
  slug: string
  nombre: string | null
  codigo: string
}) {
  const router = useRouter()
  const [enCurso, setEnCurso] = React.useState(false)

  async function aceptar() {
    const supabase = createClient()
    if (!supabase) {
      toast.error("Falta configurar Supabase en .env.local")
      return
    }

    setEnCurso(true)

    const { error } = await supabase.rpc("join_store", {
      p_store_slug: slug,
      p_invite_code: codigo,
    })

    setEnCurso(false)

    if (error) {
      toast.error(
        error.message.includes("tu propia tienda")
          ? "Esa es tu propia tienda."
          : "No pudimos usar esa invitación. Pídele al dueño que te la reenvíe."
      )
      return
    }

    toast.success("Listo, ya eres vendedor de esa tienda.")
    router.push("/vendedor")
    router.refresh()
  }

  return (
    <div className="campo-senal mb-12 bg-senal px-5 py-6 text-white sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex-1">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase">
            <MailCheck aria-hidden="true" className="size-4" />
            Te invitaron
          </p>
          <h2 className="mt-3 max-w-[22ch] font-titular text-[clamp(1.4rem,4vw,2rem)] leading-[1.06] font-extrabold tracking-[-0.03em]">
            {nombre
              ? `Vas a vender para ${nombre}`
              : "Tienes una invitación para vender"}
          </h2>
          <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-white/75">
            Con esta invitación entras al instante, sin esperar aprobación.
          </p>
        </div>

        <button
          type="button"
          onClick={aceptar}
          disabled={enCurso}
          className="flex min-h-12 items-center justify-center gap-2 rounded-sm border-2 border-white px-6 font-semibold transition-colors hover:bg-white hover:text-senal disabled:opacity-60"
        >
          {enCurso ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          Aceptar invitación
        </button>
      </div>
    </div>
  )
}
