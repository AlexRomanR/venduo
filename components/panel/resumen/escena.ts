"use client"

import type { RefObject } from "react"

import {
  CON_MOVIMIENTO,
  gsap,
  ScrollTrigger,
  useGSAP,
} from "@/components/portada/gsap"
import { prepararTrazos } from "@/components/portada/trazos"

/** Las piezas de una escena, sin las de otra escena metida adentro. */
export type Piezas = (selector: string) => HTMLElement[]

/**
 * El movimiento de cada escena del Resumen, el mismo de la portada: lo que
 * entra sube (`js-sube`), los trazos a mano se dibujan, lo que flota se mece
 * (`js-vaiven`) y cada capa sube a su velocidad con el scroll (`js-profundo`
 * con `data-vel`).
 *
 * La escena corre cuando aparece y vuelve al principio cuando sale entera de
 * la pantalla: al volver, se arma otra vez. `armar` suma lo propio de cada
 * una a la misma línea de tiempo. La raíz lleva `data-escena`, así una escena
 * metida en otra no se anima dos veces.
 *
 * Sin movimiento pedido no corre nada y todo se ve quieto, en su lugar.
 */
export function useEscena(
  raiz: RefObject<HTMLElement | null>,
  armar?: (tl: gsap.core.Timeline, piezas: Piezas) => void | (() => void),
  dependencias: unknown[] = []
) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(CON_MOVIMIENTO, () => {
        const el = raiz.current
        if (!el) return
        const q = gsap.utils.selector(el)
        const piezas: Piezas = (selector) =>
          (q(selector) as HTMLElement[]).filter(
            (pieza) => pieza.closest("[data-escena]") === el
          )

        const tl = gsap.timeline({ paused: true })
        const sube = piezas(".js-sube")
        if (sube.length) {
          tl.from(
            sube,
            {
              y: 28,
              autoAlpha: 0,
              duration: 0.9,
              ease: "expo.out",
              stagger: 0.07,
            },
            0
          )
        }
        const trazos = prepararTrazos(el).filter(
          (trazo) => trazo.closest("[data-escena]") === el
        )
        if (trazos.length) {
          tl.to(
            trazos,
            {
              strokeDashoffset: 0,
              duration: 0.8,
              ease: "power2.out",
              stagger: 0.14,
            },
            0.55
          )
        }
        const limpiar = armar?.(tl, piezas)

        piezas(".js-vaiven").forEach((pieza, i) => {
          gsap.to(pieza, {
            y: i % 2 ? 9 : -9,
            rotate: i % 2 ? 1.4 : -1.4,
            duration: 2.8 + (i % 4) * 0.5,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          })
        })
        piezas(".js-profundo").forEach((pieza) => {
          const vel = Number(pieza.dataset.vel ?? 1)
          gsap.fromTo(
            pieza,
            { y: 50 * vel },
            {
              y: -50 * vel,
              ease: "none",
              scrollTrigger: {
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          )
        })

        // Corre al aparecer, desde el principio cada vez.
        ScrollTrigger.create({
          trigger: el,
          start: "top 82%",
          onEnter: () => void tl.restart(),
          onEnterBack: () => void tl.restart(),
        })
        // Y vuelve al principio cuando ya no se ve nada de ella.
        ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          onLeave: () => void tl.pause(0),
          onLeaveBack: () => void tl.pause(0),
        })

        return limpiar
      })
    },
    { scope: raiz, dependencies: dependencias, revertOnUpdate: true }
  )
}

/** Suma una entrada a la línea de tiempo solo si hay piezas que animar. */
export function entra(
  tl: gsap.core.Timeline,
  piezas: HTMLElement[],
  desde: gsap.TweenVars,
  cuando: number | string = 0
) {
  if (piezas.length) tl.from(piezas, desde, cuando)
}

/** Un número que cuenta hasta su valor dentro de la línea de tiempo. */
export function contar(
  tl: gsap.core.Timeline,
  pieza: HTMLElement | undefined,
  valor: number,
  escribir: (n: number) => string,
  cuando: number | string = 0.15
) {
  if (!pieza) return
  const cuenta = { n: 0 }
  tl.fromTo(
    cuenta,
    { n: 0 },
    {
      n: valor,
      duration: 1.5,
      ease: "power3.out",
      onUpdate: () => {
        pieza.textContent = escribir(Math.round(cuenta.n))
      },
    },
    cuando
  )
}
