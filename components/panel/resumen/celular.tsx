"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Globe, Palette, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Flecha } from "@/components/portada/trazos"
import portada from "@/components/portada/portada.module.css"
import { CON_MOVIMIENTO, gsap } from "@/components/portada/gsap"
import { entra, type Piezas } from "@/components/panel/resumen/escena"
import { Mano } from "@/components/panel/resumen/piezas"
import estilos from "@/components/panel/resumen/resumen.module.css"

/** Lo que el celular necesita de la tienda. */
export interface TiendaDelCelular {
  nombre: string
  /** El enlace sin `https://`. */
  legible: string
  logoUrl: string | null
}

/**
 * El movimiento del celular, para sumar a la escena que lo lleva: entra
 * girando, lo que flota se estampa, y en una pantalla con mouse el celular
 * sigue al puntero y cada capa se corre según su profundidad.
 */
export function armarCelular(tl: gsap.core.Timeline, piezas: Piezas) {
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
}

/**
 * La tienda en un celular en 3D, con su enlace flotando, su logo como una
 * calcomanía y una nota a mano que lo señala. La usan la entrada del Resumen
 * y el final del alta. Tocarlo lleva a `destino`.
 */
export function EscenaDelCelular({
  tienda,
  vista,
  enVivo,
  destino,
  externo = false,
  etiqueta,
  icono: Icono = Palette,
  nota,
}: {
  tienda: TiendaDelCelular
  /** La captura de la tienda, o la de su plantilla si todavía no hay (`real`). */
  vista: { url: string; real: boolean } | null
  /** La tienda de verdad, dibujada encima de la captura cuando carga. */
  enVivo?: string
  destino: string
  /** El destino se abre en otra pestaña. */
  externo?: boolean
  /** Lo que aparece al pasar el puntero, y el nombre del enlace. */
  etiqueta: string
  icono?: LucideIcon
  nota: string
}) {
  const iniciales = tienda.nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join("")
    .toUpperCase()

  const contenido = (
    <>
      <Celular vista={vista} enVivo={enVivo} />
      <span className="absolute inset-x-0 bottom-[7%] flex justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--tinta)] px-3.5 py-2 text-[13px] font-semibold text-white shadow-lg">
          <Icono aria-hidden="true" className="size-3.5" />
          {etiqueta}
        </span>
      </span>
    </>
  )

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
            {nota}
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
              {externo ? (
                <a
                  href={destino}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`${etiqueta}: ${tienda.nombre}`}
                  className="group relative block"
                >
                  {contenido}
                </a>
              ) : (
                <Link
                  href={destino}
                  aria-label={`${etiqueta}: ${tienda.nombre}`}
                  className="group relative block"
                >
                  {contenido}
                </Link>
              )}
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

/** El ancho al que se dibuja la tienda en vivo: el de un celular de verdad. */
const ANCHO_DE_CELULAR = 390

/**
 * La portada de la tienda en un celular: la captura real que saca la web, o
 * su plantilla mientras no la haya, y lo dice. Con `enVivo`, la tienda de
 * verdad se dibuja encima a 390 px —el ancho para el que están hechas las
 * plantillas— y se achica a la pantalla; mientras carga, se ve la captura.
 */
function Celular({
  vista,
  enVivo,
}: {
  vista: { url: string; real: boolean } | null
  enVivo?: string
}) {
  const pantalla = React.useRef<HTMLSpanElement>(null)
  const [escala, setEscala] = React.useState(0)
  const [cargada, setCargada] = React.useState(false)

  React.useEffect(() => {
    const nodo = pantalla.current
    if (!enVivo || !nodo) return
    const medir = () => setEscala(nodo.clientWidth / ANCHO_DE_CELULAR)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [enVivo])

  return (
    <span className="relative block aspect-[9/19.2] h-[340px] rounded-[14%/6.6%] bg-[#050506] p-[3.2%] shadow-[0_40px_100px_-30px_rgb(29_28_26/0.45),0_0_0_1px_rgb(236_232_225/0.12)] lg:h-[470px]">
      <span
        ref={pantalla}
        className="relative block h-full overflow-hidden rounded-[11%/5.2%] bg-[var(--papel)]"
      >
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
        {vista && !vista.real && !cargada ? (
          <span className="absolute inset-x-0 bottom-0 bg-[var(--tinta)]/85 py-1.5 text-center text-xs text-white">
            Tu plantilla
          </span>
        ) : null}
        {enVivo && escala > 0 ? (
          <iframe
            src={enVivo}
            title=""
            aria-hidden="true"
            tabIndex={-1}
            loading="eager"
            onLoad={() => setCargada(true)}
            className={cn(
              "pointer-events-none absolute top-0 left-0 origin-top-left border-0 bg-[var(--papel)] transition-opacity duration-500 motion-reduce:transition-none",
              cargada ? "opacity-100" : "opacity-0"
            )}
            style={{
              width: ANCHO_DE_CELULAR,
              height: `${100 / escala}%`,
              transform: `scale(${escala})`,
            }}
          />
        ) : null}
        <span
          aria-hidden="true"
          className="absolute top-[1.6%] left-1/2 h-[3.2%] w-[30%] -translate-x-1/2 rounded-full bg-black"
        />
      </span>
    </span>
  )
}
