import { cn } from "@/lib/utils"

export interface Paso {
  nombre: string
}

/** Los pasos del alta de una tienda, en un solo lugar para que no se desfasen. */
export const PASOS_CREAR: Paso[] = [
  { nombre: "Elige plantilla" },
  { nombre: "Cuenta tu negocio" },
]

/**
 * Indicador de progreso del alta de la tienda.
 *
 * Usa el mismo trazo de apertura de 2 px que corona un tema en el resto del
 * sistema: lleno para lo recorrido y lo actual, al 15% para lo que falta. No
 * hay círculos numerados ni línea de conexión; en este mundo la regla es lo
 * que marca el avance.
 */
export function Pasos({ pasos, actual }: { pasos: Paso[]; actual: number }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
        Paso {actual} de {pasos.length}
      </p>

      <ol
        className="mt-4 grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${pasos.length}, minmax(0, 1fr))`,
        }}
      >
        {pasos.map((paso, i) => {
          const recorrido = i + 1 <= actual

          return (
            <li
              key={paso.nombre}
              aria-current={i + 1 === actual ? "step" : undefined}
              className={cn(
                "border-t-2 pt-3 font-titular text-sm font-bold tracking-[-0.01em]",
                recorrido ? "border-tinta" : "border-tinta/15 opacity-45"
              )}
            >
              <span className="tabular mr-2 opacity-40">
                {String(i + 1).padStart(2, "0")}
              </span>
              {paso.nombre}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
