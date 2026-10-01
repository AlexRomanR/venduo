import Link from "next/link"
import { ArrowUpRight, Palette, Share2 } from "lucide-react"

import { BOTON_SECUNDARIO } from "@/lib/estilos"
import type { Apariencia } from "@/lib/plantillas/apariencia"
import { enlaceLegible } from "@/lib/tienda"
import { cn } from "@/lib/utils"
import { CompartirTienda } from "@/components/panel/tablero/compartir"
import { SelloDeTienda } from "@/components/panel/tablero/sello"

const BOTON = cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")

/**
 * Lo primero del Resumen: de quién es esta tienda y cómo está.
 *
 * El nombre de la tienda es el titular de la pantalla, como pide el ritmo de
 * los paneles, y a su lado va su sello con su propia cara. Las tres acciones
 * son las que alguien busca más veces por día; compartir va primero porque es
 * lo que trae ventas.
 */
export function CabeceraDeTienda({
  persona,
  tienda,
  apariencia,
  plantilla,
}: {
  persona: string
  tienda: {
    nombre: string
    slug: string
    url: string
    logoUrl: string | null
    publicada: boolean
  }
  apariencia: Apariencia
  /** El nombre de su plantilla, como lo ve la persona. */
  plantilla: string
}) {
  const primerNombre = persona.trim().split(/\s+/)[0]

  return (
    <header className="md:flex md:items-stretch md:gap-6">
      <div className="hidden md:block">
        <SelloDeTienda
          nombre={tienda.nombre}
          logoUrl={tienda.logoUrl}
          apariencia={apariencia}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-end">
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <SelloDeTienda
              nombre={tienda.nombre}
              logoUrl={tienda.logoUrl}
              apariencia={apariencia}
              compacto
            />
          </div>
          <div className="min-w-0">
            {primerNombre ? (
              <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
                Hola, {primerNombre}
              </p>
            ) : null}
            <h1 className="mt-1 font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">
              {tienda.nombre}
            </h1>
          </div>
        </div>

        <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              !tienda.publicada && "font-semibold text-senal"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                tienda.publicada ? "bg-tinta" : "bg-senal"
              )}
            />
            {tienda.publicada ? "Publicada" : "En borrador"}
          </span>
          <span aria-hidden="true" className="opacity-30">
            ·
          </span>
          <span className="opacity-70">Plantilla {plantilla}</span>
          <span aria-hidden="true" className="hidden opacity-30 sm:inline">
            ·
          </span>
          <a
            href={tienda.url}
            target="_blank"
            rel="noreferrer noopener"
            className="hidden break-all underline-offset-4 opacity-70 transition-opacity hover:underline hover:opacity-100 sm:inline"
          >
            {enlaceLegible(tienda.url)}
          </a>
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <CompartirTienda
            nombre={tienda.nombre}
            slug={tienda.slug}
            url={tienda.url}
            legible={enlaceLegible(tienda.url)}
          >
            <button type="button" className={cn(BOTON, "col-span-2")}>
              <Share2 aria-hidden="true" className="size-4" />
              Compartir tu tienda
            </button>
          </CompartirTienda>
          <a
            href={tienda.url}
            target="_blank"
            rel="noreferrer noopener"
            className={BOTON}
          >
            Ver tienda
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
          <Link href="/editor" className={BOTON}>
            <Palette aria-hidden="true" className="size-4" />
            Editar diseño
          </Link>
        </div>
      </div>
    </header>
  )
}
