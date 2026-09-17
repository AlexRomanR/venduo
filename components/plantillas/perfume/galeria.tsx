"use client"

import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Las fotos de un producto en Esencia.
 *
 * Una sola foto grande, enmarcada en arco, y las demás como círculos debajo.
 * Un frasco no tiene espalda que mostrar: las otras fotos son detalles, y
 * elegir uno sin perder de vista el principal es lo que se busca.
 */
export function Galeria({
  imagenes,
  nombre,
}: {
  imagenes: string[]
  nombre: string
}) {
  const [actual, setActual] = React.useState(0)
  const principal = imagenes[actual] ?? imagenes[0]

  return (
    <div>
      <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-t-full bg-tinta/[0.045]">
        {principal ? (
          <Image
            key={principal}
            src={principal}
            alt={actual === 0 ? nombre : `${nombre}, foto ${actual + 1}`}
            fill
            unoptimized
            priority
            sizes="(max-width: 768px) 100vw, 448px"
            className="animate-in object-cover duration-500 fade-in motion-reduce:animate-none"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span
              aria-hidden="true"
              className="font-titular text-[9rem] leading-none italic opacity-15"
            >
              {nombre.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {imagenes.length > 1 ? (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {imagenes.slice(0, 6).map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActual(i)}
              aria-label={`Ver la foto ${i + 1}`}
              aria-pressed={actual === i}
              className={cn(
                "relative size-14 overflow-hidden rounded-full border transition-colors",
                actual === i
                  ? "border-senal ring-1 ring-senal ring-offset-2 ring-offset-papel"
                  : "border-tinta/15 opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={url}
                alt=""
                fill
                unoptimized
                sizes="56px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
