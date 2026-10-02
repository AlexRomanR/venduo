"use client"

import * as React from "react"
import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  LoaderCircle,
  Paintbrush,
  X,
} from "lucide-react"
import { toast } from "sonner"

import type { Catalogo } from "@/lib/catalogos/modelo"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { descargarPdf } from "@/components/catalogos/editor/exportar"
import { guardarCatalogo } from "@/app/(privado)/panel/catalogos/acciones"

/*
 * "Editar en Canva": seguir el catálogo en Canva, con todo editable.
 *
 * Dos caminos. **Directo**, si la integración con Canva está configurada: se
 * guarda el catálogo, la persona autoriza y Canva lo abre ya convertido en un
 * diseño suyo. **A mano**, si no: se baja el PDF y se abre el editor de PDF de
 * Canva, que lo convierte al subirlo. El resultado es el mismo; el segundo
 * pide un paso más.
 *
 * En los dos, lo que queda en Canva es una copia: los precios y el stock ya no
 * se actualizan solos.
 */

const CANVA_PDF = "https://www.canva.com/pdf-editor/"

export type ModoDeCanva = "directo" | "a-mano"

export const AVISOS_DE_CANVA: Record<string, string> = {
  fallo:
    "Canva no pudo abrir el catálogo. Bájalo en PDF y súbelo a Canva a mano.",
  cancelado: "No se abrió Canva: hace falta que des el permiso.",
  "sin-conectar":
    "Canva todavía no está conectado: el catálogo se lleva en PDF, a mano.",
}

export function BotonDeCanva({
  catalogo,
  modo,
  guardado,
  sinGuardar,
  deshabilitado,
  alGuardar,
}: {
  catalogo: Catalogo
  modo: ModoDeCanva
  guardado: { id: string; enlace: string } | null
  sinGuardar: boolean
  deshabilitado: boolean
  alGuardar: (guardado: { id: string; enlace: string }) => void
}) {
  const [trabajando, setTrabajando] = React.useState(false)
  const [abierto, setAbierto] = React.useState(false)
  const [descarga, setDescarga] = React.useState<"bajando" | "lista" | "error">(
    "bajando"
  )

  function aMano() {
    // Las dos cosas en el mismo toque: abrir una pestaña después de esperar
    // algo la bloquea el navegador.
    window.open(CANVA_PDF, "_blank", "noopener")
    setDescarga("bajando")
    setAbierto(true)
    descargarPdf(catalogo)
      .then(() => setDescarga("lista"))
      .catch((error: unknown) => {
        setDescarga("error")
        toast.error(
          error instanceof Error ? error.message : "No pudimos armar el PDF."
        )
      })
  }

  async function directo() {
    // La pestaña se abre ya, en el toque; se la manda a Canva cuando el
    // catálogo está guardado.
    const pestana = window.open("", "_blank")
    if (pestana) {
      pestana.document.title = "Abriendo Canva…"
      pestana.document.body.innerHTML =
        '<p style="font:16px system-ui,sans-serif;padding:24px">Abriendo Canva…</p>'
    }
    setTrabajando(true)
    try {
      let id = guardado?.id ?? null
      if (!id || sinGuardar) {
        const resultado = await guardarCatalogo(id, catalogo)
        if (!resultado.ok) {
          pestana?.close()
          toast.error(resultado.error)
          return
        }
        alGuardar({ id: resultado.id, enlace: resultado.enlace })
        if (!guardado) {
          window.history.replaceState(
            null,
            "",
            `/panel/catalogos/${resultado.id}`
          )
        }
        id = resultado.id
      }
      const destino = `/panel/catalogos/${id}/canva`
      if (pestana) pestana.location.href = destino
      else window.location.href = destino
    } finally {
      setTrabajando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={modo === "directo" ? directo : aMano}
        disabled={deshabilitado || trabajando}
        className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
      >
        {trabajando ? (
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin motion-reduce:animate-none"
          />
        ) : (
          <Paintbrush aria-hidden="true" className="size-4" />
        )}
        Editar en Canva
      </button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent
          showCloseButton={false}
          className="gap-0 rounded-none border-2 border-tinta bg-papel p-0 text-tinta shadow-none sm:max-w-md"
        >
          <div className="flex items-start gap-4 border-b border-tinta/15 p-5">
            <DialogTitle className="flex-1 font-titular text-xl leading-tight font-extrabold tracking-[-0.02em]">
              Sigue en Canva
            </DialogTitle>
            <DialogClose
              aria-label="Cerrar"
              className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal"
            >
              <X aria-hidden="true" className="size-5" />
            </DialogClose>
          </div>
          <DialogDescription asChild>
            <ol className="flex flex-col gap-4 p-5 text-sm leading-relaxed text-tinta">
              <li className="flex gap-3">
                <Paso numero={1} />
                <span className="flex items-start gap-2">
                  {descarga === "bajando" ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 animate-spin motion-reduce:animate-none"
                    />
                  ) : descarga === "lista" ? (
                    <CircleCheck
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                  ) : (
                    <CircleAlert
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-senal"
                    />
                  )}
                  <span aria-live="polite">
                    {descarga === "bajando"
                      ? "Tu catálogo se está bajando en PDF."
                      : descarga === "lista"
                        ? "Tu catálogo ya está en Descargas, en PDF."
                        : "No se pudo bajar el PDF. Ciérralo y vuelve a intentarlo."}
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <Paso numero={2} />
                <span>
                  En la pestaña de Canva que se abrió, toca{" "}
                  <strong>Subir tu PDF</strong> y elige ese archivo.
                </span>
              </li>
              <li className="flex gap-3">
                <Paso numero={3} />
                <span>
                  Canva lo convierte en un diseño que editas entero: textos,
                  fotos, colores y todo lo demás.
                </span>
              </li>
            </ol>
          </DialogDescription>
          <p className="border-t border-tinta/15 px-5 py-4 text-xs leading-relaxed opacity-70">
            Lo que queda en Canva es una copia: si cambian tus precios o tu
            stock, vuelve a mandarlo desde acá.
          </p>
          <div className="flex flex-col-reverse gap-3 border-t border-tinta/15 p-5 sm:flex-row sm:justify-end">
            <a
              href={CANVA_PDF}
              target="_blank"
              rel="noopener"
              className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              Abrir Canva otra vez
            </a>
            <DialogClose asChild>
              <button
                type="button"
                className={cn(BOTON_PRIMARIO, "min-h-11 px-4 text-sm")}
              >
                Listo
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Paso({ numero }: { numero: number }) {
  return (
    <span
      aria-hidden="true"
      className="tabular flex size-6 shrink-0 items-center justify-center bg-tinta text-xs font-bold text-papel"
    >
      {numero}
    </span>
  )
}
