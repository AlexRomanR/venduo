"use client"

import * as React from "react"

/**
 * Revela su contenido cuando entra al viewport.
 *
 * La clase que oculta se agrega recién al montar: si el JavaScript no corre,
 * el contenido nunca se esconde. Una animación no puede ser el requisito para
 * leer la página.
 *
 * Se usa solo debajo del pliegue. Lo primero que se ve se rinde quieto, para
 * que en un equipo lento se lea de inmediato.
 */
export function Entra({
  children,
  demora = 0,
  className,
}: {
  children: React.ReactNode
  demora?: number
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [armado, setArmado] = React.useState(false)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    setArmado(true)

    const nodo = ref.current
    if (!nodo) return

    // Sin soporte de observador no se esconde nada.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true)
          observador.disconnect()
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    )

    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={[armado ? "entra" : "", className].filter(Boolean).join(" ")}
      data-visible={visible ? "true" : "false"}
      style={demora ? { transitionDelay: `${demora}ms` } : undefined}
    >
      {children}
    </div>
  )
}
