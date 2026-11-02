"use client"

import * as React from "react"
import { Check, LayoutTemplate, Palette } from "lucide-react"

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
  armarConEstilo,
  type EstiloSugerido,
} from "@/lib/catalogos/plantillas"
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { Contador } from "@/components/panel/contador"
import { Recien } from "@/components/panel/recien"
import { hojasConContexto } from "@/components/catalogos/documento"
import {
  HojaEscalada,
  useAncho,
} from "@/components/catalogos/editor/vista-previa"

/*
 * El probador: tu catálogo en grande y las plantillas en miniatura. Tocar una
 * la prueba —tu catálogo cambia en el lugar— y "Usar esta plantilla" la
 * confirma. Antes eran dieciséis muestras una debajo de otra y tocar ya era
 * elegir: no se podía comparar.
 *
 * La galería de antes (`galeria.tsx`) sigue: la usa la app hasta que pase a
 * esta.
 */

interface Opcion {
  id: string
  nombre: string
  detalle: string
  hoja: string
  catalogo: Catalogo
}

function useAncha() {
  const [ancha, setAncha] = React.useState(false)
  React.useEffect(() => {
    const consulta = window.matchMedia("(min-width: 1024px)")
    const cambiar = () => setAncha(consulta.matches)
    cambiar()
    consulta.addEventListener("change", cambiar)
    return () => consulta.removeEventListener("change", cambiar)
  }, [])
  return ancha
}

