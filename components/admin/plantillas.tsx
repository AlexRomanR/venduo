"use client"

import * as React from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  cambiarPlantillaDeCatalogo,
  cambiarPlantillaDeTienda,
  ordenarPlantillas,
} from "@/app/admin/acciones"
import { useAccion } from "@/components/admin/usar-accion"

function Interruptor({
  activo,
  etiqueta,
  deshabilitado,
  alCambiar,
}: {
  activo: boolean
  etiqueta: string
  deshabilitado?: boolean
  alCambiar: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      disabled={deshabilitado}
      onClick={alCambiar}
      className={cn(
        "flex min-h-11 items-center border px-3 text-xs font-semibold transition-colors disabled:opacity-50",
        activo
          ? "border-tinta bg-tinta text-papel"
          : "border-tinta/25 hover:border-tinta"
      )}
    >
      {etiqueta}
    </button>
  )
}

function Mover({
  arriba,
  abajo,
  deshabilitado,
  alMover,
  nombre,
}: {
  arriba: boolean
  abajo: boolean
  deshabilitado?: boolean
  alMover: (direccion: -1 | 1) => void
  nombre: string
}) {
  return (
    <div className="flex">
      <button
        type="button"
        aria-label={`Subir ${nombre}`}
        disabled={!arriba || deshabilitado}
        onClick={() => alMover(-1)}
        className="flex size-11 items-center justify-center transition-colors hover:text-senal disabled:opacity-25"
      >
        <ArrowUp aria-hidden="true" className="size-4" />
      </button>
      <button
        type="button"
        aria-label={`Bajar ${nombre}`}
        disabled={!abajo || deshabilitado}
        onClick={() => alMover(1)}
        className="flex size-11 items-center justify-center transition-colors hover:text-senal disabled:opacity-25"
      >
        <ArrowDown aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}

function moverEn<T>(lista: T[], indice: number, direccion: -1 | 1): T[] {
  const copia = [...lista]
  const destino = indice + direccion
  ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
  return copia
}

export function PlantillasDeTiendaAdmin({
  plantillas,
}: {
  plantillas: {
    clave: string
    nombre: string
    rubro: string
    descripcion: string
    visible: boolean
    nueva: boolean
    recomendada: boolean
    tiendas: number
  }[]
}) {
  const { enCurso, correr } = useAccion()

  return (
    <ul>
      {plantillas.map((p, i) => (
        <li
          key={p.clave}
          className={cn(
            "flex flex-col gap-3 border-t border-tinta/15 px-4 py-4 first:border-t-0 sm:px-5 lg:flex-row lg:items-center lg:justify-between",
            !p.visible && "bg-tinta/[0.03]"
          )}
        >
          <div className="flex min-w-0 items-start gap-2">
            <Mover
              nombre={p.nombre}
              arriba={i > 0}
              abajo={i < plantillas.length - 1}
              deshabilitado={enCurso}
              alMover={(direccion) =>
                correr(
                  () =>
                    ordenarPlantillas({
                      tipo: "tienda",
                      claves: moverEn(plantillas, i, direccion).map(
                        (x) => x.clave
                      ),
                    }),
                  "Orden guardado."
                )
              }
            />
            <div className="min-w-0 pt-2">
              <p className="font-semibold">
                {p.nombre}{" "}
                <span className="text-xs font-normal tracking-[0.12em] uppercase opacity-65">
                  {p.rubro}
                </span>
              </p>
              <p className="text-sm opacity-70">{p.descripcion}</p>
              <p className="mt-1 text-xs opacity-65">
                {p.tiendas}{" "}
                {p.tiendas === 1 ? "tienda la usa" : "tiendas la usan"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 lg:shrink-0">
            <Interruptor
              activo={p.visible}
              etiqueta={p.visible ? "Se ofrece" : "Oculta"}
              deshabilitado={enCurso}
              alCambiar={() =>
                correr(
                  () =>
                    cambiarPlantillaDeTienda({
                      clave: p.clave,
                      visible: !p.visible,
                    }),
                  p.visible
                    ? `${p.nombre} deja de ofrecerse. Quien ya la usa la conserva.`
                    : `${p.nombre} se vuelve a ofrecer.`
                )
              }
            />
            <Interruptor
              activo={p.nueva}
              etiqueta="Nueva"
              deshabilitado={enCurso}
              alCambiar={() =>
                correr(
                  () =>
                    cambiarPlantillaDeTienda({
                      clave: p.clave,
                      nueva: !p.nueva,
                    }),
                  p.nueva
                    ? "Ya no se marca como nueva."
                    : "Se marca como nueva."
                )
              }
            />
            <Interruptor
              activo={p.recomendada}
              etiqueta="Recomendada"
              deshabilitado={enCurso}
              alCambiar={() =>
                correr(
                  () =>
                    cambiarPlantillaDeTienda({
                      clave: p.clave,
                      recomendada: !p.recomendada,
                    }),
                  p.recomendada
                    ? "Ya no se recomienda."
                    : "Se recomienda primero en su rubro."
                )
              }
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function PlantillasDeCatalogoAdmin({
  plantillas,
}: {
  plantillas: {
    clave: string
    nombre: string
    detalle: string
    visible: boolean
  }[]
}) {
  const { enCurso, correr } = useAccion()

  return (
    <ul>
      {plantillas.map((p, i) => (
        <li
          key={p.clave}
          className={cn(
            "flex flex-col gap-3 border-t border-tinta/15 px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between sm:px-5",
            !p.visible && "bg-tinta/[0.03]"
          )}
        >
          <div className="flex min-w-0 items-start gap-2">
            <Mover
              nombre={p.nombre}
              arriba={i > 0}
              abajo={i < plantillas.length - 1}
              deshabilitado={enCurso}
              alMover={(direccion) =>
                correr(
                  () =>
                    ordenarPlantillas({
                      tipo: "catalogo",
                      claves: moverEn(plantillas, i, direccion).map(
                        (x) => x.clave
                      ),
                    }),
                  "Orden guardado."
                )
              }
            />
            <div className="min-w-0 pt-2">
              <p className="font-semibold">{p.nombre}</p>
              <p className="text-sm opacity-70">{p.detalle}</p>
            </div>
          </div>
          <Interruptor
            activo={p.visible}
            etiqueta={p.visible ? "Se ofrece" : "Oculta"}
            deshabilitado={enCurso}
            alCambiar={() =>
              correr(
                () =>
                  cambiarPlantillaDeCatalogo({
                    clave: p.clave,
                    visible: !p.visible,
                  }),
                p.visible
                  ? `${p.nombre} deja de ofrecerse. Los catálogos que ya la usan siguen funcionando.`
                  : `${p.nombre} se vuelve a ofrecer.`
              )
            }
          />
        </li>
      ))}
    </ul>
  )
}
