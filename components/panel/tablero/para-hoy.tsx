import Link from "next/link"
import { ArrowRight, CircleCheck, type LucideIcon } from "lucide-react"

import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Seccion } from "@/components/panel/piezas"

export interface Pendiente {
  icono: LucideIcon
  texto: string
  detalle?: string
  href: string
  /** El verbo del botón: "Ver pedidos", "Reponer". */
  accion: string
  /** Lo que frena una venta. Es lo único que va en rojo. */
  urgente: boolean
}

/**
 * Lo que espera algo de la tienda, primero en la pantalla.
 *
 * Cada fila dice qué pasa, qué hacer y lleva ahí con un toque. El orden lo
 * decide quien arma la lista: primero lo que frena vender, después lo que
 * ayuda. Los números son los mismos de la barra lateral, así que las dos
 * nunca se contradicen.
 */
export function ParaHoy({ pendientes }: { pendientes: Pendiente[] }) {
  return (
    <Seccion
      id="para-hoy"
      icono={CircleCheck}
      titulo="Para hoy"
      bajada={
        pendientes.length > 0
          ? "Lo que espera tu respuesta, lo más importante primero."
          : undefined
      }
      extra={
        pendientes.length > 0 ? (
          <span className="tabular text-sm opacity-70">
            {formatNumber(pendientes.length)}{" "}
            {pendientes.length === 1 ? "pendiente" : "pendientes"}
          </span>
        ) : null
      }
    >
      {pendientes.length === 0 ? (
        <p className="flex items-center gap-3 px-4 py-4 text-sm sm:px-5">
          <CircleCheck aria-hidden="true" className="size-5 shrink-0" />
          <span>
            <span className="font-semibold">Estás al día.</span>{" "}
            <span className="opacity-65">
              Cuando llegue un pedido o una solicitud, aparece acá.
            </span>
          </span>
        </p>
      ) : (
        <ul>
          {pendientes.map((pendiente) => {
            const Icono = pendiente.icono
            return (
              <li
                key={pendiente.texto}
                className="border-t border-tinta/15 first:border-t-0"
              >
                <Link
                  href={pendiente.href}
                  className="group flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-tinta/[0.04] sm:px-5"
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center border",
                      pendiente.urgente
                        ? "border-senal text-senal"
                        : "border-tinta/25"
                    )}
                  >
                    <Icono aria-hidden="true" className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block leading-snug font-semibold">
                      {pendiente.texto}
                    </span>
                    {pendiente.detalle ? (
                      <span className="mt-0.5 block text-sm leading-snug opacity-65">
                        {pendiente.detalle}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold">
                    <span className="hidden sm:inline">{pendiente.accion}</span>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
                    />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Seccion>
  )
}
