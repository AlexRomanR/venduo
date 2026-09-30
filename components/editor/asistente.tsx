"use client"

import * as React from "react"
import { ArrowUp, Check, Eye, EyeOff, Sparkles, X } from "lucide-react"

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
 * La propuesta nunca se aplica sola. Se ve en la vista previa, con lo que
 * cambia marcado, y la persona decide: aplicarla —que es un solo paso de
 * deshacer— o descartarla. Mientras decide puede mirar cómo estaba.
 */
export function Asistente() {
  const { ia, propuesta, paso } = useEditor()
  const [texto, setTexto] = React.useState("")
  const sugerencias = PEDIDOS_SUGERIDOS[paso]

  function pedir(pedido: string) {
    if (pedido.trim().length < 3 || ia.cargando) return
    // Lo pedido se muestra arriba, en la tarjeta; el campo queda libre para
    // lo siguiente.
    setTexto("")
    ia.pedir(pedido)
  }

  return (
    <section
      aria-label="Pídele a la IA"
      className="border-t-2 border-tinta bg-papel"
    >
      <div aria-live="polite">
        {ia.cargando ? (
          <Pensando />
        ) : propuesta ? (
          <TarjetaDePropuesta />
        ) : ia.error ? (
          <p
            role="alert"
            className="mx-4 mt-3 border-l-2 border-senal py-1 pl-3 text-sm leading-relaxed"
          >
            {ia.error}
          </p>
        ) : null}
      </div>

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
          Dile a la IA qué quieres cambiar
        </label>
        <input
          id="pedido-a-la-ia"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Dile a la IA qué quieres cambiar…"
          maxLength={500}
          disabled={ia.cargando}
          autoComplete="off"
          className="h-11 min-w-0 flex-1 bg-transparent text-base placeholder:text-tinta/45 focus-visible:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          aria-label="Pedir"
          disabled={ia.cargando || texto.trim().length < 3}
          className="flex size-11 shrink-0 items-center justify-center rounded-plantilla bg-senal text-white transition-colors hover:bg-senal-alta disabled:bg-tinta/20 disabled:text-tinta/50"
        >
          <ArrowUp aria-hidden="true" className="size-5" />
        </button>
      </form>

      {!propuesta && !ia.cargando && sugerencias.length > 0 ? (
        <ul
          aria-label="Ideas para pedirle"
          className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-3"
        >
          {sugerencias.map((sugerencia) => (
            <li key={sugerencia} className="shrink-0">
              <button
                type="button"
                onClick={() => pedir(sugerencia)}
                className="min-h-11 border border-tinta/25 px-3 text-xs font-semibold whitespace-nowrap transition-colors hover:border-tinta hover:bg-tinta hover:text-papel"
              >
                {sugerencia}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {ia.demo ? (
        <p className="px-4 pb-2 text-[11px] opacity-50">
          IA en modo demo: las respuestas son simuladas.
        </p>
      ) : null}
    </section>
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
    <div className="px-4 pt-3">
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
    <div className="max-h-[30svh] overflow-y-auto px-4 pt-4 motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-bottom-2 lg:max-h-[46vh]">
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

      <div className="flex gap-2 pt-2 pb-2">
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
