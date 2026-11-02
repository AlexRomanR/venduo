import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/** El gris de todo esqueleto del panel: tinta muy diluida y esquina viva. */
export const BLOQUE_ESQUELETO = "rounded-none bg-tinta/[0.07]"

const REDONDO = "rounded-[14px] bg-tinta/[0.07]"

/**
 * La forma de las escenas del Resumen mientras se consulta la base: las notas
 * de "Para hoy" y la escena oscura de las ventas, con sus medidas. Así la
 * pantalla no salta cuando llega el contenido.
 */
export function EsqueletoDelTablero() {
  return (
    <div aria-busy="true" aria-label="Cargando tu resumen">
      <div className="grid gap-10 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-12 lg:py-20">
        <div>
          <Skeleton className={cn(BLOQUE_ESQUELETO, "h-3 w-20")} />
          <Skeleton className={cn(REDONDO, "mt-4 h-10 w-full max-w-[16rem]")} />
          <Skeleton className={cn(REDONDO, "mt-2 h-10 w-40")} />
          <Skeleton className={cn(BLOQUE_ESQUELETO, "mt-6 h-4 w-64")} />
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {Array.from({ length: 3 }, (_, indice) => (
            <Skeleton
              key={indice}
              className={cn(REDONDO, "h-[9.5rem] rounded-[18px] sm:h-[11rem]")}
            />
          ))}
        </div>
      </div>

      <div className="-mx-4 my-6 bg-tinta px-5 py-12 sm:-mx-5 sm:px-8 lg:mx-0 lg:my-10 lg:rounded-[28px] lg:px-12 lg:py-16">
        <Skeleton className="h-3 w-24 rounded-none bg-papel/15" />
        <Skeleton className="mt-4 h-8 w-64 max-w-full rounded-[10px] bg-papel/15" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <Skeleton className="h-4 w-36 rounded-none bg-papel/15" />
            <Skeleton className="mt-3 h-[clamp(3rem,8vw,5rem)] w-full max-w-[22rem] rounded-[14px] bg-papel/15" />
            <Skeleton className="mt-8 h-16 w-full rounded-[10px] bg-papel/10" />
          </div>
          <div className="flex h-[200px] items-end gap-[3px] lg:h-[240px]">
            {[38, 52, 30, 64, 45, 72, 50, 84, 40, 58, 66, 48].map(
              (alto, indice) => (
                <Skeleton
                  key={indice}
                  className="flex-1 rounded-t-[3px] rounded-b-none bg-papel/15"
                  style={{ height: `${alto}%` }}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
