import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import portada from "@/components/portada/portada.module.css"

/** El rótulo de cada escena: dos o tres palabras, en el bolígrafo. */
export function Rotulo({
  children,
  claro,
  className,
}: {
  children: ReactNode
  claro?: boolean
  className?: string
}) {
  return (
    <p
      className={cn(
        "js-sube text-[12.5px] font-semibold tracking-[0.12em] uppercase",
        claro ? "text-[var(--boli-claro)]" : "text-[var(--boli)]",
        className
      )}
    >
      {children}
    </p>
  )
}

/** El titular de una escena, en Archivo ancha. */
export const TITULAR = cn(
  portada.titular,
  "js-sube mt-3 text-[clamp(2rem,4vw,3.1rem)] text-balance"
)

/** La bajada debajo del titular. */
export const BAJADA =
  "js-sube mt-5 max-w-[38ch] text-[17px] leading-relaxed text-[var(--tinta)]/65"

/** Una nota a mano, en el bolígrafo. */
export function Mano({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn(portada.mano, "block text-[19px]", className)}>
      {children}
    </span>
  )
}

/** El renglón que separa una escena de la siguiente. */
export function Regla() {
  return <hr className="border-0 border-t border-[var(--regla)]" />
}
