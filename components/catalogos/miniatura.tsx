import type { DatosDelCatalogo } from "@/lib/catalogos/datos"
import type { Catalogo } from "@/lib/catalogos/modelo"
import { cn } from "@/lib/utils"
import {
  DibujoDeHoja,
  hojasConContexto,
} from "@/components/catalogos/documento"
import { html } from "@/components/catalogos/html"

/**
 * La primera hoja de un catálogo, chica, para reconocerlo en una lista.
 *
 * Se dibuja en el servidor con las mismas variantes del PDF: al teléfono llega
 * HTML y nada más, en vez de mandarle el catálogo y los productos para que la
 * arme él.
 */
export function MiniaturaDeCatalogo({
  catalogo,
  datos,
  ancho,
  className,
}: {
  catalogo: Catalogo
  datos: DatosDelCatalogo
  ancho: number
  className?: string
}) {
  const [primera] = hojasConContexto(catalogo, datos)
  if (!primera) {
    return (
      <div
        aria-hidden="true"
        className={cn("block shrink-0 bg-tinta/[0.06]", className)}
        style={{ width: ancho, height: Math.round(ancho * 1.414) }}
      />
    )
  }

  const { hoja, ctx } = primera
  const escala = ancho / ctx.hoja.ancho
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative block shrink-0 overflow-hidden ring-1 ring-tinta/15",
        className
      )}
      style={{ width: ancho, height: Math.round(ctx.hoja.alto * escala) }}
    >
      <div
        className="pointer-events-none absolute top-0 left-0 block origin-top-left"
        style={{
          width: ctx.hoja.ancho,
          height: ctx.hoja.alto,
          transform: `scale(${escala})`,
        }}
      >
        <DibujoDeHoja P={html} hoja={hoja} ctx={ctx} />
      </div>
    </div>
  )
}
