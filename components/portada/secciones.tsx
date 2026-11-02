"use client"

import { useRef, type ReactNode, type RefObject } from "react"
import Link from "next/link"
import { ArrowUpRight, CheckCheck, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { CORREO_DE_CONTACTO } from "@/lib/legal"
import { Logo } from "@/components/marca/logo"
import { DOLORES, PREGUNTAS } from "@/components/portada/datos"
import estilos from "@/components/portada/portada.module.css"
import { prepararTrazos, Subrayado } from "@/components/portada/trazos"
import { CON_MOVIMIENTO, gsap, useGSAP } from "@/components/portada/gsap"

/**
 * El movimiento común de las secciones: lo que flota se mece a su ritmo
 * (`js-vaiven`), cada capa sube a su velocidad con el scroll (`js-profundo`
 * con `data-vel`), lo que entra aparece (`js-sube`) y los trazos se dibujan.
 */
function useMovimiento(
  raiz: RefObject<HTMLElement | null>,
  extra?: () => void
) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CON_MOVIMIENTO, () => {
        const q = gsap.utils.selector(raiz)
        // No toda sección tiene trazos: sin ellos, GSAP avisaba en la consola.
        const trazos = prepararTrazos(raiz.current!)
        if (trazos.length) {
          gsap.to(trazos, {
            strokeDashoffset: 0,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.1,
            scrollTrigger: { trigger: raiz.current, start: "top 65%" },
          })
        }
        gsap.from(q(".js-sube"), {
          y: 30,
          opacity: 0,
          duration: 0.9,
          ease: "expo.out",
          stagger: 0.07,
          scrollTrigger: { trigger: raiz.current, start: "top 78%" },
        })
        q(".js-vaiven").forEach((el, i) => {
          gsap.to(el, {
            y: i % 2 ? 12 : -12,
            rotate: i % 2 ? 1.5 : -1.5,
            duration: 2.8 + (i % 4) * 0.5,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          })
        })
        q(".js-profundo").forEach((el) => {
          const vel = Number(el.dataset.vel ?? 1)
          gsap.fromTo(
            el,
            { y: 120 * vel },
            {
              y: -120 * vel,
              ease: "none",
              scrollTrigger: {
                trigger: raiz.current,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          )
        })
        extra?.()
      })
    },
    { scope: raiz }
  )
}

function Rotulo({ children, claro }: { children: ReactNode; claro?: boolean }) {
  return (
    <p
      className={cn(
        "js-sube text-[13px] font-semibold tracking-[0.1em] uppercase",
        claro ? "text-[var(--boli-claro)]" : "text-[var(--boli)]"
      )}
    >
      {children}
    </p>
  )
}

const TITULO_DE_SECCION = "mt-4 text-[clamp(2.1rem,3.6vw,3.3rem)]"

/** Las burbujas de "¿Te pasa esto?": dónde flota cada una y a qué velocidad. */
const BURBUJAS = [
  { className: "top-[2%] left-[4%]", vel: 0.6, giro: -2 },
  { className: "top-[20%] right-[0%]", vel: 1.1, giro: 2 },
  { className: "top-[42%] left-[10%]", vel: 0.8, giro: -1 },
  { className: "top-[62%] right-[6%]", vel: 1.3, giro: 2.5 },
  { className: "bottom-[2%] left-[0%]", vel: 0.9, giro: -2 },
]

