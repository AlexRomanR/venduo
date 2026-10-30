import Link from "next/link"
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Contador } from "@/components/panel/contador"
import { Seccion } from "@/components/panel/piezas"

/** Lo que impide vender, dicho como lo que hay que hacer: "Agrega tu WhatsApp". */
export interface Alerta {
  texto: string
  href: string
}

/** Algo que espera, contado: un número grande y dos palabras. */
export interface Atajo {
  valor: number
  etiqueta: string
  icono: LucideIcon
  /** La lista ya filtrada en lo que hay que atender. */
  href: string
  /** Frena una venta o un cobro. Es lo único que va en rojo. */
  urgente: boolean
}

/**
 * Lo que espera algo de la tienda, primero en la pantalla.
 *
 * Se mira, no se lee: arriba lo que impide vender, en rojo y como una orden;
 * abajo lo que espera, en números grandes que se tocan y llevan a la lista ya
 * filtrada. Lo que está en cero no aparece, y si no queda nada, una línea.
 * Los números son los de la barra lateral: los dos nunca se contradicen.
 */
export function ParaHoy({
  alertas,
  atajos,
}: {
  alertas: Alerta[]
  atajos: Atajo[]
}) {
  const conAlgo = atajos.filter((atajo) => atajo.valor > 0)

  if (alertas.length === 0 && conAlgo.length === 0) {
    return (
      <p className="flex items-center gap-2.5 font-titular text-lg font-bold">
        <CircleCheck aria-hidden="true" className="size-5" />
        Estás al día
      </p>
    )
  }

  return (
    <Seccion
      id="para-hoy"
      icono={CircleAlert}
      titulo="Para hoy"
      bajada="Lo que necesita tu atención."
    >
      {alertas.map((alerta) => (
        <Link
          key={alerta.texto}
          href={alerta.href}
          className="group flex min-h-14 items-center gap-3 border-b border-tinta/15 px-4 text-senal transition-colors last:border-b-0 hover:bg-senal/[0.06] sm:px-5"
        >
          <span aria-hidden="true" className="size-2 rounded-full bg-senal" />
          <span className="flex-1 font-semibold">{alerta.texto}</span>
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
          />
        </Link>
      ))}

      {conAlgo.length > 0 ? (
        <ul
          className={cn(
            "grid divide-x divide-tinta/15",
            alertas.length > 0 && "border-t border-tinta/15"
          )}
          style={{
            gridTemplateColumns: `repeat(${conAlgo.length}, minmax(0, 1fr))`,
          }}
        >
          {conAlgo.map((atajo) => {
            const Icono = atajo.icono
            return (
              <li key={atajo.etiqueta}>
                {/* En el celular, el número abajo de su ícono, como en la app;
                    en una pantalla ancha, en una fila: ícono, número y nombre,
                    sin el aire que dejaba una celda alta para tres cifras. */}
                <Link
                  href={atajo.href}
                  aria-label={`${atajo.valor} ${atajo.etiqueta}`}
                  className="group relative flex h-full min-h-32 flex-col justify-between gap-4 px-3 py-4 transition-colors hover:bg-tinta/[0.04] sm:px-5 lg:min-h-0 lg:flex-row lg:items-center lg:justify-start lg:gap-4 lg:py-5"
                >
                  <Icono
                    aria-hidden="true"
                    className={cn(
                      "size-5 shrink-0 lg:size-6",
                      atajo.urgente ? "text-senal" : "opacity-60"
                    )}
                  />
                  <span className="lg:flex lg:min-w-0 lg:items-baseline lg:gap-3">
                    <Contador
                      valor={atajo.valor}
                      className={cn(
                        "block font-titular text-[clamp(2.25rem,7vw,3rem)] leading-none font-extrabold tracking-[-0.04em]",
                        atajo.urgente && "text-senal"
                      )}
                    />
                    <span className="mt-1.5 block text-[13px] leading-tight font-semibold sm:text-sm lg:mt-0 lg:truncate lg:text-base">
                      {atajo.etiqueta}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="absolute top-4 right-3 size-4 -translate-x-1 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transform-none sm:right-5 lg:static lg:ml-auto"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </Seccion>
  )
}
