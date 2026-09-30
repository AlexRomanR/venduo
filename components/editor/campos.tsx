"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, Minus, Plus, Trash2 } from "lucide-react"

import type { Campo, CampoDeTexto } from "@/lib/plantillas/secciones"
import { cn } from "@/lib/utils"
import { useEditor } from "@/components/editor/contexto"
import { CampoImagen } from "@/components/editor/imagen"
import { Opciones } from "@/components/editor/piezas"

const ETIQUETA = "text-xs font-semibold tracking-[0.12em] uppercase opacity-55"

const CAJA =
  "w-full border-0 border-b border-tinta/40 bg-transparent px-0 text-base transition-colors placeholder:text-tinta/35 focus-visible:border-senal focus-visible:outline-none"

/**
 * Los campos de una sección, armados desde su definición en `secciones.ts`.
 *
 * Cada cambio va directo al borrador, así que la vista previa se actualiza
 * mientras se escribe. Los largos máximos los pone el propio campo: no se
 * puede escribir de más, y no hace falta un error para decirlo.
 */
export function CamposDeSeccion({
  seccion,
  campos,
  props,
}: {
  seccion: string
  campos: Campo[]
  props: Record<string, unknown>
}) {
  const { borrador } = useEditor()

  function cambiar(clave: string, valor: unknown) {
    const resultado = borrador.aplicar(
      [{ op: "editar", seccion, props: { [clave]: valor } }],
      { agrupar: `${seccion}.${clave}` }
    )
    return resultado.ok ? null : resultado.errores[0]
  }

  return (
    <div className="flex flex-col gap-6">
      {campos.map((campo) => (
        <CampoDeSeccion
          key={campo.clave}
          id={`${seccion}-${campo.clave}`}
          campo={campo}
          valor={props[campo.clave]}
          alCambiar={(valor) => cambiar(campo.clave, valor)}
        />
      ))}
    </div>
  )
}

function CampoDeSeccion({
  id,
  campo,
  valor,
  alCambiar,
}: {
  id: string
  campo: Campo
  valor: unknown
  alCambiar: (valor: unknown) => string | null
}) {
  const [error, setError] = React.useState<string | null>(null)
  const cambiar = (nuevo: unknown) => setError(alCambiar(nuevo))

  const pie = error ? (
    <p role="alert" className="mt-1.5 text-sm text-senal">
      {error}
    </p>
  ) : campo.ayuda ? (
    <p className="mt-1.5 text-xs leading-relaxed opacity-55">{campo.ayuda}</p>
  ) : null

  switch (campo.tipo) {
    case "texto":
    case "parrafo":
      return (
        <div>
          <Texto
            id={id}
            campo={campo}
            valor={typeof valor === "string" ? valor : ""}
            alCambiar={cambiar}
          />
          {pie}
        </div>
      )

    case "numero": {
      const numero = typeof valor === "number" ? valor : campo.min
      return (
        <div>
          <p id={id} className={ETIQUETA}>
            {campo.etiqueta}
          </p>
          <div
            role="group"
            aria-labelledby={id}
            className="mt-2 flex items-center"
          >
            <button
              type="button"
              aria-label="Menos"
              disabled={numero <= campo.min}
              onClick={() => cambiar(Math.max(campo.min, numero - 1))}
              className="flex size-11 items-center justify-center border border-tinta/30 transition-colors hover:border-tinta disabled:opacity-30"
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>
            <output
              aria-live="polite"
              className="tabular flex h-11 w-14 items-center justify-center border-y border-tinta/30 font-titular text-lg font-bold"
            >
              {numero}
            </output>
            <button
              type="button"
              aria-label="Más"
              disabled={numero >= campo.max}
              onClick={() => cambiar(Math.min(campo.max, numero + 1))}
              className="flex size-11 items-center justify-center border border-tinta/30 transition-colors hover:border-tinta disabled:opacity-30"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>
          {pie}
        </div>
      )
    }

    case "opciones":
      return (
        <div>
          <p className={cn(ETIQUETA, "mb-2")}>{campo.etiqueta}</p>
          <Opciones
            etiqueta={campo.etiqueta}
            valor={typeof valor === "string" ? valor : campo.opciones[0].valor}
            opciones={campo.opciones}
            alCambiar={cambiar}
            columnas={2}
          />
          {pie}
        </div>
      )

    case "interruptor":
      return (
        <div>
          <p className={cn(ETIQUETA, "mb-2")}>{campo.etiqueta}</p>
          <Opciones
            etiqueta={campo.etiqueta}
            valor={valor === true ? "si" : "no"}
            opciones={[
              { valor: "no", etiqueta: "No" },
              { valor: "si", etiqueta: "Sí" },
            ]}
            alCambiar={(eleccion) => cambiar(eleccion === "si")}
          />
          {pie}
        </div>
      )

    case "categoria":
      return (
        <div>
          <Categoria
            id={id}
            etiqueta={campo.etiqueta}
            valor={typeof valor === "string" ? valor : ""}
            alCambiar={cambiar}
          />
          {pie}
        </div>
      )

    case "imagen":
      return (
        <div>
          <CampoImagen
            etiqueta={campo.etiqueta}
            ayuda={campo.ayuda}
            valor={typeof valor === "string" ? valor : undefined}
            alCambiar={cambiar}
          />
          {error ? (
            <p role="alert" className="mt-1.5 text-sm text-senal">
              {error}
            </p>
          ) : null}
        </div>
      )

    case "lista":
      return (
        <div>
          <Lista
            id={id}
            campo={campo}
            elementos={
              Array.isArray(valor)
                ? (valor as Array<Record<string, string>>)
                : []
            }
            alCambiar={cambiar}
          />
          {pie}
        </div>
      )
  }
}

