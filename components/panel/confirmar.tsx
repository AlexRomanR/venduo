"use client"

import * as React from "react"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { CerrarAviso, ContenidoDeAviso } from "@/components/panel/aviso"
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface Pregunta {
  titulo: string
  texto?: string
  /** Lo que dice el botón que confirma: "Cancelar el pedido", "Borrar". */
  confirmar: string
}

/**
 * Pedir confirmación antes de algo que no se deshace con un toque.
 *
 * Reemplaza a `window.confirm`, que el navegador dibuja a su manera —en
 * inglés en algunos teléfonos— y que no se puede leer con el resto del panel.
 * Se usa igual: `if (!(await preguntar({...}))) return`. El diálogo va en la
 * pantalla que lo pide, con `{dialogo}`.
 */
export function useConfirmacion() {
  const [pendiente, setPendiente] = React.useState<
    (Pregunta & { responder: (si: boolean) => void }) | null
  >(null)

  const preguntar = React.useCallback(
    (pregunta: Pregunta) =>
      new Promise<boolean>((responder) =>
        setPendiente({ ...pregunta, responder })
      ),
    []
  )

  function cerrar(si: boolean) {
    pendiente?.responder(si)
    setPendiente(null)
  }

  const dialogo = (
    <AlertDialog
      open={pendiente !== null}
      onOpenChange={(abierto) => {
        if (!abierto) cerrar(false)
      }}
    >
      <ContenidoDeAviso>
        <div className="p-5 sm:p-6">
          <AlertDialogTitle className="font-titular text-2xl leading-tight font-extrabold tracking-[-0.03em]">
            {pendiente?.titulo}
          </AlertDialogTitle>
          {pendiente?.texto ? (
            <AlertDialogDescription className="mt-3 text-sm leading-relaxed text-tinta/70">
              {pendiente.texto}
            </AlertDialogDescription>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-tinta/15 p-5 sm:flex-row sm:justify-end sm:p-6">
          <CerrarAviso className={BOTON_SECUNDARIO}>Volver</CerrarAviso>
          <button
            type="button"
            onClick={() => cerrar(true)}
            className={BOTON_PRIMARIO}
          >
            {pendiente?.confirmar}
          </button>
        </div>
      </ContenidoDeAviso>
    </AlertDialog>
  )

  return { preguntar, dialogo }
}
