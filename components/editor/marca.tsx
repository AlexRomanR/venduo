"use client"

import * as React from "react"
import { Check, ChevronDown, CircleCheck, RotateCcw } from "lucide-react"

import { ESPACIADOS, type Apariencia } from "@/lib/plantillas/apariencia"
import { familiaDe } from "@/lib/plantillas/fuentes"
import { cn } from "@/lib/utils"
import { Aviso, Opciones, VerTodas } from "@/components/editor/piezas"

/**
 * Las piezas de "Tu marca", iguales en el editor de la tienda y en el de
 * catálogos: quien aprendió a elegir un color en uno ya sabe hacerlo en el otro.
 * Cada editor les pasa sus valores y decide qué hacer al elegir.
 */

/** Lo que se muestra de entrada: de una lista larga, nadie compara todo. */
const A_LA_VISTA = 6

/** Las primeras, y siempre la elegida: tiene que verse qué hay puesto. */
function primeras<T extends { activa: boolean }>(opciones: T[]): T[] {
  const inicio = opciones.slice(0, A_LA_VISTA)
  const elegida = opciones.find((opcion) => opcion.activa)
  return !elegida || inicio.includes(elegida)
    ? inicio
    : [...inicio.slice(0, A_LA_VISTA - 1), elegida]
}

export interface OpcionDePaleta {
  nombre: string
  colores: { papel: string; tinta: string; destacado: string }
  activa: boolean
  alElegir: () => void
}

export function ListaDePaletas({ opciones }: { opciones: OpcionDePaleta[] }) {
  const [todas, setTodas] = React.useState(false)

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {(todas ? opciones : primeras(opciones)).map(
          ({ nombre, colores, activa, alElegir }) => (
            <button
              key={nombre}
              type="button"
              aria-pressed={activa}
              onClick={alElegir}
              className={cn(
                "group flex min-w-0 flex-col overflow-hidden rounded-[14px] border bg-hoja text-left transition-colors",
                activa
                  ? "border-tinta outline-2 outline-offset-2 outline-tinta"
                  : "border-tinta/20 hover:border-tinta/60"
              )}
            >
              {/* Se pinta con los colores de la paleta, no con los del editor:
                  es un pedacito de cómo quedaría. */}
              <span
                className="flex h-12 items-end justify-between gap-1 p-2"
                style={{ background: colores.papel, color: colores.tinta }}
              >
                <span className="font-titular text-lg leading-none font-extrabold">
                  Aa
                </span>
                <span
                  aria-hidden="true"
                  className="h-4 w-7 rounded-sm transition-transform duration-300 motion-safe:group-hover:-translate-y-0.5"
                  style={{ background: colores.destacado }}
                />
              </span>
              <span className="flex min-h-10 items-center justify-between gap-1 border-t border-tinta/15 px-2 text-xs leading-tight font-semibold">
                {nombre}
                {activa ? (
                  <Check aria-hidden="true" className="size-3.5 shrink-0" />
                ) : null}
              </span>
            </button>
          )
        )}
      </div>
      {todas || opciones.length <= A_LA_VISTA ? null : (
        <VerTodas
          texto={`Ver las ${opciones.length} paletas`}
          alTocar={() => setTodas(true)}
        />
      )}
    </>
  )
}

export interface OpcionDeLetra {
  nombre: string
  ideal: string
  tipografia: Pick<
    Apariencia["tipografia"],
    "titular" | "cuerpo" | "mayusculas"
  > &
    Partial<Pick<Apariencia["tipografia"], "pesoTitular" | "espaciadoTitular">>
  activa: boolean
  alElegir: () => void
}

export function ListaDeLetras({ opciones }: { opciones: OpcionDeLetra[] }) {
  const [todas, setTodas] = React.useState(false)

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {(todas ? opciones : primeras(opciones)).map(
          ({ nombre, ideal, tipografia, activa, alElegir }) => (
            <button
              key={nombre}
              type="button"
              aria-pressed={activa}
              onClick={alElegir}
              className={cn(
                "flex flex-col overflow-hidden rounded-[14px] border text-left transition-colors",
                activa
                  ? "border-tinta bg-tinta text-papel"
                  : "border-tinta/20 hover:border-tinta/60"
              )}
            >
              <span
                className="block px-3 pt-3 text-2xl leading-none"
                style={{
                  fontFamily: familiaDe(tipografia.titular),
                  fontWeight: tipografia.pesoTitular ?? 700,
                  letterSpacing:
                    ESPACIADOS[tipografia.espaciadoTitular ?? "normal"],
                  textTransform: tipografia.mayusculas ? "uppercase" : "none",
                }}
              >
                Aa
              </span>
              <span
                className="block px-3 pt-2 text-sm font-semibold"
                style={{ fontFamily: familiaDe(tipografia.cuerpo) }}
              >
                {nombre}
              </span>
              <span
                className="block px-3 pb-3 text-xs leading-snug opacity-70"
                style={{ fontFamily: familiaDe(tipografia.cuerpo) }}
              >
                {ideal}
              </span>
            </button>
          )
        )}
      </div>
      {todas || opciones.length <= A_LA_VISTA ? null : (
        <VerTodas
          texto={`Ver las ${opciones.length} letras`}
          alTocar={() => setTodas(true)}
        />
      )}
    </>
  )
}

