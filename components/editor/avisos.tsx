"use client"

import { ArrowRight, History } from "lucide-react"

import { formatDate } from "@/lib/format"
import { useEditor } from "@/components/editor/contexto"

/**
 * Si quedó un borrador sin publicar de la vez anterior, se ofrece recuperarlo
 * antes de tocar nada. Mientras no se decida, no se escribe encima.
 */
export function Recuperar() {
  const { borrador } = useEditor()
  const pendiente = borrador.recuperable
  if (!pendiente) return null

  return (
    <div
      role="status"
      className="mx-5 mt-5 border-l-2 border-senal py-1 pl-3 motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in"
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <History aria-hidden="true" className="size-4" />
        Tienes cambios sin publicar del {formatDate(new Date(pendiente.fecha))}
      </p>
      <p className="mt-1 text-xs leading-relaxed opacity-60">
        Los guardamos en este dispositivo. ¿Sigues donde te quedaste?
      </p>
      <div className="mt-1 flex flex-wrap gap-x-5">
        <button
          type="button"
          onClick={borrador.recuperar}
          className="min-h-11 text-sm font-semibold text-senal transition-colors hover:text-senal-alta"
        >
          Recuperarlos
        </button>
        <button
          type="button"
          onClick={borrador.olvidarRecuperable}
          className="min-h-11 text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
        >
          Empezar de nuevo
        </button>
      </div>
    </div>
  )
}

/**
 * La primera vez, recién creada la tienda: qué es esto y la tranquilidad de
 * que nada llega al cliente sin publicar.
 */
export function Bienvenida({ alEmpezar }: { alEmpezar: () => void }) {
  const { tienda } = useEditor()

  return (
    <div className="mx-5 mt-5 border-2 border-tinta p-4 motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
      <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
        {tienda.nombre} ya existe
      </p>
      <p className="mt-2 font-titular text-xl leading-tight font-extrabold tracking-[-0.02em]">
        Ahora, dale tu estilo.
      </p>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm leading-relaxed opacity-80">
        <li>Lo que cambies lo ves al instante, en tu tienda real.</li>
        <li>Toca una sección de la vista previa para editarla.</li>
        <li>Tus clientes no ven nada hasta que publiques.</li>
      </ul>
      <button
        type="button"
        onClick={alEmpezar}
        className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
      >
        Empezar
        <ArrowRight aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}
