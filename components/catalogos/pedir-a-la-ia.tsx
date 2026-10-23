"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, LoaderCircle, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { MENSAJE_SIN_RESPUESTA } from "@/lib/ai/mensajes"
import { BOTON_PRIMARIO, CAMPO_LINEA, ETIQUETA_CAMPO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import type { ResultadoDeArmarConLaIa } from "@/app/(privado)/panel/catalogos/acciones"

/** Lo que más se pide: sirven de ejemplo de cómo hablarle. Los mismos de la app. */
const IDEAS = ["Lo que está en oferta", "Lo más nuevo", "Todo con stock"]

/**
 * "Pídeselo a la IA" en la lista de catálogos, plegado en una fila: abierto
 * ocupa media pantalla, y casi siempre se viene a mandar uno que ya existe.
 * Al tocarlo se abren las ideas y el campo. La IA elige los productos, el
 * orden y la plantilla, el catálogo queda guardado y se abre en el editor
 * para retocarlo. Es el mismo de la app.
 */
export function PedirCatalogoALaIa({
  armar,
}: {
  armar: (frase: string) => Promise<ResultadoDeArmarConLaIa>
}) {
  const router = useRouter()
  const [abierto, setAbierto] = React.useState(false)
  const [frase, setFrase] = React.useState("")
  const [armando, setArmando] = React.useState(false)
  const id = React.useId()

  async function enviar(pedido: string) {
    const limpio = pedido.trim()
    if (limpio.length < 3 || armando) return

    setArmando(true)
    const resultado = await armar(limpio).catch(
      (): ResultadoDeArmarConLaIa => ({
        ok: false,
        error: MENSAJE_SIN_RESPUESTA,
      })
    )
    if (!resultado.ok) {
      setArmando(false)
      toast.error(resultado.error)
      return
    }
    toast.success(`Listo: «${resultado.nombre}».`)
    router.push(`/panel/catalogos/${resultado.id}`)
  }

  return (
    <section aria-labelledby={`${id}-titulo`} className="border border-tinta">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={`${id}-cuerpo`}
        onClick={() => setAbierto((antes) => !antes)}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-tinta/[0.04] sm:px-5"
      >
        <Sparkles aria-hidden="true" className="size-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span
            id={`${id}-titulo`}
            className="block font-titular text-lg leading-tight font-bold tracking-[-0.02em]"
          >
            Pídeselo a la IA
          </span>
          <span className="mt-0.5 block text-sm leading-snug opacity-70">
            Con una frase, lo arma con tus productos.
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none",
            abierto && "rotate-180"
          )}
        />
      </button>

      {/* Se despliega con la altura de lo que trae, sin medirla. */}
      <div
        id={`${id}-cuerpo`}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          abierto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden" inert={!abierto}>
          <form
            onSubmit={(evento) => {
              evento.preventDefault()
              void enviar(frase)
            }}
            className="flex flex-col gap-4 border-t border-tinta/15 px-4 py-4 sm:px-5"
          >
            <div className="grid gap-1.5 sm:grid-cols-3">
              {IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  disabled={armando}
                  onClick={() => void enviar(idea)}
                  className="flex min-h-10 items-center gap-1.5 border border-tinta/25 px-3 text-sm transition-colors hover:border-tinta disabled:opacity-50"
                >
                  <Sparkles aria-hidden="true" className="size-3.5" />
                  {idea}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-2">
              <label className="flex min-w-0 flex-1 flex-col gap-1">
                <span className={ETIQUETA_CAMPO}>O con tus palabras</span>
                <input
                  value={frase}
                  onChange={(evento) => setFrase(evento.target.value)}
                  placeholder="Mis zapatillas en oferta"
                  maxLength={300}
                  disabled={armando}
                  className={CAMPO_LINEA}
                />
              </label>
              <button
                type="submit"
                disabled={armando || frase.trim().length < 3}
                className={cn(BOTON_PRIMARIO, "min-h-12 shrink-0 px-4")}
              >
                {armando ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <Sparkles aria-hidden="true" className="size-4" />
                )}
                Armar
              </button>
            </div>

            {armando ? (
              <p aria-live="polite" className="text-sm opacity-70">
                Armando tu catálogo…
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  )
}
