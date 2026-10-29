import Link from "next/link"

import { Deslizable } from "@/components/panel/deslizable"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export interface FichaDeFiltro {
  href: string
  nombre: string
  /** Cuántos hay en ese filtro. */
  cuenta?: number
  /** El número pide atención: va en la señal mientras la ficha no esté elegida. */
  urgente?: boolean
  activa: boolean
}

/**
 * Los filtros de una lista: una franja de fichas que se desliza de lado, la
 * misma de la app. Cada ficha es un enlace —el filtro vive en la dirección—,
 * así "Para hoy" abre la lista ya filtrada y volver atrás deshace el filtro.
 *
 * La elegida va en tinta llena, nunca en rojo: en el panel el rojo es para lo
 * que pide una acción, y un filtro solo ordena.
 */
export function FranjaDeFichas({
  fichas,
  etiqueta,
}: {
  fichas: FichaDeFiltro[]
  /** Para lectores de pantalla: qué filtra. */
  etiqueta: string
}) {
  return (
    <Deslizable
      etiqueta={etiqueta}
      className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto overscroll-x-contain border-b border-tinta/15 px-4 py-3 sm:px-5 [&::-webkit-scrollbar]:hidden"
    >
      {fichas.map((ficha) => (
        <Link
          key={ficha.href}
          href={ficha.href}
          scroll={false}
          aria-current={ficha.activa ? "page" : undefined}
          className={cn(
            "flex min-h-11 shrink-0 items-center gap-1.5 border px-3 text-sm font-semibold whitespace-nowrap transition-colors",
            ficha.activa
              ? "border-tinta bg-tinta text-papel"
              : "border-tinta/25 hover:border-tinta"
          )}
        >
          {ficha.nombre}
          {ficha.cuenta !== undefined ? (
            <span
              className={cn(
                "tabular",
                ficha.activa
                  ? "opacity-70"
                  : ficha.urgente && ficha.cuenta > 0
                    ? "text-senal"
                    : "opacity-65"
              )}
            >
              {formatNumber(ficha.cuenta)}
            </span>
          ) : null}
        </Link>
      ))}
    </Deslizable>
  )
}