export function Probador({
  sugeridos,
  claves = CLAVES_PLANTILLA,
  productos,
  datos,
  estilo,
  nombre,
  packs,
  actual,
  alUsar,
  alVolver,
}: {
  sugeridos: EstiloSugerido[]
  claves?: readonly ClavePlantilla[]
  productos: ProductoDelCatalogo[]
  datos: DatosDelCatalogo
  estilo: Estilo
  nombre: string
  packs?: Pack[]
  /** La plantilla del catálogo que se está editando, si se llega desde ahí. */
  actual?: ClavePlantilla
  alUsar: (catalogo: Catalogo) => void
  /** Volver sin cambiar: si la elegida es la que ya tiene. */
  alVolver?: () => void
}) {
  const ancha = useAncha()
  const tienda = React.useMemo(
    () => ({ nombre: datos.tienda.nombre, whatsapp: datos.tienda.whatsapp }),
    [datos]
  )

  const deLaTienda = React.useMemo<Opcion[]>(
    () =>
      sugeridos.map((sugerido) => ({
        id: `estilo:${sugerido.clave}`,
        nombre: sugerido.nombre,
        detalle: sugerido.detalle,
        hoja: HOJAS[PLANTILLAS_DE_CATALOGO[sugerido.plantilla].hoja].nombre,
        catalogo: armarConEstilo(sugerido, {
          nombre,
          productos,
          tienda,
          packs,
        }),
      })),
    [sugeridos, nombre, productos, tienda, packs]
  )
  const todas = React.useMemo<Opcion[]>(
    () =>
      claves.map((clave) => {
        const plantilla = PLANTILLAS_DE_CATALOGO[clave]
        return {
          id: `plantilla:${clave}`,
          nombre: plantilla.nombre,
          detalle: plantilla.detalle,
          hoja: HOJAS[plantilla.hoja].nombre,
          catalogo: armarCatalogo({
            plantilla: clave,
            nombre,
            productos,
            tienda,
            estilo,
            packs,
          }),
        }
      }),
    [claves, nombre, productos, tienda, estilo, packs]
  )

  const inicial = actual
    ? `plantilla:${actual}`
    : (deLaTienda[0]?.id ?? todas[0]?.id ?? "")
  const [elegida, setElegida] = React.useState(inicial)
  const opcion =
    [...deLaTienda, ...todas].find((o) => o.id === elegida) ??
    deLaTienda[0] ??
    todas[0]
  const hojas = React.useMemo(
    () => (opcion ? hojasConContexto(opcion.catalogo, datos) : []),
    [opcion, datos]
  )
  const esLaQueTiene = Boolean(actual) && elegida === `plantilla:${actual}`

  if (!opcion) return null

  const accion = esLaQueTiene ? (
    <button
      type="button"
      onClick={alVolver}
      className={cn(BOTON_SECUNDARIO, "w-full lg:w-auto")}
    >
      Volver al catálogo
    </button>
  ) : (
    <button
      type="button"
      onClick={() => alUsar(opcion.catalogo)}
      className={cn(BOTON_PRIMARIO, "w-full lg:w-auto")}
    >
      <Check aria-hidden="true" className="size-5" />
      Usar esta plantilla
    </button>
  )

  const titulo = (
    <div className="min-w-0">
      <p className="font-titular text-xl leading-tight font-extrabold tracking-[-0.02em]">
        <Recien valor={opcion.id}>{opcion.nombre}</Recien>
      </p>
      <p className="mt-0.5 text-sm opacity-70">
        <Contador valor={hojas.length} />{" "}
        {hojas.length === 1 ? "hoja" : "hojas"} · {opcion.hoja}
      </p>
      <p className="mt-1 max-w-[52ch] text-sm leading-relaxed opacity-75">
        {opcion.detalle}
      </p>
    </div>
  )

  const grupos = (
    <>
      {deLaTienda.length > 0 ? (
        <Grupo
          icono={Palette}
          titulo="Con el estilo de tu tienda"
          opciones={deLaTienda}
          elegida={elegida}
          actual={actual ? `plantilla:${actual}` : null}
          datos={datos}
          ancha={ancha}
          alProbar={setElegida}
        />
      ) : null}
      <Grupo
        icono={LayoutTemplate}
        titulo="Todas las plantillas"
        opciones={todas}
        elegida={elegida}
        actual={actual ? `plantilla:${actual}` : null}
        datos={datos}
        ancha={ancha}
        alProbar={setElegida}
      />
    </>
  )

  if (ancha) {
    return (
      <div className="grid grid-cols-[24rem_minmax(0,1fr)] items-start gap-8">
        <div className="flex flex-col gap-6">{grupos}</div>
        <section
          aria-label="Tu catálogo con esta plantilla"
          className="sticky top-6 flex min-w-0 flex-col border border-tinta"
        >
          <header className="flex items-start justify-between gap-6 border-b border-tinta/15 px-5 py-4">
            {titulo}
            <div className="shrink-0">{accion}</div>
          </header>
          <HojasGrandes key={opcion.id} hojas={hojas} columnas={2} />
        </section>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      <HojasGrandes key={opcion.id} hojas={hojas} columnas={1} />
      {titulo}
      {grupos}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-tinta bg-papel px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {accion}
      </div>
    </div>
  )
}

/**
 * Las hojas de la plantilla que se está probando. En la pantalla ancha, de a
 * dos y con desplazamiento propio; en el celular, una franja que se desliza y
 * deja asomar la siguiente.
 */
function HojasGrandes({
  hojas,
  columnas,
}: {
  hojas: ReturnType<typeof hojasConContexto>
  columnas: 1 | 2
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>()

  if (columnas === 2) {
    const anchoDeHoja = Math.max(0, (ancho - 20) / 2)
    return (
      <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto bg-tinta/[0.04] px-5 py-6">
        <div ref={ref} className="grid grid-cols-2 gap-5">
          {anchoDeHoja > 0
            ? hojas.map(({ hoja, ctx }, indice) => (
                <figure
                  key={ctx.numero}
                  className="cambio-entra flex flex-col gap-1.5"
                  style={{ animationDelay: `${Math.min(indice, 6) * 60}ms` }}
                >
                  <HojaEscalada
                    hoja={hoja}
                    ctx={ctx}
                    ancho={anchoDeHoja}
                    className="ring-1 ring-tinta/15"
                  />
                  <figcaption className="tabular text-xs opacity-65">
                    Hoja {ctx.numero} de {ctx.total}
                  </figcaption>
                </figure>
              ))
            : null}
        </div>
      </div>
    )
  }

  const anchoDeHoja = Math.round(ancho * 0.74)
  return (
    <div
      ref={ref}
      className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:none] gap-3 overflow-x-auto bg-tinta/[0.04] px-4 py-5 [&::-webkit-scrollbar]:hidden"
    >
      {anchoDeHoja > 0
        ? hojas.map(({ hoja, ctx }, indice) => (
            <figure
              key={ctx.numero}
              className="cambio-entra flex shrink-0 snap-start flex-col gap-1.5"
              style={{ animationDelay: `${Math.min(indice, 4) * 60}ms` }}
            >
              <HojaEscalada
                hoja={hoja}
                ctx={ctx}
                ancho={anchoDeHoja}
                className="ring-1 ring-tinta/15"
              />
              <figcaption className="tabular text-xs opacity-65">
                Hoja {ctx.numero} de {ctx.total}
              </figcaption>
            </figure>
          ))
        : null}
    </div>
  )
}

function Grupo({
  icono: Icono,
  titulo,
  opciones,
  elegida,
  actual,
  datos,
  ancha,
  alProbar,
}: {
  icono: typeof Palette
  titulo: string
  opciones: Opcion[]
  elegida: string
  actual: string | null
  datos: DatosDelCatalogo
  ancha: boolean
  alProbar: (id: string) => void
}) {
  return (
    <section className={cn(ancha && "border border-tinta")}>
      <h3
        className={cn(
          "flex items-center gap-2 font-titular font-bold tracking-[-0.01em]",
          ancha ? "border-b border-tinta/15 px-5 py-3.5 text-base" : "mb-2.5"
        )}
      >
        <Icono aria-hidden="true" className="size-[18px]" />
        {titulo}
      </h3>
      <ul
        className={cn(
          ancha
            ? "grid grid-cols-3 gap-x-3 gap-y-4 p-4"
            : "-mx-4 flex snap-x [scrollbar-width:none] gap-3 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden"
        )}
      >
        {opciones.map((opcion) => (
          <li key={opcion.id} className={cn(!ancha && "shrink-0 snap-start")}>
            <Miniatura
              opcion={opcion}
              datos={datos}
              ancho={ancha ? 100 : 76}
              elegida={opcion.id === elegida}
              laQueTiene={opcion.id === actual}
              alProbar={() => alProbar(opcion.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Miniatura({
  opcion,
  datos,
  ancho,
  elegida,
  laQueTiene,
  alProbar,
}: {
  opcion: Opcion
  datos: DatosDelCatalogo
  ancho: number
  elegida: boolean
  laQueTiene: boolean
  alProbar: () => void
}) {
  const primera = React.useMemo(
    () => hojasConContexto(opcion.catalogo, datos)[0],
    [opcion.catalogo, datos]
  )
  return (
    <button
      type="button"
      onClick={alProbar}
      aria-pressed={elegida}
      className="group flex w-full flex-col items-start gap-1.5 text-left"
      style={{ width: ancho }}
    >
      <span
        className={cn(
          "relative block transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-active:scale-[0.97]",
          elegida
            ? "ring-2 ring-tinta ring-offset-2 ring-offset-papel"
            : "ring-1 ring-tinta/15 group-hover:ring-tinta/50 motion-safe:group-hover:-translate-y-0.5"
        )}
      >
        {primera ? (
          <HojaEscalada hoja={primera.hoja} ctx={primera.ctx} ancho={ancho} />
        ) : (
          <span
            className="block bg-tinta/[0.06]"
            style={{ width: ancho, height: ancho * 1.41 }}
          />
        )}
        {elegida ? (
          <span
            aria-hidden="true"
            className="numero-entra absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-tinta text-papel"
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "line-clamp-2 text-xs leading-snug",
          elegida ? "font-semibold" : "opacity-75"
        )}
      >
        {opcion.nombre}
      </span>
      {laQueTiene ? (
        <span className="text-[10px] font-semibold tracking-[0.1em] uppercase opacity-65">
          La que tienes
        </span>
      ) : null}
    </button>
  )
}
