"use client"

import * as React from "react"

/**
 * Una cifra que cuenta hasta su valor al entrar en pantalla.
 *
 * Renderiza el valor final de entrada: si el JavaScript no corre o la persona
 * pidió menos movimiento, el número ya está ahí. La animación solo lo demora.
 */
export function Cifra({
  valor,
  prefijo = "",
  sufijo = "",
  detalle,
}: {
  valor: number
  prefijo?: string
  sufijo?: string
  detalle: string
}) {
  const ref = React.useRef<HTMLParagraphElement>(null)
  const [actual, setActual] = React.useState(valor)

  React.useEffect(() => {
    const nodo = ref.current
    const reducido = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches

    if (!nodo || reducido || typeof IntersectionObserver === "undefined") return

    setActual(0)
    let cuadro = 0

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return
        observador.disconnect()

        const inicio = performance.now()
        const duracion = 900

        const paso = (ahora: number) => {
          const t = Math.min((ahora - inicio) / duracion, 1)
          // Salida exponencial: arranca rápido y se asienta.
          const suave = 1 - Math.pow(1 - t, 3)
          setActual(Math.round(valor * suave))
          if (t < 1) cuadro = requestAnimationFrame(paso)
        }

        cuadro = requestAnimationFrame(paso)
      },
      { rootMargin: "0px 0px -15% 0px" }
    )

    observador.observe(nodo)

    return () => {
      observador.disconnect()
      cancelAnimationFrame(cuadro)
    }
  }, [valor])

  return (
    <div>
      <p
        ref={ref}
        className="tabular font-titular text-[clamp(2.5rem,7vw,3.25rem)] leading-none font-extrabold tracking-[-0.04em] text-senal"
      >
        {prefijo}
        {actual.toLocaleString("es-BO")}
        {sufijo}
      </p>
      <p className="mt-3 max-w-[24ch] text-sm leading-relaxed tracking-wide uppercase opacity-60">
        {detalle}
      </p>
    </div>
  )
}
