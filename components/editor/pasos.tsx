"use client"

import {
  LayoutGrid,
  LayoutTemplate,
  Palette,
  Send,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react"

import type { Vista } from "@/lib/editor/protocolo"
import { cn } from "@/lib/utils"
import type { ClaveDePaso } from "@/components/editor/contexto"

export interface Paso {
  clave: ClaveDePaso
  nombre: string
  /** El nombre corto, para las pestañas del celular. */
  corto: string
  bajada: string
  icono: LucideIcon
  /** Qué pantalla de la tienda muestra la vista previa en este paso. */
  vista: Vista
}

export const PASOS: Paso[] = [
  {
    clave: "marca",
    nombre: "Marca",
    corto: "Marca",
    bajada: "Logo, colores y letra",
    icono: Palette,
    vista: "inicio",
  },
  {
    clave: "portada",
    nombre: "Portada",
    corto: "Portada",
    bajada: "Secciones, textos y fotos",
    icono: LayoutTemplate,
    vista: "inicio",
  },
  {
    clave: "productos",
    nombre: "Productos",
    corto: "Productos",
    bajada: "Cómo se ven tus productos",
    icono: LayoutGrid,
    vista: "catalogo",
  },
  {
    clave: "carrito",
    nombre: "Carrito",
    corto: "Carrito",
    bajada: "Cómo se ve el pedido",
    icono: ShoppingBag,
    vista: "carrito",
  },
  {
    clave: "publicar",
    nombre: "Publicar",
    corto: "Publicar",
    bajada: "Revisa y publica",
    icono: Send,
    vista: "inicio",
  },
]

export function pasoDe(clave: ClaveDePaso): Paso {
  return PASOS.find((paso) => paso.clave === clave) ?? PASOS[0]
}

/**
 * El recorrido en escritorio: los pasos en una fila, arriba, como las
 * pestañas de un documento. Se puede saltar a cualquiera; el orden es una
 * sugerencia, no una puerta. Arriba y no a un costado, para dejarle todo el
 * ancho al panel y a la tienda.
 */
export function BarraDePasos({
  actual,
  conCambios,
  porDecidir,
  alElegir,
}: {
  actual: ClaveDePaso
  conCambios: Set<ClaveDePaso>
  /** El paso con algo que espera una decisión. */
  porDecidir?: ClaveDePaso | null
  alElegir: (paso: ClaveDePaso) => void
}) {
  return (
    <nav
      aria-label="Pasos del editor"
      className="overflow-x-auto border-b border-tinta/15 bg-papel px-2"
    >
      {/* Cinco columnas iguales de lado a lado: amontonados al centro, sobre
          un panel y una vista previa de anchos distintos, parecían corridos.
          El número dice que es un recorrido, aunque se pueda saltar. */}
      <ol className="grid min-w-max grid-cols-5">
        {PASOS.map((paso, indice) => {
          const activo = paso.clave === actual
          return (
            <li key={paso.clave}>
              <button
                type="button"
                onClick={() => alElegir(paso.clave)}
                aria-current={activo ? "step" : undefined}
                title={paso.bajada}
                className={cn(
                  "relative flex h-12 w-full items-center justify-center gap-2 px-4 text-sm font-semibold -outline-offset-2 transition-colors",
                  activo ? "text-tinta" : "text-tinta/70 hover:text-tinta"
                )}
              >
                <span className="tabular text-xs opacity-70">
                  {String(indice + 1).padStart(2, "0")}
                </span>
                {paso.nombre}
                {conCambios.has(paso.clave) || porDecidir === paso.clave ? (
                  <span
                    role="img"
                    aria-label={
                      porDecidir === paso.clave
                        ? "con una propuesta para revisar"
                        : "con cambios sin publicar"
                    }
                    className="size-1.5 rounded-full bg-senal"
                  />
                ) : null}
                {activo ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-tinta motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in"
                  />
                ) : null}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** El recorrido en el celular: las pestañas abajo, al alcance del pulgar. */
export function PestanasDePasos({
  actual,
  conCambios,
  porDecidir,
  alElegir,
}: {
  actual: ClaveDePaso
  conCambios: Set<ClaveDePaso>
  porDecidir?: ClaveDePaso | null
  alElegir: (paso: ClaveDePaso) => void
}) {
  return (
    <nav
      aria-label="Pasos del editor"
      className="border-t border-tinta/15 bg-papel pb-[env(safe-area-inset-bottom)]"
    >
      <ol className="grid grid-cols-5">
        {PASOS.map((paso) => {
          const activo = paso.clave === actual
          const Icono = paso.icono
          return (
            <li key={paso.clave}>
              <button
                type="button"
                onClick={() => alElegir(paso.clave)}
                aria-current={activo ? "step" : undefined}
                aria-label={
                  porDecidir === paso.clave
                    ? `${paso.nombre}, con una propuesta para revisar`
                    : conCambios.has(paso.clave)
                      ? `${paso.nombre}, con cambios sin publicar`
                      : paso.nombre
                }
                className={cn(
                  "relative flex min-h-14 w-full flex-col items-center justify-center gap-1 border-t-2 text-xs font-semibold transition-colors",
                  activo
                    ? "border-tinta text-tinta"
                    : "border-transparent text-tinta/65 hover:text-tinta"
                )}
              >
                <Icono aria-hidden="true" className="size-5" />
                <span className="max-w-full truncate px-0.5">{paso.corto}</span>
                {conCambios.has(paso.clave) || porDecidir === paso.clave ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-2 right-[calc(50%-14px)] size-1.5 rounded-full bg-senal"
                  />
                ) : null}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
