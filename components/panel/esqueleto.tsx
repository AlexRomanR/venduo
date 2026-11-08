import { ArrowLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Cabecera } from "@/components/panel/piezas"
import {
  EsqueletoDelTablero,
  Hueso,
} from "@/components/panel/tablero/esqueleto"

/*
 * Lo que se ve de una pantalla del panel mientras llegan sus datos.
 *
 * Existe para que tocar la barra responda en el acto: sin esto la pantalla
 * anterior se quedaba quieta hasta que la nueva estuviera entera, y parecía
 * que el toque no había entrado. Tiene la forma de lo que viene, en el
 * cuaderno: el titular de verdad —se sabe desde antes qué pantalla es—, y
 * debajo las notas, las tarjetas, las franjas y los tickets con huesos donde
 * van los datos. Así el contenido entra sin mover nada de lugar.
 */

/** Una tarjeta del cuaderno con la cabecera de una sección: ícono, título y bajada. */
function Tarjeta({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "pieza-tarjeta flex min-w-0 flex-col border border-tinta",
        className
      )}
    >
      <div className="flex items-start gap-3 border-b border-tinta/15 px-4 py-3.5 sm:px-5">
        <Hueso className="mt-0.5 size-5 rounded-[6px]" />
        <div className="flex-1">
          <Hueso className="h-[1.125rem] w-40" />
          <Hueso className="mt-1.5 h-3.5 w-56 max-w-full" />
        </div>
      </div>
      {children}
    </div>
  )
}

/** Las notas de arriba, torcidas como las de verdad. */
function Notas({ cuantas }: { cuantas: number }) {
  const giros = ["-1.6deg", "1.3deg", "-0.9deg"]
  return (
    <div
      className="grid grid-cols-[repeat(var(--columnas),minmax(0,1fr))] gap-2.5 pt-1 sm:gap-4 lg:grid-cols-[repeat(var(--columnas),17rem)]"
      style={{ "--columnas": cuantas } as React.CSSProperties}
    >
      {Array.from({ length: cuantas }, (_, indice) => (
        <div
          key={indice}
          style={{ rotate: giros[indice % giros.length] }}
          className="sombra-cuaderno flex min-h-[96px] flex-col justify-between rounded-[18px] border border-tinta/12 bg-hoja p-3.5 sm:p-4 lg:px-6 lg:py-5"
        >
          <Hueso className="h-3 w-20" />
          <Hueso className="mt-3 h-8 w-24 rounded-[10px] lg:h-10" />
          <Hueso className="mt-2 h-3.5 w-16" />
        </div>
      ))}
    </div>
  )
}

/** La franja de fichas para filtrar. */
function Franja() {
  return (
    <div className="flex gap-1.5 overflow-hidden border-b border-tinta/15 px-4 py-3 sm:px-5">
      {[64, 92, 84, 100].map((ancho, indice) => (
        <Hueso
          key={indice}
          className="h-11 shrink-0"
          style={{ width: ancho }}
        />
      ))}
    </div>
  )
}

/** Un ticket de pedido: lo que pidió a la izquierda, el talón a la derecha. */
function Tickets({ cuantos }: { cuantos: number }) {
  return Array.from({ length: cuantos }, (_, indice) => (
    <div
      key={indice}
      className="flex items-stretch border-t border-tinta/12 first:border-t-0"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 sm:px-5">
        <Hueso className="size-12 shrink-0 rounded-[10px]" />
        <div className="min-w-0 flex-1">
          <Hueso className="h-4 w-3/4 max-w-[14rem]" />
          <Hueso className="mt-2 h-3 w-1/2 max-w-[9rem]" />
        </div>
      </div>
      <div className="flex w-[8.5rem] shrink-0 flex-col items-end justify-center gap-2 border-l border-dashed border-tinta/25 px-3 py-3 sm:w-[9.5rem] sm:pr-5 lg:w-[10rem]">
        <Hueso className="h-[1.1rem] w-16" />
        <Hueso className="h-7 w-14 rounded-[6px]" />
      </div>
    </div>
  ))
}

