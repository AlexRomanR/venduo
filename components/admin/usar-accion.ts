"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

/**
 * Correr una acción del administrador: ocupado mientras tanto, el aviso de
 * cómo salió y la pantalla al día después.
 */
export function useAccion() {
  const router = useRouter()
  const [enCurso, empezar] = React.useTransition()

  function correr(
    accion: () => Promise<{ ok: true } | { ok: false; error: string }>,
    exito: string
  ) {
    empezar(async () => {
      const resultado = await accion().catch(() => ({
        ok: false as const,
        error: "No se pudo guardar. Inténtalo de nuevo.",
      }))
      if (!resultado.ok) {
        toast.error(resultado.error)
        return
      }
      toast.success(exito)
      router.refresh()
    })
  }

  return { enCurso, correr }
}
