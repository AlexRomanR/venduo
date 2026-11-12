import Link from "next/link"

import { cn } from "@/lib/utils"
import { Visto } from "@/components/portada/trazos"

export interface Paso {
  nombre: string
  /** Para volver a un paso ya hecho. */
  href: string
}

/** Los pasos del alta de una tienda, en un solo lugar para que no se desfasen. */
export const PASOS_CREAR: Paso[] = [
  { nombre: "Tu negocio", href: "/crear" },
  { nombre: "Tu plantilla", href: "/crear/plantilla" },
  { nombre: "Tu tienda", href: "/crear/listo" },
]

/**
 * Por dónde va el alta, en una línea del cuaderno: lo hecho con un visto a
 * mano —y se toca para volver—, el paso de ahora con el resaltador detrás, y lo
 * que falta, apagado. Una vez creada la tienda no se vuelve atrás: los pasos
 * hechos del final ya no son enlaces.
 */
export function Pasos({
  pasos,
  actual,
  conVuelta = true,
}: {
  pasos: Paso[]
  actual: number
  /** Si los pasos hechos llevan a su pantalla. */
  conVuelta?: boolean
}) {
  return (
    <nav aria-label="Pasos del alta">
      <p className="sr-only">
        Paso {actual} de {pasos.length}
      </p>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
        {pasos.map((paso, i) => {
          const numero = i + 1
          const hecho = numero < actual
          const ahora = numero === actual
          const nombre = hecho ? (
            <span className="inline-flex items-center gap-1">
              <Visto
                grosor={3.5}
                className="size-3.5 [&_path]:stroke-[var(--tinta)]"
              />
              {paso.nombre}
            </span>
          ) : (
            paso.nombre
          )

          return (
            <li key={paso.nombre} className="flex items-center gap-2">
              {i > 0 ? (
                <span aria-hidden="true" className="text-tinta/35">
                  ·
                </span>
              ) : null}
              {hecho && conVuelta ? (
                <Link
                  href={paso.href}
                  className="inline-flex min-h-11 items-center text-tinta/65 underline-offset-4 transition-colors hover:text-tinta hover:underline"
                >
                  {nombre}
                </Link>
              ) : (
                <span
                  aria-current={ahora ? "step" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center",
                    ahora ? "text-tinta" : "text-tinta/65"
                  )}
                >
                  {ahora ? (
                    <span className="pieza-resaltado">{nombre}</span>
                  ) : (
                    nombre
                  )}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
