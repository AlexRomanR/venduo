import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Una cifra del panel.
 *
 * El numeral va en tinta y no en rojo, al revés que en la portada. Son cuatro
 * cifras juntas: si todas fueran rojas, el acento dejaría de señalar nada.
 * `alerta` lo enciende solo cuando el número pide una acción — pedidos sin
 * gestionar, solicitudes esperando— y así el rojo vuelve a querer decir algo.
 */
export function Cifra({
  etiqueta,
  valor,
  detalle,
  alerta = false,
}: {
  etiqueta: string
  valor: string
  detalle?: string
  alerta?: boolean
}) {
  return (
    <div className="border-t-2 border-tinta pt-4">
      <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
        {etiqueta}
      </p>
      <p
        className={cn(
          "tabular mt-3 font-titular text-[clamp(1.6rem,4.5vw,2.25rem)] leading-none font-extrabold tracking-[-0.04em]",
          alerta && "text-senal"
        )}
      >
        {valor}
      </p>
      {detalle ? <p className="mt-2 text-sm opacity-55">{detalle}</p> : null}
    </div>
  )
}

/** Encabezado de sección: label rojo en versalita y titular acotado. */
export function Encabezado({
  etiqueta,
  titulo,
  accion,
}: {
  etiqueta: string
  titulo?: string
  accion?: { href: string; texto: string }
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
      <div className="flex-1">
        <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          {etiqueta}
        </p>
        {titulo ? (
          <h2 className="mt-3 font-titular text-xl font-bold tracking-[-0.02em]">
            {titulo}
          </h2>
        ) : null}
      </div>

      {accion ? (
        <Link
          href={accion.href}
          className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
        >
          {accion.texto}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none"
          />
        </Link>
      ) : null}
    </div>
  )
}

/** Estado vacío: dice qué hacer, no solo que no hay nada. */
export function Vacio({
  titulo,
  detalle,
  accion,
}: {
  titulo: string
  detalle: string
  accion?: { href: string; texto: string }
}) {
  return (
    <div className="border-t-2 border-tinta pt-6">
      <h3 className="font-titular text-lg font-bold tracking-[-0.02em]">
        {titulo}
      </h3>
      <p className="mt-2 max-w-[56ch] text-sm leading-relaxed opacity-70">
        {detalle}
      </p>
      {accion ? (
        <Link
          href={accion.href}
          className="mt-5 inline-flex min-h-11 items-center rounded-sm bg-senal px-5 text-sm font-semibold text-white transition-colors hover:bg-senal-alta"
        >
          {accion.texto}
        </Link>
      ) : null}
    </div>
  )
}
