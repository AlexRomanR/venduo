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

import { PEDIDOS_SUGERIDOS } from "@/lib/editor/sugerencias"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { useEditor } from "@/components/editor/contexto"

/** Lo que se lee mientras la IA piensa. Cambia para que se note que avanza. */
const MIENTRAS_PIENSA = [
  "Mirando tu tienda…",
  "Pensando qué cambiar…",
  "Probando que todo se lea bien…",
  "Armando la propuesta…",
]

/**
 * La IA del editor: un pedido en palabras y una propuesta para mirar.
 *
 * En reposo es una sola línea, para no competir con los controles del paso.
 * Las ideas aparecen al tocarla, hacia arriba y en una lista que se lee
 * entera; lo que la IA está haciendo o propone, solo cuando existe.
 *
 * La propuesta nunca se aplica sola. Se ve en la vista previa, con lo que
 * cambia marcado, y la persona decide: aplicarla —que es un solo paso de
 * deshacer— o descartarla. Mientras decide puede mirar cómo estaba.
 */
export function Asistente() {
  const { ia, propuesta, paso } = useEditor()
  const [texto, setTexto] = React.useState("")
  const [conIdeas, setConIdeas] = React.useState(false)
  const caja = React.useRef<HTMLDivElement>(null)
  const ideas = PEDIDOS_SUGERIDOS[paso]

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

  function pedir(pedido: string) {
    if (pedido.trim().length < 3 || ia.cargando) return
    // Lo pedido se muestra arriba, en la tarjeta; el campo queda libre para
    // lo siguiente.
    setTexto("")
    setConIdeas(false)
    ia.pedir(pedido)
  }

  const ocupado = ia.cargando || Boolean(propuesta) || Boolean(ia.error)
  const mostrarIdeas =
    conIdeas && !ia.cargando && !propuesta && !texto && ideas.length > 0

  return (
    <section
      ref={caja}
      aria-label="Pídele a la IA"
      className="relative border-t border-tinta/15 bg-papel"
    >
      {mostrarIdeas ? <Ideas ideas={ideas} alElegir={pedir} /> : null}

      {ocupado ? (
        <div aria-live="polite" className="border-b border-tinta/15">
          {ia.cargando ? (
            <Pensando />
          ) : propuesta ? (
            <TarjetaDePropuesta />
          ) : ia.error ? (
            <p
              role="alert"
              className="mx-4 my-3 border-l-2 border-senal py-1 pl-3 text-sm leading-relaxed"
            >
              {ia.error}
            </p>
          ) : null}
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
            "size-5 shrink-0 text-senal",
            ia.cargando && "motion-safe:animate-pulse"
          )}
        />
        <label htmlFor="pedido-a-la-ia" className="sr-only">
          Pídele un cambio a la IA
        </label>
        <input
          id="pedido-a-la-ia"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          onFocus={() => setConIdeas(true)}
          placeholder={
            ia.cargando ? "La IA está pensando…" : "Pídele un cambio a la IA"
          }
          maxLength={500}
          disabled={ia.cargando}
          autoComplete="off"
          aria-describedby={mostrarIdeas ? "ideas-para-la-ia" : undefined}
          className="h-11 min-w-0 flex-1 bg-transparent text-base placeholder:text-tinta/50 focus-visible:outline-none disabled:opacity-60"
        />
        {ideas.length > 0 && !texto && !ia.cargando ? (
          <button
            type="button"
            onClick={() => setConIdeas((abiertas) => !abiertas)}
            aria-label="Ver ideas"
            aria-pressed={mostrarIdeas}
            title="Ideas"
            className={cn(
              "flex size-11 shrink-0 items-center justify-center transition-colors hover:text-senal",
              mostrarIdeas && "text-senal"
            )}
          >
            <Lightbulb aria-hidden="true" className="size-5" />
          </button>
        ) : null}
        <button
          type="submit"
          aria-label="Pedir"
          disabled={ia.cargando || texto.trim().length < 3}
          className="flex size-11 shrink-0 items-center justify-center rounded-plantilla bg-senal text-white transition-colors hover:bg-senal-alta disabled:bg-tinta/15 disabled:text-tinta/45"
        >
          <ArrowUp aria-hidden="true" className="size-5" />
        </button>
      </form>
    </section>
  )
}

/**
 * Las ideas para el paso, hacia arriba del campo. Una lista que se lee entera
 * y no una fila que se corta: con desplazamiento lateral, en una computadora
 * las últimas quedaban escondidas sin forma de llegar a ellas.
 */
