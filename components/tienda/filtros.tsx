"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import type { CategoriaPublica } from "@/lib/data/tienda-publica"

/**
 * El filtro del catálogo: lo que está en oferta y las categorías.
 *
 * Va por URL: así el enlace de "lo que está en oferta" se puede compartir, que
 * es exactamente lo que hace una tienda en un grupo de WhatsApp.
 */
export function FiltrosTienda({
  categorias,
  ofertas,
  total,
  mostrando,
  redondeadas = false,
}: {
  categorias: CategoriaPublica[]
  /** Cuántos productos tienen precio anterior. Con cero, "En oferta" no se dibuja. */
  ofertas: number
  total: number
  mostrando: number
  /** Con el radio de la plantilla. La base editorial las quiere rectas. */
  redondeadas?: boolean
}) {
  const router = useRouter()
  const ruta = usePathname()
  const parametros = useSearchParams()

  const oferta = parametros.get("oferta") === "1"
  const categoria = parametros.get("categoria")

  function aplicar(cambios: Record<string, string | null>) {
    const siguientes = new URLSearchParams(parametros.toString())
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) siguientes.set(clave, valor)
      else siguientes.delete(clave)
    }
    const consulta = siguientes.toString()
    router.replace(consulta ? `${ruta}?${consulta}` : ruta, { scroll: false })
  }

  const hayFiltro = Boolean(oferta || categoria)

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <div className="flex w-max items-center gap-2 sm:w-auto sm:flex-wrap">
          <FichaDeFiltro
            redondeada={redondeadas}
            activa={!hayFiltro}
            onClick={() => aplicar({ oferta: null, categoria: null })}
          >
            Todo
          </FichaDeFiltro>

          {ofertas > 0 ? (
            <FichaDeFiltro
              redondeada={redondeadas}
              activa={oferta}
              onClick={() => aplicar({ oferta: oferta ? null : "1" })}
            >
              En oferta
            </FichaDeFiltro>
          ) : null}

          {categorias
            .filter((c) => c.productos > 0)
            .map((c) => (
              <FichaDeFiltro
                redondeada={redondeadas}
                key={c.id}
                activa={categoria === c.id}
                onClick={() =>
                  aplicar({ categoria: categoria === c.id ? null : c.id })
                }
              >
                {c.nombre}
              </FichaDeFiltro>
            ))}
        </div>
      </div>

      <p
        aria-live="polite"
        className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45"
      >
        {hayFiltro
          ? `${mostrando} de ${total} ${total === 1 ? "producto" : "productos"}`
          : `${total} ${total === 1 ? "producto" : "productos"}`}
      </p>
    </div>
  )
}

function FichaDeFiltro({
  activa,
  onClick,
  children,
  redondeada,
}: {
  activa: boolean
  onClick: () => void
  children: React.ReactNode
  redondeada: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={cn(
        "flex min-h-11 shrink-0 items-center rounded-plantilla border px-4 text-sm font-semibold transition-colors",
        redondeada && "px-5",
        activa
          ? "border-senal bg-senal text-white"
          : "border-tinta/25 hover:border-tinta"
      )}
    >
      {children}
    </button>
  )
}
