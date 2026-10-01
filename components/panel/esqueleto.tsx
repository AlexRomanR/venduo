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

/** Un panel con su cabecera —ícono, título y bajada— mientras carga. */
function Panel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("border border-tinta/25", className)}>
      <div className="flex items-start gap-3 border-b border-tinta/15 px-4 py-3.5 sm:px-5">
        <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-0.5 size-5")} />
        <div className="flex-1">
          <Skeleton className={cn(BLOQUE_ESQUELETO, "h-5 w-40")} />
          <Skeleton
            className={cn(BLOQUE_ESQUELETO, "mt-1.5 h-3.5 w-64 max-w-full")}
          />
        </div>
      </div>
      {children}
    </div>
  )
}

function Filas({ cuantas }: { cuantas: number }) {
  return Array.from({ length: cuantas }, (_, indice) => (
    <div
      key={indice}
      className="flex items-center gap-3 border-t border-tinta/15 px-4 py-3.5 first:border-t-0 sm:px-5"
    >
      <div className="flex-1">
        <Skeleton className={cn(BLOQUE_ESQUELETO, "h-4 w-1/2")} />
        <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-2 h-3 w-1/3")} />
      </div>
      <Skeleton className={cn(BLOQUE_ESQUELETO, "h-4 w-16")} />
    </div>
  ))
}

function Lista() {
  return (
    <>
      <Panel>
        <div className="grid grid-cols-2 gap-px bg-tinta/10 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, indice) => (
            <div key={indice} className="bg-papel px-4 py-4 sm:px-5">
              <Skeleton className={cn(BLOQUE_ESQUELETO, "h-3 w-16")} />
              <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-3 h-7 w-24")} />
              <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-2 h-3 w-28")} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-wrap gap-2 border-b border-tinta/15 px-4 py-3 sm:px-5">
          {Array.from({ length: 4 }, (_, indice) => (
            <Skeleton
              key={indice}
              className={cn(BLOQUE_ESQUELETO, "h-11 w-24")}
            />
          ))}
        </div>
        <Filas cuantas={5} />
      </Panel>
    </>
  )
}

function Formulario() {
  return (
    <>
      {Array.from({ length: 3 }, (_, panel) => (
        <Panel key={panel}>
          <div className="flex flex-col gap-5 px-4 py-5 sm:px-5">
            {Array.from({ length: 2 }, (_, campo) => (
              <div key={campo}>
                <Skeleton className={cn(BLOQUE_ESQUELETO, "h-3 w-28")} />
                <Skeleton
                  className={cn(BLOQUE_ESQUELETO, "mt-3 h-11 w-full")}
                />
              </div>
            ))}
          </div>
        </Panel>
      ))}
      <Skeleton className={cn(BLOQUE_ESQUELETO, "h-12 w-40")} />
    </>
  )
}

function Detalle() {
  return (
    <>
      <Panel>
        <div className="flex flex-wrap gap-3 px-4 py-5 sm:px-5">
          {Array.from({ length: 3 }, (_, indice) => (
            <Skeleton
              key={indice}
              className={cn(BLOQUE_ESQUELETO, "h-11 w-36")}
            />
          ))}
        </div>
      </Panel>
      <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Panel>
          <Filas cuantas={3} />
        </Panel>
        <Panel>
          <Filas cuantas={4} />
        </Panel>
      </div>
    </>
  )
}

/**
 * Lo que se ve de una pantalla del panel mientras llegan sus datos.
 *
 * Existe para que tocar la barra responda en el acto: sin esto la pantalla
 * anterior se quedaba quieta hasta que la nueva estuviera entera, y parecía
 * que el toque no había entrado. Va en el `loading.tsx` de cada sección, con
 * la forma de lo que viene —sus paneles con sus cifras y su lista, un
 * formulario o el detalle de un pedido— y no una rueda girando.
 */
export function EsqueletoDePantalla({
  forma = "lista",
  volver = false,
  angosta = false,
}: {
  forma?: "lista" | "formulario" | "detalle"
  /** Una pantalla de detalle, con su enlace de vuelta arriba. */
  volver?: boolean
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
      <Titular conVolver={volver} />
      {forma === "lista" ? (
        <Lista />
      ) : forma === "detalle" ? (
        <Detalle />
      ) : (
        <Formulario />
      )}
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
