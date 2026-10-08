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

function DibujoCalle() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex overflow-hidden bg-tinta py-[3px] font-titular text-[length:1.719cqw] whitespace-nowrap text-papel uppercase">
        {[
          "Pedidos por WhatsApp",
          "Buzos",
          "Poleras",
          "Gorras",
          "Pedidos por WhatsApp",
        ].map((frase, i) => (
          <span key={i} className="flex items-center gap-2 pl-2">
            {frase}
            <span className="size-[3px] bg-senal-alta" />
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between border-b-2 border-tinta px-2.5 py-1.5">
        <span className="font-titular text-[length:3.75cqw] leading-none uppercase">
          Tu tienda
        </span>
        <span className="border-2 border-tinta px-1 text-[length:1.406cqw] font-bold uppercase">
          Catálogo
        </span>
      </div>
      <div className="grid h-[44%] shrink-0 grid-cols-[1.15fr_1fr] items-center gap-2 px-2.5 py-2">
        <div>
          <p className="font-titular text-[length:8.75cqw] leading-[0.84] uppercase">
            Drop
            <br />
            nuevo
          </p>
          <span className="mt-1.5 inline-block bg-tinta px-1.5 py-[2px] text-[length:1.406cqw] font-bold text-papel uppercase">
            Ver lo nuevo
          </span>
        </div>
        <div className="relative h-full border-2 border-tinta bg-tinta/15">
          <span className="absolute -bottom-1 -left-1.5 -rotate-3 border border-tinta bg-senal px-1 font-titular text-[length:1.562cqw] text-white uppercase">
            Por WhatsApp
          </span>
        </div>
      </div>
      <div className="mx-2.5 border-t-[3px] border-tinta pt-[2px] font-titular text-[length:3.125cqw] leading-none uppercase">
        Lo nuevo
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-2.5 pt-1.5">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="border-2 border-tinta">
            <div className="relative aspect-square border-b-2 border-tinta bg-tinta/[0.12]">
              {i === 1 ? (
                <span className="absolute top-0.5 right-0.5 -rotate-6 bg-senal px-[2px] font-titular text-[length:1.406cqw] text-white">
                  −20%
                </span>
              ) : null}
            </div>
            <div className="m-[3px] h-[3px] w-2/3 bg-tinta/50" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DibujoAtelier() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b-[3px] border-double border-tinta/40 px-3 py-1.5">
        <span className="font-titular text-[length:3.75cqw] leading-none font-medium italic">
          Tu tienda
        </span>
        <span className="text-[length:1.406cqw] tracking-[0.22em] uppercase opacity-70">
          Colección
        </span>
      </div>
      <div className="flex gap-3 px-3 py-[3px] text-[length:1.25cqw] tracking-[0.22em] uppercase opacity-70">
        <span className="text-senal">Todo</span>
        <span>Carteras</span>
        <span>Billeteras</span>
      </div>
      <div className="grid h-[44%] shrink-0 grid-cols-[1fr_1.1fr] items-end gap-3 px-3 pt-1.5">
        <div className="pb-1">
          <p className="font-titular text-[length:6.25cqw] leading-[0.95] font-medium tracking-[-0.03em]">
            Piezas para todos los días
          </p>
          <span className="mt-2 inline-block rounded-[3px] bg-tinta px-2 py-[2px] text-[length:1.25cqw] tracking-[0.2em] text-papel uppercase">
            Ver la colección
          </span>
        </div>
        <div className="relative h-full bg-tinta/[0.06] p-2.5">
          <div className="mx-auto mt-[22%] h-[52%] w-[70%] rounded-t-[40%] rounded-b-md bg-senal/80" />
          <span className="absolute inset-1 border border-tinta/20" />
        </div>
      </div>
      <div className="mt-2.5 flex items-end gap-2 px-3">
        <span className="font-titular text-[length:3.125cqw] leading-none font-medium tracking-[-0.03em]">
          La colección
        </span>
        <span className="mb-[3px] h-px flex-1 bg-tinta/30" />
      </div>
      <div className="grid grid-cols-3 gap-2.5 px-3 pt-1.5">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="text-center">
            <div className="flex aspect-square items-center justify-center bg-tinta/[0.06]">
              <div className="h-[46%] w-[58%] rounded-t-[40%] rounded-b-sm bg-tinta/25" />
            </div>
            <div className="mx-auto mt-1 h-[3px] w-2/3 bg-tinta/40" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DibujoPisada() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between bg-tinta px-2.5 py-1.5 text-papel">
        <span className="font-titular text-[length:3.75cqw] leading-none font-extrabold uppercase italic">
          Tu tienda
        </span>
        <span className="size-2 rounded-full border border-papel" />
      </div>
      <div className="flex gap-1 px-2.5 py-1">
        {["Todo", "Urbanas", "Running", "Botas"].map((ficha, i) => (
          <span
            key={ficha}
            className={cn(
              "rounded-full border px-1.5 py-[1px] text-[length:1.25cqw] font-bold uppercase",
              i === 0 ? "border-tinta bg-tinta text-papel" : "border-tinta/20"
            )}
          >
            {ficha}
          </span>
        ))}
      </div>
      <div className="mx-2 grid grid-cols-[1.05fr_1fr] items-center gap-2 overflow-hidden rounded-[0.6rem] bg-tinta p-2 text-papel">
        <div>
          <p className="font-titular text-[length:7.5cqw] leading-[0.84] font-extrabold uppercase italic">
            Nuevos
            <br />
            pares
          </p>
          <span className="mt-1.5 inline-block rounded-full bg-senal px-1.5 py-[2px] text-[length:1.25cqw] font-bold text-white uppercase">
            Ver los modelos
          </span>
        </div>
        <div className="aspect-square rounded-[0.45rem] bg-papel/15" />
      </div>
      <div className="mx-2.5 mt-2 flex items-center font-titular text-[length:3.125cqw] leading-none font-extrabold uppercase italic">
        <span className="mr-1 inline-block h-[0.72em] w-[0.28em] -skew-x-[14deg] bg-senal" />
        Modelos
      </div>
      <div className="grid grid-cols-4 gap-1 px-2.5 pt-1.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <div className="relative aspect-square rounded-[0.35rem] bg-tinta/[0.08]">
              {i === 2 ? (
                <span className="absolute top-0.5 left-0.5 rounded-full bg-senal px-[3px] text-[length:1.25cqw] text-white">
                  −15%
                </span>
              ) : null}
            </div>
            <div className="mt-1 h-[3px] w-3/4 bg-tinta/50" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DibujoFormula() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-tinta px-3 py-1.5">
        <span className="font-titular text-[length:3.75cqw] leading-none">
          Tu tienda
        </span>
        <span className="font-mono text-[length:1.406cqw] uppercase">
          Catálogo
        </span>
      </div>
      <div className="grid grid-cols-[1.25fr_1fr] border-b border-tinta">
        <div className="border-r border-tinta px-3 py-2">
          <p className="flex justify-between font-mono text-[length:1.25cqw] uppercase opacity-70">
            <span>Tu tienda</span>
            <span>12 frascos</span>
          </p>
          <p className="mt-2 font-titular text-[length:7.5cqw] leading-[0.88] tracking-[-0.03em]">
            Aromas de autor
          </p>
          <span className="mt-2 inline-block bg-tinta px-1.5 py-[2px] font-mono text-[length:1.25cqw] text-papel uppercase">
            Ver los frascos
          </span>
        </div>
        <div className="relative m-1.5 bg-tinta/[0.1]">
          <span className="absolute bottom-1 left-1 border border-tinta bg-papel px-1 font-mono text-[length:1.094cqw] uppercase">
            Te asesoramos
          </span>
        </div>
      </div>
      <div className="mx-3 mt-2 border-b border-tinta pb-[2px] font-titular text-[length:3.125cqw] leading-none">
        Frascos
      </div>
      <div className="grid grid-cols-3 gap-2 px-3 pt-1.5">
        {["Amaderado", "Cítrico", "Floral"].map((familia) => (
          <div key={familia}>
            <div className="aspect-[4/3] bg-tinta/[0.08]" />
            <div className="relative mx-1 -mt-1.5 border border-tinta bg-papel px-1 py-[2px]">
              <div className="font-mono text-[length:1.094cqw] uppercase opacity-70">
                {familia}
              </div>
              <div className="mt-[2px] h-[3px] w-2/3 bg-tinta/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DibujoBazar() {
  return (
    <div className="flex h-full flex-col">
      <div className="bg-senal py-[3px] text-center text-[length:1.406cqw] font-semibold text-white">
        Arma tu pedido y mándalo por WhatsApp
      </div>
      <div className="flex items-center gap-2 border-b-2 border-tinta/10 px-2.5 py-1.5">
        <span className="font-titular text-[length:3.75cqw] leading-none font-extrabold tracking-[-0.03em]">
          Tu tienda
        </span>
        <span className="ml-auto h-3 w-[38%] rounded-full bg-tinta/[0.08]" />
      </div>
      <div className="grid grid-cols-[1.1fr_1fr] items-center gap-2 px-2.5 py-2">
        <div>
          <p className="font-titular text-[length:6.875cqw] leading-[0.92] font-extrabold tracking-[-0.03em]">
            De todo un poco
          </p>
          <span className="mt-1.5 inline-block rounded-full bg-tinta px-2 py-[2px] text-[length:1.406cqw] font-semibold text-papel">
            Ver todo lo que hay
          </span>
        </div>
        <div className="relative aspect-[5/4]">
          <span className="absolute top-0 right-0 h-[54%] w-[40%] rotate-6 rounded-[0.4rem] border-2 border-papel bg-tinta/20" />
          <span className="absolute top-[4%] left-[14%] h-[78%] w-[56%] -rotate-3 rounded-[0.4rem] border-2 border-papel bg-tinta/30" />
          <span className="absolute bottom-0 left-0 h-[44%] w-[34%] -rotate-6 rounded-[0.4rem] border-2 border-papel bg-senal/70" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1 px-2.5 pt-0.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-[0.35rem] border border-tinta/10 p-[2px]"
          >
            <div className="relative aspect-square rounded-[0.25rem] bg-tinta/[0.08]">
              <span
                className={cn(
                  "absolute right-0.5 bottom-0.5 -rotate-6 rounded-full px-[3px] font-titular text-[length:1.25cqw] leading-tight font-extrabold",
                  i === 1
                    ? "bg-senal text-white"
                    : "border border-tinta bg-papel"
                )}
              >
                Bs 45
              </span>
            </div>
            <div className="mt-[3px] h-[3px] w-3/4 bg-tinta/45" />
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
  calle: DibujoCalle,
  atelier: DibujoAtelier,
  pisada: DibujoPisada,
  formula: DibujoFormula,
  bazar: DibujoBazar,
}
