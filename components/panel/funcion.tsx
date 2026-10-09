"use client"

import { toast } from "sonner"

import { AVISO_DE_NO_DISPONIBLE, type EstadoDeFuncion } from "@/lib/funciones"
import { cn } from "@/lib/utils"

/**
 * Lo que el administrador de Venduo puede apagar en una tienda.
 *
 * - **activa:** el contenido, tal cual.
 * - **oculta:** nada, como si no existiera.
 * - **desactivada:** se ve, atenuado, pero no responde: el clic se corta antes
 *   de llegar —también el de un enlace o el Enter del teclado— y aparece el
 *   aviso. Es el único mensaje que recibe el emprendedor, y solo si toca.
 *
 * Esto es la cara visible. Lo que de verdad impide usarla es la comprobación
 * del servidor (`exigirFuncion`).
 */
export function ConFuncion({
  estado,
  className,
  children,
}: {
  estado: EstadoDeFuncion
  /** El display del envoltorio cuando está desactivada: block, flex, inline-flex. */
  className?: string
  children: React.ReactNode
}) {
  if (estado === "oculta") return null
  if (estado === "activa") return <>{children}</>

  return (
    <span
      aria-disabled="true"
      onClickCapture={(evento) => {
        evento.preventDefault()
        evento.stopPropagation()
        toast.info(AVISO_DE_NO_DISPONIBLE)
      }}
      className={cn("block cursor-not-allowed opacity-55", className)}
    >
      {children}
    </span>
  )
}
