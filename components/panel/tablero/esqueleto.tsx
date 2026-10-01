import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/** El gris de todo esqueleto del panel: tinta muy diluida y esquina viva. */
export const BLOQUE_ESQUELETO = "rounded-none bg-tinta/[0.07]"

/** Un panel con su cabecera y algunas filas, mientras llegan los datos. */
function Panel({ filas, alto = "h-12" }: { filas: number; alto?: string }) {
  return (
    <div className="border border-tinta/25">
      <div className="flex items-center gap-3 border-b border-tinta/15 px-4 py-4 sm:px-5">
        <Skeleton className={cn(BLOQUE_ESQUELETO, "size-5")} />
        <Skeleton className={cn(BLOQUE_ESQUELETO, "h-5 w-36")} />
      </div>
      <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
        {Array.from({ length: filas }, (_, indice) => (
          <Skeleton
            key={indice}
            className={cn(BLOQUE_ESQUELETO, alto, "w-full")}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * La forma del tablero mientras se consulta la base.
 *
 * Con la forma de lo que viene —los paneles, las cuatro cifras, el gráfico—
 * y no una rueda girando: así la pantalla no salta cuando llega el contenido.
 */
export function EsqueletoDelTablero() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando tu resumen"
      className="flex flex-col gap-6 md:gap-8"
    >
      <Panel filas={2} />

      <div className="border border-tinta/25">
        <div className="flex items-center gap-3 border-b border-tinta/15 px-4 py-4 sm:px-5">
          <Skeleton className={cn(BLOQUE_ESQUELETO, "size-5")} />
          <Skeleton className={cn(BLOQUE_ESQUELETO, "h-5 w-32")} />
        </div>
        <div className="grid grid-cols-2 gap-px bg-tinta/10 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, indice) => (
            <div key={indice} className="bg-papel px-4 py-4 sm:px-5">
              <Skeleton className={cn(BLOQUE_ESQUELETO, "h-3 w-16")} />
              <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-3 h-7 w-24")} />
            </div>
          ))}
        </div>
        <div className="px-4 py-5 sm:px-5">
          <Skeleton className={cn(BLOQUE_ESQUELETO, "h-48 w-full")} />
        </div>
      </div>

      <div className="grid gap-6 md:gap-8 xl:grid-cols-2">
        <Panel filas={4} />
        <Panel filas={4} />
      </div>
    </div>
  )
}
