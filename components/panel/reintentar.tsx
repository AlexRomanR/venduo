"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, RotateCw } from "lucide-react"

import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"

/** "Inténtalo de nuevo": vuelve a pedir la pantalla al servidor. */
export function Reintentar() {
  const router = useRouter()
  const [cargando, empezar] = useTransition()
  return (
    <button
      type="button"
      disabled={cargando}
      onClick={() => empezar(() => router.refresh())}
      className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
    >
      {cargando ? (
        <LoaderCircle
          aria-hidden="true"
          className="size-4 animate-spin motion-reduce:animate-none"
        />
      ) : (
        <RotateCw aria-hidden="true" className="size-4" />
      )}
      Inténtalo de nuevo
    </button>
  )
}
