"use client"

import * as React from "react"
import Image from "next/image"
import { Check, Minus, Plus, Sparkles } from "lucide-react"

import type { ProductoDelCatalogo } from "@/lib/catalogos/datos"
import { cn } from "@/lib/utils"

/*
 * Los campos del editor de catálogos.
 *
 * En el mundo de Venduo y no en el de la tienda, como los del editor de la
 * tienda: la identidad de la tienda vive en la vista previa, y si los
 * controles tomaran sus colores cambiarían bajo el dedo de quien los elige.
 * Cada cambio va directo al catálogo, y la vista previa se redibuja sola.
 */

export const ETIQUETA =
  "text-xs font-semibold tracking-[0.12em] uppercase opacity-65"

const CAJA =
  "w-full border-0 border-b border-tinta/40 bg-transparent px-0 text-base transition-colors placeholder:text-tinta/35 focus-visible:border-senal focus-visible:outline-none"

export function CampoTexto({
  id,
  etiqueta,
  valor,
  maximo,
  ayuda,
  placeholder,
  alCambiar,
}: {
  id: string
  etiqueta: string
  valor: string
  maximo: number
  ayuda?: string
  placeholder?: string
  alCambiar: (valor: string) => void
}) {
  return (
    <div>
      <label htmlFor={id} className={ETIQUETA}>
        {etiqueta}
      </label>
      <input
        id={id}
        value={valor}
        maxLength={maximo}
        placeholder={placeholder}
        onChange={(evento) => alCambiar(evento.target.value)}
        className={cn(CAJA, "mt-1 h-11")}
      />
      {ayuda ? (
        <p className="mt-1.5 text-xs leading-relaxed opacity-65">{ayuda}</p>
      ) : null}
    </div>
  )
}

export function CampoArea({
  id,
  etiqueta,
  valor,
  maximo,
  ayuda,
  placeholder,
  filas = 3,
  alCambiar,
}: {
  id: string
  etiqueta: string
  valor: string
  maximo: number
  ayuda?: string
  placeholder?: string
  filas?: number
  alCambiar: (valor: string) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={ETIQUETA}>
          {etiqueta}
        </label>
        <span className="tabular text-xs opacity-55">
          {valor.length}/{maximo}
        </span>
      </div>
      <textarea
        id={id}
        value={valor}
        maxLength={maximo}
        rows={filas}
        placeholder={placeholder}
        onChange={(evento) => alCambiar(evento.target.value)}
        className={cn(CAJA, "mt-1 resize-y py-2 leading-relaxed")}
      />
      {ayuda ? (
        <p className="mt-1.5 text-xs leading-relaxed opacity-65">{ayuda}</p>
      ) : null}
    </div>
  )
}

