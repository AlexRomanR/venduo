"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import { AlertDialogContent } from "@/components/ui/alert-dialog"

/** El botón que cierra sin hacer nada. Al abrir, el foco va a él. */
export const CerrarAviso = AlertDialogPrimitive.Cancel

/**
 * La caja de una pregunta que frena la pantalla: salir con cambios, borrar.
 *
 * Tiene que llevar un `CerrarAviso`: sin él, el foco se queda detrás del aviso
 * y con el teclado se sigue operando lo de atrás. Estos avisos se abren sin
 * disparador propio, así que al cerrar el foco vuelve a mano a donde estaba.
 */
export function ContenidoDeAviso({ children }: { children: React.ReactNode }) {
  const antes = React.useRef<HTMLElement | null>(null)

  return (
    <AlertDialogContent
      className="gap-0 rounded-none border-2 border-tinta bg-papel p-0 text-tinta shadow-none ring-0 data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-md motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none"
      onOpenAutoFocus={() => {
        antes.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null
      }}
      onCloseAutoFocus={(evento) => {
        if (!antes.current?.isConnected) return
        evento.preventDefault()
        antes.current.focus()
      }}
    >
      {children}
    </AlertDialogContent>
  )
}
