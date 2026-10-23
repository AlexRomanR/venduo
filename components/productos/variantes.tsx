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
  type LucideIcon,
} from "lucide-react"

import { useConfirmacion } from "@/components/panel/confirmar"
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

/** Las opciones que ya tienen nombre y valores: las que arman combinaciones. */
function opcionesCompletas(opciones: Opcion[]): Opcion[] {
  return opciones.filter((o) => o.nombre.trim() && o.valores.length)
}

/**
 * Las tallas, colores y números de un producto: solo elegirlos. Vive dentro de
 * las unidades, porque para eso sirven: para contar el stock de cada una
 * (`StockDeVariantes`).
 *
 * Cerrado es una línea —la mayoría de los productos no tiene tallas—, y lo que
 * dice sale de la categoría: "Lo tengo en varias tallas" para unos buzos, "en
 * varios números" para unos botines. Tocarla abre ese tipo con sus valores
 * para marcar; "Cambiar" deja elegir otro. Sin sugerencia, ofrece los tipos.
 * Los valores ya están escritos y se marcan con un toque, y cada color lleva
 * su foto si el producto tiene más de una. El mismo editor de la app.
 *
 * Las combinaciones se arman solas, y una que ya existía conserva su stock y
 * su precio: sumar la XL no borra lo de la M.
 */
