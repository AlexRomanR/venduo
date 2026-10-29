"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Una fila que se desliza de lado, con aviso de lo que queda afuera: el borde
 * con fichas detrás se desvanece y lleva una flecha que desliza la fila. Sin
 * ella, en la computadora —sin barra ni dedo— no había cómo llegar a la última.
 */
export function Deslizable({
  etiqueta,
  className,
  children,
}: {
  /** Para lectores de pantalla: qué hay en la fila. */
  etiqueta: string
  className?: string
  children: React.ReactNode
}) {
  const fila = React.useRef<HTMLElement>(null)
  const [hayMas, setHayMas] = React.useState({
    izquierda: false,
    derecha: false,
  })

  React.useEffect(() => {
    const caja = fila.current
    if (!caja) return
    const medir = () => {
      const izquierda = caja.scrollLeft > 1
      const derecha = caja.scrollLeft + caja.clientWidth < caja.scrollWidth - 1
      setHayMas((antes) =>
        antes.izquierda === izquierda && antes.derecha === derecha
          ? antes
          : { izquierda, derecha }
      )
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(caja)
    caja.addEventListener("scroll", medir, { passive: true })
    return () => {
      observador.disconnect()
      caja.removeEventListener("scroll", medir)
    }
  }, [])

  const deslizar = (sentido: 1 | -1) =>
    fila.current?.scrollBy({
      left: sentido * fila.current.clientWidth * 0.7,
      behavior: "smooth",
    })

  return (
    <div className="relative isolate">
      {(["izquierda", "derecha"] as const).map((lado) =>
        hayMas[lado] ? (
          <div
            key={lado}
            className={cn(
              "pointer-events-none absolute inset-y-0 z-10 flex w-20 items-center from-papel from-45% to-transparent",
              lado === "izquierda"
                ? "left-0 justify-start bg-gradient-to-r pl-2"
                : "right-0 justify-end bg-gradient-to-l pr-2"
            )}
          >
            <button
              type="button"
              aria-label={
                lado === "izquierda" ? "Ver los anteriores" : "Ver más"
              }
              onClick={() => deslizar(lado === "izquierda" ? -1 : 1)}
              className="pointer-events-auto flex size-9 items-center justify-center border border-tinta bg-papel transition-colors hover:bg-tinta hover:text-papel"
            >
              {lado === "izquierda" ? (
                <ArrowLeft aria-hidden="true" className="size-4" />
              ) : (
                <ArrowRight aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        ) : null
      )}
      <nav ref={fila} aria-label={etiqueta} className={className}>
        {children}
      </nav>
    </div>
  )
}
