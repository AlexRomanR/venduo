import type { VARIANTES } from "@/lib/catalogos/constantes"

/**
 * Cada diseño de una parte de productos, dibujado: se elige mirando, sin tener
 * que saber qué es una grilla. Bloques llenos para las fotos y rayas para el
 * texto, en el color de la ficha.
 */

type Diseno = keyof (typeof VARIANTES)["productos"]

const FOTO = "rounded-[2px] bg-current opacity-80"
const RAYA = "h-1 rounded-full bg-current opacity-45"

function Fotos({ cuantas, clase }: { cuantas: number; clase: string }) {
  return (
    <span className={clase}>
      {Array.from({ length: cuantas }, (_, indice) => (
        <span key={indice} className={FOTO} />
      ))}
    </span>
  )
}

function Renglones({ conFoto = false }: { conFoto?: boolean }) {
  return (
    <span className="flex h-full flex-col justify-between">
      {[0, 1, 2].map((fila) => (
        <span key={fila} className="flex items-center gap-1">
          {conFoto ? <span className={`size-2.5 shrink-0 ${FOTO}`} /> : null}
          <span className={`flex-1 ${RAYA}`} />
          {conFoto ? null : <span className="h-1 w-2 bg-current opacity-80" />}
        </span>
      ))}
    </span>
  )
}

const DIBUJOS: Record<Diseno, React.ReactNode> = {
  grilla: <Fotos cuantas={6} clase="grid h-full grid-cols-3 gap-0.5" />,
  lista: <Renglones conFoto />,
  menu: <Renglones />,
  tabla: (
    <span className="grid h-full grid-cols-3 grid-rows-3 gap-px border border-current opacity-70">
      {Array.from({ length: 9 }, (_, indice) => (
        <span key={indice} className="border-[0.5px] border-current" />
      ))}
    </span>
  ),
  destacado: (
    <span className="flex h-full flex-col gap-0.5">
      <span className={`flex-1 ${FOTO}`} />
      <span className={RAYA} />
    </span>
  ),
  lookbook: (
    <span className="grid h-full grid-cols-[2fr_1fr] gap-0.5">
      <span className={FOTO} />
      <Fotos cuantas={2} clase="grid gap-0.5" />
    </span>
  ),
  pedestal: (
    <span className="flex h-full flex-col items-center justify-end gap-0.5">
      <span className={`h-5 w-5 rounded-t-full bg-current opacity-80`} />
      <span className={`w-8 ${RAYA}`} />
    </span>
  ),
  historia: (
    <span className="flex h-full justify-center">
      <span className={`h-full w-4 ${FOTO}`} />
    </span>
  ),
  etiquetas: (
    <span className="grid h-full grid-cols-2 gap-1">
      {[0, 1, 2, 3].map((etiqueta) => (
        <span
          key={etiqueta}
          className="rounded-[2px] border border-current opacity-80"
        />
      ))}
    </span>
  ),
  flyer: (
    <span className="flex h-full flex-col gap-0.5">
      <span className="h-1.5 w-2/3 bg-current opacity-80" />
      <Fotos cuantas={2} clase="grid flex-1 grid-cols-2 gap-0.5" />
      <span className={RAYA} />
    </span>
  ),
}

export function EsquemaDeProductos({ diseno }: { diseno: Diseno }) {
  return (
    <span aria-hidden="true" className="block h-8 w-12">
      {DIBUJOS[diseno]}
    </span>
  )
}
