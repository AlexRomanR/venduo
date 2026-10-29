import { TreePalm } from "lucide-react"

import { textoDeVuelta } from "@/lib/vacaciones"

/**
 * La banda de arriba de una tienda de vacaciones. Común a todas las
 * plantillas: no pregunta cuál es, y se pinta con los colores de la tienda.
 */
export function AvisoDeVacaciones({ hasta }: { hasta: string | null }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-papel/25 bg-tinta px-4 py-2.5 text-center font-sans text-sm font-semibold text-papel"
    >
      <TreePalm aria-hidden="true" className="size-4 shrink-0" />
      <span>Estamos de vacaciones. {textoDeVuelta(hasta)}</span>
    </div>
  )
}