/** Un producto: la foto, el nombre y su precio, y el stock con más y menos. */
function Productos({ cuantos }: { cuantos: number }) {
  return Array.from({ length: cuantos }, (_, indice) => (
    <div
      key={indice}
      className="flex items-center gap-3 border-t border-tinta/12 px-4 py-3 first:border-t-0 sm:px-5"
    >
      <Hueso className="size-[84px] shrink-0 rounded-[16px]" />
      <div className="min-w-0 flex-1">
        <Hueso className="h-4 w-3/4 max-w-[14rem]" />
        <Hueso className="mt-2 h-3.5 w-16" />
      </div>
      <div className="flex shrink-0 items-center gap-1 max-sm:hidden">
        <Hueso className="size-11" />
        <Hueso className="h-4 w-9" />
        <Hueso className="size-11" />
      </div>
    </div>
  ))
}

/** Filas de una lista cualquiera. */
function Filas({ cuantas }: { cuantas: number }) {
  return Array.from({ length: cuantas }, (_, indice) => (
    <div
      key={indice}
      className="flex items-center gap-3 border-t border-tinta/12 px-4 py-4 first:border-t-0 sm:px-5"
    >
      <div className="flex-1">
        <Hueso className="h-4 w-1/2" />
        <Hueso className="mt-2 h-3 w-1/3" />
      </div>
      <Hueso className="h-4 w-16" />
    </div>
  ))
}

