"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Una fila que se desliza de lado, con aviso de lo que queda afuera: el borde
 * con fichas detrás se esfuma con una máscara (`franja-deslizable`), que sirve
 * sobre cualquier fondo. Con un puntero fino lleva además una flecha que
 * desliza la fila: en la computadora —sin dedo— no había cómo llegar a la
 * última.
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
      <nav
        ref={fila}
        aria-label={etiqueta}
        data-mas-izquierda={hayMas.izquierda || undefined}
        data-mas-derecha={hayMas.derecha || undefined}
        className={cn("franja-deslizable", className)}
      >
        {children}
      </nav>
      {/* Las flechas, solo con puntero fino: en el celular avisan el borde que
          se esfuma y la ficha que asoma. Van sobre la parte esfumada, así no
          tapan una ficha que se pueda leer. */}
      {(["izquierda", "derecha"] as const).map((lado) =>
        hayMas[lado] ? (
          <button
            key={lado}
            type="button"
            aria-label={lado === "izquierda" ? "Ver los anteriores" : "Ver más"}
            onClick={() => deslizar(lado === "izquierda" ? -1 : 1)}
            className={cn(
              "sombra-cuaderno absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-tinta/25 bg-hoja transition-colors hover:bg-tinta hover:text-papel [@media(pointer:fine)]:flex",
              lado === "izquierda" ? "left-1" : "right-1"
            )}
          >
            {lado === "izquierda" ? (
              <ArrowLeft aria-hidden="true" className="size-4" />
            ) : (
              <ArrowRight aria-hidden="true" className="size-4" />
            )}
          </button>
        ) : null
      )}
    </div>
  )
}
