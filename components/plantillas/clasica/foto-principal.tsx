"use client"

import * as React from "react"
import Image from "next/image"
import { ImageOff } from "lucide-react"

import { useFotoElegida } from "@/components/tienda/foto-elegida"

/**
 * La foto grande de la ficha en la Clásica. Elegir un color en la ficha la
 * cambia por la de ese color, si es una de las fotos del producto.
 */
export function FotoPrincipal({
  inicial,
  imagenes,
  nombre,
  sizes,
}: {
  inicial: string | null
  imagenes: string[]
  nombre: string
  sizes: string
}) {
  const [foto, setFoto] = React.useState(inicial)

  useFotoElegida((url) => {
    if (imagenes.includes(url)) setFoto(url)
  })

  return foto ? (
    <Image
      key={foto}
      src={foto}
      alt={nombre}
      fill
      unoptimized
      priority
      sizes={sizes}
      className="animate-in object-cover duration-300 fade-in motion-reduce:animate-none"
    />
  ) : (
    <div className="flex size-full items-center justify-center">
      <ImageOff aria-hidden="true" className="size-10 opacity-20" />
    </div>
  )
}
