"use client"

import * as React from "react"

import {
  ESTADOS,
  NOMBRES_DE_ESTADO,
  type ClaveFuncion,
  type EstadoDeFuncion,
} from "@/lib/funciones"
import { cn } from "@/lib/utils"
import {
  cambiarAjuste,
  cambiarEstadoDeTienda,
  cambiarEstadoGeneral,
} from "@/app/admin/acciones"
import { useAccion } from "@/components/admin/usar-accion"

const CORTO: Record<EstadoDeFuncion, string> = {
  activa: "Activa",
  desactivada: "Desactivada",
  oculta: "Oculta",
}

/**
 * Los tres estados de una función, en una fila de botones. Por tienda suma un
 * cuarto: seguir lo general.
 */
function SelectorDeEstado({
  nombre,
  valor,
  conGeneral,
  general,
  deshabilitado,
  alCambiar,
}: {
  nombre: string
  valor: EstadoDeFuncion | null
  conGeneral?: boolean
  general?: EstadoDeFuncion
  deshabilitado?: boolean
  alCambiar: (estado: EstadoDeFuncion | null) => void
}) {
  const opciones: (EstadoDeFuncion | null)[] = conGeneral
    ? [null, ...ESTADOS]
    : [...ESTADOS]

  return (
    <div
      role="radiogroup"
      aria-label={nombre}
      className="flex flex-wrap gap-1.5"
    >
      {opciones.map((opcion) => {
        const elegida = valor === opcion
        return (
          <button
            key={opcion ?? "general"}
            type="button"
            role="radio"
            aria-checked={elegida}
            disabled={deshabilitado}
            onClick={() => !elegida && alCambiar(opcion)}
            title={opcion ? NOMBRES_DE_ESTADO[opcion] : undefined}
            className={cn(
              "flex min-h-11 items-center border px-3 text-xs font-semibold transition-colors disabled:opacity-50",
              elegida
                ? opcion === "activa" ||
                  (opcion === null && general === "activa")
                  ? "border-tinta bg-tinta text-papel"
                  : "border-senal bg-senal text-white"
                : "border-tinta/25 hover:border-tinta"
            )}
          >
            {opcion === null
              ? `Como el general (${CORTO[general ?? "activa"].toLowerCase()})`
              : CORTO[opcion]}
          </button>
        )
      })}
    </div>
  )
}

/** Una función, para toda la plataforma. */
export function FuncionGeneral({
  clave,
  nombre,
  descripcion,
  estado,
}: {
  clave: ClaveFuncion
  nombre: string
  descripcion: string
  estado: EstadoDeFuncion
}) {
  const { enCurso, correr } = useAccion()

  return (
    <li className="flex flex-col gap-3 border-t border-tinta/15 px-4 py-4 first:border-t-0 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="font-semibold">{nombre}</p>
        <p className="text-sm opacity-70">{descripcion}</p>
      </div>
      <SelectorDeEstado
        nombre={nombre}
        valor={estado}
        deshabilitado={enCurso}
        alCambiar={(nuevo) =>
          nuevo &&
          correr(
            () => cambiarEstadoGeneral({ clave, estado: nuevo }),
            `${nombre}: ${NOMBRES_DE_ESTADO[nuevo].toLowerCase()} para todas las tiendas.`
          )
        }
      />
    </li>
  )
}

/** Una función en una tienda: su propio estado, o el general. */
export function FuncionDeTienda({
  tienda,
  clave,
  nombre,
  descripcion,
  general,
  propio,
}: {
  tienda: string
  clave: ClaveFuncion
  nombre: string
  descripcion: string
  general: EstadoDeFuncion
  propio: EstadoDeFuncion | null
}) {
  const { enCurso, correr } = useAccion()

  return (
    <li className="flex flex-col gap-3 border-t border-tinta/15 px-4 py-4 first:border-t-0 sm:px-5">
      <div className="min-w-0">
        <p className="font-semibold">{nombre}</p>
        <p className="text-sm opacity-70">{descripcion}</p>
      </div>
      <SelectorDeEstado
        nombre={nombre}
        valor={propio}
        conGeneral
        general={general}
        deshabilitado={enCurso}
        alCambiar={(nuevo) =>
          correr(
            () => cambiarEstadoDeTienda({ tienda, clave, estado: nuevo }),
            nuevo
              ? `${nombre}: ${NOMBRES_DE_ESTADO[nuevo].toLowerCase()} en esta tienda.`
              : `${nombre} vuelve a seguir lo general.`
          )
        }
      />
    </li>
  )
}

/** El interruptor de emergencia de la IA y el tope diario por tienda. */
export function AjustesDeIa({
  apagada,
  tope,
}: {
  apagada: boolean
  tope: number | null
}) {
  const { enCurso, correr } = useAccion()
  const [valor, setValor] = React.useState(tope === null ? "" : String(tope))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Apagar toda la IA</p>
          <p className="text-sm opacity-70">
            Para una caída del proveedor o una demostración: la IA desaparece de
            todas las tiendas al instante, sin desplegar nada.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={apagada}
          disabled={enCurso}
          onClick={() =>
            correr(
              () => cambiarAjuste({ clave: "ia_apagada", valor: !apagada }),
              apagada
                ? "La IA vuelve a estar disponible."
                : "La IA quedó apagada en toda la plataforma."
            )
          }
          className={cn(
            "flex min-h-11 shrink-0 items-center justify-center border-2 px-5 text-sm font-semibold transition-colors disabled:opacity-50",
            apagada
              ? "border-senal bg-senal text-white"
              : "border-tinta hover:bg-tinta hover:text-papel"
          )}
        >
          {apagada ? "Encender la IA" : "Apagar la IA"}
        </button>
      </div>

      <form
        className="flex flex-col gap-3 border-t border-tinta/15 pt-5 sm:flex-row sm:items-end sm:justify-between"
        onSubmit={(evento) => {
          evento.preventDefault()
          const numero = valor.trim() === "" ? null : Number(valor)
          if (numero !== null && (!Number.isInteger(numero) || numero < 1))
            return
          correr(
            () => cambiarAjuste({ clave: "ia_tope_diario", valor: numero }),
            numero === null
              ? "Sin tope diario."
              : `Tope de ${numero} pedidos por día y por tienda.`
          )
        }}
      >
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Tope diario por tienda</span>
          <span className="text-sm opacity-70">
            Cuántos pedidos a la IA puede hacer cada tienda por día. Vacío, sin
            tope.
          </span>
          <input
            inputMode="numeric"
            value={valor}
            onChange={(evento) =>
              setValor(evento.target.value.replace(/\D/g, ""))
            }
            placeholder="Sin tope"
            className="mt-1 h-11 w-40 border-b border-tinta bg-transparent text-base outline-none focus-visible:border-senal"
          />
        </label>
        <button
          type="submit"
          disabled={enCurso}
          className="flex min-h-11 items-center justify-center border-2 border-tinta px-5 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel disabled:opacity-50"
        >
          Guardar el tope
        </button>
      </form>
    </div>
  )
}