export function EditorDeVariantes({
  opciones,
  variantes,
  fotos,
  sugerido,
  enHoja = false,
  alCambiar,
  error,
}: {
  opciones: Opcion[]
  variantes: VarianteEnFormulario[]
  /** Las fotos del producto: de ahí sale la foto de cada color. */
  fotos: string[]
  /** El tipo que suele llevar su categoría (`tipoSugerido`): se ofrece primero. */
  sugerido: TipoDeOpcion | null
  /** Dentro de su propia hoja: sin nada elegido, muestra los tipos de entrada. */
  enHoja?: boolean
  alCambiar: (opciones: Opcion[], variantes: VarianteEnFormulario[]) => void
  error?: string
}) {
  const [agregando, setAgregando] = React.useState(false)
  const { preguntar, dialogo } = useConfirmacion()
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
    const color = nuevas.find((o) => tipoDe(o)?.nombre === "Color")?.nombre
    return combinaciones(opcionesCompletas(nuevas)).map(
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

  async function quitar(indice: number) {
    const tipo = tipoDe(opciones[indice])
    // Quitar una opción borra las unidades que se cargaron en cada una.
    if (variantes.some((v) => v.stock > 0)) {
      const si = await preguntar({
        titulo: tipo
          ? `¿Ya no lo tienes en ${tipo.varios}?`
          : "¿Quitar esta opción?",
        texto: "Se borran las unidades que cargaste en cada una.",
        confirmar: "Quitar",
      })
      if (!si) return
    }
    cambiarOpciones(opciones.filter((_, i) => i !== indice))
  }

  const usados = opciones.map((o) => tipoDe(o)?.nombre).filter(Boolean)
  const cuantas = combinaciones(opcionesCompletas(opciones)).length

  if (opciones.length === 0 && enHoja) {
    return (
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold">¿En qué lo tienes?</span>
        <ElegirTipo usados={[]} alElegir={agregarTipo} />
      </div>
    )
  }

  if (opciones.length === 0) {
    return agregando ? (
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold">¿En qué lo tienes?</span>
        <ElegirTipo usados={[]} alElegir={agregarTipo} />
        <button
          type="button"
          onClick={() => setAgregando(false)}
          className="min-h-11 self-start text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
        >
          Cancelar
        </button>
      </div>
    ) : (
      <BotonPunteado
        alTocar={() => (sugerido ? agregarTipo(sugerido) : setAgregando(true))}
      >
        Lo tengo en {sugerido?.varios ?? "varias tallas o colores"}
      </BotonPunteado>
    )
  }

  return (
    <div className="flex flex-col gap-7">
      {opciones.map((opcion, indice) => (
        <EditorDeOpcion
          key={indice}
          opcion={opcion}
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
          alCambiarTipo={
            // Recién abierta por la sugerencia y sin nada marcado: si no era
            // talla sino color, se cambia sin quitar y volver a abrir.
            opciones.length === 1 && opcion.valores.length === 0
              ? () => {
                  cambiarOpciones([])
                  setAgregando(true)
                }
              : undefined
          }
          alQuitar={() => quitar(indice)}
        />
      ))}

      {cuantas === 0 ? (
        <p className="text-sm opacity-70">
          Marca las que tienes y pon las unidades de cada una.
        </p>
      ) : null}

      {opciones.length < MAXIMO_DE_OPCIONES ? (
        agregando ? (
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold">
              ¿Qué otra opción tiene?
            </span>
            <ElegirTipo usados={usados} alElegir={agregarTipo} />
            <button
              type="button"
              onClick={() => setAgregando(false)}
              className="min-h-11 self-start text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <BotonPunteado alTocar={() => setAgregando(true)}>
            {usados.includes("Color")
              ? "Agregar talla o número"
              : "Agregar color"}
          </BotonPunteado>
        )
      ) : null}

      {cuantas > MAXIMO_DE_VARIANTES ? (
        <p role="alert" className="text-sm font-semibold text-senal">
          Son {formatNumber(cuantas)} combinaciones: el máximo es{" "}
          {MAXIMO_DE_VARIANTES}. Desmarca algunas.
        </p>
      ) : null}

      {error ? <p className="text-sm text-senal">{error}</p> : null}
      {dialogo}
    </div>
  )
}

/** Abrir algo que no está a la vista: una línea punteada a todo el ancho. */
function BotonPunteado({
  alTocar,
  children,
}: {
  alTocar: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={alTocar}
      className="flex min-h-11 w-full items-center justify-center gap-2 border border-dashed border-tinta/35 px-3 text-sm font-semibold transition-colors hover:border-tinta active:bg-tinta/[0.06] sm:w-fit sm:px-5"
    >
      <Plus aria-hidden="true" className="size-4" />
      {children}
    </button>
  )
}

/* ---------------------------------------------------------------------------
 * Elegir el tipo
 * ------------------------------------------------------------------------ */

/** Los tipos que más se usan y "Otra", como fichas: un toque y está elegido. */
function ElegirTipo({
  usados,
  alElegir,
}: {
  usados: (string | undefined)[]
  alElegir: (tipo: TipoDeOpcion | null) => void
}) {
  const disponibles = TIPOS_DE_OPCION.filter((t) => !usados.includes(t.nombre))
  return (
    // Columnas iguales: fichas de ancho distinto que saltan de renglón dejan
    // los bordes sin alinear.
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {disponibles.map((tipo) => (
        <Ficha
          key={tipo.nombre}
          icono={ICONOS[tipo.nombre] ?? Shirt}
          texto={tipo.nombre}
          etiqueta={`${tipo.nombre}: ${tipo.detalle.toLowerCase()}`}
          ancha
          alTocar={() => alElegir(tipo)}
        />
      ))}
      <Ficha
        icono={PencilLine}
        texto="Otra"
        punteada
        ancha
        alTocar={() => alElegir(null)}
      />
    </div>
  )
}

/** Una ficha que se toca: un tipo, un valor o agregar uno. */
function Ficha({
  icono: Icono,
  texto,
  etiqueta,
  elegida,
  punteada = false,
  muestra,
  ancha = false,
  alTocar,
}: {
  icono?: LucideIcon
  texto: string
  etiqueta?: string
  /** Si se marca y desmarca: lleva su estado y su check. */
  elegida?: boolean
  punteada?: boolean
  /** El color del valor, si es un color: lleva su punto. */
  muestra?: string
  /** Llena su columna, en una grilla de fichas iguales. */
  ancha?: boolean
  alTocar: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={elegida}
      aria-label={etiqueta}
      onClick={alTocar}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 border px-3 text-sm font-semibold transition-colors",
        ancha && "w-full px-2",
        elegida
          ? "border-tinta bg-tinta text-papel"
          : punteada
            ? "border-dashed border-tinta/35 hover:border-tinta"
            : "border-tinta/25 hover:border-tinta"
      )}
    >
      {Icono ? <Icono aria-hidden="true" className="size-4" /> : null}
      {muestra ? <Muestra color={muestra} sobreTinta={elegida} /> : null}
      {texto}
      {elegida ? (
        <Check aria-hidden="true" className="-mr-0.5 size-3.5" />
      ) : null}
    </button>
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
  fotos,
  fotoDe,
  alElegirFoto,
  alCambiarNombre,
  alCambiarValores,
  alCambiarTipo,
  alQuitar,
}: {
  opcion: Opcion
  /** Las fotos del producto, si esta opción lleva una por valor: el color. */
  fotos: string[]
  fotoDe: (valor: string) => string | null
  alElegirFoto: (valor: string, foto: string | null) => void
  alCambiarNombre: (nombre: string) => void
  alCambiarValores: (valores: string[]) => void
  /** Elegir otro tipo en su lugar, mientras no tenga nada marcado. */
  alCambiarTipo?: () => void
  alQuitar: () => void
}) {
  const tipo = tipoDe(opcion)
  const [escribiendo, setEscribiendo] = React.useState(!tipo)
  const [nuevo, setNuevo] = React.useState("")
  const idNombre = React.useId()
  const Icono = tipo ? (ICONOS[tipo.nombre] ?? Shirt) : PencilLine

  // Una lista larga —trece colores, once números— ya elegida se cierra a lo
  // elegido: la pared entera solo hace falta mientras se elige.
  const larga = (tipo?.valores.length ?? 0) > 8
  const [abierta, setAbierta] = React.useState(opcion.valores.length === 0)
  const cerrada = larga && !abierta

  // Los de la lista, y los que se agregaron a mano, que también se marcan.
  const propios = opcion.valores.filter((v) => !tipo?.valores.includes(v))
  const fichas = cerrada
    ? opcion.valores
    : [...(tipo?.valores ?? []), ...propios]

  function alternar(valor: string) {
    const siguientes = opcion.valores.includes(valor)
      ? opcion.valores.filter((v) => v !== valor)
      : [...opcion.valores, valor]
    alCambiarValores(ordenarValores(tipo, siguientes))
  }

  function agregar() {
    // "Vainilla, Coco" de una vez: cada coma es un valor.
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
    if (tipo || opcion.valores.length + sinRepetir.length > 0) {
      setEscribiendo(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <Icono aria-hidden="true" className="size-5 shrink-0" />
        {tipo ? (
          <h3 className="flex-1 font-titular text-lg leading-tight font-bold tracking-[-0.01em]">
            {tipo.nombre}
          </h3>
        ) : (
          <label htmlFor={idNombre} className="flex min-w-0 flex-1">
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
        {alCambiarTipo ? (
          <button
            type="button"
            onClick={alCambiarTipo}
            className="min-h-11 shrink-0 px-1 text-sm font-semibold underline underline-offset-4 transition-colors hover:text-senal"
          >
            Cambiar
          </button>
        ) : null}
        <button
          type="button"
          onClick={alQuitar}
          aria-label={`Quitar ${opcion.nombre || "esta opción"}`}
          className="flex size-11 shrink-0 items-center justify-center opacity-65 transition hover:bg-tinta/[0.06] hover:text-senal hover:opacity-100"
        >
          <Trash2 aria-hidden="true" className="size-[18px]" />
        </button>
      </div>

      {fichas.length || !escribiendo ? (
        <div
          role="group"
          aria-label={`${opcion.nombre || "Valores"}: toca los que tienes`}
          className="flex flex-wrap gap-2"
        >
          {fichas.map((valor) => (
            <Ficha
              key={valor}
              texto={valor}
              elegida={opcion.valores.includes(valor)}
              muestra={tipo?.nombre === "Color" ? valor : undefined}
              alTocar={() => alternar(valor)}
            />
          ))}
          {cerrada ? (
            <Ficha
              icono={Plus}
              texto="Ver todos"
              punteada
              alTocar={() => setAbierta(true)}
            />
          ) : escribiendo ? null : (
            <Ficha
              icono={Plus}
              texto={tipo ? "Otra" : "Agregar"}
              etiqueta={tipo?.otro ?? "Agregar un valor"}
              punteada
              alTocar={() => setEscribiendo(true)}
            />
          )}
        </div>
      ) : null}

      {escribiendo ? (
        <div className="flex items-end gap-2">
          <input
            aria-label={
              tipo ? tipo.otro : `Valores de ${opcion.nombre || "la opción"}`
            }
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                agregar()
              }
            }}
            placeholder={
              tipo ? tipo.otro : "Sus valores, con coma: Vainilla, Coco"
            }
            maxLength={120}
            autoFocus={Boolean(tipo)}
            className="h-11 min-w-0 flex-1 border-b border-tinta bg-transparent text-base outline-none placeholder:text-tinta/40 focus-visible:border-senal"
          />
          <button
            type="button"
            onClick={agregar}
            disabled={!nuevo.trim()}
            className="inline-flex min-h-11 shrink-0 items-center border border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel disabled:opacity-35"
          >
            Agregar
          </button>
        </div>
      ) : null}

      {fotos.length > 1 && opcion.valores.length ? (
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-sm opacity-70">
            La foto de cada color, la que se ve al elegirlo:
          </span>
          <ul className="flex flex-col gap-2">
            {opcion.valores.map((color) => (
              <FotoDeColor
                key={color}
                color={color}
                fotos={fotos}
                elegida={fotoDe(color)}
                alElegir={(foto) => alElegirFoto(color, foto)}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

/** La foto de un color, elegida entre las del producto. */
function FotoDeColor({
  color,
  fotos,
  elegida,
  alElegir,
}: {
  color: string
  fotos: string[]
  elegida: string | null
  alElegir: (foto: string | null) => void
}) {
  return (
    <li className="flex items-center gap-3">
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
          aria-checked={elegida === null}
          aria-label="Sin foto propia"
          onClick={() => alElegir(null)}
          className={cn(
            "flex size-12 shrink-0 items-center justify-center border",
            elegida === null ? "border-2 border-tinta" : "border-tinta/25"
          )}
        >
          <ImageOff aria-hidden="true" className="size-4 opacity-55" />
        </button>
        {fotos.map((foto, indice) => (
          <button
            key={foto}
            type="button"
            role="radio"
            aria-checked={elegida === foto}
            aria-label={`Foto ${indice + 1}`}
            onClick={() => alElegir(foto)}
            className={cn(
              "relative size-12 shrink-0 overflow-hidden border",
              elegida === foto ? "border-2 border-tinta" : "border-tinta/25"
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
}

/* ---------------------------------------------------------------------------
 * El stock de cada una
 * ------------------------------------------------------------------------ */

/**
 * Las unidades de cada talla o color, en el lugar de las unidades del
 * producto: una fila por cada una, con más y menos. Con dos opciones van
 * agrupadas por la primera —la S, y debajo sus colores—.
 *
 * El precio de cada una casi nunca cambia, así que no se muestra hasta que se
 * pide: "Alguna cuesta distinto" abre un precio por fila.
 */
export function StockDeVariantes({
  opciones,
  variantes,
  precio,
  alCambiar,
  error,
}: {
  opciones: Opcion[]
  variantes: VarianteEnFormulario[]
  /** El precio del producto, como se escribe: el de toda variante sin precio propio. */
  precio: number | undefined
  alCambiar: (variantes: VarianteEnFormulario[]) => void
  error?: string
}) {
  const [conPrecio, setConPrecio] = React.useState(() =>
    variantes.some((v) => v.precio !== null)
  )
  const [primera, segunda] = opcionesCompletas(opciones)
  if (!primera) return null

  function cambiar(indice: number, cambio: Partial<VarianteEnFormulario>) {
    alCambiar(variantes.map((v, i) => (i === indice ? { ...v, ...cambio } : v)))
  }

  function alternarPrecio() {
    // Al cerrarlo, todas vuelven al precio del producto: lo escondido no cuenta.
    if (conPrecio) alCambiar(variantes.map((v) => ({ ...v, precio: null })))
    setConPrecio(!conPrecio)
  }

  const filas = variantes.map((variante, indice) => ({ variante, indice }))
  const grupos: { titulo: string | null; filas: typeof filas }[] = segunda
    ? primera.valores.map((valor) => ({
        titulo: valor,
        filas: filas.filter(
          (f) => f.variante.valores[primera.nombre] === valor
        ),
      }))
    : [{ titulo: null, filas }]
  const ultima = segunda ?? primera
  const esColor = tipoDe(ultima)?.nombre === "Color"
  const total = variantes.reduce((suma, v) => suma + (v.stock || 0), 0)

  return (
    // min-w-0: el panel es una grilla, y sin él la fila más ancha la estira.
    <div className="flex min-w-0 flex-col gap-5 border-t border-tinta/15 pt-5">
      <span className="text-xs font-semibold tracking-[0.12em] uppercase opacity-70">
        Unidades de cada una
      </span>
      {grupos.map((grupo) => (
        <div key={grupo.titulo ?? "todas"} className="flex flex-col gap-2">
          {grupo.titulo ? (
            <span className="text-sm font-semibold">
              {primera.nombre} {grupo.titulo}
            </span>
          ) : null}
          <ul className="flex flex-col gap-2">
            {grupo.filas.map(({ variante, indice }) => {
              const valor = variante.valores[ultima.nombre] ?? ""
              return (
                <FilaDeVariante
                  key={indice}
                  etiqueta={valor}
                  muestra={esColor ? valor : null}
                  completo={
                    segunda
                      ? `${variante.valores[primera.nombre]} · ${valor}`
                      : valor
                  }
                  variante={variante}
                  conPrecio={conPrecio}
                  precio={precio}
                  alCambiar={(cambio) => cambiar(indice, cambio)}
                />
              )
            })}
          </ul>
        </div>
      ))}

      <div className="flex items-center justify-between gap-3 border-t border-tinta/15 pt-2">
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            checked={conPrecio}
            onChange={alternarPrecio}
            className="size-5 accent-tinta"
          />
          Alguna cuesta distinto
        </label>
        <span className="tabular text-sm opacity-70">
          {formatNumber(total)} {total === 1 ? "unidad" : "unidades"}
        </span>
      </div>

      {error ? <p className="text-sm text-senal">{error}</p> : null}
    </div>
  )
}

/** Una combinación: su nombre, su precio si se pidió, y sus unidades. */
function FilaDeVariante({
  etiqueta,
  muestra,
  completo,
  variante,
  conPrecio,
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
  conPrecio: boolean
  precio: number | undefined
  alCambiar: (cambio: Partial<VarianteEnFormulario>) => void
}) {
  return (
    <li className="flex items-center gap-2 sm:gap-3">
      <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold sm:text-base">
        {variante.imagen ? (
          // Con el precio abierto, en el celular la fila no da para la foto:
          // el color ya se ve en su ficha, arriba.
          <span
            className={cn(
              "relative size-6 shrink-0 overflow-hidden border border-tinta/15 sm:size-8",
              conPrecio && "max-sm:hidden"
            )}
          >
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
        <span className="truncate">{etiqueta}</span>
      </span>

      {conPrecio ? (
        <label className="flex w-16 shrink-0 items-center gap-1 border-b border-tinta focus-within:border-senal sm:w-20">
          <span className="text-sm opacity-65">{CURRENCY_SYMBOL}</span>
          <input
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
            placeholder={precio !== undefined ? String(precio) : ""}
            aria-label={`Precio de ${completo}. Vacío: el del producto`}
            className="tabular h-11 w-full min-w-0 [appearance:textfield] bg-transparent text-base outline-none placeholder:text-tinta/40 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </label>
      ) : null}

      <div
        role="group"
        aria-label={`Unidades de ${completo}`}
        className="flex h-11 shrink-0 items-stretch border border-tinta"
      >
        <button
          type="button"
          onClick={() =>
            alCambiar({ stock: Math.max((variante.stock || 0) - 1, 0) })
          }
          disabled={!variante.stock}
          aria-label="Una menos"
          className="flex w-11 items-center justify-center transition-colors hover:bg-tinta hover:text-papel disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-tinta"
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
            "tabular w-10 [appearance:textfield] border-x border-tinta bg-transparent text-center font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            variante.stock === 0 && "text-tinta/55"
          )}
        />
        <button
          type="button"
          onClick={() => alCambiar({ stock: (variante.stock || 0) + 1 })}
          aria-label="Una más"
          className="flex w-11 items-center justify-center transition-colors hover:bg-tinta hover:text-papel"
        >
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
    </li>
  )
}
