"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import type { EstadoDeFuncion } from "@/lib/funciones"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import type { CambioDePlantilla } from "@/app/(privado)/panel/apariencia/acciones"
import { HojaDeAjuste } from "@/components/panel/ajustes"
import { ConFuncion } from "@/components/panel/funcion"
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

function prefiereQuieto() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * La pasarela de Apariencia: una plantilla a la vez, grande y en el centro,
 * con la tienda de la persona adentro. Arranca en la suya —con el editor a
 * mano— y con las flechas, deslizando o con ← y → se pasa a las otras, que
 * llevan "Usar X". Se compara viendo, sin abrir nada.
 *
 * "Usar X" abre la pregunta en una hoja: cambiar la plantilla cambia lo que ve
 * cada comprador en ese momento, y ofrece una sola decisión, conservar la
 * portada —lo seguro, porque sus textos pueden ser trabajo del emprendedor— o
 * empezar con la de la plantilla nueva. Las dos guardan antes el diseño.
 *
 * Las miniaturas llegan dibujadas del servidor: importarlas acá traería al
 * navegador todas las definiciones de plantilla con zod.
 */
export function PasarelaDeApariencia({
  actual,
  otras,
  miniaturas,
  notas,
  urlDeTienda,
  editor,
  cambio,
  cambiar,
}: {
  /** La plantilla de la tienda; `nombre` ya dice "Plantilla anterior" si se retiró. */
  actual: PlantillaDeLaPasarela
  /** A las que se puede pasar. Vacía si Venduo ocultó el cambio de plantilla. */
  otras: PlantillaDeLaPasarela[]
  /** La de la tienda primero y después las otras, en el mismo orden, ya dibujadas. */
  miniaturas: React.ReactNode[]
  /** Lo que se aclara debajo del dibujo de las otras; "{plantilla}" lleva su nombre. */
  notas: string[]
  urlDeTienda: string
  editor: EstadoDeFuncion
  cambio: EstadoDeFuncion
  cambiar: (
    entrada: CambioDePlantilla
  ) => Promise<{ ok: boolean; error?: string }>
}) {
  const router = useRouter()
  const todas = [actual, ...otras]
  const total = todas.length
  const [indice, setIndice] = React.useState(0)
  const [preguntando, setPreguntando] = React.useState(false)
  const [conservar, setConservar] = React.useState(true)
  const [enCurso, setEnCurso] = React.useState(false)
  const franja = React.useRef<HTMLDivElement>(null)
  const vista = todas[indice] ?? actual
  const esLaTuya = indice === 0

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
    if (!nodo || enCurso || destino < 0 || destino >= total) return
    nodo.scrollTo({
      left: nodo.clientWidth * destino,
      behavior: prefiereQuieto() ? "auto" : "smooth",
    })
  }

  async function usar() {
    setEnCurso(true)
    const resultado = await cambiar({
      clave: vista.clave,
      conservarSecciones: conservar,
    })
    setEnCurso(false)

    if (!resultado.ok) {
      toast.error(
        resultado.error ??
          "No pudimos cambiar la plantilla. Inténtalo de nuevo."
      )
      return
    }

    setPreguntando(false)
    toast.success(`Tu tienda ahora usa ${vista.nombre}.`)
    // Vuelve a la primera: ahí queda la nueva, ya como la tuya.
    franja.current?.scrollTo({ left: 0, behavior: "auto" })
    router.refresh()
  }

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
            enCurso ? "overflow-hidden" : "overflow-x-auto"
          )}
        >
          {todas.map((plantilla, i) => (
            <div
              key={plantilla.clave}
              data-indice={i}
              aria-roledescription="plantilla"
              aria-label={
                i === 0 ? `${plantilla.nombre}, la tuya` : plantilla.nombre
              }
              className="w-full shrink-0 snap-center px-0.5"
            >
              <div className="overflow-hidden rounded-[16px] border border-tinta/15">
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
              disabled={indice === 0 || enCurso}
              aria-label={
                indice > 0
                  ? `Anterior: ${todas[indice - 1].nombre}`
                  : "Anterior"
              }
              className={cn(flecha, "-left-3 sm:-left-5 xl:-left-16")}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => ir(indice + 1)}
              disabled={indice === total - 1 || enCurso}
              aria-label={
                indice < total - 1
                  ? `Siguiente: ${todas[indice + 1].nombre}`
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
            {todas.map((plantilla, i) => (
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
            {esLaTuya ? <Insignia tono="llena">La tuya</Insignia> : null}
            {!esLaTuya && vista.recomendada ? (
              <Insignia tono="llena">Recomendada</Insignia>
            ) : null}
            {!esLaTuya && vista.nueva ? (
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
          {!esLaTuya && notas.length > 0 ? (
            <div className="mt-2 flex flex-col gap-0.5">
              {notas.map((nota) => (
                <p key={nota} className="text-sm text-tinta/65">
                  {nota.replace("{plantilla}", vista.nombre)}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        {/* Dos columnas iguales: a su ancho, los botones bajaban de renglón. */}
        {esLaTuya ? (
          <div
            className={cn(
              "grid w-full gap-2 sm:max-w-[26rem]",
              editor === "oculta" ? "grid-cols-1" : "grid-cols-2"
            )}
          >
            {editor !== "oculta" ? (
              <ConFuncion estado={editor}>
                <Link
                  href="/editor"
                  className={cn(BOTON_PRIMARIO, "w-full px-4 text-sm")}
                >
                  Abrir el editor
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </ConFuncion>
            ) : null}
            <a
              href={urlDeTienda}
              target="_blank"
              rel="noreferrer noopener"
              className={cn(BOTON_SECUNDARIO, "w-full px-4 text-sm")}
            >
              Ver tienda
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </div>
        ) : (
          <div className="w-full sm:max-w-[26rem]">
            <ConFuncion estado={cambio}>
              <button
                type="button"
                onClick={() => {
                  setConservar(true)
                  setPreguntando(true)
                }}
                className={cn(BOTON_PRIMARIO, "w-full")}
              >
                Usar {vista.nombre}
              </button>
            </ConFuncion>
          </div>
        )}
      </div>

      {esLaTuya ? null : (
        <HojaDeAjuste
          abierta={preguntando}
          titulo={`¿Pasar a ${vista.nombre}?`}
          descripcion="Cambia cómo se ve tu tienda. Antes de cambiar guardamos cómo estaba."
          alCerrar={() => {
            if (!enCurso) setPreguntando(false)
          }}
          pie={
            <button
              type="button"
              onClick={usar}
              disabled={enCurso}
              className={cn(BOTON_PRIMARIO, "w-full")}
            >
              {enCurso ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              Usar {vista.nombre}
            </button>
          }
        >
          {vista.rasgos.length > 0 ? (
            <ul className="border-t border-tinta/15">
              {vista.rasgos.map((rasgo) => (
                <li
                  key={rasgo}
                  className="border-b border-tinta/15 py-2.5 text-sm text-tinta/80"
                >
                  {rasgo}
                </li>
              ))}
            </ul>
          ) : null}
          <fieldset>
            <legend className="text-xs font-semibold tracking-[0.12em] text-tinta/65 uppercase">
              Tu portada
            </legend>
            <div className="mt-3 flex flex-col gap-2">
              <Opcion
                nombre={`portada-${vista.clave}`}
                activa={conservar}
                onElegir={() => setConservar(true)}
                titulo="Conservar la mía"
                texto="Tus textos y el orden quedan igual; cambia solo cómo se ven."
              />
              <Opcion
                nombre={`portada-${vista.clave}`}
                activa={!conservar}
                onElegir={() => setConservar(false)}
                titulo={`Empezar con la de ${vista.nombre}`}
                texto={`Tu portada se arma con las secciones de ${vista.nombre}.`}
              />
            </div>
          </fieldset>
        </HojaDeAjuste>
      )}
    </div>
  )
}

function Opcion({
  nombre,
  activa,
  onElegir,
  titulo,
  texto,
}: {
  nombre: string
  activa: boolean
  onElegir: () => void
  titulo: string
  texto: string
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-[14px] border p-4 transition-colors",
        activa
          ? "border-tinta bg-tinta/[0.04]"
          : "border-tinta/20 hover:border-tinta/50"
      )}
    >
      <input
        type="radio"
        name={nombre}
        checked={activa}
        onChange={onElegir}
        className="mt-1 size-4 shrink-0 accent-[var(--tinta)]"
      />
      <span>
        <span className="block text-sm font-semibold">{titulo}</span>
        <span className="mt-1 block text-sm leading-relaxed text-tinta/70">
          {texto}
        </span>
      </span>
    </label>
  )
}

/**
 * El historial, corto: las últimas versiones a la vista y el resto a pedido,
 * con el botón al pie para que "Ver menos" no quede en medio de la lista.
 * Las filas llegan dibujadas del servidor.
 */
export function ListaDeVersiones({
  filas,
  aLaVista = 3,
}: {
  filas: React.ReactNode[]
  aLaVista?: number
}) {
  const [todas, setTodas] = React.useState(false)
  const corta = filas.length > aLaVista + 1
  const visibles = corta && !todas ? filas.slice(0, aLaVista) : filas
  const resto = filas.length - aLaVista

  return (
    <>
      <ol>{visibles}</ol>
      {corta ? (
        <button
          type="button"
          onClick={() => setTodas((antes) => !antes)}
          aria-expanded={todas}
          className="flex min-h-12 w-full items-center border-t border-tinta/15 px-4 text-sm font-semibold transition-colors hover:bg-tinta/[0.04] sm:px-5"
        >
          {todas
            ? "Ver menos"
            : resto === 1
              ? "Ver la anterior"
              : `Ver las ${resto} anteriores`}
        </button>
      ) : null}
    </>
  )
}
