import Link from "next/link"
import { ArrowRight, Users } from "lucide-react"

import { formatMoney, formatNumber } from "@/lib/format"
import type { Tablero } from "@/lib/tablero"
import { cn } from "@/lib/utils"
import { Seccion, SinDatos } from "@/components/panel/tablero/seccion"

const ENLACE =
  "inline-flex min-h-11 items-center gap-2 rounded-plantilla border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"

/**
 * La red de vendedores: cuántos hay, quién vendió más y quién espera.
 *
 * Una tienda que no acepta vendedores ve lo que se pierde, en una línea, y
 * cómo activarla: es lo que distingue a Venduo de una tienda cualquiera.
 */
export function TuRed({ red }: { red: Tablero["red"] }) {
  if (!red.activa) {
    return (
      <Seccion
        id="tu-red"
        icono={Users}
        titulo="Vende con una red"
        bajada="Jóvenes que comparten tus productos y cobran solo si venden."
      >
        <div className="flex flex-1 flex-col items-start gap-4 px-4 py-5 sm:px-5">
          <p className="max-w-[46ch] text-sm leading-relaxed opacity-70">
            Tú eliges la comisión y apruebas a quién entra. Cada venta queda en
            su historial laboral, y tú llegas a clientes que no te conocían.
          </p>
          <Link href="/panel/vendedores" className={ENLACE}>
            Conocer cómo funciona
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </Seccion>
    )
  }

  return (
    <Seccion
      id="tu-red"
      icono={Users}
      titulo="Tu red de vendedores"
      bajada="Quién vendió más en los últimos 30 días."
      extra={
        <span className="tabular text-sm opacity-70">
          {formatNumber(red.activos)} {red.activos === 1 ? "activo" : "activos"}
        </span>
      }
      accion={{ href: "/panel/vendedores", texto: "Ver tu red" }}
    >
      {red.pendientes > 0 ? (
        <Link
          href="/panel/vendedores"
          className="group flex min-h-12 items-center justify-between gap-3 border-b border-tinta/15 px-4 text-sm transition-colors hover:bg-tinta/[0.04] sm:px-5"
        >
          <span>
            <span className="font-semibold">
              {formatNumber(red.pendientes)}{" "}
              {red.pendientes === 1 ? "persona espera" : "personas esperan"}
            </span>{" "}
            <span className="opacity-65">que la apruebes</span>
          </span>
          <ArrowRight
            aria-hidden="true"
            className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
          />
        </Link>
      ) : null}

      {red.destacados.length === 0 ? (
        <SinDatos
          icono={Users}
          titulo={
            red.activos === 0
              ? "Todavía nadie vende para ti"
              : "Tu red no vendió este mes"
          }
          texto={
            red.activos === 0
              ? "Comparte tu invitación: cada vendedor lleva tus productos a gente que no te conocía."
              : "Pásales novedades y fotos nuevas por WhatsApp: con material fresco venden más."
          }
        >
          {red.activos === 0 ? (
            <Link href="/panel/vendedores" className={ENLACE}>
              Invitar vendedores
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
        </SinDatos>
      ) : (
        <ol>
          {red.destacados.map((vendedor, indice) => (
            <li
              key={vendedor.id}
              className={cn(
                "flex min-h-14 items-center gap-3 px-4 py-2.5 sm:px-5",
                indice > 0 && "border-t border-tinta/15"
              )}
            >
              <span className="tabular w-4 shrink-0 font-titular text-sm font-bold opacity-40">
                {indice + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate leading-snug font-semibold">
                  {vendedor.nombre}
                </span>
                <span className="tabular mt-0.5 block text-xs opacity-70">
                  {formatNumber(vendedor.pedidos)}{" "}
                  {vendedor.pedidos === 1 ? "pedido" : "pedidos"}
                </span>
              </span>
              <span className="tabular shrink-0 font-titular font-bold">
                {formatMoney(vendedor.ventasCents)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Seccion>
  )
}