/** Una rejilla de celdas: catálogos, plantillas, cifras. */
function Celdas({
  cuantas,
  alto,
  className,
}: {
  cuantas: number
  alto: string
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-2 overflow-hidden", className)}>
      {Array.from({ length: cuantas }, (_, indice) => (
        <div
          key={indice}
          className="pieza-celda -mr-px -mb-px flex flex-col gap-3 border-r border-b border-tinta/10 p-4"
        >
          <Hueso className={cn("w-full rounded-[12px]", alto)} />
          <Hueso className="h-4 w-3/4" />
          <Hueso className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function Campos({ cuantos }: { cuantos: number }) {
  return (
    <div className="flex flex-col gap-5 px-4 py-5 sm:px-5">
      {Array.from({ length: cuantos }, (_, campo) => (
        <div key={campo}>
          <Hueso className="h-3.5 w-28" />
          <Hueso className="mt-3 h-11 w-full rounded-[14px]" />
        </div>
      ))}
    </div>
  )
}

const CUERPOS = {
  pedidos: (
    <>
      <Notas cuantas={2} />
      <Tarjeta>
        <Franja />
        <Tickets cuantos={5} />
      </Tarjeta>
    </>
  ),
  productos: (
    <>
      <Notas cuantas={2} />
      <Tarjeta>
        <div className="flex h-12 items-center gap-3 border-b border-tinta/15 px-4 sm:px-5">
          <Hueso className="size-5 rounded-[6px]" />
          <Hueso className="h-4 w-40" />
        </div>
        <Franja />
        <Productos cuantos={5} />
      </Tarjeta>
    </>
  ),
  // Catálogos: pedírselo a la IA, los que ya armaste y las plantillas. Doce
  // celdas llenan las filas de a dos, de a tres y de a cuatro.
  catalogos: (
    <>
      <div className="pieza-tarjeta flex min-h-[4.5rem] items-center gap-3 border border-tinta px-4 sm:px-5">
        <Hueso className="size-5 rounded-[6px]" />
        <div className="flex-1">
          <Hueso className="h-[1.125rem] w-36" />
          <Hueso className="mt-1.5 h-3.5 w-48 max-w-full" />
        </div>
      </div>
      <Tarjeta>
        {Array.from({ length: 2 }, (_, indice) => (
          <div
            key={indice}
            className="flex items-center gap-3 border-t border-tinta/12 px-4 py-4 first:border-t-0 sm:px-5"
          >
            <Hueso className="h-[4.5rem] w-14 shrink-0 rounded-[8px]" />
            <div className="flex-1">
              <Hueso className="h-4 w-1/2" />
              <Hueso className="mt-2 h-3 w-2/3" />
            </div>
          </div>
        ))}
      </Tarjeta>
      <Tarjeta>
        <Celdas
          cuantas={12}
          alto="aspect-[3/4] max-h-40"
          className="sm:grid-cols-3 xl:grid-cols-4"
        />
      </Tarjeta>
    </>
  ),
  // Una rejilla de plantillas: armar un catálogo nuevo.
  rejilla: (
    <Tarjeta>
      <Celdas
        cuantas={12}
        alto="aspect-[3/4] max-h-40"
        className="sm:grid-cols-3 xl:grid-cols-4"
      />
    </Tarjeta>
  ),
  // Apariencia: tu plantilla con sus dos botones, la rejilla de las otras y
  // el historial.
  apariencia: (
    <>
      <Tarjeta>
        <div className="flex flex-col gap-5 px-4 py-5 sm:px-5">
          <div className="flex items-center gap-4 sm:gap-6">
            <Hueso className="aspect-[4/3] w-[8.5rem] shrink-0 rounded-[10px] sm:w-[18rem]" />
            <div className="flex-1">
              <Hueso className="h-7 w-32 rounded-[10px]" />
              <Hueso className="mt-2 h-3 w-16" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:max-w-[26rem]">
            <Hueso className="h-12" />
            <Hueso className="h-12" />
          </div>
        </div>
      </Tarjeta>
      <Tarjeta>
        <Celdas
          cuantas={6}
          alto="aspect-[4/3] rounded-[10px]"
          className="@container sm:grid-cols-3"
        />
      </Tarjeta>
      <Tarjeta>
        <Filas cuantas={3} />
      </Tarjeta>
    </>
  ),
  // Publicar: el buscador, las fichas y los productos para elegir.
  publicar: (
    <Tarjeta>
      <div className="flex h-12 items-center gap-3 border-b border-tinta/15 px-4 sm:px-5">
        <Hueso className="size-5 rounded-[6px]" />
        <Hueso className="h-4 w-40" />
      </div>
      <Franja />
      <Celdas
        cuantas={12}
        alto="aspect-square rounded-[16px]"
        className="sm:grid-cols-3 lg:grid-cols-6"
      />
    </Tarjeta>
  ),
  // Estadísticas: el período, las cifras contra el anterior y una lista; en
  // la pantalla ancha, la columna de la IA a la derecha.
  estadisticas: (
    <div className="flex flex-col gap-6 md:gap-8 xl:grid xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start xl:gap-6">
      <div className="flex min-w-0 flex-col gap-6 md:gap-8">
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((indice) => (
            <Hueso key={indice} className="h-11" />
          ))}
        </div>
        <Tarjeta>
          <Celdas cuantas={4} alto="h-7" className="@container" />
        </Tarjeta>
        <Tarjeta>
          <Filas cuantas={4} />
        </Tarjeta>
      </div>
      <div className="pieza-tarjeta hidden h-[28rem] flex-col gap-3 border border-tinta p-5 xl:flex">
        <Hueso className="h-[1.125rem] w-48" />
        <Hueso className="h-3.5 w-56" />
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2, 3].map((indice) => (
            <Hueso key={indice} className="h-10 w-full rounded-[12px]" />
          ))}
        </div>
        <Hueso className="mt-auto h-12 w-full rounded-[14px]" />
      </div>
    </div>
  ),
  lista: (
    <>
      <Tarjeta>
        <Filas cuantas={3} />
      </Tarjeta>
      <Tarjeta>
        <Filas cuantas={4} />
      </Tarjeta>
    </>
  ),
  formulario: (
    <>
      {Array.from({ length: 3 }, (_, tarjeta) => (
        <Tarjeta key={tarjeta}>
          <Campos cuantos={2} />
        </Tarjeta>
      ))}
    </>
  ),
  detalle: (
    <>
      <Tarjeta>
        <div className="flex gap-3 overflow-hidden px-4 py-5 sm:px-5">
          {Array.from({ length: 3 }, (_, indice) => (
            <Hueso key={indice} className="h-11 w-32 shrink-0" />
          ))}
        </div>
      </Tarjeta>
      <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Tarjeta>
          <Tickets cuantos={2} />
        </Tarjeta>
        <Tarjeta>
          <Filas cuantas={3} />
        </Tarjeta>
      </div>
    </>
  ),
} satisfies Record<string, React.ReactNode>

export function EsqueletoDePantalla({
  titulo,
  resaltar,
  bajada,
  forma = "lista",
  volver,
  angosta = false,
}: {
  /** El titular de la pantalla, el mismo que va a tener: no hace falta esperarlo. */
  titulo?: string
  resaltar?: string
  /** La bajada, si es fija: lo que ya se sabe no se dibuja como hueso. */
  bajada?: string
  forma?: keyof typeof CUERPOS
  /** El nombre de la pantalla de vuelta, en una de detalle: "Pedidos". */
  volver?: string
  /** Centrada y con un ancho de lectura, como los formularios largos. */
  angosta?: boolean
}) {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando"
      className={cn(
        "flex flex-col gap-6 md:gap-8",
        angosta && "mx-auto w-full max-w-3xl"
      )}
    >
      {volver ? (
        <span className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold opacity-60 max-lg:hidden">
          <ArrowLeft aria-hidden="true" className="size-4" />
          {volver}
        </span>
      ) : null}
      {titulo ? (
        <Cabecera
          titulo={titulo}
          resaltar={resaltar}
          bajada={bajada ?? <Hueso className="mt-1 h-4 w-64 max-w-full" />}
        />
      ) : (
        <div>
          <Hueso className="h-[clamp(2rem,6vw,2.9rem)] w-full max-w-xs rounded-[14px]" />
          <Hueso className="mt-4 h-4 w-full max-w-md" />
        </div>
      )}
      {CUERPOS[forma]}
    </div>
  )
}

/**
 * El Resumen mientras carga: la entrada —el nombre de la tienda al lado del
 * celular— y después las escenas, con las mismas notas de hoja.
 */
export function EsqueletoDelResumen() {
  return (
    <div aria-busy="true" aria-label="Cargando tu resumen">
      <div className="grid items-center gap-8 pt-2 pb-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6 lg:pt-4 lg:pb-16">
        <div>
          <Hueso className="h-3 w-20" />
          <Hueso className="mt-4 h-[clamp(2.6rem,7vw,5rem)] w-full max-w-[22rem] rounded-[14px]" />
          <Hueso className="mt-2 h-[clamp(2.6rem,7vw,5rem)] w-2/3 max-w-[18rem] rounded-[14px]" />
          <Hueso className="mt-5 h-9 w-56" />
          <Hueso className="mt-6 h-5 w-72 max-w-full" />
          <Hueso className="mt-8 h-[3.25rem] w-full sm:w-56" />
        </div>
        <div className="flex h-[400px] items-center justify-center lg:h-[540px]">
          <div className="sombra-cuaderno flex aspect-[9/19.2] h-[340px] flex-col gap-3 rounded-[30px] border border-tinta/12 bg-hoja p-4 pt-10 lg:h-[470px]">
            <Hueso className="h-3 w-1/2" />
            <Hueso className="h-16 w-full rounded-[14px]" />
            <Hueso className="h-16 w-full rounded-[14px]" />
            <Hueso className="h-16 w-4/5 rounded-[14px]" />
          </div>
        </div>
      </div>

      <EsqueletoDelTablero />
    </div>
  )
}