export function Dolores() {
  const raiz = useRef<HTMLElement>(null)
  useMovimiento(raiz)

  return (
    <section
      ref={raiz}
      className="mx-auto max-w-[1280px] px-6 pt-16 pb-20 lg:px-10 lg:pt-24 lg:pb-28"
    >
      <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-10">
        <div>
          <Rotulo>¿Te pasa esto?</Rotulo>
          <h2
            className={cn(
              estilos.titular,
              "js-sube max-w-[16ch]",
              TITULO_DE_SECCION
            )}
          >
            Vender por redes funciona.{" "}
            <span className={estilos.resaltado}>
              Organizarlo es lo difícil.
            </span>
          </h2>
          <p className="js-sube mt-7 max-w-[36ch] text-[18px] leading-relaxed text-[var(--tinta)]/65">
            Nada de eso se arregla con una página web más. Se arregla con lo que
            hay detrás de la página.
          </p>
        </div>

        <ul className="relative flex flex-col gap-4 lg:h-[560px] lg:gap-0">
          {DOLORES.map((dolor, i) => (
            <li
              key={dolor}
              className={cn("lg:absolute", BURBUJAS[i].className)}
            >
              <div className="js-profundo" data-vel={BURBUJAS[i].vel}>
                <div
                  className="js-vaiven"
                  style={{ rotate: `${BURBUJAS[i].giro}deg` }}
                >
                  <p className="max-w-[24rem] rounded-[22px] rounded-bl-[6px] border border-[var(--regla)] bg-white px-5 py-3.5 text-[17px] leading-snug font-medium shadow-[0_18px_40px_-20px_rgb(29_28_26/0.35)]">
                    «{dolor}»
                    <span className="mt-1.5 flex items-center justify-end gap-1 text-[12px] font-normal text-[var(--tinta)]/40">
                      21:4{i}{" "}
                      <CheckCheck
                        aria-hidden="true"
                        className="size-3.5 text-[var(--boli)]"
                      />
                    </span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Preguntas() {
  return (
    <section
      id="preguntas"
      className="mx-auto max-w-[1280px] scroll-mt-20 px-6 py-16 lg:px-10 lg:py-24"
    >
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.1em] text-[var(--boli)] uppercase">
            Preguntas
          </p>
          <h2
            className={cn(estilos.titular, "max-w-[16ch]", TITULO_DE_SECCION)}
          >
            Lo que todos nos preguntan primero.
          </h2>
        </div>
        <div className="border-b border-[var(--regla)]">
          {PREGUNTAS.map((pregunta) => (
            <details
              key={pregunta.p}
              className="group border-t border-[var(--regla)] [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[18px] font-semibold">
                {pregunta.p}
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--regla)] transition-[transform,background-color,color] duration-300 group-open:rotate-45 group-open:bg-[var(--boli)] group-open:text-white">
                  <Plus aria-hidden="true" className="size-4" />
                </span>
              </summary>
              <p className="max-w-[64ch] pb-6 text-[16.5px] leading-relaxed text-[var(--tinta)]/65">
                {pregunta.r}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Cierre() {
  const raiz = useRef<HTMLElement>(null)
  useMovimiento(raiz)

  return (
    <footer ref={raiz} className="border-t border-[var(--regla)]">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center px-6 py-20 text-center lg:px-10 lg:py-32">
        <h2
          className={cn(
            estilos.titular,
            "js-sube max-w-[18ch] text-[clamp(2.6rem,5.4vw,5rem)]"
          )}
        >
          Tu tienda online hoy. Tu negocio ordenado{" "}
          <span className="relative inline-block whitespace-nowrap">
            esta semana.
            <Subrayado
              grosor={3}
              className="absolute -bottom-[0.12em] left-0 h-[0.24em] w-full"
            />
          </span>
        </h2>
        <div className="js-sube mt-10 flex flex-col items-center gap-4">
          <Link
            href="/login?modo=registro"
            className={cn(estilos.boton, "min-h-14 px-8 text-base")}
          >
            Crear mi tienda gratis
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
          <p className="text-[14.5px] text-[var(--tinta)]/55">
            Lista en minutos. No pedimos tarjeta.
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-[1280px] border-t border-[var(--regla)] px-6 py-8 lg:px-10">
        <div className="flex flex-col gap-3 text-[14px] text-[var(--tinta)]/60 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8">
          <Logo className="text-lg text-[var(--tinta)]" />
          <span className="whitespace-nowrap sm:flex-1">
            Santa Cruz · La Paz · Cochabamba
          </span>
          <div className="-my-3 flex flex-wrap gap-x-6 sm:gap-x-8">
            <Link
              href="/privacidad"
              className="flex min-h-11 items-center hover:text-[var(--tinta)]"
            >
              Privacidad
            </Link>
            <Link
              href="/terminos"
              className="flex min-h-11 items-center hover:text-[var(--tinta)]"
            >
              Términos
            </Link>
            <a
              href={`mailto:${CORREO_DE_CONTACTO}`}
              className="flex min-h-11 items-center hover:text-[var(--tinta)]"
            >
              {CORREO_DE_CONTACTO}
            </a>
          </div>
        </div>
        <p className="mt-4 text-[12.5px] text-[var(--tinta)]/40">
          Rosa Deportes es una tienda de ejemplo: sus productos, precios, stock
          y pedidos son ilustrativos. Fotos de Pexels.
        </p>
      </div>
    </footer>
  )
}
