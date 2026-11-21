"use client"

import * as React from "react"
import {
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react"

import type { PropuestaDeCatalogo } from "@/lib/ai/schemas"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"

/*
 * La IA del editor de catálogos, igual que la del editor de la tienda: una
 * barra fija al pie del panel y, cuando responde, su propuesta ocupa el panel
 * hasta aplicarla o descartarla. Antes era una pestaña más, y los dos editores
 * enseñaban dos formas distintas de pedirle algo.
 *
 * La IA propone y el sistema valida en el servidor; acá solo se muestra lo que
 * propuso. Nada cambia hasta "Aplicar cambios".
 */

/** La barra para pedirle algo, con sus ideas hacia arriba. */
export function BarraDeIa({
  ideas,
  pidiendo,
  pedido,
  alPedir,
}: {
  ideas: string[]
  pidiendo: boolean
  /** Lo último que se pidió, para mostrarlo mientras piensa. */
  pedido: string
  alPedir: (pedido: string) => void
}) {
  const [texto, setTexto] = React.useState("")
  const [conIdeas, setConIdeas] = React.useState(false)
  const caja = React.useRef<HTMLElement>(null)

  // Las ideas se cierran al tocar afuera o con Escape, como cualquier menú.
  React.useEffect(() => {
    if (!conIdeas) return
    function afuera(evento: PointerEvent) {
      if (!caja.current?.contains(evento.target as Node)) setConIdeas(false)
    }
    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setConIdeas(false)
    }
    document.addEventListener("pointerdown", afuera)
    document.addEventListener("keydown", tecla)
    return () => {
      document.removeEventListener("pointerdown", afuera)
      document.removeEventListener("keydown", tecla)
    }
  }, [conIdeas])

  function pedir(frase: string) {
    if (frase.trim().length < 3 || pidiendo) return
    setTexto("")
    setConIdeas(false)
    alPedir(frase)
  }

  const mostrarIdeas = conIdeas && !pidiendo && !texto && ideas.length > 0

  return (
    <section
      ref={caja}
      aria-label="Pídele a la IA"
      className="relative border-t border-tinta/15 bg-papel"
    >
      {mostrarIdeas ? (
        <div
          id="ideas-del-catalogo"
          className="absolute inset-x-0 bottom-full z-20 max-h-[60vh] overflow-y-auto rounded-t-[22px] border border-tinta/15 bg-hoja shadow-[var(--sombra-cuaderno)] motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in motion-safe:slide-in-from-bottom-1"
        >
          <p className="px-4 pt-3 pb-1 text-xs font-semibold tracking-[0.12em] uppercase opacity-70">
            Ideas para empezar
          </p>
          <ul>
            {ideas.map((idea) => (
              <li key={idea}>
                <button
                  type="button"
                  onClick={() => pedir(idea)}
                  className="flex min-h-11 w-full items-center gap-3 border-b border-tinta/10 px-4 py-2 text-left text-sm transition-colors hover:bg-tinta/[0.04]"
                >
                  <Sparkles
                    aria-hidden="true"
                    className="size-4 shrink-0 opacity-70"
                  />
                  <span className="min-w-0 flex-1">{idea}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="px-4 py-2 text-xs leading-relaxed opacity-70">
            Ordena tus productos, puede quitar algunos y propone un nombre. Lo
            ves antes de aplicarlo.
          </p>
        </div>
      ) : null}

      {pidiendo ? (
        <div aria-live="polite" className="border-b border-tinta/15 px-4 py-3">
          <p className="text-sm font-semibold">La IA está pensando</p>
          {pedido ? (
            <p className="mt-1 truncate text-xs opacity-70">
              Pediste: «{pedido}»
            </p>
          ) : null}
          <div className="mt-2 h-0.5 overflow-hidden bg-tinta/10">
            <div className="h-full w-1/3 bg-tinta motion-safe:animate-[pensando_1.4s_ease-in-out_infinite]" />
          </div>
          <style>{`@keyframes pensando{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
        </div>
      ) : null}

      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          pedir(texto)
        }}
        className="flex items-center gap-2 px-4 py-2"
      >
        <Sparkles
          aria-hidden="true"
          className={cn(
            "size-5 shrink-0",
            pidiendo && "motion-safe:animate-pulse"
          )}
        />
        <label htmlFor="pedido-al-catalogo" className="sr-only">
          Pídele un cambio a la IA
        </label>
        <input
          id="pedido-al-catalogo"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          onFocus={() => setConIdeas(true)}
          placeholder={
            pidiendo ? "La IA está pensando…" : "Pídele un cambio a la IA"
          }
          maxLength={300}
          disabled={pidiendo}
          autoComplete="off"
          aria-describedby={mostrarIdeas ? "ideas-del-catalogo" : undefined}
          className="h-11 min-w-0 flex-1 rounded-full bg-transparent px-3 text-base placeholder:text-tinta/70 disabled:opacity-60"
        />
        {ideas.length > 0 && !texto && !pidiendo ? (
          <button
            type="button"
            onClick={() => setConIdeas((abiertas) => !abiertas)}
            aria-label="Ver ideas"
            aria-pressed={mostrarIdeas}
            title="Ideas"
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full transition-colors hover:opacity-60",
              mostrarIdeas && "bg-tinta/[0.08]"
            )}
          >
            <Lightbulb aria-hidden="true" className="size-5" />
          </button>
        ) : null}
        <button
          type="submit"
          aria-label="Pedir"
          disabled={pidiendo || texto.trim().length < 3}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accion text-white transition-colors hover:bg-accion-alta disabled:bg-tinta/15 disabled:text-tinta/60"
        >
          <ArrowUp aria-hidden="true" className="size-5" />
        </button>
      </form>
    </section>
  )
}

/** Lo que propuso la IA, en todo el panel, hasta que se decide. */
export function TarjetaDePropuesta({
  pedido,
  propuesta,
  detalle,
  viendoAntes,
  alVerAntes,
  alAplicar,
  alDescartar,
}: {
  pedido: string
  propuesta: PropuestaDeCatalogo
  /** Qué cambiaría si se aplica, dicho antes de aplicarla. */
  detalle: React.ReactNode
  viendoAntes: boolean
  alVerAntes: (viendo: boolean) => void
  alAplicar: () => void
  alDescartar: () => void
}) {
  const tarjeta = React.useRef<HTMLDivElement>(null)

  // El campo donde se escribió ya no está: sin esto el foco se pierde y un
  // lector de pantalla no se entera de la respuesta.
  React.useEffect(() => {
    tarjeta.current?.focus({ preventScroll: true })
  }, [])

  return (
    <section aria-label="Propuesta de la IA">
      <div
        ref={tarjeta}
        tabIndex={-1}
        className="px-4 pt-4 outline-none motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-2 sm:px-5"
      >
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          <Sparkles aria-hidden="true" className="size-3.5" />
          La IA propone
        </p>
        {pedido ? (
          <p className="mt-1 truncate text-xs opacity-70">
            Pediste: «{pedido}»
          </p>
        ) : null}
        <p className="mt-2 font-titular text-xl leading-tight font-extrabold tracking-[-0.02em]">
          {propuesta.nombre}
        </p>
        <p className="mt-1 text-sm leading-relaxed opacity-80">
          {propuesta.explicacion}
        </p>
        {detalle}
      </div>

      {/* Siguen a la propuesta y, si es larga, quedan pegados abajo. */}
      <div className="sticky bottom-0 mt-3 border-t border-tinta/15 bg-papel px-4 pb-3 sm:px-5">
        <button
          type="button"
          aria-pressed={viendoAntes}
          onClick={() => alVerAntes(!viendoAntes)}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-60"
        >
          {viendoAntes ? (
            <Eye aria-hidden="true" className="size-4" />
          ) : (
            <EyeOff aria-hidden="true" className="size-4" />
          )}
          {viendoAntes ? "Ver la propuesta" : "Ver cómo estaba"}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={alAplicar}
            className={cn(
              BOTON_PRIMARIO,
              "min-h-11 flex-1 px-4 whitespace-nowrap"
            )}
          >
            <Check aria-hidden="true" className="size-4 max-sm:hidden" />
            Aplicar cambios
          </button>
          <button
            type="button"
            onClick={alDescartar}
            className={cn(BOTON_SECUNDARIO, "min-h-11 px-4")}
          >
            <X aria-hidden="true" className="size-4 max-sm:hidden" />
            Descartar
          </button>
        </div>
      </div>
    </section>
  )
}
