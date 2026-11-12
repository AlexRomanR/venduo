"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Insignia } from "@/components/panel/piezas"

/** Lo que la pasarela necesita de cada plantilla, sin su definición. */
export interface PlantillaDeLaPasarela {
  clave: string
  nombre: string
  rubro: string | null
  descripcion: string | null
  rasgos: string[]
  recomendada: boolean
  nueva: boolean
}

/** Lo que quien la usa le puede pedir a la pasarela. */
export interface ControlDePasarela {
  /** Vuelve a la primera, sin animar: después de cambiar de plantilla. */
  alPrincipio: () => void
}

function prefiereQuieto() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * Las plantillas de a una, grandes y en el centro, cada una con la tienda
 * adentro: se pasa con las flechas, deslizando o con ← y →. Debajo, el nombre
 * con sus insignias, el rubro, la descripción y lo que quien la usa ponga en
 * `acciones`. La usan Apariencia (`PasarelaDeApariencia`) y el alta
 * (`ElegirPlantilla`).
 *
 * Las miniaturas llegan dibujadas del servidor: importarlas acá traería al
 * navegador todas las definiciones de plantilla con zod.
 */
export function PasarelaDePlantillas({
  ref,
  plantillas,
  miniaturas,
  notas = [],
  marcaDeLaPrimera,
  bloqueada = false,
  acciones,
  alCambiar,
}: {
  ref?: React.Ref<ControlDePasarela>
  plantillas: PlantillaDeLaPasarela[]
  /** Las mismas, en el mismo orden, ya dibujadas. */
  miniaturas: React.ReactNode[]
  /** Lo que se aclara debajo del dibujo; "{plantilla}" lleva su nombre. */
  notas?: string[]
  /**
   * La primera es otra cosa —"La tuya" en Apariencia—: lleva esta insignia en
   * vez de Recomendada o Nueva, y no lleva las notas.
   */
  marcaDeLaPrimera?: string
  /** Mientras se aplica algo: no se puede pasar a otra. */
  bloqueada?: boolean
  acciones?: (vista: PlantillaDeLaPasarela, indice: number) => React.ReactNode
  /** Cuando se asienta otra plantilla a la vista. */
  alCambiar?: (vista: PlantillaDeLaPasarela, indice: number) => void
}) {
  const total = plantillas.length
  const [indice, setIndice] = React.useState(0)
  const franja = React.useRef<HTMLDivElement>(null)
  const vista = plantillas[indice] ?? plantillas[0]
  const esLaPrimeraMarcada = Boolean(marcaDeLaPrimera) && indice === 0

  React.useImperativeHandle(ref, () => ({
    alPrincipio() {
      franja.current?.scrollTo({ left: 0, behavior: "auto" })
    },
  }))

  const alCambiarVivo = React.useRef(alCambiar)
  alCambiarVivo.current = alCambiar
  React.useEffect(() => {
    const actual = plantillas[indice]
    if (actual) alCambiarVivo.current?.(actual, indice)
  }, [indice, plantillas])

  // Si cambia el ancho —girar el teléfono, achicar la ventana— la franja se
  // vuelve a ubicar en la que se estaba viendo: si no, quedaba entre dos.
  const indiceVivo = React.useRef(indice)
  indiceVivo.current = indice
  React.useEffect(() => {
    const nodo = franja.current
    if (!nodo) return
    const medida = new ResizeObserver(() => {
      nodo.scrollTo({
        left: nodo.clientWidth * indiceVivo.current,
        behavior: "auto",
      })
    })
    medida.observe(nodo)
    return () => medida.disconnect()
  }, [])

  // Lo de abajo cambia cuando un cuadro se asienta: a más del 60 % a la vista.
  React.useEffect(() => {
    const nodo = franja.current
    if (!nodo) return
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setIndice(Number((entrada.target as HTMLElement).dataset.indice))
          }
        }
      },
      { root: nodo, threshold: 0.6 }
    )
    nodo
      .querySelectorAll("[data-indice]")
      .forEach((el) => observador.observe(el))
    return () => observador.disconnect()
  }, [total])

  function ir(destino: number) {
    const nodo = franja.current
    if (!nodo || bloqueada || destino < 0 || destino >= total) return
    nodo.scrollTo({
      left: nodo.clientWidth * destino,
      behavior: prefiereQuieto() ? "auto" : "smooth",
    })
  }

  if (!vista) return null

  const flecha =
    "sombra-cuaderno absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-tinta/15 bg-hoja transition-[opacity,background-color] hover:bg-papel disabled:pointer-events-none disabled:opacity-0"

  return (
    <div className="flex flex-col gap-5">
      {/* Al medio y con un ancho de celular grande: a lo ancho de la tarjeta,
          en la compu, el dibujo medía 880 px. */}
      <div className="relative mx-auto w-full max-w-[40rem]">
        {/* Un cuadro por plantilla, del ancho entero, que encaja al deslizar. */}
        <div
          ref={franja}
          tabIndex={0}
          role="group"
          aria-roledescription="carrusel"
          aria-label="Plantillas"
          aria-busy={bloqueada || undefined}
          onKeyDown={(evento) => {
            if (evento.key === "ArrowLeft") {
              evento.preventDefault()
              ir(indice - 1)
            } else if (evento.key === "ArrowRight") {
              evento.preventDefault()
              ir(indice + 1)
            }
          }}
          className={cn(
            "flex snap-x snap-mandatory [scrollbar-width:none] rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta [&::-webkit-scrollbar]:hidden",
            bloqueada ? "overflow-hidden" : "overflow-x-auto"
          )}
        >
          {plantillas.map((plantilla, i) => (
            <div
              key={plantilla.clave}
              data-indice={i}
              aria-roledescription="plantilla"
              aria-label={
                i === 0 && marcaDeLaPrimera
                  ? `${plantilla.nombre}, ${marcaDeLaPrimera.toLowerCase()}`
                  : plantilla.nombre
              }
              className="w-full shrink-0 snap-center px-0.5"
            >
              <div
                className={cn(
                  "relative overflow-hidden rounded-[16px] border border-tinta/15",
                  bloqueada && i === indice && "armando-barrido"
                )}
              >
                {miniaturas[i]}
              </div>
            </div>
          ))}
        </div>

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => ir(indice - 1)}
              disabled={indice === 0 || bloqueada}
              aria-label={
                indice > 0
                  ? `Anterior: ${plantillas[indice - 1].nombre}`
                  : "Anterior"
              }
              className={cn(flecha, "-left-3 sm:-left-5 xl:-left-16")}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => ir(indice + 1)}
              disabled={indice === total - 1 || bloqueada}
              aria-label={
                indice < total - 1
                  ? `Siguiente: ${plantillas[indice + 1].nombre}`
                  : "Siguiente"
              }
              className={cn(flecha, "-right-3 sm:-right-5 xl:-right-16")}
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="-mt-1 flex items-center justify-center gap-3">
          <span className="flex gap-1.5" aria-hidden="true">
            {plantillas.map((plantilla, i) => (
              <span
                key={plantilla.clave}
                className={cn(
                  "h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none",
                  i === indice ? "w-5 bg-tinta" : "w-1.5 bg-tinta/20"
                )}
              />
            ))}
          </span>
          <span aria-live="polite" className="tabular text-sm text-tinta/65">
            <span className="sr-only">{vista.nombre}, </span>
            {indice + 1} de {total}
          </span>
        </div>
      ) : null}

      {/* Centrado bajo el dibujo, que también va al medio. */}
      <div
        key={vista.clave}
        className="cambio-entra flex flex-col items-center gap-4 text-center"
      >
        <div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <h3 className="font-titular text-[clamp(1.5rem,4vw,2rem)] leading-none font-extrabold tracking-[-0.03em]">
              {vista.nombre}
            </h3>
            {esLaPrimeraMarcada ? (
              <Insignia tono="llena">{marcaDeLaPrimera}</Insignia>
            ) : null}
            {!esLaPrimeraMarcada && vista.recomendada ? (
              <Insignia tono="llena">Recomendada</Insignia>
            ) : null}
            {!esLaPrimeraMarcada && vista.nueva ? (
              <Insignia tono="tinta">Nueva</Insignia>
            ) : null}
          </div>
          {vista.rubro ? (
            <p className="mt-1.5 text-xs font-semibold tracking-[0.12em] text-tinta/65 uppercase">
              {vista.rubro}
            </p>
          ) : null}
          {vista.descripcion ? (
            <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-relaxed text-tinta/80">
              {vista.descripcion}
            </p>
          ) : null}
          {!esLaPrimeraMarcada && notas.length > 0 ? (
            <div className="mt-2 flex flex-col gap-0.5">
              {notas.map((nota) => (
                <p key={nota} className="text-sm text-tinta/65">
                  {nota.replace("{plantilla}", vista.nombre)}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        {acciones?.(vista, indice)}
      </div>
    </div>
  )
}
