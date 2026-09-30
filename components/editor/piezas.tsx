"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Piezas chicas que repiten los pasos del editor.
 *
 * Todo en el mundo editorial de Venduo: el editor es una herramienta de la
 * plataforma, y la identidad de la tienda vive en la vista previa. Si los
 * controles tomaran los colores del borrador, cambiarían bajo el dedo de quien
 * está eligiendo un color.
 */

/** El encabezado de un paso: número, título y para qué sirve. */
export function EncabezadoDePaso({
  numero,
  titulo,
  bajada,
}: {
  numero: number
  titulo: string
  bajada: string
}) {
  return (
    <header className="px-5 pt-6 pb-5">
      <p className="tabular text-xs font-semibold tracking-[0.12em] text-senal uppercase">
        Paso {numero} de 6
      </p>
      <h2 className="mt-2 font-titular text-[1.75rem] leading-none font-extrabold tracking-[-0.03em]">
        {titulo}
      </h2>
      <p className="mt-2 max-w-[42ch] text-sm leading-relaxed opacity-70">
        {bajada}
      </p>
    </header>
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
          <h3 className="text-xs font-semibold tracking-[0.12em] uppercase opacity-60">
            {titulo}
          </h3>
          {ayuda ? (
            <p className="mt-1 text-xs leading-relaxed opacity-55">{ayuda}</p>
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
              "flex min-h-11 flex-col items-center justify-center gap-2 border px-2 py-3 text-xs font-semibold transition-colors",
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
          <span className="mr-2 text-xs font-semibold tracking-[0.12em] uppercase opacity-60">
            Siguiente
          </span>
          {nombre}
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
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
