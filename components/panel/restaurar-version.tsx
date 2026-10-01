"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, RotateCcw, X } from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * Volver a una versión del historial.
 *
 * Pide confirmación porque cambia lo que ve cada comprador en ese momento, y
 * lo dice sin rodeos: lo que vuelve y que lo de ahora queda guardado. Esa
 * segunda parte es la que quita el miedo a tocar el botón.
 */
export function RestaurarVersion({
  version,
  numero,
  descripcion,
  restaurar,
  className,
}: {
  version: string
  numero: number
  descripcion: string
  restaurar: (entrada: {
    version: string
  }) => Promise<{ ok: boolean; error?: string }>
  className?: string
}) {
  const router = useRouter()
  const [abierto, setAbierto] = React.useState(false)
  const [enCurso, setEnCurso] = React.useState(false)
  const etiqueta = String(numero).padStart(2, "0")

  async function confirmar() {
    setEnCurso(true)
    const resultado = await restaurar({ version })
    setEnCurso(false)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos restaurar esa versión.")
      return
    }

    setAbierto(false)
    toast.success(`Tu tienda volvió a la versión ${etiqueta}.`, {
      description: "Lo que tenías antes quedó guardado en el historial.",
    })
    router.refresh()
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(valor) => !enCurso && setAbierto(valor)}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Restaurar la versión ${etiqueta}`}
          className={cn(
            "inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold transition-colors hover:text-senal",
            className
          )}
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          Restaurar
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[92svh] gap-0 overflow-y-auto rounded-none border-2 border-tinta bg-papel p-0 text-tinta shadow-none sm:max-w-lg"
      >
        <div className="flex items-start gap-4 border-b border-tinta/15 p-5 sm:p-6">
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
              Historial de diseño
            </p>
            <DialogTitle className="mt-2 font-titular text-2xl leading-tight font-extrabold tracking-[-0.03em]">
              Volver a la versión {etiqueta}
            </DialogTitle>
            <p className="mt-1 text-sm opacity-60">{descripcion}</p>
          </div>
          <DialogClose
            aria-label="Cerrar"
            disabled={enCurso}
            className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal"
          >
            <X aria-hidden="true" className="size-5" />
          </DialogClose>
        </div>

        <div className="p-5 sm:p-6">
          <DialogDescription className="text-sm leading-relaxed text-tinta/70">
            Tu tienda vuelve a verse como en ese momento: la plantilla, los
            colores, el logo y las secciones de la portada con sus textos. Tus
            productos, pedidos y vendedores no se tocan.
          </DialogDescription>
          <p className="mt-4 border-l-2 border-tinta pl-3 text-sm leading-relaxed">
            Antes de volver guardamos cómo está ahora. Si te arrepientes, lo
            restauras desde este mismo historial.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-tinta/15 p-5 sm:flex-row sm:justify-end sm:p-6">
          <DialogClose asChild>
            <button
              type="button"
              disabled={enCurso}
              className={BOTON_SECUNDARIO}
            >
              Cancelar
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={confirmar}
            disabled={enCurso}
            className={BOTON_PRIMARIO}
          >
            {enCurso ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <RotateCcw aria-hidden="true" className="size-4" />
            )}
            Restaurar la versión {etiqueta}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
