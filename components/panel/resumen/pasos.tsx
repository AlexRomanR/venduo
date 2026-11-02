"use client"

import { useRef, type ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { Tablero } from "@/lib/tablero"
import { cn } from "@/lib/utils"
import { CompartirTienda } from "@/components/panel/tablero/compartir"
import { Subrayado, Tachon, Visto } from "@/components/portada/trazos"
import portada from "@/components/portada/portada.module.css"
import { entra, useEscena } from "@/components/panel/resumen/escena"
import {
  BAJADA,
  Mano,
  Rotulo,
  TITULAR,
} from "@/components/panel/resumen/piezas"

const BOTON_DEL_PASO = cn(portada.boton, "min-h-11 px-5 text-[14.5px]")

interface Paso {
  hecho: boolean
  titulo: string
  detalle: string
  accion: ReactNode
}

/**
 * Lo que le falta a una tienda nueva para vender, como una lista que se va
 * tachando. Cada paso se cumple con los datos —un producto cargado, un pedido
 * recibido— y no con un clic. Se va sola cuando todo está hecho.
 */
export function PrimerosPasos({
  pasos,
  tienda,
}: {
  pasos: Tablero["pasos"]
  tienda: { nombre: string; slug: string; url: string; legible: string }
}) {
  const raiz = useRef<HTMLElement>(null)

  useEscena(raiz, (tl, piezas) => {
    entra(
      tl,
      piezas(".js-paso"),
      { y: 40, autoAlpha: 0, duration: 0.8, ease: "expo.out", stagger: 0.15 },
      0.2
    )
    const tachones = piezas(".js-tachon")
    for (const tachon of tachones) {
      tachon.style.strokeDasharray = "1"
      tachon.style.strokeDashoffset = "1"
    }
    if (tachones.length) {
      tl.to(
        tachones,
        {
          strokeDashoffset: 0,
          duration: 0.5,
          ease: "power2.inOut",
          stagger: 0.2,
        },
        0.9
      )
    }
  })

  const lista: Paso[] = [
    {
      hecho: pasos.producto,
      titulo: "Carga tu primer producto",
      detalle: "Una foto, un precio y cuántos tienes.",
      accion: (
        <Link href="/panel/productos/nuevo" className={BOTON_DEL_PASO}>
          Cargar producto
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ),
    },
    {
      hecho: pasos.estilo,
      titulo: "Dale tu estilo a la tienda",
      detalle: "Tus colores, tu logo y tus textos.",
      accion: (
        <Link href="/editor" className={BOTON_DEL_PASO}>
          Abrir el editor
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ),
    },
    {
      hecho: pasos.primerPedido,
      titulo: "Recibe tu primer pedido",
      detalle: "Comparte el enlace donde ya vendes.",
      accion: (
        <CompartirTienda {...tienda}>
          <button type="button" className={BOTON_DEL_PASO}>
            Compartir tu tienda
          </button>
        </CompartirTienda>
      ),
    },
  ]

  const hechos = lista.filter((paso) => paso.hecho).length
  if (hechos === lista.length) return null
  const faltan = lista.length - hechos

  return (
    <section
      ref={raiz}
      data-escena
      id="primeros-pasos"
      aria-labelledby="titulo-primeros-pasos"
      className="grid gap-10 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 lg:py-20"
    >
      <div>
        <Rotulo>Primeros pasos</Rotulo>
        <h2 id="titulo-primeros-pasos" className={TITULAR}>
          {faltan === 1 ? "Te falta " : "Te faltan "}
          <span className="relative inline-block whitespace-nowrap">
            {faltan === 1 ? "un paso" : `${faltan} pasos`}
            <Subrayado className="absolute -bottom-[0.14em] left-0 h-[0.24em] w-full" />
          </span>{" "}
          para vender.
        </h2>
        <p className={BAJADA}>
          Se tachan solos cuando los haces: no hay nada que marcar.
        </p>
        <Mano className="js-sube mt-6 text-[22px]">
          {hechos} de {lista.length} listos
        </Mano>
      </div>

      <ol className="flex flex-col">
        {lista.map((paso, indice) => (
          <li
            key={paso.titulo}
            className="js-paso grid grid-cols-[auto_1fr] gap-x-5 border-t border-[var(--regla)] py-6 last:border-b"
          >
            <span
              aria-hidden="true"
              className={cn(
                portada.titular,
                portada.cifras,
                "relative text-[clamp(2.6rem,5vw,3.6rem)] leading-none",
                paso.hecho
                  ? "text-[var(--tinta)]/25"
                  : "text-transparent [-webkit-text-stroke:1.5px_var(--tinta)]"
              )}
            >
              {String(indice + 1).padStart(2, "0")}
              {paso.hecho ? (
                <Visto className="absolute -top-1 -right-5 h-8 w-10" />
              ) : null}
            </span>
            <div className="min-w-0 self-center">
              <p
                className={cn(
                  "relative inline-block text-[19px] leading-snug font-semibold",
                  paso.hecho && "text-[var(--tinta)]/45"
                )}
              >
                {paso.titulo}
                {paso.hecho ? (
                  <>
                    <span className="sr-only"> (hecho)</span>
                    <Tachon className="absolute top-1/2 -left-1 h-3 w-[calc(100%+0.5rem)] -translate-y-1/2" />
                  </>
                ) : null}
              </p>
              {paso.hecho ? null : (
                <>
                  <p className="mt-1 text-[15px] text-[var(--tinta)]/60">
                    {paso.detalle}
                  </p>
                  <div className="mt-4">{paso.accion}</div>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