function Ideas({
  ideas,
  alElegir,
}: {
  ideas: string[]
  alElegir: (idea: string) => void
}) {
  const { ia } = useEditor()

  return (
    <div
      id="ideas-para-la-ia"
      className="absolute inset-x-0 bottom-full z-20 max-h-[60vh] overflow-y-auto border-t-2 border-tinta bg-papel motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in motion-safe:slide-in-from-bottom-1"
    >
      <p className="px-4 pt-3 pb-1 text-xs font-semibold tracking-[0.12em] uppercase opacity-60">
        Ideas para empezar
      </p>
      <ul>
        {ideas.map((idea) => (
          <li key={idea}>
            <button
              type="button"
              onClick={() => alElegir(idea)}
              className="flex min-h-11 w-full items-center gap-3 border-b border-tinta/10 px-4 py-2 text-left text-sm transition-colors hover:bg-tinta/[0.04]"
            >
              <Sparkles
                aria-hidden="true"
                className="size-4 shrink-0 text-senal"
              />
              <span className="min-w-0 flex-1">{idea}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="px-4 py-2 text-xs leading-relaxed opacity-55">
        O escríbele con tus palabras lo que quieres.
        {ia.demo ? " IA en modo demo: las respuestas son simuladas." : ""}
      </p>
    </div>
  )
}

/** Lo que se pidió, citado. Así se sabe a qué está respondiendo la IA. */
function Pedido() {
  const { ia } = useEditor()
  if (!ia.pedido) return null
  return (
    <p className="mt-1 truncate text-xs opacity-60">Pediste: «{ia.pedido}»</p>
  )
}

function Pensando() {
  const [indice, setIndice] = React.useState(0)
  const [segundos, setSegundos] = React.useState(0)

  React.useEffect(() => {
    const reloj = window.setInterval(() => {
      setIndice((actual) => (actual + 1) % MIENTRAS_PIENSA.length)
      setSegundos((actual) => actual + 1.6)
    }, 1600)
    return () => window.clearInterval(reloj)
  }, [])

  return (
    <div className="px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
        La IA está pensando
      </p>
      <Pedido />
      <p
        key={indice}
        className="mt-1 text-sm motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in"
      >
        {MIENTRAS_PIENSA[indice]}
      </p>
      {segundos > 14 ? (
        <p className="mt-1 text-xs leading-relaxed opacity-60">
          Está tardando un poco más: a veces revisa su primera idea antes de
          mostrártela.
        </p>
      ) : null}
      {/* Una regla que avanza: el único adorno, y dice que algo está pasando. */}
      <div className="mt-2 h-0.5 overflow-hidden bg-tinta/10">
        <div className="h-full w-1/3 bg-senal motion-safe:animate-[pensando_1.4s_ease-in-out_infinite]" />
      </div>
      <style>{`@keyframes pensando{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  )
}

function TarjetaDePropuesta() {
  const { propuesta, ia } = useEditor()
  if (!propuesta) return null

  const hayCambios = propuesta.operaciones.length > 0

  return (
    <div className="max-h-[30svh] overflow-y-auto px-4 pt-3 motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-2 lg:max-h-[46vh]">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-senal uppercase">
        <Sparkles aria-hidden="true" className="size-3.5" />
        {hayCambios ? "La IA propone" : "La IA dice"}
      </p>
      <Pedido />
      <p className="mt-2 font-titular text-lg leading-snug font-extrabold tracking-[-0.01em]">
        {propuesta.resumen}
      </p>

      {propuesta.aviso ? (
        <p className="mt-2 border-l-2 border-tinta/40 pl-3 text-sm opacity-80">
          {propuesta.aviso}
        </p>
      ) : null}

      {propuesta.cambios.length > 0 ? (
        <ul className="mt-3 border-t border-tinta/15">
          {propuesta.cambios.map((cambio, indice) => (
            <li
              key={`${cambio.texto}-${indice}`}
              className="flex items-center gap-3 border-b border-tinta/15 py-2 text-sm"
            >
              {cambio.color ? (
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 border border-tinta/25"
                  style={{ background: cambio.color }}
                />
              ) : (
                <Check
                  aria-hidden="true"
                  className="size-4 shrink-0 opacity-50"
                />
              )}
              <span className="min-w-0 flex-1">{cambio.texto}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {hayCambios ? (
        <button
          type="button"
          aria-pressed={ia.mirandoAntes}
          onClick={() => ia.setMirandoAntes(!ia.mirandoAntes)}
          className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
        >
          {ia.mirandoAntes ? (
            <Eye aria-hidden="true" className="size-4" />
          ) : (
            <EyeOff aria-hidden="true" className="size-4" />
          )}
          {ia.mirandoAntes ? "Ver la propuesta" : "Ver cómo estaba"}
        </button>
      ) : null}

      <div className="flex gap-2 pt-2 pb-3">
        {hayCambios ? (
          <>
            <button
              type="button"
              onClick={ia.aplicar}
              className={cn(BOTON_PRIMARIO, "min-h-11 flex-1")}
            >
              <Check aria-hidden="true" className="size-4" />
              Aplicar
            </button>
            <button
              type="button"
              onClick={ia.descartar}
              className={cn(BOTON_SECUNDARIO, "min-h-11")}
            >
              <X aria-hidden="true" className="size-4" />
              Descartar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={ia.descartar}
            className={cn(BOTON_SECUNDARIO, "min-h-11 flex-1")}
          >
            Entendido
          </button>
        )}
      </div>
    </div>
  )
}
