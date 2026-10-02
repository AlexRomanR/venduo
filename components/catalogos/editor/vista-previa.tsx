"use client"

import * as React from "react"

import type { DatosDelCatalogo } from "@/lib/catalogos/datos"
import type { Catalogo } from "@/lib/catalogos/modelo"
import { cn } from "@/lib/utils"
import {
  DibujoDeHoja,
  hojasConContexto,
  type HojaConContexto,
} from "@/components/catalogos/documento"
import { html } from "@/components/catalogos/html"

/** El ancho de un elemento, al día. */
export function useAncho<T extends HTMLElement>() {
  const ref = React.useRef<T>(null)
  const [ancho, setAncho] = React.useState(0)

  React.useLayoutEffect(() => {
    const elemento = ref.current
    if (!elemento) return
    setAncho(elemento.clientWidth)
    const observador = new ResizeObserver(([entrada]) => {
      setAncho(Math.floor(entrada.contentRect.width))
    })
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  return [ref, ancho] as const
}

/**
 * Una hoja del catálogo a su medida real, achicada para que entre.
 *
 * Se dibuja en puntos —un punto es un píxel— y se escala entera: así el
 * reparto, los cortes de renglón y los tamaños son los mismos del PDF, que se
 * arma con las mismas variantes.
 */
export function HojaEscalada({
  hoja,
  ctx,
  ancho,
  className,
}: HojaConContexto & { ancho: number; className?: string }) {
  const escala = ancho / ctx.hoja.ancho
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ width: ancho, height: ctx.hoja.alto * escala }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 origin-top-left select-none"
        style={{
          width: ctx.hoja.ancho,
          height: ctx.hoja.alto,
          transform: `scale(${escala})`,
        }}
      >
        <DibujoDeHoja P={html} hoja={hoja} ctx={ctx} />
      </div>
    </div>
  )
}

/**
 * Todas las hojas, una debajo de otra. Tocar una elige su bloque en el editor.
 *
 * Se dibuja con el catálogo diferido: escribir un título no espera a que se
 * redibujen treinta hojas.
 *
 * **Sigue a la hoja que se edita.** Al elegir un bloque —en la lista, en una
 * hoja o al agregarlo— la vista previa va a su primera hoja: editar la oferta
 * con la vista previa parada en la portada era editar a ciegas. Se mueve solo
 * cuando cambia lo elegido, no en cada letra: si la persona recorre las hojas
 * mientras escribe, no se la devuelve a cada rato.
 */
export function VistaPrevia({
  catalogo,
  datos,
  elegido,
  pedido = 0,
  alElegir,
  className,
}: {
  catalogo: Catalogo
  datos: DatosDelCatalogo
  elegido: string | null
  /** Sube cada vez que hay que volver a mostrar lo elegido: al abrir la vista. */
  pedido?: number
  alElegir: (bloque: string) => void
  className?: string
}) {
  const diferido = React.useDeferredValue(catalogo)
  const hojas = React.useMemo(
    () => hojasConContexto(diferido, datos),
    [diferido, datos]
  )
  const desplazable = React.useRef<HTMLDivElement>(null)
  const [ref, ancho] = useAncho<HTMLDivElement>()
  const anchoDeHoja = Math.min(ancho, 620)

  // Lo que falta mostrar. Se anota cuando cambia lo elegido y se cumple apenas
  // su hoja existe y se ve: un bloque recién agregado llega un render después,
  // por el catálogo diferido, y en el celular la vista puede estar oculta.
  const pendiente = React.useRef<string | null>(null)
  // Lo que se tocó acá mismo ya está a la vista: moverlo a la primera hoja
  // de su bloque haría saltar la vista previa bajo el dedo.
  const tocada = React.useRef<string | null>(null)
  React.useEffect(() => {
    pendiente.current = elegido === tocada.current ? null : elegido
    tocada.current = null
  }, [elegido, pedido])

  // La última hoja que se mostró, por un momento. Si justo después cambia el
  // ancho —al aparecer la barra de desplazamiento, las hojas se angostan y se
  // acortan—, la que se mostró se corre: se la vuelve a alinear.
  const alineada = React.useRef<{ id: string; hasta: number } | null>(null)

  React.useEffect(() => {
    const reciente =
      alineada.current && Date.now() < alineada.current.hasta
        ? alineada.current.id
        : null
    const nueva = pendiente.current
    const id = nueva ?? reciente
    const contenedor = desplazable.current
    if (!id || !contenedor || contenedor.getClientRects().length === 0) return
    const hoja = contenedor.querySelector<HTMLElement>(
      `[data-bloque="${CSS.escape(id)}"]`
    )
    if (!hoja) return
    pendiente.current = null
    alineada.current = { id, hasta: Date.now() + 1_500 }

    const conducta: ScrollBehavior =
      nueva && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "smooth"
        : "auto"
    if (contenedor.scrollHeight > contenedor.clientHeight) {
      // En escritorio la vista previa se desplaza dentro de su caja: mover la
      // página correría el formulario que se está editando.
      const arriba =
        hoja.getBoundingClientRect().top -
        contenedor.getBoundingClientRect().top +
        contenedor.scrollTop -
        16
      contenedor.scrollTo({ top: arriba, behavior: conducta })
    } else {
      hoja.scrollIntoView({ block: "start", behavior: conducta })
    }
  }, [elegido, pedido, hojas, anchoDeHoja])

  return (
    <div ref={desplazable} className={className}>
      <div ref={ref} className="flex flex-col items-center gap-5">
        {hojas.length === 0 ? (
          <p className="max-w-[40ch] py-10 text-center text-sm leading-relaxed opacity-70">
            Todavía no hay hojas para mostrar. Elige productos o agrega una
            portada.
          </p>
        ) : null}
        {anchoDeHoja > 0
          ? hojas.map(({ hoja, ctx }, indice) => {
              const activa = hoja.bloque.id === elegido
              const primeraDelBloque =
                indice === 0 ||
                hojas[indice - 1].hoja.bloque.id !== hoja.bloque.id
              return (
                <figure
                  key={ctx.numero}
                  data-bloque={primeraDelBloque ? hoja.bloque.id : undefined}
                  className="flex scroll-mt-24 flex-col gap-1.5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      tocada.current = hoja.bloque.id
                      alElegir(hoja.bloque.id)
                    }}
                    aria-label={`Editar la hoja ${ctx.numero}`}
                    aria-pressed={activa}
                    className={cn(
                      "block outline-offset-4 transition-shadow",
                      activa
                        ? "ring-2 ring-tinta ring-offset-4 ring-offset-papel"
                        : "ring-1 ring-tinta/15 hover:ring-tinta/50"
                    )}
                  >
                    <HojaEscalada hoja={hoja} ctx={ctx} ancho={anchoDeHoja} />
                  </button>
                  <figcaption className="tabular text-xs opacity-65">
                    Hoja {ctx.numero} de {ctx.total}
                  </figcaption>
                </figure>
              )
            })
          : null}
      </div>
    </div>
  )
}
