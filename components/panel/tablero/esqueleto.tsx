import { cn } from "@/lib/utils"

/**
 * Lo que todavía no llegó de la base: un hueso de tinta diluida que late
 * despacio. En el cuaderno es una píldora (`pieza-hueso`); con Reducir
 * movimiento, quieto.
 */
export function Hueso({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        "pieza-hueso block animate-pulse rounded-full motion-reduce:animate-none",
        className
      )}
    />
  )
}

/** El hueso sobre la escena oscura de las ventas. */
function HuesoClaro({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        "block animate-pulse rounded-full bg-papel/15 motion-reduce:animate-none",
        className
      )}
    />
  )
}

const GIROS = ["-1.6deg", "1.3deg", "-0.9deg"]

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
          <Hueso className="h-3 w-20" />
          <Hueso className="mt-4 h-10 w-full max-w-[16rem] rounded-[14px]" />
          <Hueso className="mt-2 h-10 w-40 rounded-[14px]" />
          <Hueso className="mt-6 h-4 w-64 max-w-full" />
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {GIROS.map((giro) => (
            <div
              key={giro}
              style={{ rotate: giro }}
              className="sombra-cuaderno flex h-[9.5rem] flex-col justify-between rounded-[18px] border border-tinta/12 bg-hoja p-3 sm:h-[11rem] sm:p-4"
            >
              <Hueso className="size-5 rounded-[6px]" />
              <div>
                <Hueso className="h-8 w-3/4 rounded-[10px]" />
                <Hueso className="mt-2 h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="-mx-4 my-6 bg-tinta px-5 py-12 sm:-mx-5 sm:px-8 lg:mx-0 lg:my-10 lg:rounded-[28px] lg:px-12 lg:py-16">
        <HuesoClaro className="h-3 w-24" />
        <HuesoClaro className="mt-4 h-8 w-64 max-w-full rounded-[10px]" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <HuesoClaro className="h-4 w-36" />
            <HuesoClaro className="mt-3 h-[clamp(3rem,8vw,5rem)] w-full max-w-[22rem] rounded-[14px]" />
            <HuesoClaro className="mt-8 h-16 w-full rounded-[14px] bg-papel/10" />
          </div>
          <div className="flex h-[200px] items-end gap-[3px] lg:h-[240px]">
            {[38, 52, 30, 64, 45, 72, 50, 84, 40, 58, 66, 48].map(
              (alto, indice) => (
                <HuesoClaro
                  key={indice}
                  className="flex-1 rounded-t-[4px] rounded-b-none"
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