function Texto({
  id,
  campo,
  valor,
  alCambiar,
}: {
  id: string
  campo: CampoDeTexto
  valor: string
  alCambiar: (valor: string) => void
}) {
  const cerca = valor.length > campo.max * 0.8

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className={ETIQUETA}>
          {campo.etiqueta}
          {campo.requerido ? null : (
            <span className="ml-1 tracking-normal normal-case opacity-70">
              (opcional)
            </span>
          )}
        </label>
        {cerca ? (
          <span className="tabular text-xs opacity-55">
            {valor.length}/{campo.max}
          </span>
        ) : null}
      </div>
      {campo.tipo === "parrafo" ? (
        <textarea
          id={id}
          value={valor}
          maxLength={campo.max}
          placeholder={campo.ejemplo}
          rows={campo.max > 400 ? 5 : 3}
          onChange={(evento) => alCambiar(evento.target.value)}
          className={cn(CAJA, "mt-1.5 resize-y py-2 leading-relaxed")}
        />
      ) : (
        <input
          id={id}
          value={valor}
          maxLength={campo.max}
          placeholder={campo.ejemplo}
          onChange={(evento) => alCambiar(evento.target.value)}
          className={cn(CAJA, "mt-1 h-12")}
        />
      )}
    </>
  )
}

function Categoria({
  id,
  etiqueta,
  valor,
  alCambiar,
}: {
  id: string
  etiqueta: string
  valor: string
  alCambiar: (valor: string | undefined) => void
}) {
  const { datos } = useEditor()

  if (datos.categorias.length === 0) {
    return (
      <>
        <p className={ETIQUETA}>{etiqueta}</p>
        <p className="mt-2 text-sm opacity-60">
          Todavía no tienes categorías: se muestran productos de todo tu
          catálogo.
        </p>
      </>
    )
  }

  return (
    <>
      <label htmlFor={id} className={ETIQUETA}>
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(evento) => alCambiar(evento.target.value || undefined)}
        className={cn(CAJA, "mt-1 h-12 cursor-pointer")}
      >
        <option value="">Todas las categorías</option>
        {datos.categorias.map((categoria) => (
          <option key={categoria} value={categoria}>
            {categoria}
          </option>
        ))}
      </select>
    </>
  )
}

function Lista({
  id,
  campo,
  elementos,
  alCambiar,
}: {
  id: string
  campo: Extract<Campo, { tipo: "lista" }>
  elementos: Array<Record<string, string>>
  alCambiar: (valor: Array<Record<string, string>>) => void
}) {
  function cambiarElemento(indice: number, clave: string, texto: string) {
    alCambiar(
      elementos.map((elemento, i) =>
        i === indice ? { ...elemento, [clave]: texto } : elemento
      )
    )
  }

  function mover(indice: number, hacia: -1 | 1) {
    const destino = indice + hacia
    if (destino < 0 || destino >= elementos.length) return
    const copia = [...elementos]
    ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
    alCambiar(copia)
  }

  const nuevo = Object.fromEntries(campo.campos.map((sub) => [sub.clave, ""]))

  return (
    <div>
      <p className={ETIQUETA}>{campo.etiqueta}</p>
      <ol className="mt-3 flex flex-col gap-3">
        {elementos.map((elemento, indice) => (
          <li
            key={indice}
            className="border border-tinta/20 p-3 motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="tabular text-xs font-semibold opacity-55">
                {campo.elemento.charAt(0).toUpperCase() +
                  campo.elemento.slice(1)}{" "}
                {indice + 1}
              </span>
              <span className="flex">
                <button
                  type="button"
                  aria-label={`Subir ${campo.elemento} ${indice + 1}`}
                  disabled={indice === 0}
                  onClick={() => mover(indice, -1)}
                  className="flex size-11 items-center justify-center opacity-60 transition-opacity hover:opacity-100 disabled:opacity-20"
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Bajar ${campo.elemento} ${indice + 1}`}
                  disabled={indice === elementos.length - 1}
                  onClick={() => mover(indice, 1)}
                  className="flex size-11 items-center justify-center opacity-60 transition-opacity hover:opacity-100 disabled:opacity-20"
                >
                  <ArrowDown aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Quitar ${campo.elemento} ${indice + 1}`}
                  onClick={() =>
                    alCambiar(elementos.filter((_, i) => i !== indice))
                  }
                  className="flex size-11 items-center justify-center opacity-60 transition-opacity hover:text-senal hover:opacity-100"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              </span>
            </div>
            <div className="mt-1 flex flex-col gap-4">
              {campo.campos.map((sub) => (
                <div key={sub.clave}>
                  <Texto
                    id={`${id}-${indice}-${sub.clave}`}
                    campo={sub}
                    valor={elemento[sub.clave] ?? ""}
                    alCambiar={(texto) =>
                      cambiarElemento(indice, sub.clave, texto)
                    }
                  />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ol>

      {elementos.length < campo.max ? (
        <button
          type="button"
          onClick={() => alCambiar([...elementos, nuevo])}
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 border border-dashed border-tinta/40 text-sm font-semibold transition-colors hover:border-tinta"
        >
          <Plus aria-hidden="true" className="size-4" />
          Agregar {campo.elemento}
        </button>
      ) : (
        <p className="mt-3 text-xs opacity-55">
          Llegaste al máximo de {campo.max}.
        </p>
      )}
    </div>
  )
}
