"use client"

import { useRef, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Clock, Globe, Palette, Share2 } from "lucide-react"

import type { Suscripcion } from "@/lib/data/panel"
import { cn } from "@/lib/utils"
import { CompartirTienda } from "@/components/panel/tablero/compartir"
import { Flecha } from "@/components/portada/trazos"
import portada from "@/components/portada/portada.module.css"
import { CON_MOVIMIENTO, gsap } from "@/components/portada/gsap"
import { entra, useEscena } from "@/components/panel/resumen/escena"
import { Mano } from "@/components/panel/resumen/piezas"
import estilos from "@/components/panel/resumen/resumen.module.css"

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

  useEscena(raiz, (tl, piezas) => {
    const celular = piezas(".js-celular")[0]
    if (celular) {
      tl.from(
        celular,
        {
          rotateY: -55,
          rotateX: 18,
          y: 90,
          autoAlpha: 0,
          duration: 1.4,
          ease: "expo.out",
        },
        0.1
      )
    }
    entra(
      tl,
      piezas(".js-flota"),
      {
        scale: 0.4,
        autoAlpha: 0,
        duration: 0.8,
        ease: "back.out(1.8)",
        stagger: 0.12,
      },
      0.55
    )

    // El mouse inclina el celular y corre cada capa según su profundidad.
    if (!window.matchMedia("(pointer: fine)").matches || !celular) return
    const inclina = piezas(".js-inclina")[0]
    const inclinarX = gsap.quickTo(inclina, "rotationX", {
      duration: 0.9,
      ease: "power3.out",
    })
    const inclinarY = gsap.quickTo(inclina, "rotationY", {
      duration: 0.9,
      ease: "power3.out",
    })
    const capas = piezas(".js-capa").map((pieza) => {
      const z = Number(pieza.dataset.z ?? 1)
      return {
        z,
        x: gsap.quickTo(pieza, "x", { duration: 1.1, ease: "power3.out" }),
        y: gsap.quickTo(pieza, "y", { duration: 1.1, ease: "power3.out" }),
      }
    })
    const mover = (evento: PointerEvent) => {
      if (!window.matchMedia(CON_MOVIMIENTO).matches) return
      const dx = evento.clientX / window.innerWidth - 0.5
      const dy = evento.clientY / window.innerHeight - 0.5
      inclinarY(dx * 22)
      inclinarX(-dy * 14)
      for (const capa of capas) {
        capa.x(dx * 36 * capa.z)
        capa.y(dy * 26 * capa.z)
      }
    }
    window.addEventListener("pointermove", mover)
    return () => window.removeEventListener("pointermove", mover)
  })

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
              "inline-flex min-h-9 items-center gap-2 rounded-full border bg-white px-3.5 text-[14px] font-semibold",
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
                "inline-flex min-h-9 items-center gap-2 rounded-full border bg-white px-3.5 text-[14px] font-semibold",
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

      <EscenaDelCelular tienda={tienda} vista={vista} />
    </section>
  )
}

function EscenaDelCelular({
  tienda,
  vista,
}: {
  tienda: TiendaDeLaEntrada
  vista: { url: string; real: boolean } | null
}) {
  const iniciales = tienda.nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join("")
    .toUpperCase()

  return (
    <div className="relative mx-auto h-[400px] w-full max-w-[420px] [perspective:1500px] lg:h-[540px]">
      {/* El enlace de la tienda, flotando arriba. */}
      <div className="js-flota absolute top-[6%] -left-[30%] z-20 max-lg:hidden">
        <div className="js-capa" data-z="1.6">
          <div className="js-vaiven" style={{ rotate: "-3deg" }}>
            <span
              className={cn(
                estilos.nota,
                "flex max-w-[15rem] items-center gap-2 rounded-full py-2 pr-4 pl-2.5 text-[13.5px] font-semibold"
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--tinta)] text-white">
                <Globe aria-hidden="true" className="size-3.5" />
              </span>
              <span className="truncate">{tienda.legible}</span>
            </span>
          </div>
        </div>
      </div>

      {/* El logo de la tienda, como una calcomanía. */}
      <div className="js-flota absolute top-[16%] right-[2%] z-20 lg:-right-[4%]">
        <div className="js-capa" data-z="2.2">
          <div className="js-vaiven" style={{ rotate: "8deg" }}>
            <span
              className={cn(
                estilos.nota,
                "relative flex size-[72px] items-center justify-center overflow-hidden rounded-full border-[3px] border-white lg:size-[88px]"
              )}
            >
              {tienda.logoUrl ? (
                <Image
                  src={tienda.logoUrl}
                  alt=""
                  fill
                  sizes="88px"
                  className="object-cover"
                />
              ) : (
                <span
                  className={cn(
                    portada.titular,
                    "text-[26px] text-[var(--boli)]"
                  )}
                >
                  {iniciales}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* La nota a mano que señala el celular. */}
      <div className="js-flota absolute bottom-[8%] left-0 z-20 lg:-left-[10%]">
        <div className="js-capa" data-z="1.2">
          <Mano className="max-w-[9rem] -rotate-6 text-[20px] leading-tight">
            así la ven tus clientes
          </Mano>
          <Flecha className="mt-1 ml-10 h-9 w-16 -scale-y-100 rotate-[-20deg]" />
        </div>
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center [transform-style:preserve-3d]">
        <div
          className="js-celular [transform-style:preserve-3d]"
          style={{ transform: "rotateY(-18deg) rotateX(7deg) rotateZ(-3deg)" }}
        >
          <div className="js-inclina [transform-style:preserve-3d]">
            <div className="js-vaiven relative [transform-style:preserve-3d]">
              <span
                aria-hidden="true"
                className="absolute inset-0 [transform:translateZ(-14px)] rounded-[14%/6.6%] bg-[#2a2a2e]"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 [transform:translateZ(-7px)] rounded-[14%/6.6%] bg-[#3a3a40]"
              />
              <Link
                href="/editor"
                aria-label={`Editar ${tienda.nombre}`}
                className="group relative block"
              >
                <Celular vista={vista} />
                <span className="absolute inset-x-0 bottom-[7%] flex justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--tinta)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-lg">
                    <Palette aria-hidden="true" className="size-3.5" />
                    Editar tu tienda
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute -bottom-2 left-1/2 h-10 w-[60%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(29_28_26/0.22),transparent)] blur-md"
      />
    </div>
  )
}

/**
 * La portada de la tienda en un celular: la captura real que saca la web, o
 * su plantilla mientras no la haya, y lo dice.
 */
function Celular({ vista }: { vista: { url: string; real: boolean } | null }) {
  return (
    <span className="relative block aspect-[9/19.2] h-[340px] rounded-[14%/6.6%] bg-[#050506] p-[3.2%] shadow-[0_40px_100px_-30px_rgb(29_28_26/0.45),0_0_0_1px_rgb(236_232_225/0.12)] lg:h-[470px]">
      <span className="relative block h-full overflow-hidden rounded-[11%/5.2%] bg-[var(--papel)]">
        {vista ? (
          <Image
            src={vista.url}
            alt=""
            fill
            sizes="230px"
            priority
            className="object-cover object-top"
          />
        ) : null}
        {vista && !vista.real ? (
          <span className="absolute inset-x-0 bottom-0 bg-[var(--tinta)]/85 py-1.5 text-center text-[11px] text-white">
            Tu plantilla
          </span>
        ) : null}
        <span
          aria-hidden="true"
          className="absolute top-[1.6%] left-1/2 h-[3.2%] w-[30%] -translate-x-1/2 rounded-full bg-black"
        />
      </span>
    </span>
  )
}