/** Un sí o no, con su explicación. Es un interruptor accesible de 44 px. */
export function Interruptor({
  etiqueta,
  detalle,
  activo,
  deshabilitado,
  alCambiar,
}: {
  etiqueta: string
  detalle?: string
  activo: boolean
  deshabilitado?: boolean
  alCambiar: (activo: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      disabled={deshabilitado}
      onClick={() => alCambiar(!activo)}
      className="flex min-h-11 w-full items-center justify-between gap-4 text-left disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{etiqueta}</span>
        {detalle ? (
          <span className="mt-0.5 block text-xs leading-relaxed opacity-65">
            {detalle}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-10 shrink-0 border-2 border-tinta transition-colors",
          activo ? "bg-tinta" : "bg-transparent"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 transition-[left] duration-200 motion-reduce:transition-none",
            activo ? "left-[18px] bg-papel" : "left-0.5 bg-tinta"
          )}
        />
      </span>
    </button>
  )
}

/** Un número chico con menos y más: los productos por hoja. */
export function Contador({
  etiqueta,
  valor,
  minimo,
  maximo,
  detalle,
  alCambiar,
}: {
  etiqueta: string
  valor: number
  minimo: number
  maximo: number
  detalle?: string
  alCambiar: (valor: number) => void
}) {
  const boton =
    "flex size-11 items-center justify-center border-2 border-tinta transition-colors hover:bg-tinta hover:text-papel disabled:pointer-events-none disabled:opacity-30"
  return (
    <div>
      <p className={ETIQUETA}>{etiqueta}</p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          aria-label="Uno menos"
          disabled={valor <= minimo}
          onClick={() => alCambiar(valor - 1)}
          className={boton}
        >
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <output
          aria-live="polite"
          className="tabular min-w-8 text-center font-titular text-2xl font-extrabold"
        >
          {valor}
        </output>
        <button
          type="button"
          aria-label="Uno más"
          disabled={valor >= maximo}
          onClick={() => alCambiar(valor + 1)}
          className={boton}
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
        {detalle ? (
          <span className="text-sm leading-snug opacity-70">{detalle}</span>
        ) : null}
      </div>
    </div>
  )
}

/** Elegir entre pocas opciones con fichas: la variante de una hoja, por ejemplo. */
export function Fichas<T extends string>({
  etiqueta,
  valor,
  opciones,
  alCambiar,
}: {
  etiqueta: string
  valor: T
  opciones: { valor: T; etiqueta: string }[]
  alCambiar: (valor: T) => void
}) {
  return (
    <fieldset className="min-w-0">
      <legend className={ETIQUETA}>{etiqueta}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {opciones.map((opcion) => {
          const activa = opcion.valor === valor
          return (
            <button
              key={opcion.valor}
              type="button"
              aria-pressed={activa}
              onClick={() => alCambiar(opcion.valor)}
              className={cn(
                "flex min-h-11 items-center border px-3 text-sm font-semibold transition-colors",
                activa
                  ? "border-tinta bg-tinta text-papel"
                  : "border-tinta/25 hover:border-tinta"
              )}
            >
              {opcion.etiqueta}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * La foto de una portada o un separador: la de uno de los productos elegidos,
 * o automática —la del primero que tenga—.
 */
export function SelectorDeFoto({
  etiqueta,
  valor,
  productos,
  alCambiar,
}: {
  etiqueta: string
  valor: string | null
  productos: ProductoDelCatalogo[]
  alCambiar: (valor: string | null) => void
}) {
  const conFoto = productos.filter((producto) => producto.foto).slice(0, 24)
  const opcion = (activa: boolean) =>
    cn(
      "relative flex size-16 shrink-0 items-center justify-center overflow-hidden border-2 transition-colors",
      activa ? "border-tinta" : "border-transparent hover:border-tinta/40"
    )

  return (
    <fieldset className="min-w-0">
      <legend className={ETIQUETA}>{etiqueta}</legend>
      <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-2">
        <button
          type="button"
          aria-pressed={valor === null}
          onClick={() => alCambiar(null)}
          className={cn(opcion(valor === null), "bg-tinta/[0.05]")}
        >
          <Sparkles aria-hidden="true" className="size-4 opacity-60" />
          <span className="sr-only">Automática</span>
        </button>
        {conFoto.map((producto) => (
          <button
            key={producto.id}
            type="button"
            aria-pressed={valor === producto.id}
            aria-label={`Foto de ${producto.nombre}`}
            onClick={() => alCambiar(producto.id)}
            className={opcion(valor === producto.id)}
          >
            {producto.foto ? (
              <Image
                src={producto.foto}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : null}
            {valor === producto.id ? (
              <span className="absolute right-0.5 bottom-0.5 flex size-4 items-center justify-center bg-tinta text-papel">
                <Check aria-hidden="true" className="size-3" />
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <p className="text-xs leading-relaxed opacity-65">
        {valor === null
          ? "Automática: la del primer producto con foto."
          : "Usa la foto de ese producto."}
      </p>
    </fieldset>
  )
}