export function OpcionDeMayusculas({
  valor,
  alCambiar,
}: {
  valor: boolean
  alCambiar: (mayusculas: boolean) => void
}) {
  return (
    <Opciones
      etiqueta="Títulos"
      valor={valor ? "si" : "no"}
      opciones={[
        { valor: "no", etiqueta: "Títulos normales" },
        { valor: "si", etiqueta: "TÍTULOS EN MAYÚSCULAS" },
      ]}
      alCambiar={(elegido) => alCambiar(elegido === "si")}
    />
  )
}

/** Lo más fino de un ajuste, cerrado hasta que alguien lo busque. */
export function ElegirCadaUno({
  titulo,
  abiertoAlInicio = false,
  children,
}: {
  titulo: string
  abiertoAlInicio?: boolean
  children: React.ReactNode
}) {
  const [abierto, setAbierto] = React.useState(abiertoAlInicio)

  return (
    <div className="mt-5 border-t border-tinta/15 pt-2">
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((actual) => !actual)}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-sm font-semibold"
      >
        {titulo}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 transition-transform motion-reduce:transition-none",
            abierto && "rotate-180"
          )}
        />
      </button>
      {abierto ? children : null}
    </div>
  )
}

/** Un color: el selector del sistema y su código, para quien lo tiene anotado. */
export function FilaDeColor({
  nombre,
  para,
  valor,
  alCambiar,
  volver,
}: {
  nombre: string
  para: string
  valor: string
  alCambiar: (hex: string, escribiendo: boolean) => void
  /** Si cambió, cómo volver al de origen. */
  volver?: { titulo: string; alTocar: () => void } | null
}) {
  return (
    <li className="flex items-center gap-3 border-b border-tinta/15 py-2">
      <label
        className="relative size-11 shrink-0 cursor-pointer rounded-[10px] border border-tinta/25 transition-transform motion-safe:hover:scale-105"
        style={{ background: valor }}
      >
        <span className="sr-only">Elegir el color de {nombre}</span>
        <input
          type="color"
          value={valor}
          onChange={(evento) => alCambiar(evento.target.value, false)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{nombre}</span>
        <span className="block truncate text-xs opacity-70">{para}</span>
      </span>
      <CampoHex
        etiqueta={`Código del color de ${nombre}`}
        valor={valor}
        alCambiar={(hex) => alCambiar(hex, true)}
      />
      {volver ? (
        <button
          type="button"
          aria-label={`${volver.titulo}: ${nombre}`}
          title={volver.titulo}
          onClick={volver.alTocar}
          className="-mr-2 flex size-11 shrink-0 items-center justify-center opacity-70 transition-opacity hover:opacity-100"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
        </button>
      ) : (
        <span aria-hidden="true" className="-mr-2 size-11 shrink-0" />
      )}
    </li>
  )
}

function CampoHex({
  etiqueta,
  valor,
  alCambiar,
}: {
  etiqueta: string
  valor: string
  alCambiar: (hex: string) => void
}) {
  const [texto, setTexto] = React.useState(valor)
  React.useEffect(() => setTexto(valor), [valor])

  function confirmar() {
    const limpio = texto.trim().replace(/^#?/, "#").toLowerCase()
    if (/^#[0-9a-f]{6}$/.test(limpio)) {
      if (limpio !== valor) alCambiar(limpio)
      setTexto(limpio)
    } else {
      setTexto(valor)
    }
  }

  return (
    <input
      aria-label={etiqueta}
      value={texto}
      onChange={(evento) => setTexto(evento.target.value)}
      onBlur={confirmar}
      onKeyDown={(evento) => {
        if (evento.key === "Enter") {
          evento.preventDefault()
          confirmar()
        }
      }}
      maxLength={7}
      spellCheck={false}
      className="tabular h-11 w-[5.5rem] shrink-0 border-0 border-b border-tinta/30 bg-transparent px-0 font-mono text-sm uppercase transition-colors focus-visible:border-tinta focus-visible:bg-tinta/[0.04] focus-visible:outline-none"
    />
  )
}

/** Si los colores se leen, y si no, qué no se lee y con qué se arregla. */
export function AvisoDeLegibilidad({
  problemas,
  arreglo,
  sinArreglo,
  consecuencia,
}: {
  problemas: string[]
  arreglo: { hex: string; texto: string; alUsar: () => void } | null
  sinArreglo: string
  /** Qué no se puede hacer mientras no se lea. */
  consecuencia: string
}) {
  if (problemas.length === 0) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm opacity-70">
        <CircleCheck aria-hidden="true" className="size-4 shrink-0" />
        Todo se lee bien.
      </p>
    )
  }

  return (
    <Aviso tono="problema" className="mt-4">
      <p className="font-semibold">Así no se va a leer bien.</p>
      <ul className="mt-1 opacity-80">
        {problemas.map((problema) => (
          <li key={problema}>{problema}</li>
        ))}
      </ul>
      {arreglo ? (
        <button
          type="button"
          onClick={arreglo.alUsar}
          className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-senal transition-colors hover:text-senal-alta"
        >
          <span
            aria-hidden="true"
            className="size-5 rounded-[6px] border border-tinta/25"
            style={{ background: arreglo.hex }}
          />
          {arreglo.texto}
        </button>
      ) : (
        <p className="mt-2 opacity-80">{sinArreglo}</p>
      )}
      <p className="mt-1 text-xs opacity-70">{consecuencia}</p>
    </Aviso>
  )
}
