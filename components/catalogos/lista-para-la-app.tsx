"use client"

import * as React from "react"

/** Lo que la lista de plantillas le dice a la app. */
type MensajeALaApp =
  | { tipo: "alto"; alto: number }
  | { tipo: "elegir"; eleccion: unknown }
  | { tipo: "enlace"; ruta: string }

function alaApp(mensaje: MensajeALaApp) {
  window.ReactNativeWebView?.postMessage(JSON.stringify(mensaje))
}

/**
 * Las plantillas de la lista de catálogos dentro de la app. La app las pone
 * en su lista, sin que se desplacen solas, y les da el alto que piden: por
 * eso cada cambio de tamaño se avisa. Un toque no navega: se le dice a la app
 * qué se tocó, y ella abre su editor con esa plantilla.
 */
export function ListaParaLaApp({ children }: { children: React.ReactNode }) {
  const caja = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const elemento = caja.current
    if (!elemento) return
    const avisar = () =>
      alaApp({ tipo: "alto", alto: Math.ceil(elemento.scrollHeight) })
    avisar()
    const observador = new ResizeObserver(avisar)
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  return (
    <div
      ref={caja}
      // Un píxel a los lados: el ancho de la vista no es entero, y el borde
      // derecho de cada panel quedaba medio píxel afuera, cortado.
      className="flex flex-col gap-6 bg-papel px-px"
      onClickCapture={(evento) => {
        const destino = evento.target as HTMLElement
        const tarjeta = destino.closest<HTMLElement>("[data-eleccion]")
        const enlace = destino.closest<HTMLAnchorElement>("a[href]")
        if (!tarjeta && !enlace) return
        evento.preventDefault()
        evento.stopPropagation()
        if (tarjeta?.dataset.eleccion) {
          alaApp({
            tipo: "elegir",
            eleccion: JSON.parse(tarjeta.dataset.eleccion),
          })
        } else if (enlace) {
          alaApp({ tipo: "enlace", ruta: new URL(enlace.href).pathname })
        }
      }}
    >
      {children}
    </div>
  )
}

/** Sin tienda, sin catálogos o en modo demo: la app no muestra nada. */
export function NadaParaLaApp() {
  React.useEffect(() => alaApp({ tipo: "alto", alto: 0 }), [])
  return null
}
