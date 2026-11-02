"use client"

import { useRef } from "react"
import Link from "next/link"
import {
  ArrowRight,
  PackageMinus,
  PackageX,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react"

import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Circulo, Visto } from "@/components/portada/trazos"
import portada from "@/components/portada/portada.module.css"
import { entra, contar, useEscena } from "@/components/panel/resumen/escena"
import {
  BAJADA,
  Mano,
  Rotulo,
  TITULAR,
} from "@/components/panel/resumen/piezas"
import estilos from "@/components/panel/resumen/resumen.module.css"

/** Lo que impide vender, dicho como lo que hay que hacer. */
export interface Pendiente {
  texto: string
  href: string
}

/** Algo que espera, contado. */
export interface Espera {
  clave: "cobrar" | "agotado" | "poco"
  valor: number
  etiqueta: string
  href: string
  /** Frena una venta o un cobro: va en el bolígrafo y se encierra. */
  urgente: boolean
}

const ICONOS: Record<Espera["clave"], LucideIcon> = {
  cobrar: ShoppingBag,
  agotado: PackageX,
  poco: PackageMinus,
}

const GIROS = ["-2.5deg", "1.8deg", "-1.2deg"]

/**
 * Lo que espera algo de la tienda: lo que impide vender, como renglones de un
 * cuaderno, y lo que espera contado, en notas pegadas que se tocan y llevan a
 * la lista ya filtrada. Lo que está en cero no aparece; si no queda nada, la
 * escena lo festeja con un visto a mano.
 */
export function ParaHoy({
  pendientes,
  esperas,
}: {
  pendientes: Pendiente[]
  esperas: Espera[]
}) {
  const raiz = useRef<HTMLElement>(null)
  const conAlgo = esperas.filter((espera) => espera.valor > 0)
  const alDia = pendientes.length === 0 && conAlgo.length === 0

  useEscena(raiz, (tl, piezas) => {
    entra(
      tl,
      piezas(".js-renglon"),
      { x: -30, autoAlpha: 0, duration: 0.6, ease: "power3.out", stagger: 0.1 },
      0.2
    )
    entra(
      tl,
      piezas(".js-nota"),
      {
        y: 70,
        rotate: (i) => (i % 2 ? 14 : -12),
        scale: 0.85,
        autoAlpha: 0,
        duration: 1,
        ease: "elastic.out(1, 0.7)",
        stagger: 0.14,
      },
      0.3
    )
    piezas(".js-cifra").forEach((pieza, i) => {
      contar(
        tl,
        pieza,
        Number(pieza.dataset.valor),
        formatNumber,
        0.45 + i * 0.14
      )
    })
  })

  return (
    <section
      ref={raiz}
      data-escena
      id="para-hoy"
      aria-labelledby="titulo-para-hoy"
      className="grid gap-10 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-12 lg:py-20"
    >
      <div>
        <Rotulo>Para hoy</Rotulo>
        {alDia ? (
          <>
            <h2 id="titulo-para-hoy" className={TITULAR}>
              Estás{" "}
              <span className="relative inline-block whitespace-nowrap">
                al día.
                <Visto className="absolute -top-3 -right-11 h-9 w-11" />
              </span>
            </h2>
            <p className={BAJADA}>
              Nada espera por ti. Buen momento para compartir tu tienda donde
              vendes.
            </p>
          </>
        ) : (
          <>
            <h2 id="titulo-para-hoy" className={TITULAR}>
              Esto te espera <span className={portada.resaltado}>hoy.</span>
            </h2>
            <p className={BAJADA}>
              Toca cada nota y vas directo a lo que hay que atender.
            </p>
          </>
        )}
      </div>

      {alDia ? null : (
        <div className="flex min-w-0 flex-col gap-6">
          {pendientes.length > 0 ? (
            <ul
              className={cn(
                estilos.renglones,
                estilos.nota,
                "rounded-[20px] px-5 pt-3 pb-2"
              )}
            >
              <li className="js-renglon">
                <Mano className="text-[17px] leading-[2.25rem] text-[var(--tinta)]/50">
                  antes de vender:
                </Mano>
              </li>
              {pendientes.map((pendiente) => (
                <li key={pendiente.texto} className="js-renglon">
                  <Link
                    href={pendiente.href}
                    className="group flex min-h-[2.25rem] items-center gap-3 text-[17px] font-semibold text-[var(--boli)]"
                  >
                    <span
                      aria-hidden="true"
                      className="size-4 shrink-0 rounded-[4px] border-2 border-current"
                    />
                    <span className="flex-1">{pendiente.texto}</span>
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {conAlgo.length > 0 ? (
            <ul
              className="grid gap-3 sm:gap-5"
              style={{
                gridTemplateColumns: `repeat(${conAlgo.length}, minmax(0, 1fr))`,
              }}
            >
              {conAlgo.map((espera, i) => {
                const Icono = ICONOS[espera.clave]
                return (
                  <li key={espera.clave} className="js-nota">
                    <Link
                      href={espera.href}
                      aria-label={`${espera.valor} ${espera.etiqueta}`}
                      style={{ rotate: GIROS[i % GIROS.length] }}
                      className={cn(
                        estilos.nota,
                        "group relative flex h-full min-h-[9.5rem] flex-col justify-between rounded-[18px] p-3.5 transition-[rotate,translate,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:rotate-0 sm:min-h-[11rem] sm:p-5"
                      )}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <Icono
                          aria-hidden="true"
                          className={cn(
                            "size-5 sm:size-6",
                            espera.urgente
                              ? "text-[var(--boli)]"
                              : "text-[var(--tinta)]/45"
                          )}
                        />
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 -translate-x-1 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                        />
                      </span>
                      <span>
                        <span className="relative inline-block">
                          <span
                            data-valor={espera.valor}
                            className={cn(
                              portada.titular,
                              portada.cifras,
                              "js-cifra relative z-10 block text-[clamp(2.6rem,8vw,4.2rem)] leading-none",
                              espera.urgente && "text-[var(--boli)]"
                            )}
                          >
                            {formatNumber(espera.valor)}
                          </span>
                          {espera.urgente ? (
                            <Circulo className="absolute -top-3 -left-4 h-[calc(100%+1.5rem)] w-[calc(100%+2.75rem)]" />
                          ) : null}
                        </span>
                        <span className="mt-2 block text-[13.5px] leading-tight font-semibold sm:text-[15px]">
                          {espera.etiqueta}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      )}
    </section>
  )
}
