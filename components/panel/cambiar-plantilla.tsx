"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import type { CambioDePlantilla } from "@/app/(privado)/panel/apariencia/acciones"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

/**
 * Pasar la tienda a otra plantilla.
 *
 * Pide confirmación porque cambia lo que ve cada comprador en ese mismo
 * momento, y ofrece una sola decisión: conservar las secciones —lo seguro,
 * porque sus textos pueden ser trabajo del emprendedor— o empezar con las de la
 * plantilla nueva. Las dos guardan antes el diseño anterior.
 */
export function CambiarPlantilla({
  clave,
  nombre,
  plantillaActual,
  cambiar,
}: {
  clave: string
  nombre: string
  plantillaActual: string
  cambiar: (
    entrada: CambioDePlantilla
  ) => Promise<{ ok: boolean; error?: string }>
}) {
  const router = useRouter()
  const [abierto, setAbierto] = React.useState(false)
  const [conservar, setConservar] = React.useState(true)
  const [enCurso, setEnCurso] = React.useState(false)

  async function confirmar() {
    setEnCurso(true)
    const resultado = await cambiar({ clave, conservarSecciones: conservar })
    setEnCurso(false)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos cambiar la plantilla.")
      return
    }

    setAbierto(false)
    toast.success(`Tu tienda ahora usa ${nombre}.`)
    // El layout vuelve a pintar el tema: el panel cambia de piel en el acto.
    router.refresh()
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(valor) => !enCurso && setAbierto(valor)}
    >
      <DialogTrigger asChild>
        <button type="button" className={cn(BOTON_SECUNDARIO, "w-full")}>
          Usar {nombre}
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[92svh] gap-0 overflow-y-auto rounded-none border-2 border-tinta bg-papel p-0 text-tinta shadow-none sm:max-w-lg"
      >
        <div className="flex items-start gap-4 border-b border-tinta/15 p-5 sm:p-6">
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
              Cambiar de plantilla
            </p>
            <DialogTitle className="mt-2 font-titular text-2xl leading-tight font-extrabold tracking-[-0.03em]">
              Pasar de {plantillaActual} a {nombre}
            </DialogTitle>
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
          {/* Sin miniatura: ya está en la tarjeta que abrió esto, y con ella el
              botón de confirmar quedaba debajo del borde en una laptop. */}
          <DialogDescription className="text-sm leading-relaxed text-tinta/70">
            Cambia cómo se ve tu tienda y este panel. Tus productos, categorías
            y pedidos no se tocan. Antes de cambiar guardamos tu diseño actual.
          </DialogDescription>

          <fieldset className="mt-6">
            <legend className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
              Las secciones de tu portada
            </legend>

            <div className="mt-3 flex flex-col gap-2">
              <Opcion
                nombre="secciones"
                activa={conservar}
                onElegir={() => setConservar(true)}
                titulo="Conservar las mías"
                texto="Tus textos y el orden de tu portada quedan igual; cambia solo cómo se ven."
              />
              <Opcion
                nombre="secciones"
                activa={!conservar}
                onElegir={() => setConservar(false)}
                titulo={`Empezar con las de ${nombre}`}
                texto="Tu portada se arma con las secciones y textos de ejemplo de la plantilla."
              />
            </div>
          </fieldset>
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
            ) : null}
            Usar {nombre}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Opcion({
  nombre,
  activa,
  onElegir,
  titulo,
  texto,
}: {
  nombre: string
  activa: boolean
  onElegir: () => void
  titulo: string
  texto: string
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 border p-4 transition-colors",
        activa
          ? "border-tinta bg-tinta/[0.04]"
          : "border-tinta/20 hover:border-tinta/50"
      )}
    >
      <input
        type="radio"
        name={nombre}
        checked={activa}
        onChange={onElegir}
        className="mt-1 size-4 shrink-0"
      />
      <span>
        <span className="block text-sm font-semibold">{titulo}</span>
        <span className="mt-1 block text-sm leading-relaxed opacity-65">
          {texto}
        </span>
      </span>
    </label>
  )
}
