"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Piezas chicas que repiten los pasos del editor.
 *
 * Todo en el mundo editorial de Venduo: el editor es una herramienta de la
 * plataforma, y la identidad de la tienda vive en la vista previa. Si los
 * controles tomaran los colores del borrador, cambiarían bajo el dedo de quien
 * está eligiendo un color.
 */

/** El encabezado de un paso: su nombre y para qué sirve. */
export function EncabezadoDePaso({
  titulo,
  bajada,
}: {
  titulo: string
  bajada: string
}) {
  return (
    <header className="px-5 pt-4 pb-4 lg:pt-6 lg:pb-5 [@media(max-height:700px)]:max-lg:p-0">
      {/* En el celular el nombre ya está en la barra del panel, y ahí cada
          renglón cuenta. */}
      <h1 className="font-titular text-3xl leading-none font-extrabold tracking-[-0.03em] max-lg:sr-only">
        {titulo}
      </h1>
      <p className="max-w-[42ch] text-sm leading-relaxed opacity-70 lg:mt-2 [@media(max-height:700px)]:max-lg:hidden">
        {bajada}
      </p>
    </header>
  )
}

/**
 * Un ajuste abierto desde su fila, en el mismo panel: así la vista previa sigue
 * a la vista mientras se elige, también en el celular.
 */
