"use client"

import * as React from "react"
import Image from "next/image"
import { ImageOff } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Las fotos de un producto en Pasarela.
 *
 * En el celular se pasan con el dedo, a lo ancho de la pantalla y con un
 * contador: es el gesto que ya conoce quien compra ropa por Instagram. En
 * escritorio van todas a la vista en dos columnas, porque ahí el espacio sobra
 * y hacer clic para ver la espalda de una prenda es un paso de más.
 */
export function Galeria({
  imagenes,
  nombre,
  retrato,
}: {
  imagenes: string[]
  nombre: string
  retrato: boolean
}) {
  const [actual, setActual] = React.useState(0)
  const carril = React.useRef<HTMLDivElement>(null)

  const proporcion = retrato ? "aspect-[3/4]" : "aspect-square"

  if (imagenes.length === 0) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center bg-tinta/[0.06]",
          proporcion
        )}
      >
        <ImageOff aria-hidden="true" className="size-10 opacity-20" />
      </div>
    )
  }

  return (
    <>
      <div className="relative md:hidden">
        <div
          ref={carril}
          onScroll={() => {
            const el = carril.current
            if (!el) return
            setActual(Math.round(el.scrollLeft / el.clientWidth))
          }}
          className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
        >
          {imagenes.map((url, i) => (
            <div
              key={url}
              className={cn(
                "relative w-full shrink-0 snap-center bg-tinta/[0.06]",
                proporcion
              )}
            >
              <Image
                src={url}
                alt={i === 0 ? nombre : `${nombre}, foto ${i + 1}`}
                fill
                unoptimized
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {imagenes.length > 1 ? (
          <p
            aria-live="polite"
            className="tabular absolute right-3 bottom-3 bg-papel px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em]"
          >
            {actual + 1} / {imagenes.length}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "hidden gap-2 md:grid",
          imagenes.length > 1 ? "grid-cols-2" : "grid-cols-1"
        )}
      >
        {imagenes.slice(0, 6).map((url, i) => (
          <div
            key={url}
            className={cn("relative w-full bg-tinta/[0.06]", proporcion)}
          >
            <Image
              src={url}
              alt={i === 0 ? nombre : `${nombre}, foto ${i + 1}`}
              fill
              unoptimized
              priority={i === 0}
              sizes="(max-width: 1280px) 30vw, 380px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </>
  )
}
