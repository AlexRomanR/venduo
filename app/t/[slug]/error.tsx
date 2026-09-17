"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { RotateCw } from "lucide-react"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"

/**
 * Cuando una pantalla de la tienda falla.
 *
 * Quien ve esto es un comprador, no quien programó la tienda: no se le muestra
 * el error, se le ofrece reintentar. El layout sigue montado, así que la
 * pantalla conserva los colores y la letra de la plantilla.
 */
export default function ErrorDeTienda({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { slug } = useParams<{ slug: string }>()

  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-20 text-center">
      <h1 className="font-titular text-[clamp(2rem,7vw,3rem)] leading-tight font-extrabold tracking-[-0.03em]">
        Algo no cargó
      </h1>
      <p className="mt-4 max-w-[42ch] leading-relaxed opacity-70">
        Puede ser la conexión. Vuelve a intentarlo; tu carrito sigue guardado en
        este teléfono.
      </p>

      <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <button type="button" onClick={reset} className={BOTON_PRIMARIO}>
          <RotateCw aria-hidden="true" className="size-4" />
          Intentar de nuevo
        </button>
        {slug ? (
          <Link href={`/t/${slug}`} className={BOTON_SECUNDARIO}>
            Ir al inicio de la tienda
          </Link>
        ) : null}
      </div>
    </main>
  )
}