export function AjusteAbierto({
  volver,
  titulo,
  ayuda,
  principal = false,
  alVolver,
  children,
}: {
  /** El nombre de la lista a la que se vuelve. */
  volver: string
  titulo: string
  ayuda?: string
  /** Si es el encabezado principal de la pantalla mientras está abierto. */
  principal?: boolean
  alVolver: () => void
  children: React.ReactNode
}) {
  const inicio = React.useRef<HTMLDivElement>(null)
  const Titulo = principal ? "h1" : "h2"

  React.useEffect(() => {
    inicio.current?.scrollIntoView({ block: "nearest" })
  }, [])

  return (
    <div
      ref={inicio}
      className="motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in motion-safe:slide-in-from-right-2"
    >
      <div className="border-b border-tinta/15 px-2">
        <button
          type="button"
          onClick={alVolver}
          className="flex min-h-11 items-center gap-2 px-3 text-sm font-semibold transition-colors hover:opacity-60"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {volver}
        </button>
      </div>
      <div className="px-5 pt-4 pb-6">
        <Titulo className="font-titular text-xl leading-tight font-extrabold tracking-[-0.02em]">
          {titulo}
        </Titulo>
        {ayuda ? (
          <p className="mt-1 text-sm leading-relaxed opacity-70">{ayuda}</p>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

/** Para mostrar el resto de una lista larga de opciones. */
export function VerTodas({
  texto,
  alTocar,
}: {
  texto: string
  alTocar: () => void
}) {
  return (
    <button
      type="button"
      onClick={alTocar}
      className="mt-2 min-h-11 text-sm font-semibold underline underline-offset-4 transition-colors hover:opacity-60"
    >
      {texto}
    </button>
  )
}

/** Un grupo de controles dentro de un paso, separado por una regla. */
export function Grupo({
  titulo,
  ayuda,
  accion,
  children,
  className,
}: {
  titulo: string
  ayuda?: React.ReactNode
  accion?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("border-t border-tinta/15 px-5 py-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold tracking-[0.12em] uppercase opacity-70">
            {titulo}
          </h2>
          {ayuda ? (
            <p className="mt-1 text-xs leading-relaxed opacity-70">{ayuda}</p>
          ) : null}
        </div>
        {accion}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/**
 * Elegir una entre pocas opciones, con dibujos cuando ayudan.
 *
 * Es un grupo de radios accesible: flechas para moverse y cada opción de 44 px
 * como mínimo.
 */
export function Opciones<T extends string | number>({
  etiqueta,
  valor,
  opciones,
  alCambiar,
  columnas,
}: {
  etiqueta: string
  valor: T
  opciones: Array<{ valor: T; etiqueta: string; dibujo?: React.ReactNode }>
  alCambiar: (valor: T) => void
  columnas?: number
}) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([])

  function mover(evento: React.KeyboardEvent, indice: number) {
    const paso =
      evento.key === "ArrowRight" || evento.key === "ArrowDown"
        ? 1
        : evento.key === "ArrowLeft" || evento.key === "ArrowUp"
          ? -1
          : 0
    if (!paso) return
    evento.preventDefault()
    const siguiente = (indice + paso + opciones.length) % opciones.length
    alCambiar(opciones[siguiente].valor)
    refs.current[siguiente]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={etiqueta}
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${columnas ?? opciones.length}, minmax(0, 1fr))`,
      }}
    >
      {opciones.map((opcion, indice) => {
        const activa = opcion.valor === valor
        return (
          <button
            key={String(opcion.valor)}
            ref={(elemento) => {
              refs.current[indice] = elemento
            }}
            type="button"
            role="radio"
            aria-checked={activa}
            tabIndex={activa ? 0 : -1}
            onClick={() => alCambiar(opcion.valor)}
            onKeyDown={(evento) => mover(evento, indice)}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-2 rounded-[12px] border px-2 py-3 text-xs font-semibold transition-colors",
              activa
                ? "border-tinta bg-tinta text-papel"
                : "border-tinta/20 hover:border-tinta/60"
            )}
          >
            {opcion.dibujo}
            <span>{opcion.etiqueta}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Al pie de cada paso: el siguiente, para quien prefiere ir en orden. */
export function SiguientePaso({
  nombre,
  alIr,
}: {
  nombre: string
  alIr: () => void
}) {
  return (
    <div className="border-t border-tinta/15 p-5">
      <button
        type="button"
        onClick={alIr}
        className="group flex min-h-12 w-full items-center justify-between gap-3 rounded-plantilla border-2 border-tinta px-5 font-semibold transition-colors hover:bg-tinta hover:text-papel"
      >
        <span>
          <span className="mr-2 text-xs font-semibold tracking-[0.12em] uppercase opacity-70">
            Siguiente
          </span>
          {nombre}
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-5 transition-transform duration-300 motion-safe:group-hover:translate-x-1"
        />
      </button>
    </div>
  )
}

/** Un aviso dentro de un paso. El rojo es solo para lo que hay que resolver. */
export function Aviso({
  tono = "info",
  children,
  className,
}: {
  tono?: "info" | "problema"
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      role={tono === "problema" ? "alert" : undefined}
      className={cn(
        "border-l-2 py-1 pl-3 text-sm leading-relaxed",
        tono === "problema" ? "border-senal" : "border-tinta/40 opacity-80",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Un ajuste que se prende o se apaga, con lo que hace dicho al lado.
 *
 * Toda la fila es el interruptor: se toca en cualquier parte, no solo en la
 * perilla, y mide 44 px o más.
 */
export function Interruptor({
  etiqueta,
  ayuda,
  activo,
  alCambiar,
  deshabilitado = false,
}: {
  etiqueta: string
  ayuda?: string
  activo: boolean
  alCambiar: (activo: boolean) => void
  deshabilitado?: boolean
}) {
  // Sale de la etiqueta y no de `useId`: el paso puede venir dibujado del
  // servidor, y ahí `useId` no siempre daba lo mismo que en el navegador.
  const id = `ajuste-${etiqueta.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-labelledby={`${id}-etiqueta`}
      aria-describedby={ayuda ? `${id}-ayuda` : undefined}
      disabled={deshabilitado}
      onClick={() => alCambiar(!activo)}
      className="flex min-h-14 w-full items-center gap-4 border-b border-tinta/15 py-3 text-left transition-colors enabled:hover:bg-tinta/[0.03] disabled:cursor-not-allowed"
    >
      <span className={cn("min-w-0 flex-1", deshabilitado && "opacity-55")}>
        <span id={`${id}-etiqueta`} className="block text-sm font-semibold">
          {etiqueta}
        </span>
        {ayuda ? (
          <span
            id={`${id}-ayuda`}
            className="mt-0.5 block text-xs leading-relaxed opacity-65"
          >
            {ayuda}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border-2 transition-colors",
          activo ? "border-tinta bg-tinta" : "border-tinta/40",
          deshabilitado && "opacity-40"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full transition-[left] duration-200 motion-reduce:transition-none",
            activo ? "left-[1.375rem] bg-papel" : "left-0.5 bg-tinta/45"
          )}
        />
      </span>
    </button>
  )
}
