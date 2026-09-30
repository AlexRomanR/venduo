"use client"

import {
  LayoutGrid,
  LayoutTemplate,
  Package,
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
    nombre: "Tu marca",
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
    clave: "catalogo",
    nombre: "Catálogo",
    corto: "Catálogo",
    bajada: "Cómo se ven tus productos",
    icono: LayoutGrid,
    vista: "catalogo",
  },
  {
    clave: "producto",
    nombre: "Producto",
    corto: "Producto",
    bajada: "La ficha de cada producto",
    icono: Package,
    vista: "producto",
  },
  {
    clave: "carrito",
    nombre: "Carrito",
    corto: "Carrito",
    bajada: "El pedido y el pago",
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
 * El recorrido en escritorio: los seis pasos a la vista, con el número y qué
 * se edita en cada uno. Se puede saltar a cualquiera; el orden es una
 * sugerencia, no una puerta.
 */
export function RielDePasos({
  actual,
  conCambios,
  alElegir,
}: {
  actual: ClaveDePaso
  conCambios: Set<ClaveDePaso>
  alElegir: (paso: ClaveDePaso) => void
}) {
  return (
    <nav aria-label="Pasos del editor" className="flex flex-col py-4">
      <ol>
        {PASOS.map((paso, indice) => {
          const activo = paso.clave === actual
          return (
            <li key={paso.clave}>
              <button
                type="button"
                onClick={() => alElegir(paso.clave)}
                aria-current={activo ? "step" : undefined}
                className={cn(
                  "group relative flex w-full items-start gap-3 border-l-2 py-3 pr-4 pl-5 text-left transition-colors",
                  activo
                    ? "border-senal bg-tinta/[0.04]"
                    : "border-transparent hover:bg-tinta/[0.03]"
                )}
              >
                <span
                  className={cn(
                    "tabular mt-0.5 font-titular text-sm font-bold",
                    activo ? "text-senal" : "opacity-45"
                  )}
                >
                  {String(indice + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    {paso.nombre}
                    {conCambios.has(paso.clave) ? (
                      <span
                        aria-label="con cambios sin publicar"
                        className="size-1.5 rounded-full bg-senal"
                      />
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug opacity-55">
                    {paso.bajada}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** El recorrido en el celular: seis pestañas abajo, al alcance del pulgar. */
export function PestanasDePasos({
  actual,
  conCambios,
  alElegir,
}: {
  actual: ClaveDePaso
  conCambios: Set<ClaveDePaso>
  alElegir: (paso: ClaveDePaso) => void
}) {
  return (
    <nav
      aria-label="Pasos del editor"
      className="border-t border-tinta/15 bg-papel pb-[env(safe-area-inset-bottom)]"
    >
      <ol className="grid grid-cols-6">
        {PASOS.map((paso) => {
          const activo = paso.clave === actual
          const Icono = paso.icono
          return (
            <li key={paso.clave}>
              <button
                type="button"
                onClick={() => alElegir(paso.clave)}
                aria-current={activo ? "step" : undefined}
                aria-label={paso.nombre}
                className={cn(
                  "relative flex min-h-14 w-full flex-col items-center justify-center gap-1 border-t-2 text-[10px] font-semibold tracking-[0.02em] transition-colors",
                  activo
                    ? "border-senal text-senal"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <Icono aria-hidden="true" className="size-5" />
                <span className="max-w-full truncate px-0.5">{paso.corto}</span>
                {conCambios.has(paso.clave) ? (
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
