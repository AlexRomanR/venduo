"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"

import {
  CLAVES_PLANTILLA,
  HOJAS,
  type ClavePlantilla,
} from "@/lib/catalogos/constantes"
import type {
  DatosDelCatalogo,
  ProductoDelCatalogo,
} from "@/lib/catalogos/datos"
import type { Catalogo, Estilo, Pack } from "@/lib/catalogos/modelo"
import {
  PLANTILLAS_DE_CATALOGO,
  armarCatalogo,
} from "@/lib/catalogos/plantillas"
import { cn } from "@/lib/utils"
import { hojasConContexto } from "@/components/catalogos/documento"
import {
  HojaEscalada,
  useAncho,
} from "@/components/catalogos/editor/vista-previa"

/**
 * Las doce plantillas, cada una armada con los productos elegidos.
 *
 * Se ven sus dos primeras hojas y no un dibujo genérico: la pregunta que hay
 * que contestar es cómo se ven mis productos así, no cómo se ve la plantilla.
 */
export function GaleriaDePlantillas({
  productos,
  datos,
  estilo,
  nombre,
  packs,
  actual,
  sugerida,
  alElegir,
}: {
  productos: ProductoDelCatalogo[]
  datos: DatosDelCatalogo
  estilo: Estilo
  nombre: string
  packs?: Pack[]
  actual?: ClavePlantilla
  sugerida?: ClavePlantilla | null
  alElegir: (catalogo: Catalogo) => void
}) {
  const muestras = React.useMemo(
    () =>
      CLAVES_PLANTILLA.map((clave) => {
        const catalogo = armarCatalogo({
          plantilla: clave,
          nombre,
          productos,
          tienda: {
            nombre: datos.tienda.nombre,
            whatsapp: datos.tienda.whatsapp,
          },
          estilo,
          packs,
        })
        return {
          clave,
          catalogo,
          hojas: hojasConContexto(catalogo, datos).slice(0, 2),
        }
      }),
    [productos, datos, estilo, nombre, packs]
  )

  return (
    <ul className="grid grid-cols-1 gap-px bg-tinta/15 md:grid-cols-2 2xl:grid-cols-3">
      {muestras.map(({ clave, catalogo, hojas }) => (
        <li key={clave} className="bg-papel">
          <Muestra
            clave={clave}
            hojas={hojas}
            actual={clave === actual}
            sugerida={clave === sugerida}
            alElegir={() => alElegir(catalogo)}
          />
        </li>
      ))}
    </ul>
  )
}

function Muestra({
  clave,
  hojas,
  actual,
  sugerida,
  alElegir,
}: {
  clave: ClavePlantilla
  hojas: ReturnType<typeof hojasConContexto>
  actual: boolean
  sugerida: boolean
  alElegir: () => void
}) {
  const plantilla = PLANTILLAS_DE_CATALOGO[clave]
  const [ref, ancho] = useAncho<HTMLDivElement>()
  const anchoDeHoja = Math.max(0, (ancho - 12) / 2)

  return (
    <button
      type="button"
      onClick={alElegir}
      aria-current={actual ? "true" : undefined}
      className={cn(
        "group flex h-full w-full flex-col gap-4 p-4 text-left transition-colors sm:p-5",
        actual ? "bg-tinta/[0.06]" : "hover:bg-tinta/[0.03]"
      )}
    >
      <div
        ref={ref}
        className="flex w-full items-start gap-3 bg-tinta/[0.06] p-3"
        style={{ minHeight: 120 }}
      >
        {anchoDeHoja > 0
          ? hojas.map(({ hoja, ctx }) => (
              <HojaEscalada
                key={ctx.numero}
                hoja={hoja}
                ctx={ctx}
                ancho={anchoDeHoja - 6}
                className="ring-1 ring-tinta/15"
              />
            ))
          : null}
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-titular text-lg leading-tight font-bold tracking-[-0.02em]">
            {plantilla.nombre}
          </h3>
          {sugerida ? (
            <span className="inline-flex items-center gap-1 border border-tinta px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase">
              <Sparkles aria-hidden="true" className="size-3" />
              La sugiere la IA
            </span>
          ) : null}
          {actual ? (
            <span className="border border-tinta bg-tinta px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-papel uppercase">
              La que tienes
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-relaxed opacity-75">
          {plantilla.detalle}
        </p>
        <p className="mt-1 text-xs opacity-65">
          {plantilla.ideal} · {HOJAS[plantilla.hoja].nombre}
        </p>
      </div>
    </button>
  )
}
