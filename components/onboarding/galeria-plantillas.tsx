"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"

import type { RubroConPlantillas } from "@/lib/demo-data"
import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Miniatura } from "@/components/plantillas/miniatura"

export function GaleriaPlantillas({
  rubros,
  nombresDeBloque,
}: {
  rubros: RubroConPlantillas[]
  nombresDeBloque: Record<string, string>
}) {
  const [rubroActivo, setRubroActivo] = React.useState<string | null>(null)
  const [elegida, setElegida] = React.useState<string | null>(null)
  const [api, setApi] = React.useState<CarouselApi>()
  const [actual, setActual] = React.useState(0)

  const visibles = React.useMemo(
    () =>
      (rubroActivo
        ? rubros.filter((rubro) => rubro.key === rubroActivo)
        : rubros
      ).flatMap((rubro) =>
        rubro.plantillas.map((plantilla) => ({
          ...plantilla,
          rubro: rubro.name,
        }))
      ),
    [rubros, rubroActivo]
  )

  const plantillaElegida = visibles.find(
    (plantilla) => plantilla.key === elegida
  )

  React.useEffect(() => {
    if (!api) return

    setActual(api.selectedScrollSnap())
    const alCambiar = () => setActual(api.selectedScrollSnap())

    api.on("select", alCambiar)
    return () => {
      api.off("select", alCambiar)
    }
  }, [api])

  return (
    <div>
      {/* El filtro envuelve en vez de desplazarse: a 375 px una fila que se va
          de lado esconde la mitad de los rubros. */}
      <div className="flex flex-wrap gap-2">
        <Filtro
          activo={rubroActivo === null}
          onClick={() => setRubroActivo(null)}
        >
          Todas
        </Filtro>
        {rubros.map((rubro) => (
          <Filtro
            key={rubro.key}
            activo={rubroActivo === rubro.key}
            onClick={() => setRubroActivo(rubro.key)}
          >
            {rubro.name}
          </Filtro>
        ))}
      </div>

      {/* La clave remonta el carrusel al cambiar de rubro: sin eso queda
          desplazado en una posición que ya no existe. */}
      <Carousel
        key={rubroActivo ?? "todas"}
        setApi={setApi}
        opts={{ align: "start", containScroll: "trimSnaps" }}
        className="mt-10"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-tinta/15 pb-4">
          <p className="flex-1 text-xs font-semibold tracking-[0.12em] text-senal uppercase">
            {visibles.length}{" "}
            {visibles.length === 1 ? "plantilla" : "plantillas"}
          </p>
          <span className="tabular text-sm opacity-45">
            {String(Math.min(actual + 1, visibles.length)).padStart(2, "0")} /{" "}
            {String(visibles.length).padStart(2, "0")}
          </span>
          <Controles />
        </div>

        <CarouselContent className="mt-8 -ml-5">
          {visibles.map((plantilla) => {
            const seleccionada = elegida === plantilla.key

            return (
              <CarouselItem
                key={plantilla.key}
                // De a dos también en escritorio: cada plantilla tiene su
                // identidad, y en un tercio del ancho la miniatura no se lee.
                className="basis-[88%] pl-5 sm:basis-1/2"
              >
                <button
                  type="button"
                  onClick={() => setElegida(plantilla.key)}
                  aria-pressed={seleccionada}
                  className={cn(
                    // flex-col y no el flujo por defecto: un <button> nativo
                    // centra su contenido verticalmente cuando sobra alto, y
                    // las tarjetas de descripción corta quedaban desalineadas
                    // contra las de dos líneas.
                    "group flex h-full w-full flex-col border-t-2 pt-5 text-left transition-colors duration-300",
                    seleccionada
                      ? "border-senal"
                      : "border-tinta/15 hover:border-tinta"
                  )}
                >
                  {/* La foto del sistema escala a 1.02 en hover; la vista
                      previa hereda ese mismo gesto y no inventa otro. */}
                  <div
                    className={cn(
                      "overflow-hidden border transition-colors",
                      seleccionada ? "border-senal" : "border-tinta"
                    )}
                  >
                    <div className="transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transform-none">
                      <Miniatura clave={plantilla.key} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-3">
                    <h3
                      className={cn(
                        "flex-1 font-titular text-lg font-bold tracking-[-0.02em] transition-colors",
                        seleccionada ? "text-senal" : "group-hover:text-senal"
                      )}
                    >
                      {plantilla.name}
                    </h3>
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-300",
                        seleccionada
                          ? "border-senal text-senal opacity-100"
                          : "border-transparent opacity-0"
                      )}
                    >
                      <Check aria-hidden="true" className="size-3" />
                      Elegida
                    </span>
                  </div>

                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tracking-[0.12em] uppercase">
                    <span className="opacity-40">{plantilla.rubro}</span>
                    {plantilla.recomendada ? (
                      <span className="font-semibold">Recomendada</span>
                    ) : null}
                    {plantilla.nueva ? (
                      <span className="font-semibold opacity-70">Nueva</span>
                    ) : null}
                  </p>

                  {plantilla.description ? (
                    <p className="mt-3 text-sm leading-relaxed opacity-70">
                      {plantilla.description}
                    </p>
                  ) : null}

                  <p className="mt-3 text-xs leading-relaxed opacity-45">
                    {resumirBloques(plantilla.bloques, nombresDeBloque)}
                  </p>
                </button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>

      {/* Aparece recién al elegir: con el carrusel largo, un botón al final
          del documento queda fuera de alcance. */}
      <div
        aria-hidden={!plantillaElegida}
        className={cn(
          "sticky bottom-0 mt-12 border-t border-tinta/15 bg-papel/95 backdrop-blur transition-all duration-300 ease-out",
          plantillaElegida
            ? "translate-y-0 py-4 opacity-100"
            : "pointer-events-none translate-y-3 py-0 opacity-0"
        )}
      >
        {plantillaElegida ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <p className="flex-1 text-sm">
              <span className="opacity-55">Elegiste</span>{" "}
              <span className="font-titular font-bold">
                {plantillaElegida.name}
              </span>
            </p>
            <Link
              href={`/crear/negocio?plantilla=${plantillaElegida.key}`}
              className="flex min-h-12 items-center gap-2 rounded-sm bg-senal px-5 font-semibold text-white transition-colors hover:bg-senal-alta"
            >
              Continuar
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Flechas del carrusel.
 *
 * Se componen sobre `useCarousel` en vez de usar `CarouselPrevious`, que
 * viene absoluto, redondo y con los tokens de shadcn. Acá los controles son
 * rectangulares y de 44 px, como el resto del mundo editorial.
 */
function Controles() {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel()

  return (
    <div className="flex gap-2">
      <Flecha
        etiqueta="Ver las anteriores"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
      </Flecha>
      <Flecha
        etiqueta="Ver las siguientes"
        onClick={scrollNext}
        disabled={!canScrollNext}
      >
        <ArrowRight aria-hidden="true" className="size-4" />
      </Flecha>
    </div>
  )
}

function Flecha({
  etiqueta,
  onClick,
  disabled,
  children,
}: {
  etiqueta: string
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      onClick={onClick}
      disabled={disabled}
      className="flex size-11 items-center justify-center rounded-sm border-2 border-tinta transition-colors hover:bg-tinta hover:text-papel disabled:border-tinta/15 disabled:text-tinta/25 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

/**
 * Lista los bloques agrupando los repetidos consecutivos.
 *
 * Varias plantillas llevan más de una grilla —lo nuevo y lo más buscado—,
 * y enumerarlas por separado se lee como un error de la pantalla en vez de
 * como una decisión de la plantilla.
 */
function resumirBloques(bloques: string[], nombres: Record<string, string>) {
  const grupos: Array<{ nombre: string; veces: number }> = []

  for (const bloque of bloques) {
    const nombre = nombres[bloque] ?? bloque
    const ultimo = grupos.at(-1)

    if (ultimo?.nombre === nombre) ultimo.veces += 1
    else grupos.push({ nombre, veces: 1 })
  }

  return grupos
    .map((grupo) =>
      grupo.veces > 1 ? `${grupo.nombre} ×${grupo.veces}` : grupo.nombre
    )
    .join(" · ")
}

function Filtro({
  activo,
  onClick,
  children,
}: {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={cn(
        "flex min-h-11 items-center border px-4 text-sm transition-colors duration-200",
        activo
          ? "border-tinta bg-tinta text-papel"
          : "border-tinta/15 hover:border-tinta"
      )}
    >
      {children}
    </button>
  )
}
