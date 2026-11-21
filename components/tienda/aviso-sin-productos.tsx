"use client"

import * as React from "react"
import Link from "next/link"
import { PackagePlus } from "lucide-react"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * Lo que ve quien abre su propia tienda sin un solo producto cargado.
 *
 * Solo se dibuja si el servidor comprobó que es su dueño. Cerrado una vez, no
 * vuelve a salir en esa pestaña: tiene que poder mirar su tienda en paz.
 */
export function AvisoSinProductos({ slug }: { slug: string }) {
  const clave = `venduo:sin-productos:${slug}`
  const [abierto, setAbierto] = React.useState(false)

  React.useEffect(() => {
    try {
      if (window.sessionStorage.getItem(clave)) return
    } catch {
      // Sin almacenamiento, el aviso sale en cada visita.
    }
    setAbierto(true)
  }, [clave])

  function alCambiar(siguiente: boolean) {
    setAbierto(siguiente)
    if (siguiente) return
    try {
      window.sessionStorage.setItem(clave, "1")
    } catch {
      // Sin almacenamiento, el aviso sale en cada visita.
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiar}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 border-tinta/15 bg-papel p-0 text-tinta sm:max-w-md"
      >
        <div className="p-5">
          <DialogTitle className="font-titular text-xl leading-tight font-extrabold tracking-[-0.02em]">
            Tu tienda todavía no tiene productos
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-tinta/70">
            Cárgalos para que tus clientes puedan hacerte un pedido. Solo tú ves
            este aviso.
          </DialogDescription>
        </div>
        <div className="flex flex-col gap-3 border-t border-tinta/15 p-5">
          <Link href="/panel/productos/cargar" className={BOTON_PRIMARIO}>
            <PackagePlus aria-hidden="true" className="size-4" />
            Cargar mis productos
          </Link>
          <DialogClose asChild>
            <button type="button" className={BOTON_SECUNDARIO}>
              Seguir viendo mi tienda
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
