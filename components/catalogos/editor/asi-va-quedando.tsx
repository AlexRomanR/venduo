"use client"

import * as React from "react"
import { BookOpen, Eye } from "lucide-react"

import { hojasDe, type DatosDelCatalogo } from "@/lib/catalogos/datos"
import type { Catalogo } from "@/lib/catalogos/modelo"
import { cn } from "@/lib/utils"
import { HojaDeAjuste } from "@/components/panel/ajustes"
import { Contador } from "@/components/panel/contador"
import { SinDatos } from "@/components/panel/piezas"
import { Recien } from "@/components/panel/recien"
import { hojasConContexto } from "@/components/catalogos/documento"
import {
  HojaEscalada,
  VistaPrevia,
} from "@/components/catalogos/editor/vista-previa"

/*
 * "Así va quedando": el catálogo que se arma mientras se eligen los productos.
 * Antes se elegían a ciegas y recién en el paso siguiente aparecía algo. Ahora
 * cada producto que se toca vuela hasta acá y su hoja se arma en el momento.
 */

function cuantasHojas(n: number) {
  return n === 1 ? "hoja" : "hojas"
}

/** La columna de la pantalla ancha: las hojas, de la primera a la última. */
export function AsiVaQuedando({
  borrador,
  datos,
  plantilla,
}: {
  borrador: Catalogo | null
  datos: DatosDelCatalogo
  plantilla: string | null
}) {
  const hojas = borrador ? hojasDe(borrador, datos).length : 0
  const desplazable = React.useRef<HTMLDivElement>(null)
  const antes = React.useRef(hojas)

  // Cuando se agrega una hoja, la columna baja hasta ella: es la que llegó.
  React.useEffect(() => {
    const contenedor = desplazable.current
    if (contenedor && hojas > antes.current) {
      const quieto = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      contenedor.scrollTo({
        top: contenedor.scrollHeight,
        behavior: quieto ? "auto" : "smooth",
      })
    }
    antes.current = hojas
  }, [hojas])

  return (
    <section
      aria-label="Así va quedando"
      className="flex min-w-0 flex-col border border-tinta bg-papel lg:sticky lg:top-6"
    >
      <header className="flex items-start justify-between gap-4 border-b border-tinta/15 px-5 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
            <Eye aria-hidden="true" className="size-[18px] shrink-0" />
            Así va quedando
          </h2>
          {plantilla ? (
            <p className="mt-0.5 text-sm opacity-70">
              Con la plantilla{" "}
              <Recien valor={plantilla} className="font-semibold">
                {plantilla}
              </Recien>
              .
            </p>
          ) : null}
        </div>
        <p className="shrink-0 text-sm font-semibold whitespace-nowrap">
          <Recien valor={hojas}>
            <Contador valor={hojas} /> {cuantasHojas(hojas)}
          </Recien>
        </p>
      </header>
      <div
        ref={desplazable}
        data-destino-del-vuelo
        className="max-h-[calc(100dvh-13rem)] overflow-y-auto bg-tinta/[0.04]"
      >
        {borrador && hojas > 0 ? (
          <VistaPrevia
            catalogo={borrador}
            datos={datos}
            elegido={null}
            vivo
            soloVer
            anchoMaximo={300}
            className="px-5 py-6"
          />
        ) : (
          <SinDatos
            icono={BookOpen}
            titulo="Todavía sin hojas"
            texto="Elige tus productos y tu catálogo se arma aquí."
          />
        )}
      </div>
    </section>
  )
}

/**
 * En el celular: la última hoja chica, al lado del botón de seguir. Tocarla
 * abre el catálogo entero en una hoja de abajo.
 */
export function AsiVaQuedandoEnLaBarra({
  borrador,
  datos,
  plantilla,
}: {
  borrador: Catalogo | null
  datos: DatosDelCatalogo
  plantilla: string | null
}) {
  const [abierta, setAbierta] = React.useState(false)
  const todas = React.useMemo(
    () => (borrador ? hojasConContexto(borrador, datos) : []),
    [borrador, datos]
  )
  const ultima = todas.at(-1)
  const hojas = todas.length
  const firma = ultima ? `${hojas}-${ultima.ctx.numero}` : "nada"

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        disabled={hojas === 0}
        aria-label={`Ver cómo va quedando: ${hojas} ${cuantasHojas(hojas)}`}
        className="flex shrink-0 items-center gap-2.5 text-left disabled:opacity-60"
      >
        <span
          data-destino-del-vuelo
          className="relative flex h-14 w-10 items-center justify-center overflow-hidden bg-tinta/[0.06] ring-1 ring-tinta/20"
        >
          {ultima ? (
            <span key={firma} className="cambio-entra block">
              <HojaEscalada hoja={ultima.hoja} ctx={ultima.ctx} ancho={40} />
            </span>
          ) : null}
        </span>
        <span className="text-sm leading-tight font-semibold whitespace-nowrap">
          <Recien valor={hojas}>
            <Contador valor={hojas} />
          </Recien>
          <span className="block text-xs font-normal opacity-65">
            {cuantasHojas(hojas)}
          </span>
        </span>
      </button>
      <HojaDeAjuste
        abierta={abierta}
        titulo="Así va quedando"
        descripcion={
          plantilla
            ? `Con la plantilla ${plantilla} · ${hojas} ${cuantasHojas(hojas)}.`
            : `${hojas} ${cuantasHojas(hojas)}.`
        }
        alCerrar={() => setAbierta(false)}
      >
        {borrador ? (
          <VistaPrevia
            catalogo={borrador}
            datos={datos}
            elegido={null}
            vivo
            soloVer
            className={cn("bg-tinta/[0.04] px-4 py-6")}
          />
        ) : null}
      </HojaDeAjuste>
    </>
  )
}
