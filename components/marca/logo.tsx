import { CAJA_JUSTA, CELULAR, MOSTRADOR, RAYAS } from "@/lib/marca"
import { cn } from "@/lib/utils"

/**
 * El símbolo de Venduo: la feria en el celular.
 *
 * El cuerpo va en `currentColor` y las rayas del toldo en vino claro
 * (`toldo`), así que sobre un fondo oscuro basta con poner el texto en papel.
 * Solo en el mundo de Venduo. Las reglas están en `.agents/rules/marca.md`.
 */
export function Simbolo({
  className,
  titulo,
}: {
  className?: string
  /** Si va solo, sin el nombre al lado: lo que lee un lector de pantalla. */
  titulo?: string
}) {
  return (
    <svg
      viewBox={CAJA_JUSTA}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
      className={cn("size-6 shrink-0", className)}
    >
      <path fill="currentColor" fillRule="evenodd" d={CELULAR} />
      {RAYAS.map((raya) => (
        <path
          key={raya.d}
          d={raya.d}
          className={raya.senal ? "fill-toldo" : undefined}
          fill={raya.senal ? undefined : "currentColor"}
        />
      ))}
      <path fill="currentColor" d={MOSTRADOR} />
    </svg>
  )
}

/**
 * El símbolo y el nombre. El nombre es texto vivo y toma la letra y el tamaño
 * de donde se ponga; el símbolo crece con él.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[0.36em] font-titular font-extrabold tracking-[-0.02em]",
        className
      )}
    >
      <Simbolo className="size-[1.4em]" />
      Venduo
    </span>
  )
}
