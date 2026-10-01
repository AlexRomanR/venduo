import Image from "next/image"
import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Una sección del Resumen: un panel encerrado por una regla, con su cabecera.
 *
 * Es el panel de demostración de DESIGN.md —regla estructural de un píxel,
 * esquina viva, sin sombra— y no una tarjeta. Antes las secciones se separaban
 * solo con un rótulo chico y una regla al 15%, y lo importante se perdía entre
 * lo demás. Encerrada en su panel, cada una se reconoce de un vistazo, y su
 * título dice para qué sirve en vez de solo nombrarla.
 *
 * `accion` es el pie: un enlace a todo el ancho para seguir en la sección
 * completa del panel, del tamaño de un pulgar.
 */
export function Seccion({
  id,
  icono: Icono,
  titulo,
  bajada,
  extra,
  accion,
  className,
  children,
}: {
  id: string
  icono: LucideIcon
  titulo: string
  bajada?: string
  /** Lo que va a la derecha del título: un selector, un contador. */
  extra?: React.ReactNode
  accion?: { href: string; texto: string }
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={`${id}-titulo`}
      className={cn("flex min-w-0 flex-col border border-tinta", className)}
    >
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-tinta/15 px-4 py-3.5 sm:px-5">
        {/* El título reclama 16rem antes de ceder: en un celular, lo que va a
            la derecha baja a su propia línea en vez de apretar la bajada en
            una columna de una palabra por renglón. */}
        <div className="flex min-w-[min(100%,16rem)] flex-1 items-start gap-3">
          <Icono aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0">
            <h2
              id={`${id}-titulo`}
              className="font-titular text-lg leading-tight font-bold tracking-[-0.02em]"
            >
              {titulo}
            </h2>
            {bajada ? (
              <p className="mt-0.5 text-sm leading-snug opacity-70">{bajada}</p>
            ) : null}
          </div>
        </div>
        {extra}
      </header>

      <div className="flex flex-1 flex-col">{children}</div>

      {accion ? (
        <Link
          href={accion.href}
          className="group flex min-h-12 items-center justify-between gap-3 border-t border-tinta/15 px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel sm:px-5"
        >
          {accion.texto}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
          />
        </Link>
      ) : null}
    </section>
  )
}

/**
 * Lo que muestra una sección sin datos: qué va a aparecer acá y cómo llegar.
 *
 * Una tienda recién creada es el estado normal durante una demostración, no un
 * caso raro, así que dice qué hacer y no solo que no hay nada.
 */
export function SinDatos({
  icono: Icono,
  titulo,
  texto,
  children,
}: {
  icono: LucideIcon
  titulo: string
  texto: string
  /** Una acción, si la hay. */
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-start gap-3 px-4 py-6 sm:px-5">
      <Icono aria-hidden="true" className="size-6 opacity-30" />
      <div>
        <p className="font-titular font-bold tracking-[-0.01em]">{titulo}</p>
        <p className="mt-1 max-w-[46ch] text-sm leading-relaxed opacity-65">
          {texto}
        </p>
      </div>
      {children}
    </div>
  )
}

/** La foto chica de un producto en una fila, o su lugar vacío. */
export function Miniatura({
  foto,
  icono: Icono,
}: {
  foto: string | null
  icono: LucideIcon
}) {
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden border border-tinta/15 bg-tinta/[0.05]">
      {foto ? (
        <Image
          src={foto}
          alt=""
          fill
          unoptimized
          sizes="44px"
          className="object-cover"
        />
      ) : (
        <Icono aria-hidden="true" className="size-4 opacity-35" />
      )}
    </span>
  )
}
