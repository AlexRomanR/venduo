"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** Lo que la app necesita de cada plantilla para dibujar lo suyo. */
export interface PlantillaParaLaApp {
  clave: string
  nombre: string
  rubro: string | null
  descripcion: string | null
  rasgos: string[]
  recomendada: boolean
  nueva: boolean
}

/** Lo que la pasarela le dice a la app. */
type MensajeALaApp =
  | { tipo: "lista"; plantillas: PlantillaParaLaApp[]; notas: string[] }
  | { tipo: "alto"; alto: number }
  | { tipo: "indice"; indice: number }

declare global {
  interface Window {
    /** Por donde la app le habla a la pasarela, con `injectJavaScript`. */
    venduoPasarela?: { recibir: (mensaje: unknown) => void }
  }
}

function alaApp(mensaje: MensajeALaApp) {
  window.ReactNativeWebView?.postMessage(JSON.stringify(mensaje))
}

/**
 * La tira de dibujos de la pasarela de Apariencia, para la app: una plantilla
 * por pantalla, que encaja al deslizar, cada una con la tienda adentro. Lo demás
 * —el nombre, los botones, la hoja para cambiar— lo dibuja la app; acá solo se
 * avisa cuál se está mirando y cuánto mide, y se obedece cuando la app pide ir
 * a otra con sus flechas.
 */
export function PasarelaParaLaApp({
  plantillas,
  notas,
  miniaturas,
}: {
  plantillas: PlantillaParaLaApp[]
  notas: string[]
  miniaturas: React.ReactNode[]
}) {
  const franja = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    alaApp({ tipo: "lista", plantillas, notas })
  }, [plantillas, notas])

  // El alto, para que la app le dé a la vista el que pide.
  React.useEffect(() => {
    const elemento = franja.current
    if (!elemento) return
    const avisar = () =>
      alaApp({ tipo: "alto", alto: Math.ceil(elemento.scrollHeight) })
    avisar()
    const observador = new ResizeObserver(avisar)
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  // La que se está mirando: la que ocupa más de la mitad.
  React.useEffect(() => {
    const elemento = franja.current
    if (!elemento) return
    const observador = new IntersectionObserver(
      (vistas) => {
        for (const vista of vistas) {
          if (!vista.isIntersecting) continue
          const indice = Number((vista.target as HTMLElement).dataset.indice)
          alaApp({ tipo: "indice", indice })
        }
      },
      { root: elemento, threshold: 0.6 }
    )
    elemento
      .querySelectorAll("[data-indice]")
      .forEach((hijo) => observador.observe(hijo))
    return () => observador.disconnect()
  }, [])

  // La app pide ir a otra con sus flechas.
  React.useEffect(() => {
    window.venduoPasarela = {
      recibir(crudo) {
        const mensaje = (
          typeof crudo === "string" ? JSON.parse(crudo) : crudo
        ) as { tipo?: string; indice?: number }
        if (mensaje.tipo !== "ir" || typeof mensaje.indice !== "number") return
        const elemento = franja.current
        if (!elemento) return
        const quieto = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
        elemento.scrollTo({
          left: mensaje.indice * elemento.clientWidth,
          behavior: quieto ? "auto" : "smooth",
        })
      },
    }
    return () => {
      delete window.venduoPasarela
    }
  }, [])

  return (
    <div
      ref={franja}
      className={cn(
        "flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto bg-hoja [&::-webkit-scrollbar]:hidden"
      )}
    >
      {miniaturas.map((miniatura, indice) => (
        <div
          key={plantillas[indice]?.clave ?? indice}
          data-indice={indice}
          className="w-full shrink-0 snap-center px-px"
        >
          <div className="overflow-hidden rounded-[16px] border border-tinta/15">
            {miniatura}
          </div>
        </div>
      ))}
    </div>
  )
}
