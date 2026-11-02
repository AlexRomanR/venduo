"use client"

import { useEffect } from "react"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

import { cn } from "@/lib/utils"
import { Cabecera } from "@/components/portada/cabecera"
import { Entrada } from "@/components/portada/entrada"
import { archivoAncho, kalam } from "@/components/portada/letras"
import estilos from "@/components/portada/portada.module.css"
import { Pedidos } from "@/components/portada/pedidos"
import { Cierre, Dolores, Preguntas } from "@/components/portada/secciones"
import { PorQue } from "@/components/portada/tu-estilo"
import { ComoFunciona } from "@/components/portada/pasos"
import { Incluye } from "@/components/portada/incluye"
import { ParaQuien } from "@/components/portada/rubros"
import { CON_MOVIMIENTO, gsap, ScrollTrigger } from "@/components/portada/gsap"

/**
 * La portada pública: el cuaderno de ventas pasado en limpio. Papel, tinta y
 * un bolígrafo frambuesa; el celular en 3D, las escenas y el movimiento son solo de
 * esta página. El sistema está en `DESIGN.md`, "La portada".
 */
export function Portada({ conSesion }: { conSesion: boolean }) {
  useEffect(() => {
    if (!window.matchMedia(CON_MOVIMIENTO).matches) return
    const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -72 } })
    lenis.on("scroll", ScrollTrigger.update)
    const latir = (tiempo: number) => lenis.raf(tiempo * 1000)
    gsap.ticker.add(latir)
    gsap.ticker.lagSmoothing(0)
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
    return () => {
      gsap.ticker.remove(latir)
      lenis.destroy()
    }
  }, [])

  return (
    <div className={cn(archivoAncho.variable, kalam.variable, estilos.portada)}>
      <Cabecera conSesion={conSesion} />
      <main>
        <Entrada />
        <Dolores />
        <ComoFunciona />
        <Pedidos />
        <PorQue />
        <ParaQuien />
        <Incluye />
        <Preguntas />
      </main>
      <Cierre />
    </div>
  )
}
