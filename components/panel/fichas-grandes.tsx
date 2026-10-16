import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Contador } from "@/components/panel/contador"

/*
 * Números grandes que se tocan, arriba de una lista: lo que espera algo,
 * contado. Cada uno filtra la lista de abajo; el elegido lleva la regla de
 * abajo gruesa, como una pestaña. Son los mismos de la app: `FichasDeCobro`
 * en Pedidos y `FichasGrandes` en Productos.
 */

const CELDA =
  "flex min-w-0 flex-1 flex-col border-b-4 border-l border-l-tinta transition-colors first:border-l-0"

function claseDeCelda(elegida: boolean, rojo: boolean, tocable: boolean) {
  return cn(
    CELDA,
    elegida
      ? rojo
        ? "border-b-senal"
        : "border-b-tinta"
      : "border-b-transparent",
    tocable && "hover:bg-tinta/[0.04] active:bg-tinta/[0.08]"
  )
}

export interface Cobro {
  etiqueta: string
  cents: number
  pedidos: number
  /** Plata que todavía espera: va en rojo mientras haya. */
  urgente?: boolean
  elegida: boolean
  href: string
}

/** Lo que falta cobrar y lo que ya entró, en plata y en grande. */
export function FichasDeCobro({ cobros }: { cobros: Cobro[] }) {
  return (
    <div className="flex border border-tinta">
      {cobros.map((cobro) => {
        const rojo = Boolean(cobro.urgente) && cobro.cents > 0
        return (
          <Link
            key={cobro.etiqueta}
            href={cobro.href}
            scroll={false}
            aria-current={cobro.elegida ? "page" : undefined}
            className={cn(
              claseDeCelda(cobro.elegida, rojo, true),
              "gap-1 p-4 lg:px-6 lg:py-5"
            )}
          >
            <span
              className={cn(
                "text-xs font-semibold tracking-[0.12em] uppercase",
                rojo ? "text-senal" : "opacity-65"
              )}
            >
              {cobro.etiqueta}
            </span>
            <Contador
              valor={cobro.cents}
              tipo="dinero"
              className={cn(
                "truncate font-titular text-[28px] leading-[34px] font-extrabold tracking-[-0.03em] lg:text-4xl lg:leading-[44px]",
                rojo && "text-senal"
              )}
            />
            <span className="text-sm opacity-70">
              {formatNumber(cobro.pedidos)}{" "}
              {cobro.pedidos === 1 ? "pedido" : "pedidos"}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export interface FichaGrande {
  clave: string
  valor: number
  tipo?: "numero" | "dinero"
  etiqueta: string
  icono: LucideIcon
  /** Pide algo mientras no sea cero: va en rojo. */
  urgente?: boolean
  elegida?: boolean
  /** Sin enlace, la ficha solo informa. */
  href?: string
}

/** Una fila de números grandes, cada uno con su ícono. */
export function FichasGrandes({ fichas }: { fichas: FichaGrande[] }) {
  return (
    <div className="flex border border-tinta">
      {fichas.map((ficha) => {
        const Icono = ficha.icono
        const rojo = Boolean(ficha.urgente) && ficha.valor > 0
        const contenido = (
          <>
            <Icono
              aria-hidden="true"
              className={cn("size-[18px]", rojo ? "text-senal" : "opacity-60")}
            />
            <span className="mt-3 block min-w-0">
              <Contador
                valor={ficha.valor}
                tipo={ficha.tipo ?? "numero"}
                className={cn(
                  "block truncate font-titular text-[30px] leading-9 font-extrabold tracking-[-0.03em] lg:text-4xl lg:leading-[44px]",
                  // Un monto es más largo que una cuenta: en el celular se
                  // achica con el ancho, como la app achica la letra para que entre.
                  ficha.tipo === "dinero" &&
                    "max-sm:text-[clamp(1.125rem,5.2vw,1.875rem)]",
                  rojo && "text-senal"
                )}
              />
              <span className="block text-sm leading-tight font-semibold">
                {ficha.etiqueta}
              </span>
            </span>
          </>
        )
        const clase = cn(
          claseDeCelda(Boolean(ficha.elegida), rojo, Boolean(ficha.href)),
          "min-h-[104px] justify-between px-2.5 py-3 sm:px-4 lg:px-6 lg:py-5"
        )

        return ficha.href ? (
          <Link
            key={ficha.clave}
            href={ficha.href}
            scroll={false}
            aria-current={ficha.elegida ? "page" : undefined}
            className={clase}
          >
            {contenido}
          </Link>
        ) : (
          <div key={ficha.clave} className={clase}>
            {contenido}
          </div>
        )
      })}
    </div>
  )
}
