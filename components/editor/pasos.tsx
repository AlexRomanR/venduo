"use client"

import {
  ChevronRight,
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
 * El recorrido en escritorio: los seis pasos en una fila, arriba, como las
 * pestañas de un documento. Se puede saltar a cualquiera; el orden es una
 * sugerencia, no una puerta. Arriba y no a un costado, para dejarle todo el
 * ancho al panel y a la tienda.
 */
export function BarraDePasos({
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
      className="overflow-x-auto border-b border-tinta/15 bg-papel px-2"
    >
      <ol className="flex min-w-max items-center">
        {PASOS.map((paso, indice) => {
          const activo = paso.clave === actual
          return (
            <li key={paso.clave} className="flex items-center">
              {indice > 0 ? (
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 opacity-25"
                />
              ) : null}
              <button
                type="button"
                onClick={() => alElegir(paso.clave)}
                aria-current={activo ? "step" : undefined}
                title={paso.bajada}
                className={cn(
                  "relative flex h-12 items-center gap-2 px-3 text-sm font-semibold transition-colors xl:px-4",
                  activo ? "text-tinta" : "opacity-55 hover:opacity-100"
                )}
              >
                <span
                  className={cn(
                    "tabular font-titular text-xs font-bold",
                    activo ? "text-senal" : "opacity-70"
                  )}
                >
                  {String(indice + 1).padStart(2, "0")}
                </span>
                {paso.nombre}
                {conCambios.has(paso.clave) ? (
                  <span
                    aria-label="con cambios sin publicar"
                    className="size-1.5 rounded-full bg-senal"
                  />
                ) : null}
                {activo ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 bottom-0 h-0.5 bg-senal motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in"
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
