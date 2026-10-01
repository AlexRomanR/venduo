import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BLOQUE_ESQUELETO,
  EsqueletoDelTablero,
} from "@/components/panel/tablero/esqueleto"

/**
 * El titular y su bajada, con las medidas de los de verdad: así el contenido
 * entra sin mover nada de lugar.
 */
function Titular({ conVolver = false }: { conVolver?: boolean }) {
  return (
    <div>
      {conVolver ? (
        <Skeleton className={cn(BLOQUE_ESQUELETO, "mb-6 h-11 w-36")} />
      ) : null}
      <Skeleton
        className={cn(
          BLOQUE_ESQUELETO,
          "h-[clamp(1.75rem,5vw,2.5rem)] w-full max-w-xs"
        )}
      />
      <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-4 h-4 w-full max-w-md")} />
      <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-2 h-4 w-2/3 max-w-sm")} />
    </div>
  )
}

function Lista() {
  return (
    <>
      <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, indice) => (
          <div key={indice} className="border-t-2 border-tinta/15 pt-4">
            <Skeleton className={cn(BLOQUE_ESQUELETO, "h-3 w-24")} />
            <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-3 h-8 w-28")} />
            <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-2 h-3 w-36")} />
          </div>
        ))}
      </div>

      <div className="border-t border-tinta/15 pt-10">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_, indice) => (
            <Skeleton
              key={indice}
              className={cn(BLOQUE_ESQUELETO, "h-11 w-24")}
            />
          ))}
        </div>
        <div className="mt-10 flex flex-col">
          {Array.from({ length: 5 }, (_, indice) => (
            <div
              key={indice}
              className="flex items-center gap-4 border-b border-tinta/15 py-4"
            >
              <Skeleton className={cn(BLOQUE_ESQUELETO, "size-11 shrink-0")} />
              <div className="flex-1">
                <Skeleton className={cn(BLOQUE_ESQUELETO, "h-4 w-1/2")} />
                <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-2 h-3 w-1/3")} />
              </div>
              <Skeleton className={cn(BLOQUE_ESQUELETO, "h-4 w-16")} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function Formulario() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 5 }, (_, indice) => (
        <div key={indice}>
          <Skeleton className={cn(BLOQUE_ESQUELETO, "h-4 w-28")} />
          <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-2 h-11 w-full")} />
        </div>
      ))}
      <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-2 h-11 w-40")} />
    </div>
  )
}

/**
 * Lo que se ve de una pantalla del panel mientras llegan sus datos.
 *
 * Existe para que tocar la barra responda en el acto: sin esto la pantalla
 * anterior se quedaba quieta hasta que la nueva estuviera entera, y parecía
 * que el toque no había entrado. Va en el `loading.tsx` de cada sección, con
 * la forma de lo que viene —una lista con sus cifras, o un formulario— y no
 * una rueda girando.
 */
export function EsqueletoDePantalla({
  forma = "lista",
  volver = false,
}: {
  forma?: "lista" | "formulario"
  /** Una pantalla de detalle: centrada, con su enlace de vuelta arriba. */
  volver?: boolean
}) {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando"
      className={cn(
        "flex flex-col gap-12",
        volver && "mx-auto w-full max-w-3xl"
      )}
    >
      <Titular conVolver={volver} />
      {forma === "lista" ? <Lista /> : <Formulario />}
    </div>
  )
}

/** El Resumen mientras carga: la cabecera con su sello y después el tablero. */
export function EsqueletoDelResumen() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando tu resumen"
      className="flex flex-col gap-6 md:gap-8"
    >
      <div className="flex items-end gap-4 md:gap-6">
        <Skeleton
          className={cn(
            BLOQUE_ESQUELETO,
            "size-14 shrink-0 md:aspect-[4/3] md:h-auto md:w-44"
          )}
        />
        <div className="min-w-0 flex-1">
          <Skeleton className={cn(BLOQUE_ESQUELETO, "h-3 w-20")} />
          <Skeleton
            className={cn(
              BLOQUE_ESQUELETO,
              "mt-2 h-[clamp(1.75rem,5vw,2.5rem)] w-full max-w-xs"
            )}
          />
          <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-3 h-4 w-48")} />
        </div>
      </div>

      <EsqueletoDelTablero />
    </div>
  )
}
