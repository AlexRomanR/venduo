"use client"

import { useRef } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { PLANTILLAS, type ClavePlantilla } from "@/lib/plantillas"
import { producto } from "@/components/portada/datos"
import estilos from "@/components/portada/portada.module.css"
import {
  capaDelFundido,
  useAnterior,
  useRotacion,
} from "@/components/portada/rotacion"
import { CON_MOVIMIENTO, gsap, useGSAP } from "@/components/portada/gsap"

/**
 * Cada rubro con la plantilla que la galería le ofrece primero y los
 * productos que lo representan. Los rubros de la galería son Moda, Belleza y
 * Variedades; acá se nombran como los dice quien vende.
 */
const RUBROS: {
  nombre: string
  plantilla: ClavePlantilla
  productos: string[]
}[] = [
  {
    nombre: "Ropa y calzado",
    plantilla: "fashion",
    productos: ["chamarra", "zapatillas"],
  },
  {
    nombre: "Belleza y maquillaje",
    plantilla: "tocador",
    productos: ["labial", "perfume"],
  },
  {
    nombre: "Perfumes",
    plantilla: "perfume",
    productos: ["perfume", "labial"],
  },
  {
    nombre: "Accesorios y joyas",
    plantilla: "quilate",
    productos: ["cartera", "labial"],
  },
  {
    nombre: "Celulares y tecnología",
    plantilla: "bazar",
    productos: ["audifonos", "cartera"],
  },
  {
    nombre: "Deporte",
    plantilla: "pisada",
    productos: ["zapatillas", "chamarra"],
  },
  {
    nombre: "Regalos y variedades",
    plantilla: "bazar",
    productos: ["perfume", "audifonos"],
  },
]

/** Dónde flotan los dos productos de cada rubro. */
const LUGARES = [
  "top-[10%] -left-[46%] w-[110px] -rotate-12 lg:-left-[62%] lg:w-[210px]",
  "bottom-[8%] -right-[42%] w-[100px] rotate-[10deg] lg:-right-[56%] lg:w-[190px]",
]

/**
 * "Para quién es", interactivo: tocas tu rubro y ves la plantilla que le
 * corresponde, en el celular, con sus productos alrededor. Los rubros rotan
 * solos mientras la sección está a la vista.
 */
export function ParaQuien() {
  const raiz = useRef<HTMLElement>(null)
  const { actual, elegir } = useRotacion(raiz, RUBROS.length, 5000)
  const rubro = RUBROS[actual]
  const anterior = useAnterior(actual)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CON_MOVIMIENTO, () => {
        gsap.from(raiz.current!.querySelectorAll(".js-sube"), {
          y: 30,
          opacity: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.07,
          scrollTrigger: { trigger: raiz.current, start: "top 78%" },
        })
        gsap.to(raiz.current!.querySelectorAll(".js-vaiven"), {
          y: -12,
          duration: 3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          stagger: 0.8,
        })
      })
    },
    { scope: raiz }
  )

  useGSAP(
    () => {
      if (!window.matchMedia(CON_MOVIMIENTO).matches) return
      gsap.fromTo(
        raiz.current!.querySelectorAll(".js-producto-rubro"),
        { scale: 0.5, opacity: 0, y: 30 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.6)",
          stagger: 0.1,
        }
      )
      gsap.fromTo(
        raiz.current!.querySelectorAll(".js-nombre-plantilla"),
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "expo.out" }
      )
    },
    { scope: raiz, dependencies: [actual] }
  )

  return (
    <section
      ref={raiz}
      className="overflow-x-clip border-t border-[var(--regla)]"
    >
      <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-16 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-10 lg:px-10 lg:py-24">
        <div>
          <p className="js-sube text-[13px] font-semibold tracking-[0.1em] text-[var(--boli)] uppercase">
            Para quién es
          </p>
          <h2
            className={cn(
              estilos.titular,
              "js-sube mt-4 max-w-[17ch] text-[clamp(2.1rem,3.6vw,3.3rem)]"
            )}
          >
            Para quien ya vende, y quiere vender ordenado.
          </h2>
          <p className="js-sube mt-6 max-w-[50ch] text-[18px] leading-relaxed text-[var(--tinta)]/65">
            Si tus clientes te encuentran en TikTok, Instagram, Facebook o
            WhatsApp, Venduo es para ti. Empiezas con lo que ya tienes: las
            fotos de tu celular y tus precios.
          </p>
          <p className="js-sube mt-8 text-[14px] text-[var(--tinta)]/50">
            ¿Qué vendes? Toca tu rubro.
          </p>
          <div
            role="radiogroup"
            aria-label="Rubro"
            className="js-sube mt-3 grid max-w-[34rem] grid-cols-2 gap-2"
          >
            {RUBROS.map((r, i) => (
              <button
                key={r.nombre}
                type="button"
                role="radio"
                aria-checked={i === actual}
                onClick={() => elegir(i)}
                className={cn(
                  "rounded-full border px-2 py-2.5 text-center text-[13px] font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-300 min-[400px]:px-3 min-[400px]:text-[14.5px]",
                  // Siete rubros en dos columnas: el último cierra el bloque a lo ancho.
                  i === RUBROS.length - 1 &&
                    RUBROS.length % 2 === 1 &&
                    "col-span-2",
                  i === actual
                    ? "border-[var(--tinta)] bg-[var(--tinta)] text-white"
                    : "border-[var(--regla)] bg-white hover:border-[var(--tinta)]/30"
                )}
              >
                {r.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mx-auto mb-12 w-[220px] lg:mb-0 lg:w-[300px]">
          <div className="js-vaiven relative aspect-[1/2] w-full rounded-[2.4rem] bg-[#121215] p-[3.4%] shadow-[0_50px_90px_-40px_rgb(29_28_26/0.6)]">
            <div className="relative h-full overflow-hidden rounded-[2rem] bg-white">
              {RUBROS.map((r, i) => (
                <Image
                  key={r.nombre}
                  src={`/plantillas/celular/${r.plantilla}.webp`}
                  alt={
                    i === actual
                      ? `La plantilla ${PLANTILLAS[r.plantilla].nombre}`
                      : ""
                  }
                  fill
                  sizes="300px"
                  className={cn(
                    "object-cover object-top",
                    capaDelFundido(i, actual, anterior)
                  )}
                />
              ))}
              <span className="absolute top-[1.6%] left-1/2 h-[3%] w-[30%] -translate-x-1/2 rounded-full bg-[#121215]" />
            </div>
          </div>

          {rubro.productos.map((clave, i) => {
            const p = producto(clave)
            return (
              <div
                key={`${actual}-${clave}`}
                className={cn(
                  "js-producto-rubro pointer-events-none absolute",
                  LUGARES[i]
                )}
              >
                <Image
                  src={p.foto}
                  alt=""
                  width={p.ancho}
                  height={p.alto}
                  sizes="230px"
                  className={cn(estilos.producto, "h-auto w-full")}
                />
              </div>
            )
          })}

          <p className="js-nombre-plantilla absolute -bottom-12 left-1/2 w-max -translate-x-1/2 rounded-full border border-[var(--regla)] bg-white px-4 py-2 text-[14px] shadow-[0_14px_30px_-16px_rgb(29_28_26/0.45)]">
            Plantilla{" "}
            <span className="font-semibold">
              {PLANTILLAS[rubro.plantilla].nombre}
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
