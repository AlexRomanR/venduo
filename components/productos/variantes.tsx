"use client"

import * as React from "react"
import Image from "next/image"
import {
  Check,
  Droplet,
  Footprints,
  ImageOff,
  Minus,
  Palette,
  PencilLine,
  Plus,
  Shirt,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react"

import { ETIQUETA_CAMPO } from "@/lib/estilos"
import { CURRENCY_SYMBOL, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  combinaciones,
  fotoDe,
  MAXIMO_DE_OPCIONES,
  MAXIMO_DE_VARIANTES,
  mismaCombinacion,
  MUESTRAS_DE_COLOR,
  ordenarValores,
  TIPOS_DE_OPCION,
  tipoDe,
  type Opcion,
  type TipoDeOpcion,
  type Valores,
} from "@/lib/variantes"

/** Una variante como la edita el formulario: el precio en bolivianos. */
export interface VarianteEnFormulario {
  valores: Valores
  stock: number
  precio: number | null
  imagen: string | null
}

/** El ícono de cada tipo de opción, para reconocerlo sin leer. */
const ICONOS: Record<string, LucideIcon> = {
  Talla: Shirt,
  Número: Footprints,
  Color: Palette,
  Tamaño: Droplet,
}

/**
 * Las tallas, colores y números de un producto, eligiendo en vez de escribir.
 *
 * Primero el tipo —talla de ropa, número de calzado, color, tamaño, u otro que
 * se nombra a mano— y después sus valores, que ya están escritos y se marcan
 * con un toque. Lo que no está en la lista se agrega. Cada color lleva su
 * foto, si el producto tiene más de una.
 *
 * Las combinaciones se arman solas, agrupadas por la primera opción, y una que
 * ya existía conserva su stock y su precio: sumar la XL no borra lo de la M.
 */
export function EditorDeVariantes({
  opciones,
  variantes,
  fotos,
  precio,
  alCambiar,
  error,
}: {
  opciones: Opcion[]
  variantes: VarianteEnFormulario[]
  /** Las fotos del producto: de ahí sale la foto de cada color. */
  fotos: string[]
  /** El precio del producto, como se escribe: el de toda variante sin precio propio. */
  precio: number | undefined
  alCambiar: (opciones: Opcion[], variantes: VarianteEnFormulario[]) => void
  error?: string
}) {
  const [agregando, setAgregando] = React.useState(false)
  // La opción con foto es la de color: cada color, la suya.
  const conFoto = opciones.find((o) => tipoDe(o)?.nombre === "Color")?.nombre

  /** Las combinaciones de unas opciones, con lo que ya tenía cada una. */
  function armar(nuevas: Opcion[], renombres: Record<string, string> = {}) {
    const previas = variantes.map((v) => ({
      ...v,
      valores: Object.fromEntries(
        Object.entries(v.valores).map(([clave, valor]) => [
          renombres[clave] ?? clave,
          valor,
        ])
      ),
    }))
    const completas = nuevas.filter((o) => o.nombre.trim() && o.valores.length)
    const color = nuevas.find((o) => tipoDe(o)?.nombre === "Color")?.nombre
    return combinaciones(completas).map(
      (valores) =>
        previas.find((p) => mismaCombinacion(p.valores, valores)) ?? {
          valores,
          stock: 0,
          precio: null,
          imagen:
            color && valores[color]
              ? fotoDe(previas, color, valores[color])
              : null,
        }
    )
  }

  function cambiarOpciones(
    nuevas: Opcion[],
    renombres?: Record<string, string>
  ) {
    alCambiar(nuevas, armar(nuevas, renombres))
  }

  function agregarTipo(tipo: TipoDeOpcion | null) {
    setAgregando(false)
    cambiarOpciones([...opciones, { nombre: tipo?.nombre ?? "", valores: [] }])
  }

  function cambiarVariante(
    indice: number,
    cambio: Partial<VarianteEnFormulario>
  ) {
    alCambiar(
      opciones,
      variantes.map((v, i) => (i === indice ? { ...v, ...cambio } : v))
    )
  }

  const usados = opciones.map((o) => tipoDe(o)?.nombre).filter(Boolean)
  const total = variantes.reduce((suma, v) => suma + (v.stock || 0), 0)
  const cuantas = combinaciones(
    opciones.filter((o) => o.nombre.trim() && o.valores.length)
  ).length

  if (opciones.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed opacity-70">
          ¿Lo vendes en varias tallas, colores o números? Elige cuál: cada
          opción lleva su stock.
        </p>
        <ElegirTipo usados={[]} alElegir={agregarTipo} />
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {opciones.map((opcion, indice) => (
        <EditorDeOpcion
          key={indice}
          opcion={opcion}
          primera={indice === 0}
          fotos={opcion.nombre === conFoto ? fotos : []}
          fotoDe={(valor) => fotoDe(variantes, opcion.nombre, valor)}
          alElegirFoto={(valor, foto) =>
            alCambiar(
              opciones,
              variantes.map((v) =>
                v.valores[opcion.nombre] === valor ? { ...v, imagen: foto } : v
              )
            )
          }
          alCambiarNombre={(nombre) => {
            const anterior = opcion.nombre
            cambiarOpciones(
              opciones.map((o, i) => (i === indice ? { ...o, nombre } : o)),
              anterior ? { [anterior]: nombre } : {}
            )
          }}
          alCambiarValores={(valores) =>
            cambiarOpciones(
              opciones.map((o, i) => (i === indice ? { ...o, valores } : o))
            )
          }
          alQuitar={() =>
            cambiarOpciones(opciones.filter((_, i) => i !== indice))
          }
        />
      ))}

      {opciones.length < MAXIMO_DE_OPCIONES ? (
        <div className="border-t border-tinta/15 py-4">
          {agregando ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">
                  ¿Qué otra opción tiene?
                </span>
                <button
                  type="button"
                  onClick={() => setAgregando(false)}
                  aria-label="Cancelar"
                  className="flex size-11 items-center justify-center transition-colors hover:bg-tinta/[0.06]"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              </div>
              <ElegirTipo usados={usados} alElegir={agregarTipo} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAgregando(true)}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 transition-colors hover:text-senal"
            >
              <Plus aria-hidden="true" className="size-4" />
              {usados.includes("Color")
                ? "Agregar talla o número"
                : "Agregar color u otra opción"}
            </button>
          )}
        </div>
      ) : null}

      {cuantas > MAXIMO_DE_VARIANTES ? (
        <p
          role="alert"
          className="border-t border-tinta/15 pt-4 text-sm font-semibold text-senal"
        >
          Son {formatNumber(cuantas)} combinaciones: el máximo es{" "}
          {MAXIMO_DE_VARIANTES}. Desmarca algunas.
        </p>
      ) : variantes.length > 0 ? (
        <Combinaciones
          opciones={opciones.filter((o) => o.nombre.trim() && o.valores.length)}
          variantes={variantes}
          total={total}
          precio={precio}
          alCambiar={cambiarVariante}
        />
      ) : null}

      {error ? <p className="pt-3 text-sm text-senal">{error}</p> : null}
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Elegir el tipo
 * ------------------------------------------------------------------------ */

/** Las opciones que más se usan, cada una con su ejemplo, y "Otra". */
function ElegirTipo({
  usados,
  alElegir,
}: {
  usados: (string | undefined)[]
  alElegir: (tipo: TipoDeOpcion | null) => void
}) {
  const disponibles = TIPOS_DE_OPCION.filter((t) => !usados.includes(t.nombre))
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {disponibles.map((tipo) => {
        const Icono = ICONOS[tipo.nombre] ?? Shirt
        return (
          <li key={tipo.nombre}>
            <button
              type="button"
              onClick={() => alElegir(tipo)}
              className="flex h-full min-h-[5.5rem] w-full flex-col items-start gap-1.5 border border-tinta/25 p-3 text-left transition-colors hover:border-tinta active:bg-tinta/[0.06]"
            >
              <Icono aria-hidden="true" className="size-5" />
              <span className="leading-tight font-semibold">{tipo.nombre}</span>
              <span className="text-xs leading-snug opacity-65">
                {tipo.nombre === "Color" ? (
                  <MuestrasEnFila />
                ) : (
                  `${tipo.detalle}: ${tipo.valores.slice(0, 3).join(", ")}…`
                )}
              </span>
            </button>
          </li>
        )
      })}
      <li>
        <button
          type="button"
          onClick={() => alElegir(null)}
          className="flex h-full min-h-[5.5rem] w-full flex-col items-start gap-1.5 border border-dashed border-tinta/35 p-3 text-left transition-colors hover:border-tinta active:bg-tinta/[0.06]"
        >
          <PencilLine aria-hidden="true" className="size-5" />
          <span className="leading-tight font-semibold">Otra</span>
          <span className="text-xs leading-snug opacity-65">
            Sabor, modelo, material…
          </span>
        </button>
      </li>
    </ul>
  )
}

