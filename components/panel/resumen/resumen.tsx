"use client"

import { useEffect, type ReactNode } from "react"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

import { cn } from "@/lib/utils"
import { archivoAncho, kalam } from "@/components/portada/letras"
import { CON_MOVIMIENTO, gsap, ScrollTrigger } from "@/components/portada/gsap"
import estilos from "@/components/panel/resumen/resumen.module.css"

/**
 * El Resumen entero: el cuaderno de ventas del día, con el bolígrafo, las
 * letras y el scroll de la portada. El scroll suave se apaga mientras hay un
 * diálogo abierto, y no toca lo que se desliza por su cuenta (la barra
 * lateral, una franja de fotos).
 */
export function Resumen({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!window.matchMedia(CON_MOVIMIENTO).matches) return
    const lenis = new Lenis({
      lerp: 0.12,
      allowNestedScroll: true,
      prevent: (nodo) =>
        Boolean(
          nodo.closest("[role=dialog], aside, nav, [data-lenis-prevent]")
        ),
      virtualScroll: () => !document.body.hasAttribute("data-scroll-locked"),
    })
    lenis.on("scroll", ScrollTrigger.update)
    const latir = (tiempo: number) => lenis.raf(tiempo * 1000)
    gsap.ticker.add(latir)
    gsap.ticker.lagSmoothing(0)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => {
      gsap.ticker.remove(latir)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [])

  return (
    <div
      className={cn(
        archivoAncho.variable,
        kalam.variable,
        estilos.resumen,
        // Lo que espera a su escena —un sello agrandado, una nota corrida— no
        // puede empujar la página de costado en el celular.
        "flex flex-col overflow-x-clip"
      )}
    >
      {children}
    </div>
  )
}
