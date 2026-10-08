"use client"

import * as React from "react"
import { LoaderCircle, WandSparkles } from "lucide-react"
import { toast } from "sonner"

import type { PropuestaDeCatalogo } from "@/lib/ai/schemas"
import { PLANTILLAS_DE_CATALOGO } from "@/lib/catalogos/plantillas"
import { BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { pedirCatalogoALaIa } from "@/app/(privado)/panel/catalogos/acciones"
import { MENSAJE_SIN_RESPUESTA } from "@/lib/ai/mensajes"

/**
 * Pedirle a la IA un catálogo, o un orden para el que está abierto.
 *
 * La IA propone y el sistema valida en el servidor; acá solo se muestra lo
 * que propuso y por qué. Nada cambia hasta que la persona toca "Usar".
 */
export function PedidoALaIa({
  titulo,
  ayuda,
  ejemplos,
  actuales,
  textoDeUsar,
  alUsar,
}: {
  titulo: string
  ayuda: string
  ejemplos: string[]
  /** Si se pide un orden para un catálogo abierto, sus productos. */
  actuales: string[] | null
  textoDeUsar: string
  alUsar: (propuesta: PropuestaDeCatalogo) => void
}) {
  const id = React.useId()
  const [frase, setFrase] = React.useState("")
  const [propuesta, setPropuesta] = React.useState<PropuestaDeCatalogo | null>(
    null
  )
  const [pidiendo, empezar] = React.useTransition()

  function pedir(texto = frase) {
    if (!texto.trim()) return
    setFrase(texto)
    empezar(async () => {
      // Si la plataforma corta la función, la acción lanza en vez de responder.
      const resultado = await pedirCatalogoALaIa(texto, actuales).catch(() => ({
        ok: false as const,
        error: MENSAJE_SIN_RESPUESTA,
      }))
      if (resultado.ok) setPropuesta(resultado.propuesta)
      else toast.error(resultado.error)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <WandSparkles
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-senal"
        />
        <div>
          <label htmlFor={id} className="block text-sm font-semibold">
            {titulo}
          </label>
          <p className="mt-0.5 text-xs leading-relaxed opacity-65">{ayuda}</p>
        </div>
      </div>

      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          pedir()
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <input
          id={id}
          value={frase}
          maxLength={300}
          onChange={(evento) => setFrase(evento.target.value)}
          placeholder={ejemplos[0]}
          className="h-11 min-w-0 flex-[1_1_14rem] border-0 border-b border-tinta/40 bg-transparent text-base placeholder:text-tinta/40 focus-visible:border-senal focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={pidiendo || !frase.trim()}
          className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
        >
          {pidiendo ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : null}
          {pidiendo ? "Pensando…" : "Pedir"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {ejemplos.map((ejemplo) => (
          <button
            key={ejemplo}
            type="button"
            disabled={pidiendo}
            onClick={() => pedir(ejemplo)}
            className="min-h-11 border border-tinta/25 px-3 text-left text-xs font-semibold transition-colors hover:border-tinta disabled:opacity-50"
          >
            {ejemplo}
          </button>
        ))}
      </div>

      {propuesta ? (
        <div
          role="status"
          className="flex flex-col gap-3 border-2 border-tinta p-4"
        >
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
              Propuesta
            </p>
            <p className="mt-1 font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
              {propuesta.nombre}
            </p>
            <p className="mt-1 text-sm leading-relaxed opacity-80">
              {propuesta.explicacion}
            </p>
            <p className="mt-2 text-xs opacity-65">
              {propuesta.productos.length}{" "}
              {propuesta.productos.length === 1 ? "producto" : "productos"} ·
              Plantilla {PLANTILLAS_DE_CATALOGO[propuesta.plantilla].nombre}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                alUsar(propuesta)
                setPropuesta(null)
              }}
              className="flex min-h-11 items-center bg-tinta px-4 text-sm font-semibold text-papel transition-opacity hover:opacity-85"
            >
              {textoDeUsar}
            </button>
            <button
              type="button"
              onClick={() => setPropuesta(null)}
              className="min-h-11 px-3 text-sm font-semibold opacity-75 hover:opacity-100"
            >
              Descartar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
