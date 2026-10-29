"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, TreePalm } from "lucide-react"
import { toast } from "sonner"

import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { diaEnPalabras } from "@/lib/vacaciones"

/**
 * La franja del Resumen mientras la tienda está de vacaciones. En tinta y no
 * en rojo: la eligió la persona, no es algo que falte hacer.
 */
export function FranjaDeVacaciones({
  hasta,
  reactivar,
}: {
  hasta: string | null
  reactivar: (entrada: {
    activa: boolean
    hasta: string | null
  }) => Promise<{ ok: true } | { ok: false; error: string }>
}) {
  const router = useRouter()
  const [enCurso, setEnCurso] = React.useState(false)

  async function alReactivar() {
    setEnCurso(true)
    const resultado = await reactivar({ activa: false, hasta: null }).catch(
      () => ({
        ok: false as const,
        error: "No pudimos cambiar tus vacaciones. Revisa tu conexión.",
      })
    )
    setEnCurso(false)
    if (!resultado.ok) {
      toast.error(resultado.error)
      return
    }
    toast.success("Tu tienda vuelve a recibir pedidos.")
    router.refresh()
  }

  return (
    <section
      aria-label="Vacaciones"
      className="flex flex-col gap-4 border border-tinta px-4 py-4 sm:px-5 lg:flex-row lg:items-center"
    >
      <TreePalm aria-hidden="true" className="size-5 shrink-0 max-lg:hidden" />
      <div className="min-w-0 flex-1">
        <p className="font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
          {hasta
            ? `De vacaciones hasta el ${diaEnPalabras(hasta)}`
            : "De vacaciones, sin fecha de vuelta"}
        </p>
        <p className="mt-0.5 text-sm text-tinta/65">
          Tu tienda se ve, pero no recibe pedidos.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void alReactivar()}
        disabled={enCurso}
        className={cn(BOTON_SECUNDARIO, "min-h-11 shrink-0 px-5 text-sm")}
      >
        {enCurso ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : null}
        Reactivar
      </button>
    </section>
  )
}
