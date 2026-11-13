"use client"

import { useRef, type ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight, Clock, Palette, Share2 } from "lucide-react"

import type { Suscripcion } from "@/lib/data/panel"
import { cn } from "@/lib/utils"
import { CompartirTienda } from "@/components/panel/tablero/compartir"
import portada from "@/components/portada/portada.module.css"
import {
  armarCelular,
  EscenaDelCelular,
} from "@/components/panel/resumen/celular"
import { useEscena } from "@/components/panel/resumen/escena"

export interface TiendaDeLaEntrada {
  nombre: string
  slug: string
  url: string
  /** El enlace sin `https://`, armado en el servidor. */
  legible: string
  logoUrl: string | null
  publicada: boolean
  pausada?: boolean
  deVacaciones?: boolean
}

/**
 * La entrada del Resumen: de quién es la tienda, cómo está y qué pasó hoy, al
 * lado de la tienda misma en un celular en 3D que sigue al mouse. Tocar el
 * celular abre el editor. `frase` llega después, cuando la base respondió:
 * lo que se vendió hoy y lo que espera.
 */
export function Entrada({
  persona,
  tienda,
  suscripcion,
  vista,
  frase,
}: {
  persona: string
  tienda: TiendaDeLaEntrada
  suscripcion: Suscripcion | null
  vista: { url: string; real: boolean } | null
  frase: ReactNode
}) {
  const raiz = useRef<HTMLElement>(null)
  const primerNombre = persona.trim().split(/\s+/)[0]

  useEscena(raiz, armarCelular)

  const alAire = tienda.publicada && !tienda.pausada
  const estado = tienda.pausada
    ? "Pausada"
    : !tienda.publicada
      ? "Borrador"
      : tienda.deVacaciones
        ? "De vacaciones"
        : "Publicada"
  const prueba =
    suscripcion?.status === "prueba" && suscripcion.diasRestantes !== null
      ? suscripcion
      : null

  return (
    <section
      ref={raiz}
      data-escena
      aria-label="Tu tienda"
      className="grid items-center gap-8 pt-2 pb-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6 lg:pt-4 lg:pb-16"
    >
      <div className="min-w-0">
        {primerNombre ? (
          <p className="js-sube text-[12.5px] font-semibold tracking-[0.12em] text-[var(--boli)] uppercase">
            Hola, {primerNombre}
          </p>
        ) : null}
        <h1
          className={cn(
            portada.titular,
            "js-sube mt-3 text-[clamp(2.6rem,7vw,5.2rem)] leading-[0.95] text-balance"
          )}
          style={{ fontStretch: "108%" }}
        >
          {tienda.nombre}
        </h1>

        <div className="js-sube mt-5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex min-h-9 items-center gap-2 rounded-full border bg-hoja px-3.5 text-[14px] font-semibold",
              alAire
                ? "border-[var(--regla)]"
                : "border-[var(--boli)] text-[var(--boli)]"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                alAire && !tienda.deVacaciones
                  ? "bg-[#1fa855]"
                  : "bg-[var(--boli)]"
              )}
            />
            {estado}
          </span>
          {prueba && prueba.diasRestantes !== null ? (
            <span
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-full border bg-hoja px-3.5 text-[14px] font-semibold",
                prueba.porVencer
                  ? "border-[var(--boli)] text-[var(--boli)]"
                  : "border-[var(--regla)]"
              )}
            >
              <Clock aria-hidden="true" className="size-3.5" />
              {prueba.diasRestantes <= 0
                ? "Tu prueba vence hoy"
                : `Prueba · ${prueba.diasRestantes} ${prueba.diasRestantes === 1 ? "día" : "días"}`}
            </span>
          ) : null}
        </div>

        <p className="js-sube mt-6 max-w-[34ch] text-[clamp(1.15rem,2.2vw,1.4rem)] leading-snug font-medium text-[var(--tinta)]/80">
          {frase}
        </p>

        <div className="js-sube mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
          <CompartirTienda
            nombre={tienda.nombre}
            slug={tienda.slug}
            url={tienda.url}
            legible={tienda.legible}
          >
            <button
              type="button"
              className={cn(
                portada.boton,
                "max-sm:w-full max-sm:justify-center"
              )}
            >
              <Share2 aria-hidden="true" className="size-4" />
              Compartir tu tienda
            </button>
          </CompartirTienda>
          <a
            href={tienda.url}
            target="_blank"
            rel="noreferrer noopener"
            className={portada.enlace}
          >
            Ver tienda
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
          <Link href="/editor" className={portada.enlace}>
            <Palette aria-hidden="true" className="size-4" />
            Editar
          </Link>
        </div>
      </div>

      <EscenaDelCelular
        tienda={tienda}
        vista={vista}
        destino="/editor"
        etiqueta="Editar tu tienda"
        nota="así la ven tus clientes"
      />
    </section>
  )
}
