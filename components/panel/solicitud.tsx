"use client"

import * as React from "react"
import { Check, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import type { Decision } from "@/app/(privado)/panel/vendedores/acciones"

/**
 * Responder a quien pidió vender para la tienda.
 *
 * Aprobar va en tinta llena y no en rojo: con dos o tres solicitudes, una
 * columna de botones rojos competiría con todo lo demás. Lo que avisa que
 * hay algo esperando es el panel mismo, primero en la pantalla.
 */
export function DecidirSolicitud({
  id,
  nombre,
  decidir,
  soloLectura = false,
}: {
  id: string
  nombre: string
  decidir: (
    id: string,
    decision: Decision
  ) => Promise<{ ok: boolean; error?: string }>
  soloLectura?: boolean
}) {
  const [enCurso, setEnCurso] = React.useState<Decision | null>(null)

  async function responder(decision: Decision) {
    if (soloLectura) {
      toast.info("Estás en modo demo: los cambios no se guardan.")
      return
    }

    if (
      decision === "rechazado" &&
      !window.confirm(
        `¿Rechazar a ${nombre}? No va a poder vender tus productos, aunque comparta tu tienda.`
      )
    ) {
      return
    }

    setEnCurso(decision)
    const resultado = await decidir(id, decision)
    setEnCurso(null)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos guardar tu respuesta.")
      return
    }

    toast.success(
      decision === "activo"
        ? `${nombre} ya puede vender para ti.`
        : `Rechazaste la solicitud de ${nombre}.`
    )
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => responder("activo")}
        disabled={enCurso !== null}
        className="flex min-h-11 items-center gap-2 rounded-plantilla bg-tinta px-4 text-sm font-semibold text-papel transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        {enCurso === "activo" ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Check aria-hidden="true" className="size-4" />
        )}
        Aprobar
      </button>
      <button
        type="button"
        onClick={() => responder("rechazado")}
        disabled={enCurso !== null}
        aria-label={`Rechazar a ${nombre}`}
        className="flex min-h-11 items-center gap-2 rounded-plantilla border border-tinta/25 px-3 text-sm font-semibold transition-colors hover:border-tinta disabled:opacity-60"
      >
        {enCurso === "rechazado" ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <X aria-hidden="true" className="size-4" />
        )}
        <span className="hidden sm:inline">Rechazar</span>
      </button>
    </div>
  )
}
