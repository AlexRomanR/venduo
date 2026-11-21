"use client"

import { ArrowRight, History, WandSparkles } from "lucide-react"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatDate } from "@/lib/format"
import { useConfirmacion } from "@/components/panel/confirmar"
import { ConFuncion } from "@/components/panel/funcion"
import { useEditor } from "@/components/editor/contexto"

/**
 * Si quedó un borrador sin publicar de la vez anterior, hay que decidir antes
 * de seguir: mientras tanto no se guarda nada, para no pisarlo, y editar al
 * lado hacía creer que lo nuevo estaba a salvo.
 */
export function Recuperar() {
  const { borrador } = useEditor()
  const { preguntar, dialogo } = useConfirmacion()
  const pendiente = borrador.recuperable
  if (!pendiente) return null

  async function descartar() {
    const si = await preguntar({
      titulo: "¿Descartar estos cambios?",
      texto: "No se pueden recuperar. Tu tienda publicada no cambia.",
      confirmar: "Descartarlos",
    })
    if (si) borrador.olvidarRecuperable()
  }

  return (
    <div className="px-5 py-6 motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in">
      {dialogo}
      <History aria-hidden="true" className="size-6" />
      <h1 className="mt-3 font-titular text-xl leading-tight font-extrabold tracking-[-0.02em]">
        Tienes cambios sin publicar
      </h1>
      <p className="mt-1 text-sm leading-relaxed opacity-70">
        Son del {formatDate(new Date(pendiente.fecha))} y los guardamos en este
        dispositivo. ¿Sigues donde te quedaste?
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={borrador.recuperar}
          className={BOTON_PRIMARIO}
        >
          Recuperarlos
        </button>
        <button type="button" onClick={descartar} className={BOTON_SECUNDARIO}>
          Descartarlos
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
  const { tienda, ia, irAPaso } = useEditor()

  return (
    <div className="mx-5 mt-5 rounded-[18px] border border-tinta/15 bg-hoja p-4 shadow-[var(--sombra-cuaderno)] motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
      <p className="font-titular text-xl leading-tight font-extrabold tracking-[-0.02em]">
        Ahora, personaliza tu tienda.
      </p>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm leading-relaxed opacity-80">
        <li>Lo ves al instante aquí. Nadie más lo ve hasta que publiques.</li>
        <li>Toca una sección de la vista previa para editarla.</li>
      </ul>
      <div className="mt-3 flex flex-wrap gap-x-5">
        <button
          type="button"
          onClick={alEmpezar}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:opacity-60"
        >
          Empezar
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
        {tienda.descripcion ? (
          <ConFuncion estado={ia.estado} className="inline-flex">
            <button
              type="button"
              onClick={() => {
                alEmpezar()
                irAPaso("portada")
                ia.pedir(
                  "Escribe los textos de mi página de inicio con lo que conté de mi negocio"
                )
              }}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:opacity-60"
            >
              <WandSparkles aria-hidden="true" className="size-4" />
              Que la IA escriba tus textos
            </button>
          </ConFuncion>
        ) : null}
      </div>
    </div>
  )
}
