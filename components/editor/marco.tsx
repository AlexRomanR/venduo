"use client"

import * as React from "react"
import { Monitor, Smartphone } from "lucide-react"

import {
  mensajeAlEditor,
  type EstadoParaLaVistaPrevia,
  type MensajeAlaVistaPrevia,
  type MensajeAlEditor,
  type Vista,
} from "@/lib/editor/protocolo"
import { cn } from "@/lib/utils"

type Dispositivo = "celular" | "computadora"

const ANCHO_DE_CELULAR = 390
const ANCHO_DE_COMPUTADORA = 1280

const NOMBRES_DE_VISTA: Record<Vista, string> = {
  inicio: "La portada",
  catalogo: "El catálogo",
  producto: "La ficha de un producto",
  carrito: "El carrito",
}

/** Si la pantalla es de escritorio: solo ahí se elige cómo mirar la tienda. */
function useEsEscritorio() {
  return React.useSyncExternalStore(
    (avisar) => {
      const consulta = window.matchMedia("(min-width: 1024px)")
      consulta.addEventListener("change", avisar)
      return () => consulta.removeEventListener("change", avisar)
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false
  )
}

function useTamano(ref: React.RefObject<HTMLElement | null>) {
  const [tamano, setTamano] = React.useState({ ancho: 0, alto: 0 })

  React.useEffect(() => {
    const elemento = ref.current
    if (!elemento) return
    const observador = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect
      setTamano({ ancho: Math.floor(width), alto: Math.floor(height) })
    })
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [ref])

  return tamano
}

/**
 * El lugar donde se ve la tienda mientras se edita.
 *
 * En la computadora se puede mirar como celular —390 px, el ancho de un
 * teléfono común— o como computadora, a 1280 px reducida para caber. Dentro de
 * un `<iframe>` las media queries responden a ese ancho, así que el modo
 * celular es el celular de verdad y no una aproximación. En el celular, la
 * vista previa es la pantalla misma.
 */
export function MarcoDeVistaPrevia({
  estado,
  enfoque,
  alMensaje,
}: {
  estado: EstadoParaLaVistaPrevia
  /** Cada vez que cambia, la vista previa trae esa sección a la vista. */
  enfoque: { seccion: string; vez: number } | null
  alMensaje: (mensaje: MensajeAlEditor) => void
}) {
  const marco = React.useRef<HTMLIFrameElement>(null)
  const lienzo = React.useRef<HTMLDivElement>(null)
  const { ancho, alto } = useTamano(lienzo)
  const [lista, setLista] = React.useState(false)
  const [dispositivo, setDispositivo] = React.useState<Dispositivo>("celular")

  const ultimo = React.useRef(estado)
  const alMensajeActual = React.useRef(alMensaje)
  React.useEffect(() => {
    ultimo.current = estado
    alMensajeActual.current = alMensaje
  })

  const enviar = React.useCallback((mensaje: MensajeAlaVistaPrevia) => {
    marco.current?.contentWindow?.postMessage(mensaje, window.location.origin)
  }, [])

  React.useEffect(() => {
    function recibir(evento: MessageEvent) {
      if (
        evento.origin !== window.location.origin ||
        evento.source !== marco.current?.contentWindow
      ) {
        return
      }
      const leido = mensajeAlEditor.safeParse(evento.data)
      if (!leido.success) return

      if (leido.data.tipo === "lista") {
        // Puede volver a avisar si el marco se recarga: se le manda el estado
        // de nuevo, el de este momento.
        setLista(true)
        enviar(ultimo.current)
      } else {
        alMensajeActual.current(leido.data)
      }
    }

    window.addEventListener("message", recibir)
    return () => window.removeEventListener("message", recibir)
  }, [enviar])

  React.useEffect(() => {
    if (lista) enviar(estado)
  }, [estado, lista, enviar])

  React.useEffect(() => {
    if (lista && enfoque) enviar({ tipo: "enfocar", seccion: enfoque.seccion })
  }, [enfoque, lista, enviar])

  const esEscritorio = useEsEscritorio()
  const reducida = esEscritorio && dispositivo === "computadora" && ancho > 0
  // El borde del marco ocupa 2 px por lado.
  const escala = reducida ? Math.min(1, (ancho - 4) / ANCHO_DE_COMPUTADORA) : 1

  return (
    <div className="flex h-full min-h-0 flex-col bg-tinta/[0.06]">
      <div className="hidden items-center justify-between gap-4 border-b border-tinta/15 bg-papel px-4 py-2 lg:flex">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-60">
          Vista previa ·{" "}
          <span className="tracking-normal normal-case">
            {NOMBRES_DE_VISTA[estado.vista]}
          </span>
        </p>
        <div
          role="radiogroup"
          aria-label="Ver como"
          className="flex border border-tinta/25"
        >
          {(
            [
              ["celular", "Celular", Smartphone],
              ["computadora", "Computadora", Monitor],
            ] as const
          ).map(([valor, etiqueta, Icono]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={dispositivo === valor}
              onClick={() => setDispositivo(valor)}
              className={cn(
                "flex min-h-10 items-center gap-2 px-3 text-xs font-semibold transition-colors",
                dispositivo === valor
                  ? "bg-tinta text-papel"
                  : "hover:bg-tinta/[0.06]"
              )}
            >
              <Icono aria-hidden="true" className="size-4" />
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={lienzo}
        className="relative flex min-h-0 flex-1 justify-center overflow-hidden lg:p-4"
      >
        <div
          className="relative h-full w-full flex-none overflow-hidden bg-white lg:border-2 lg:border-tinta"
          style={
            esEscritorio
              ? {
                  width: reducida
                    ? ANCHO_DE_COMPUTADORA * escala + 4
                    : Math.min(ANCHO_DE_CELULAR + 4, ancho),
                }
              : undefined
          }
        >
          <iframe
            ref={marco}
            src="/editor/vista-previa"
            title="Vista previa de tu tienda"
            className="block border-0 bg-white"
            style={
              reducida
                ? {
                    width: ANCHO_DE_COMPUTADORA,
                    height: (alto - 4) / escala,
                    transform: `scale(${escala})`,
                    transformOrigin: "top left",
                  }
                : { width: "100%", height: "100%" }
            }
          />

          {!lista ? (
            <div
              aria-live="polite"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-papel"
            >
              <span className="size-8 animate-pulse bg-tinta/15" />
              <p className="text-sm opacity-60">Armando tu vista previa…</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
