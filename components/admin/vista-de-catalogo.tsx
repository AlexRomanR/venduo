import type { DatosDelCatalogo } from "@/lib/catalogos/datos"
import type { Catalogo } from "@/lib/catalogos/modelo"
import {
  DibujoDeHoja,
  hojasConContexto,
} from "@/components/catalogos/documento"
import { html } from "@/components/catalogos/html"

/**
 * Las dos primeras hojas de una plantilla de catálogo, chicas, para que el
 * administrador la reconozca sin abrirla: la portada sola se parece entre
 * plantillas, la hoja de productos es la que las distingue.
 *
 * Se escalan por el alto y no por el ancho: así una hoja apaisada y una de
 * historia vertical quedan en la misma línea que las A4.
 */
export function VistaDeCatalogo({
  catalogo,
  datos,
  alto,
}: {
  catalogo: Catalogo
  datos: DatosDelCatalogo
  alto: number
}) {
  const hojas = hojasConContexto(catalogo, datos).slice(0, 2)

  return (
    <div aria-hidden="true" className="flex gap-1.5">
      {hojas.map(({ hoja, ctx }, indice) => {
        const escala = alto / ctx.hoja.alto
        return (
          <div
            key={indice}
            className="relative shrink-0 overflow-hidden ring-1 ring-tinta/15"
            style={{ width: Math.round(ctx.hoja.ancho * escala), height: alto }}
          >
            <div
              className="pointer-events-none absolute top-0 left-0 origin-top-left"
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
      })}
    </div>
  )
}
