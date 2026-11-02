import { cn } from "@/lib/utils"
import estilos from "@/components/portada/portada.module.css"

/**
 * Trazos de bolígrafo dibujados a mano, en SVG para poder animarlos: cada
 * camino lleva `js-trazo` y GSAP lo dibuja con su largo real.
 */

interface PropsTrazo {
  className?: string
  grosor?: number
}

export function Subrayado({ className, grosor = 3 }: PropsTrazo) {
  return (
    <svg
      viewBox="0 0 300 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("overflow-visible", className)}
    >
      <path
        className={cn(estilos.trazo, "js-trazo")}
        pathLength={1}
        strokeWidth={grosor}
        d="M3 13 C 60 6, 120 4, 180 7 S 270 12, 297 6 M 20 17 C 90 12, 170 11, 260 14"
      />
    </svg>
  )
}

export function Circulo({ className, grosor = 2.5 }: PropsTrazo) {
  return (
    <svg
      viewBox="0 0 120 70"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("overflow-visible", className)}
    >
      <path
        className={cn(estilos.trazo, "js-trazo")}
        pathLength={1}
        strokeWidth={grosor}
        d="M70 6 C 30 2, 4 18, 6 36 C 8 56, 40 66, 70 64 C 100 62, 118 48, 114 30 C 110 12, 86 4, 52 8"
      />
    </svg>
  )
}

export function Flecha({ className, grosor = 2.5 }: PropsTrazo) {
  return (
    <svg
      viewBox="0 0 120 60"
      aria-hidden="true"
      className={cn("overflow-visible", className)}
    >
      <path
        className={cn(estilos.trazo, "js-trazo")}
        pathLength={1}
        strokeWidth={grosor}
        d="M4 48 C 30 50, 70 40, 108 12 M 92 10 L 109 11 L 104 27"
      />
    </svg>
  )
}

export function Visto({ className, grosor = 3 }: PropsTrazo) {
  return (
    <svg
      viewBox="0 0 40 32"
      aria-hidden="true"
      className={cn("overflow-visible", className)}
    >
      <path
        className={cn(estilos.trazo, "js-trazo")}
        pathLength={1}
        strokeWidth={grosor}
        d="M4 17 C 8 20, 12 25, 15 28 C 21 18, 29 9, 37 3"
      />
    </svg>
  )
}

/** El tachón de un renglón: dos pasadas rápidas, como se tacha de verdad. */
export function Tachon({ className, grosor = 2 }: PropsTrazo) {
  return (
    <svg
      viewBox="0 0 300 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("pointer-events-none overflow-visible", className)}
    >
      <path
        className={cn(estilos.trazo, "js-tachon")}
        pathLength={1}
        strokeWidth={grosor}
        d="M2 11 C 80 8, 160 13, 298 8 M 6 14 C 100 11, 200 15, 290 11"
      />
    </svg>
  )
}

/** Deja los trazos sin dibujar, listos para que GSAP los trace. */
export function prepararTrazos(raiz: Element, selector = ".js-trazo") {
  const caminos = Array.from(raiz.querySelectorAll<SVGPathElement>(selector))
  for (const camino of caminos) {
    camino.style.strokeDasharray = "1"
    camino.style.strokeDashoffset = "1"
  }
  return caminos
}
