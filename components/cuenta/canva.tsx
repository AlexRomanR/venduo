"use client"

import * as React from "react"
import { LoaderCircle, Unplug } from "lucide-react"
import { toast } from "sonner"

import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { desconectarDeCanva } from "@/app/(privado)/cuenta/acciones"

/** Si Venduo tiene acceso a la cuenta de Canva de la persona, y cómo quitárselo. */
export function ConexionCanva({ conectado }: { conectado: boolean }) {
  const [trabajando, empezar] = React.useTransition()

  if (!conectado) {
    return (
      <p className="max-w-[60ch] text-sm leading-relaxed opacity-70">
        Todavía no conectaste tu cuenta de Canva. Se conecta la primera vez que
        tocas «Editar en Canva» en un catálogo, y desde ahí no te vuelve a pedir
        permiso.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-[60ch] text-sm leading-relaxed">
        Tu cuenta de Canva está conectada: tus catálogos se abren en Canva sin
        pedirte permiso cada vez.
      </p>
      <button
        type="button"
        disabled={trabajando}
        onClick={() =>
          empezar(async () => {
            const resultado = await desconectarDeCanva()
            if (resultado.ok) {
              toast("Listo: Venduo ya no tiene acceso a tu Canva.")
            } else {
              toast.error(resultado.error)
            }
          })
        }
        className={cn(BOTON_SECUNDARIO, "min-h-11 shrink-0 px-4 text-sm")}
      >
        {trabajando ? (
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin motion-reduce:animate-none"
          />
        ) : (
          <Unplug aria-hidden="true" className="size-4" />
        )}
        Desconectar Canva
      </button>
    </div>
  )
}
