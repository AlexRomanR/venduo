import type { CSSProperties } from "react"

import {
  PLANTILLAS,
  plantillaDeTienda,
  type ClavePlantilla,
} from "@/lib/plantillas"
import { variablesEnLinea } from "@/lib/plantillas/apariencia"
import { cn } from "@/lib/utils"

/**
 * Una tienda en miniatura, con la identidad de su plantilla.
 *
 * Se dibuja con los tokens reales —colores, letras, radio— puestos en línea
 * sobre el recuadro, así que no tiñe la página que la contiene: la galería del
 * alta muestra dos plantillas lado a lado dentro del mundo de Venduo. Cuando
 * cambia la base de una plantilla, su miniatura cambia sola.
 *
 * Las letras van en `cqw`, relativas al ancho del recuadro y no de la pantalla:
 * la misma miniatura se ve en una tarjeta de 300 px y en el panel a 450, y en
 * píxeles fijos el texto quedaba chico en la grande.
 *
 * No usa estado ni efectos: la importan tanto la galería, que es de cliente,
 * como el panel, que es de servidor.
 */
export function Miniatura({
  clave,
  className,
}: {
  clave: string | null | undefined
  className?: string
}) {
  const plantilla = plantillaDeTienda(clave)
  const Dibujo = DIBUJOS[plantilla]

  return (
    <div
      aria-hidden="true"
      data-miniatura={plantilla}
      style={
        variablesEnLinea(PLANTILLAS[plantilla].apariencia) as CSSProperties
      }
      className={cn(
        "@container relative aspect-[4/3] w-full overflow-hidden bg-papel text-tinta select-none",
        className
      )}
    >
      <Dibujo />
    </div>
  )
}

function DibujoClasico() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-tinta/15 px-3 py-2">
        <span className="font-titular text-[length:3.438cqw] font-extrabold tracking-[-0.02em]">
          Tu tienda
        </span>
        <span className="size-2 rounded-full bg-tinta/30" />
      </div>
      <div className="px-3 pt-4">
        <p className="max-w-[14ch] font-titular text-[length:6.25cqw] leading-[0.98] font-extrabold tracking-[-0.04em]">
          Lo que vendes, a la vista.
        </p>
        <span className="mt-2.5 inline-block rounded-[3px] bg-senal px-2 py-[3px] text-[length:1.875cqw] font-semibold text-white">
          Ver el catálogo
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-1.5 border-t-2 border-tinta px-3 pt-2.5">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="aspect-square border border-tinta/15 bg-tinta/5" />
            <div className="mt-1 h-[3px] w-3/4 bg-tinta/40" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DibujoFashion() {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-tinta py-[3px] text-center text-[length:1.562cqw] font-semibold tracking-[0.2em] text-papel uppercase">
        Pedidos por WhatsApp
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-tinta px-2.5 py-1.5">
        <span className="text-[length:1.562cqw] font-semibold tracking-[0.16em] uppercase">
          Catálogo
        </span>
        <span className="font-titular text-[length:3.438cqw] font-semibold tracking-[0.08em] uppercase">
          Tu tienda
        </span>
        <span className="size-2 justify-self-end border border-tinta" />
      </div>
      <div className="flex justify-center gap-2.5 border-b border-tinta/15 py-1 text-[length:1.406cqw] font-semibold tracking-[0.14em] uppercase opacity-70">
        <span>Todo</span>
        <span>Ropa</span>
        <span>Calzado</span>
        <span>Carteras</span>
      </div>
      <div className="flex h-[42%] shrink-0 flex-col justify-end bg-gradient-to-t from-tinta to-tinta/75 px-2.5 pb-2.5">
        <p className="font-titular text-[length:7.5cqw] leading-[0.88] font-semibold tracking-[0.02em] text-papel uppercase">
          Nueva
          <br />
          temporada
        </p>
        <span className="mt-1.5 w-fit bg-papel px-1.5 py-[2px] text-[length:1.562cqw] font-semibold tracking-[0.14em] uppercase">
          Ver la colección
        </span>
      </div>
      <div className="mx-2.5 mt-2 border-b-2 border-tinta pb-[2px] font-titular text-[length:2.812cqw] font-semibold tracking-[0.02em] uppercase">
        Lo nuevo
      </div>
      <div className="grid grid-cols-4 gap-1 px-2.5 pt-1.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <div className="relative aspect-[3/4] bg-tinta/[0.12]">
              {i === 1 ? (
                <span className="absolute top-0.5 left-0.5 bg-senal px-[2px] text-[length:1.25cqw] text-white">
                  −20%
                </span>
              ) : null}
            </div>
            <div className="mt-1 h-[3px] w-3/4 bg-tinta/45" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DibujoPerfume() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-tinta/10 py-[3px] text-center text-[length:1.562cqw] tracking-[0.28em] uppercase opacity-60">
        Asesoría por WhatsApp
      </div>
      <div className="py-1.5 text-center font-titular text-[length:4.062cqw] leading-none italic">
        Tu tienda
      </div>
      <div className="flex h-[40%] shrink-0 items-center gap-3 bg-tinta px-4 text-papel">
        <div className="flex-1">
          <span className="block h-px w-4 bg-senal-alta" />
          <p className="mt-1.5 font-titular text-[length:5cqw] leading-[1.02] font-medium italic">
            Aromas que se quedan contigo
          </p>
          <span className="mt-2 inline-block rounded-full border border-papel/50 px-2 py-[2px] text-[length:1.406cqw] tracking-[0.2em] uppercase">
            Descubrir
          </span>
        </div>
        <div className="h-[78%] w-[26%] rounded-t-full border border-papel/25 bg-papel/10" />
      </div>
      <div className="pt-2.5 text-center font-titular text-[length:3.438cqw] leading-none font-medium italic">
        Los favoritos
      </div>
      <span className="mx-auto mt-1.5 block h-px w-3 bg-senal" />
      <div className="grid grid-cols-3 gap-2.5 px-4 pt-2">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="text-center">
            <div className="relative aspect-[4/5] bg-tinta/[0.07]">
              <span className="absolute inset-[3px] border border-papel/70" />
            </div>
            <div className="mx-auto mt-1 h-[3px] w-2/3 bg-tinta/35" />
            <div className="mx-auto mt-[2px] h-[2px] w-1/3 bg-tinta/20" />
          </div>
        ))}
      </div>
    </div>
  )
}

const DIBUJOS: Record<ClavePlantilla, () => React.JSX.Element> = {
  clasica: DibujoClasico,
  fashion: DibujoFashion,
  perfume: DibujoPerfume,
}
