"use client"

import * as React from "react"
import Image from "next/image"
import { ImageOff, Minus, Plus, Trash2, X } from "lucide-react"

import { CAMPO_LINEA, ETIQUETA_CAMPO, FICHA, FICHA_LIBRE } from "@/lib/estilos"
import { CURRENCY_SYMBOL, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  combinaciones,
  fotoDe,
  MAXIMO_DE_OPCIONES,
  MAXIMO_DE_VARIANTES,
  mismaCombinacion,
  nombreDeVariante,
  type Opcion,
  type Valores,
} from "@/lib/variantes"

/** Una variante como la edita el formulario: el precio en bolivianos. */
export interface VarianteEnFormulario {
  valores: Valores
  stock: number
  precio: number | null
  imagen: string | null
}

/** Los nombres que más se usan, para no escribirlos. */
const SUGERIDAS = ["Talla", "Color", "Número", "Tamaño"]

/**
 * Las variantes de un producto: hasta dos opciones —Talla y Color— y una fila
 * por combinación, con su stock y, si es distinto, su precio.
 *
 * Las combinaciones se arman solas al escribir los valores, y una que ya
 * existía conserva su stock y su precio: agregar la talla XL no borra lo que
 * se cargó en la M. Una opción puede llevar foto: cada color, la suya.
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
  const [conFoto, setConFoto] = React.useState<string | null>(() => {
    const conImagen = variantes.filter((v) => v.imagen)
    if (conImagen.length === 0) return null
    return (
      opciones.find((o) =>
        conImagen.every(
          (v) =>
            fotoDe(conImagen, o.nombre, v.valores[o.nombre] ?? "") === v.imagen
        )
      )?.nombre ?? null
    )
  })

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
    const validas = nuevas.filter((o) => o.nombre.trim() && o.valores.length)
    return combinaciones(validas).map(
      (valores) =>
        previas.find((p) => mismaCombinacion(p.valores, valores)) ?? {
          valores,
          stock: 0,
          precio: null,
          imagen:
            conFoto && valores[conFoto]
              ? fotoDe(previas, conFoto, valores[conFoto])
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

  function cambiarVariante(
    indice: number,
    cambio: Partial<VarianteEnFormulario>
  ) {
    alCambiar(
      opciones,
      variantes.map((v, i) => (i === indice ? { ...v, ...cambio } : v))
    )
  }

  function elegirFoto(opcion: string, valor: string, foto: string | null) {
    alCambiar(
      opciones,
      variantes.map((v) =>
        v.valores[opcion] === valor ? { ...v, imagen: foto } : v
      )
    )
  }

  function alternarFoto(opcion: string) {
    const nueva = conFoto === opcion ? null : opcion
    setConFoto(nueva)
    // Una sola opción lleva foto: al cambiar de opción, se empieza de nuevo.
    alCambiar(
      opciones,
      variantes.map((v) => ({ ...v, imagen: null }))
    )
  }

  const total = variantes.reduce((suma, v) => suma + (v.stock || 0), 0)
  const cuantas = combinaciones(
    opciones.filter((o) => o.nombre.trim() && o.valores.length)
  ).length

  if (opciones.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm leading-relaxed opacity-70">
          Si lo vendes en varias tallas, colores o números, cada uno lleva su
          stock y quien compra elige en tu tienda.
        </p>
        <button
          type="button"
          onClick={() => cambiarOpciones([{ nombre: "", valores: [] }])}
          className="inline-flex min-h-11 items-center gap-2 border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
        >
          <Plus aria-hidden="true" className="size-4" />
          Agregar opciones
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {opciones.map((opcion, indice) => (
        <EditorDeOpcion
          key={indice}
          opcion={opcion}
          sugeridas={SUGERIDAS.filter(
            (s) => !opciones.some((o, i) => i !== indice && o.nombre === s)
          )}
          conFoto={conFoto === opcion.nombre && opcion.nombre !== ""}
          puedeFoto={fotos.length > 0}
          alCambiarNombre={(nombre) => {
            const anterior = opcion.nombre
            if (conFoto === anterior) setConFoto(nombre)
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
          alQuitar={() => {
            if (conFoto === opcion.nombre) setConFoto(null)
            cambiarOpciones(opciones.filter((_, i) => i !== indice))
          }}
          alAlternarFoto={() => alternarFoto(opcion.nombre)}
        >
          {conFoto === opcion.nombre && opcion.nombre ? (
            <FotosPorValor
              opcion={opcion}
              fotos={fotos}
              elegida={(valor) => fotoDe(variantes, opcion.nombre, valor)}
              alElegir={(valor, foto) => elegirFoto(opcion.nombre, valor, foto)}
            />
          ) : null}
        </EditorDeOpcion>
      ))}

      {opciones.length < MAXIMO_DE_OPCIONES ? (
        <button
          type="button"
          onClick={() =>
            cambiarOpciones([...opciones, { nombre: "", valores: [] }])
          }
          className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold underline underline-offset-4 transition-colors hover:text-senal"
        >
          <Plus aria-hidden="true" className="size-4" />
          Agregar otra opción
        </button>
      ) : null}

      {cuantas > MAXIMO_DE_VARIANTES ? (
        <p role="alert" className="text-sm font-semibold text-senal">
          Son {formatNumber(cuantas)} combinaciones: el máximo es{" "}
          {MAXIMO_DE_VARIANTES}. Quita algunos valores.
        </p>
      ) : variantes.length > 0 ? (
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between gap-3 border-b border-tinta pb-2">
            <span className={ETIQUETA_CAMPO}>
              {formatNumber(variantes.length)}{" "}
              {variantes.length === 1 ? "combinación" : "combinaciones"}
            </span>
            <span className="tabular text-sm font-semibold">
              {formatNumber(total)} {total === 1 ? "unidad" : "unidades"} en
              total
            </span>
          </div>
          <ul>
            {variantes.map((variante, indice) => (
              <FilaDeVariante
                key={nombreDeVariante(opciones, variante.valores)}
                nombre={nombreDeVariante(opciones, variante.valores)}
                variante={variante}
                precio={precio}
                alCambiar={(cambio) => cambiarVariante(indice, cambio)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-sm text-senal">{error}</p> : null}
    </div>
  )
}

/** Una opción: su nombre y sus valores, que se agregan escribiendo. */
function EditorDeOpcion({
  opcion,
  sugeridas,
  conFoto,
  puedeFoto,
  alCambiarNombre,
  alCambiarValores,
  alQuitar,
  alAlternarFoto,
  children,
}: {
  opcion: Opcion
  sugeridas: string[]
  conFoto: boolean
  puedeFoto: boolean
  alCambiarNombre: (nombre: string) => void
  alCambiarValores: (valores: string[]) => void
  alQuitar: () => void
  alAlternarFoto: () => void
  children?: React.ReactNode
}) {
  const [nuevo, setNuevo] = React.useState("")
  const idNombre = React.useId()
  const idValor = React.useId()

  function agregar(texto: string) {
    // "S, M, L" de una vez: cada coma es un valor.
    const partes = texto
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
    const sinRepetir = partes.filter(
      (p, i) =>
        partes.findIndex((q) => q.toLowerCase() === p.toLowerCase()) === i &&
        !opcion.valores.some((v) => v.toLowerCase() === p.toLowerCase())
    )
    if (sinRepetir.length) alCambiarValores([...opcion.valores, ...sinRepetir])
    setNuevo("")
  }

  return (
    <div className="flex flex-col gap-3 border-l-2 border-tinta pl-4">
      <div className="flex items-end gap-3">
        <label
          htmlFor={idNombre}
          className="flex min-w-0 flex-1 flex-col gap-1"
        >
          <span className={ETIQUETA_CAMPO}>Opción</span>
          <input
            id={idNombre}
            value={opcion.nombre}
            onChange={(e) => alCambiarNombre(e.target.value)}
            placeholder="Talla, Color, Número…"
            maxLength={30}
            className={cn(CAMPO_LINEA, "w-full font-semibold outline-none")}
          />
        </label>
        <button
          type="button"
          onClick={alQuitar}
          aria-label={`Quitar la opción ${opcion.nombre || "sin nombre"}`}
          className="flex size-11 shrink-0 items-center justify-center transition-colors hover:bg-tinta/[0.06]"
        >
          <Trash2 aria-hidden="true" className="size-5" />
        </button>
      </div>

      {!opcion.nombre && sugeridas.length ? (
        <div className="flex flex-wrap gap-1.5">
          {sugeridas.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => alCambiarNombre(s)}
              className={cn(FICHA, FICHA_LIBRE)}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        {opcion.valores.map((valor) => (
          <span
            key={valor}
            className="inline-flex min-h-9 items-center gap-1 border border-tinta bg-tinta pl-3 text-sm font-semibold text-papel"
          >
            {valor}
            <button
              type="button"
              onClick={() =>
                alCambiarValores(opcion.valores.filter((v) => v !== valor))
              }
              aria-label={`Quitar ${valor}`}
              className="flex size-9 items-center justify-center transition-opacity hover:opacity-70"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </span>
        ))}
      </div>

      <label htmlFor={idValor} className="flex flex-col gap-1">
        <span className="sr-only">
          Agregar un valor a {opcion.nombre || "la opción"}
        </span>
        <div className="flex items-end gap-2">
          <input
            id={idValor}
            value={nuevo}
            onChange={(e) => {
              if (e.target.value.endsWith(",")) agregar(e.target.value)
              else setNuevo(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                agregar(nuevo)
              }
            }}
            onBlur={() => nuevo.trim() && agregar(nuevo)}
            placeholder={
              opcion.valores.length
                ? "Agregar otro"
                : opcion.nombre === "Color"
                  ? "Negro, Blanco, Rojo"
                  : opcion.nombre === "Número"
                    ? "38, 39, 40"
                    : "S, M, L"
            }
            maxLength={120}
            className={cn(CAMPO_LINEA, "min-w-0 flex-1 outline-none")}
          />
          <button
            type="button"
            onClick={() => agregar(nuevo)}
            disabled={!nuevo.trim()}
            aria-label="Agregar"
            className="flex size-11 shrink-0 items-center justify-center border border-tinta transition-colors hover:bg-tinta hover:text-papel disabled:opacity-35"
          >
            <Plus aria-hidden="true" className="size-5" />
          </button>
        </div>
      </label>

      {puedeFoto && opcion.nombre && opcion.valores.length ? (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={conFoto}
            onChange={alAlternarFoto}
            className="size-5 accent-[var(--color-tinta)]"
          />
          <span>
            <span className="font-semibold">
              Una foto por cada {opcion.nombre.toLowerCase()}
            </span>
            <span className="block text-xs opacity-65">
              Al elegirlo en tu tienda, se ve su foto.
            </span>
          </span>
        </label>
      ) : null}

      {children}
    </div>
  )
}

/** La foto de cada valor, elegida entre las del producto. */
function FotosPorValor({
  opcion,
  fotos,
  elegida,
  alElegir,
}: {
  opcion: Opcion
  fotos: string[]
  elegida: (valor: string) => string | null
  alElegir: (valor: string, foto: string | null) => void
}) {
  return (
    <ul className="flex flex-col gap-3">
      {opcion.valores.map((valor) => {
        const actual = elegida(valor)
        return (
          <li key={valor} className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">{valor}</span>
            <div
              role="radiogroup"
              aria-label={`Foto de ${valor}`}
              className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto"
            >
              <button
                type="button"
                role="radio"
                aria-checked={actual === null}
                aria-label="Sin foto propia"
                onClick={() => alElegir(valor, null)}
                className={cn(
                  "flex size-14 shrink-0 items-center justify-center border",
                  actual === null ? "border-2 border-tinta" : "border-tinta/25"
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
                  onClick={() => alElegir(valor, foto)}
                  className={cn(
                    "relative size-14 shrink-0 overflow-hidden border",
                    actual === foto
                      ? "border-2 border-tinta"
                      : "border-tinta/25"
                  )}
                >
                  <Image
                    src={foto}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Una combinación: su nombre, el stock con más y menos, y su precio si cambia. */
function FilaDeVariante({
  nombre,
  variante,
  precio,
  alCambiar,
}: {
  nombre: string
  variante: VarianteEnFormulario
  precio: number | undefined
  alCambiar: (cambio: Partial<VarianteEnFormulario>) => void
}) {
  const idPrecio = React.useId()
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-tinta/15 py-3">
      <span className="flex min-w-[8.5rem] flex-1 items-center gap-2 font-semibold">
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
        ) : null}
        <span>{nombre}</span>
      </span>

      <div className="flex items-center gap-3">
        <div
          role="group"
          aria-label={`Unidades de ${nombre}`}
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
            aria-label={`Unidades de ${nombre}`}
            className={cn(
              "tabular w-12 [appearance:textfield] border-x border-tinta bg-transparent text-center font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              variante.stock === 0 && "text-senal"
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
            aria-label={`Precio de ${nombre}. Vacío: el del producto`}
            className="tabular h-10 w-20 border-b border-tinta bg-transparent text-base outline-none placeholder:text-tinta/40 focus-visible:border-senal"
          />
        </label>
      </div>
    </li>
  )
}