/** Unos puntos de color, para que la ficha de "Color" se reconozca sin leer. */
function MuestrasEnFila() {
  return (
    <span
      className="flex items-center gap-1 pt-0.5"
      aria-label="Negro, blanco, azul, rojo y más"
    >
      {["Negro", "Blanco", "Azul", "Rojo", "Amarillo"].map((color) => (
        <Muestra key={color} color={color} />
      ))}
    </span>
  )
}

function Muestra({
  color,
  grande = false,
  sobreTinta = false,
}: {
  color: string
  grande?: boolean
  /** Sobre una ficha elegida: el borde claro, o el negro se pierde. */
  sobreTinta?: boolean
}) {
  const valor = MUESTRAS_DE_COLOR[color]
  if (!valor) return null
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block shrink-0 rounded-full border",
        sobreTinta ? "border-papel/70" : "border-tinta/25",
        grande ? "size-4" : "size-3"
      )}
      style={{ backgroundColor: valor }}
    />
  )
}

/* ---------------------------------------------------------------------------
 * Una opción y sus valores
 * ------------------------------------------------------------------------ */

function EditorDeOpcion({
  opcion,
  primera,
  fotos,
  fotoDe,
  alElegirFoto,
  alCambiarNombre,
  alCambiarValores,
  alQuitar,
}: {
  opcion: Opcion
  primera: boolean
  /** Las fotos del producto, si esta opción lleva una por valor: el color. */
  fotos: string[]
  fotoDe: (valor: string) => string | null
  alElegirFoto: (valor: string, foto: string | null) => void
  alCambiarNombre: (nombre: string) => void
  alCambiarValores: (valores: string[]) => void
  alQuitar: () => void
}) {
  const tipo = tipoDe(opcion)
  const [escribiendo, setEscribiendo] = React.useState(!tipo)
  const [nuevo, setNuevo] = React.useState("")
  const idNombre = React.useId()
  const idNuevo = React.useId()
  const Icono = tipo ? (ICONOS[tipo.nombre] ?? Shirt) : PencilLine

  // Los de la lista, y los que se agregaron a mano, que también se marcan.
  const propios = opcion.valores.filter((v) => !tipo?.valores.includes(v))
  const fichas = [...(tipo?.valores ?? []), ...propios]

  function alternar(valor: string) {
    const elegido = opcion.valores.includes(valor)
    const siguientes = elegido
      ? opcion.valores.filter((v) => v !== valor)
      : [...opcion.valores, valor]
    alCambiarValores(ordenarValores(tipo, siguientes))
  }

  function agregar() {
    const partes = nuevo
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
    const sinRepetir = partes.filter(
      (p, i) =>
        partes.findIndex((q) => q.toLowerCase() === p.toLowerCase()) === i &&
        !opcion.valores.some((v) => v.toLowerCase() === p.toLowerCase())
    )
    if (sinRepetir.length) {
      alCambiarValores(ordenarValores(tipo, [...opcion.valores, ...sinRepetir]))
    }
    setNuevo("")
    if (tipo) setEscribiendo(false)
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-3 py-4",
        !primera && "border-t border-tinta/15",
        primera && "pt-0"
      )}
    >
      <div className="flex items-center gap-3">
        <Icono aria-hidden="true" className="size-5 shrink-0" />
        {tipo ? (
          <h3 className="flex-1 font-titular text-lg leading-tight font-bold tracking-[-0.01em]">
            {tipo.nombre}
            <span className="ml-2 text-sm font-normal opacity-65">
              {opcion.valores.length
                ? `${opcion.valores.length} ${opcion.valores.length === 1 ? "elegida" : "elegidas"}`
                : "Toca las que tienes"}
            </span>
          </h3>
        ) : (
          <label htmlFor={idNombre} className="flex min-w-0 flex-1 flex-col">
            <span className="sr-only">Nombre de la opción</span>
            <input
              id={idNombre}
              value={opcion.nombre}
              onChange={(e) => alCambiarNombre(e.target.value)}
              placeholder="¿Cómo se llama? Sabor, modelo…"
              maxLength={30}
              autoFocus={!opcion.nombre}
              className="h-11 w-full border-b border-tinta bg-transparent font-titular text-lg font-bold outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-tinta/40 focus-visible:border-senal"
            />
          </label>
        )}
        <button
          type="button"
          onClick={alQuitar}
          aria-label={`Quitar ${opcion.nombre || "esta opción"}`}
          className="flex size-11 shrink-0 items-center justify-center transition-colors hover:bg-tinta/[0.06] hover:text-senal"
        >
          <Trash2 aria-hidden="true" className="size-5" />
        </button>
      </div>

      {fichas.length ? (
        <div
          role="group"
          aria-label={`${opcion.nombre || "Valores"}: toca los que tienes`}
          className="flex flex-wrap gap-2"
        >
          {fichas.map((valor) => {
            const elegido = opcion.valores.includes(valor)
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={elegido}
                onClick={() => alternar(valor)}
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border px-3 text-sm font-semibold transition-colors",
                  elegido
                    ? "border-tinta bg-tinta text-papel"
                    : "border-tinta/25 hover:border-tinta"
                )}
              >
                {tipo?.nombre === "Color" ? (
                  <Muestra color={valor} sobreTinta={elegido} />
                ) : null}
                {valor}
                {elegido ? (
                  <Check aria-hidden="true" className="-mr-0.5 size-3.5" />
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}

      {escribiendo ? (
        <div className="flex items-end gap-2">
          <label
            htmlFor={idNuevo}
            className="flex min-w-0 flex-1 flex-col gap-1"
          >
            <span className={ETIQUETA_CAMPO}>
              {tipo ? tipo.otro : "Sus valores"}
            </span>
            <input
              id={idNuevo}
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  agregar()
                }
              }}
              placeholder={
                tipo ? "Escríbelo" : "Separados por coma: Vainilla, Coco"
              }
              maxLength={120}
              autoFocus={Boolean(tipo)}
              className="h-11 w-full border-b border-tinta bg-transparent text-base outline-none placeholder:text-tinta/40 focus-visible:border-senal"
            />
          </label>
          <button
            type="button"
            onClick={agregar}
            disabled={!nuevo.trim()}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 border border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel disabled:opacity-35"
          >
            <Plus aria-hidden="true" className="size-4" />
            Agregar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEscribiendo(true)}
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold underline underline-offset-4 transition-colors hover:text-senal"
        >
          <Plus aria-hidden="true" className="size-4" />
          {tipo?.otro ?? "Agregar"}
        </button>
      )}

      {fotos.length > 1 && opcion.valores.length ? (
        <FotosPorColor
          colores={opcion.valores}
          fotos={fotos}
          elegida={fotoDe}
          alElegir={alElegirFoto}
        />
      ) : null}
    </section>
  )
}

