"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** El ancho al que se arma la tienda: el de un celular, como la ve el cliente. */
const ANCHO_DE_CELULAR = 390
/** Lo que mide la pantalla del celular dibujado, dentro de su marco. */
const PANTALLA = { ancho: 280, alto: 580 }
const ESCALA = PANTALLA.ancho / ANCHO_DE_CELULAR

/**
 * La tienda de verdad, dentro de un celular: se desplaza, se tocan sus
 * productos y se abre su carrito, como la ve quien compra.
 *
 * Es la página pública misma, armada a 390 px y achicada para entrar en el
 * marco. Solo se carga en una pantalla ancha —en el celular el Resumen
 * muestra la captura, que pesa una imagen—, y las visitas del dueño no se
 * cuentan, así que mirarla acá no infla nada.
 */
export function TiendaEnVivo({
  ruta,
  nombre,
}: {
  /** La ruta de la tienda en este mismo sitio: `/t/{slug}`. */
  ruta: string
  nombre: string
}) {
  const [ancha, setAncha] = React.useState(false)
  const [lista, setLista] = React.useState(false)

  React.useEffect(() => {
    const consulta = window.matchMedia("(min-width: 1024px)")
    const medir = () => setAncha(consulta.matches)
    medir()
    consulta.addEventListener("change", medir)
    return () => consulta.removeEventListener("change", medir)
  }, [])

  // La barra de desplazamiento de la computadora no existe en un celular, y
  // dentro del marco se comía parte de la tienda.
  function alCargar(evento: React.SyntheticEvent<HTMLIFrameElement>) {
    try {
      const documento = evento.currentTarget.contentDocument
      if (documento) documento.documentElement.style.scrollbarWidth = "none"
    } catch {
      // Otro origen —un dominio propio—: queda con su barra, nada más.
    }
    setLista(true)
  }

  return (
    <div
      className="relative mx-auto rounded-[2.4rem] bg-tinta p-2.5"
      style={{ width: PANTALLA.ancho + 20 }}
    >
      <div
        className="relative overflow-hidden rounded-[1.9rem] bg-papel"
        style={{ height: PANTALLA.alto }}
      >
        {ancha ? (
          <iframe
            src={ruta}
            title={`${nombre}, como la ve tu cliente`}
            onLoad={alCargar}
            className="origin-top-left border-0"
            style={{
              width: ANCHO_DE_CELULAR,
              height: PANTALLA.alto / ESCALA,
              transform: `scale(${ESCALA})`,
            }}
          />
        ) : null}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 flex flex-col gap-3 bg-papel px-4 pt-12 transition-opacity duration-300",
            lista && "opacity-0"
          )}
        >
          <span className="h-5 w-2/3 animate-pulse bg-tinta/10" />
          <span className="h-40 w-full animate-pulse bg-tinta/10" />
          <span className="grid grid-cols-2 gap-3">
            <span className="h-32 animate-pulse bg-tinta/10" />
            <span className="h-32 animate-pulse bg-tinta/10" />
          </span>
        </div>
      </div>
    </div>
  )
}