/** La foto de cada color, elegida entre las del producto. */
function FotosPorColor({
  colores,
  fotos,
  elegida,
  alElegir,
}: {
  colores: string[]
  fotos: string[]
  elegida: (color: string) => string | null
  alElegir: (color: string, foto: string | null) => void
}) {
  return (
    <div className="mt-1 flex flex-col gap-3 bg-tinta/[0.03] p-3">
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">La foto de cada color</span>
        <span className="text-xs opacity-65">
          Es la que se ve cuando lo eligen en tu tienda.
        </span>
      </span>
      <ul className="flex flex-col gap-3">
        {colores.map((color) => {
          const actual = elegida(color)
          return (
            <li key={color} className="flex items-center gap-3">
              <span className="flex w-20 shrink-0 items-center gap-1.5 text-sm font-semibold">
                <Muestra color={color} />
                <span className="truncate">{color}</span>
              </span>
              <div
                role="radiogroup"
                aria-label={`Foto de ${color}`}
                className="flex min-w-0 [scrollbar-width:none] gap-1.5 overflow-x-auto"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={actual === null}
                  aria-label="Sin foto propia"
                  onClick={() => alElegir(color, null)}
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center border bg-papel",
                    actual === null
                      ? "border-2 border-tinta"
                      : "border-tinta/25"
                  )}
                >
                  <ImageOff aria-hidden="true" className="size-4 opacity-55" />
                </button>
                {fotos.map((foto, indice) => (
                  <button
                    key={foto}
                    type="button"
                    role="radio"
                    aria-checked={actual === foto}
                    aria-label={`Foto ${indice + 1}`}
                    onClick={() => alElegir(color, foto)}
                    className={cn(
                      "relative size-12 shrink-0 overflow-hidden border",
                      actual === foto
                        ? "border-2 border-tinta"
                        : "border-tinta/25"
                    )}
                  >
                    <Image
                      src={foto}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ---------------------------------------------------------------------------
 * Las combinaciones
 * ------------------------------------------------------------------------ */

/**
 * El stock y el precio de cada combinación. Con dos opciones van agrupadas por
 * la primera —la S, y debajo sus colores—: treinta filas sueltas no se leen.
 */
function Combinaciones({
  opciones,
  variantes,
  total,
  precio,
  alCambiar,
}: {
  opciones: Opcion[]
  variantes: VarianteEnFormulario[]
  total: number
  precio: number | undefined
  alCambiar: (indice: number, cambio: Partial<VarianteEnFormulario>) => void
}) {
  const [primera, segunda] = opciones
  const filas = variantes.map((variante, indice) => ({ variante, indice }))
  const grupos = segunda
    ? primera.valores.map((valor) => ({
        titulo: valor,
        filas: filas.filter(
          (f) => f.variante.valores[primera.nombre] === valor
        ),
      }))
    : [{ titulo: null, filas }]

  return (
    <div className="flex flex-col border-t border-tinta pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">Stock de cada una</span>
        <span className="tabular text-sm opacity-70">
          {formatNumber(total)} {total === 1 ? "unidad" : "unidades"} en total
        </span>
      </div>
      <p className="mt-1 text-xs opacity-65">
        El precio, solo si alguna cuesta distinto.
      </p>

      {grupos.map((grupo) => (
        <div key={grupo.titulo ?? "todas"} className="mt-3">
          {grupo.titulo ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
              {primera.nombre} {grupo.titulo}
            </span>
          ) : null}
          <ul>
            {grupo.filas.map(({ variante, indice }) => {
              const ultimo = segunda ?? primera
              const valor = variante.valores[ultimo.nombre] ?? ""
              return (
                <FilaDeVariante
                  key={indice}
                  etiqueta={valor}
                  muestra={tipoDe(ultimo)?.nombre === "Color" ? valor : null}
                  completo={
                    segunda
                      ? `${variante.valores[primera.nombre]} · ${valor}`
                      : valor
                  }
                  variante={variante}
                  precio={precio}
                  alCambiar={(cambio) => alCambiar(indice, cambio)}
                />
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

/** Una combinación: su nombre, el stock con más y menos, y su precio si cambia. */
function FilaDeVariante({
  etiqueta,
  muestra,
  completo,
  variante,
  precio,
  alCambiar,
}: {
  /** Lo que se lee en la fila: el valor que la distingue en su grupo. */
  etiqueta: string
  /** El color, si la fila es de un color: lleva su punto. */
  muestra: string | null
  /** El nombre entero, para el lector de pantalla: "M · Negro". */
  completo: string
  variante: VarianteEnFormulario
  precio: number | undefined
  alCambiar: (cambio: Partial<VarianteEnFormulario>) => void
}) {
  const idPrecio = React.useId()
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-tinta/15 py-2.5">
      <span className="flex min-w-[6.5rem] flex-1 items-center gap-2 font-semibold">
        {variante.imagen ? (
          <span className="relative size-8 shrink-0 overflow-hidden border border-tinta/15">
            <Image
              src={variante.imagen}
              alt=""
              fill
              sizes="32px"
              className="object-cover"
            />
          </span>
        ) : muestra ? (
          <Muestra color={muestra} grande />
        ) : null}
        <span>{etiqueta}</span>
      </span>

      <div className="flex items-center gap-3">
        <div
          role="group"
          aria-label={`Unidades de ${completo}`}
          className="flex h-10 items-stretch border border-tinta"
        >
          <button
            type="button"
            onClick={() =>
              alCambiar({ stock: Math.max((variante.stock || 0) - 1, 0) })
            }
            disabled={!variante.stock}
            aria-label="Una menos"
            className="flex w-10 items-center justify-center transition-colors hover:bg-tinta hover:text-papel disabled:opacity-35"
          >
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={variante.stock}
            onChange={(e) =>
              alCambiar({
                stock: Math.max(0, Math.trunc(Number(e.target.value) || 0)),
              })
            }
            onFocus={(e) => e.target.select()}
            aria-label={`Unidades de ${completo}`}
            className={cn(
              "tabular w-12 [appearance:textfield] border-x border-tinta bg-transparent text-center font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              variante.stock === 0 && "text-tinta/55"
            )}
          />
          <button
            type="button"
            onClick={() => alCambiar({ stock: (variante.stock || 0) + 1 })}
            aria-label="Una más"
            className="flex w-10 items-center justify-center transition-colors hover:bg-tinta hover:text-papel"
          >
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </div>

        <label htmlFor={idPrecio} className="flex items-baseline gap-1">
          <span className="text-sm opacity-65">{CURRENCY_SYMBOL}</span>
          <input
            id={idPrecio}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={variante.precio ?? ""}
            onChange={(e) =>
              alCambiar({
                precio: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            placeholder={precio !== undefined ? String(precio) : "Precio"}
            aria-label={`Precio de ${completo}. Vacío: el del producto`}
            className="tabular h-10 w-20 border-b border-tinta bg-transparent text-base outline-none placeholder:text-tinta/40 focus-visible:border-senal"
          />
        </label>
      </div>
    </li>
  )
}
