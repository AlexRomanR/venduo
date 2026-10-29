"use client"

import * as React from "react"
import { ChevronRight, Minus, Plus, X, type LucideIcon } from "lucide-react"

import { CURRENCY_SYMBOL } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"

/*
 * Las piezas de una pantalla para crear o editar algo, "por filas": arriba lo
 * esencial escrito ahí mismo, y cada dato opcional una fila con su valor a la
 * vista que se abre en una hoja. La receta está en `ui-styling.md` ("Crear o
 * editar algo") y en la skill `pantalla-por-filas`.
 *
 *   <ul className="border border-tinta">
 *     <Fila icono={FolderOpen} titulo="Categoría" valor="Ropa" alTocar={…} />
 *     <Palanca icono={Eye} titulo="Visible en tu tienda" valor={…} alCambiar={…} />
 *   </ul>
 *   <HojaDeAjuste abierta={…} titulo="Categoría" descripcion="…" alCerrar={…}>
 *     …el único ajuste de esa fila…
 *   </HojaDeAjuste>
 */

/** Un monto escrito: vacío es "sin valor", no cero. */
export function leerMonto(texto: string) {
  return texto === "" ? null : Number(texto)
}

export function ErrorDeAjuste({ texto }: { texto?: string }) {
  return texto ? <p className="text-sm text-senal">{texto}</p> : null
}

/**
 * Un ajuste del producto: su nombre, lo que tiene ahora y la flecha que abre
 * su hoja. `apagado` es el valor vacío ("Ninguna", "No"), que se lee más bajo.
 */
export function Fila({
  icono: Icono,
  titulo,
  valor,
  apagado = false,
  peligro = false,
  error,
  detalle,
  soloLectura = false,
  alTocar,
}: {
  icono: LucideIcon
  titulo: string
  valor: string
  apagado?: boolean
  peligro?: boolean
  error?: string
  /** Un texto entero bajo el título, sin cortar: una nota se lee completa. */
  detalle?: string
  /** Se ve pero no se toca: en el modo demo o con el panel bloqueado. */
  soloLectura?: boolean
  alTocar: () => void
}) {
  const contenido = (
    <>
      <Icono
        aria-hidden="true"
        className={cn(
          "size-5 shrink-0",
          error && "text-senal",
          detalle && "mt-0.5 self-start"
        )}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("font-semibold", error && "text-senal")}>
          {titulo}
        </span>
        {error ? <span className="text-sm text-senal">{error}</span> : null}
        {detalle ? (
          <span className="mt-1 text-sm break-words whitespace-pre-line">
            {detalle}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "max-w-[45%] truncate text-right",
          apagado ? "text-tinta/55" : "font-semibold",
          peligro && "text-senal",
          detalle && "self-start pt-0.5"
        )}
      >
        {valor}
      </span>
      {soloLectura ? null : (
        <ChevronRight
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 opacity-55",
            detalle && "mt-1.5 self-start"
          )}
        />
      )}
    </>
  )
  const clases = "flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left"

  return (
    <li className="border-t border-tinta/15 first:border-t-0">
      {soloLectura ? (
        <div className={cn(clases, detalle && "py-3")}>{contenido}</div>
      ) : (
        <button
          type="button"
          onClick={alTocar}
          className={cn(
            clases,
            "transition-colors hover:bg-tinta/[0.04] active:bg-tinta/[0.07]",
            detalle && "py-3"
          )}
        >
          {contenido}
        </button>
      )}
    </li>
  )
}

/** Un sí o no que se cambia ahí mismo: la fila entera es el interruptor. */
export function Palanca({
  icono: Icono,
  titulo,
  valor,
  alCambiar,
}: {
  icono: LucideIcon
  titulo: string
  valor: boolean
  alCambiar: (valor: boolean) => void
}) {
  return (
    <li className="border-t border-tinta/15 first:border-t-0">
      <button
        type="button"
        role="switch"
        aria-checked={valor}
        onClick={() => alCambiar(!valor)}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-tinta/[0.04]"
      >
        <Icono aria-hidden="true" className="size-5 shrink-0" />
        <span className="flex-1 font-semibold">{titulo}</span>
        <span
          aria-hidden="true"
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full border-2 border-tinta transition-colors",
            valor ? "bg-tinta" : "bg-transparent"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full transition-[left,background-color] duration-150 motion-reduce:transition-none",
              valor ? "left-[1.375rem] bg-papel" : "left-0.5 bg-tinta"
            )}
          />
        </span>
      </button>
    </li>
  )
}

/** Unidades con más y menos: lo que más se cambia, sin abrir nada. */
export function Cantidad({
  etiqueta,
  valor,
  alCambiar,
  minimo = 0,
  maximo = 999_999,
  error = false,
  angosta = false,
}: {
  etiqueta: string
  valor: number
  alCambiar: (valor: number) => void
  /** Una línea de una venta no baja de 1: quitarla se hace en su hoja. */
  minimo?: number
  maximo?: number
  error?: boolean
  /** El número más estrecho, para una fila que también lleva foto y nombre. */
  angosta?: boolean
}) {
  const acotar = (n: number) => Math.min(maximo, Math.max(minimo, n))
  const borde = error ? "border-senal" : "border-tinta"
  // Lo que se está escribiendo: puede quedar vacío un momento. Sin esto, con
  // mínimo 1, borrar dejaba "1" y escribir "2" daba 12.
  const [escrito, setEscrito] = React.useState<string | null>(null)
  return (
    <div
      role="group"
      aria-label={etiqueta}
      className={cn("flex h-11 shrink-0 items-stretch border", borde)}
    >
      <button
        type="button"
        onClick={() => alCambiar(acotar(valor - 1))}
        disabled={valor <= minimo}
        aria-label="Una menos"
        className="flex w-11 items-center justify-center transition-colors hover:bg-tinta hover:text-papel disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-tinta"
      >
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={minimo}
        max={maximo}
        value={escrito ?? valor}
        onChange={(e) => {
          const cifras = e.target.value.replace(/\D/g, "")
          setEscrito(cifras)
          if (cifras !== "") alCambiar(acotar(Number(cifras)))
        }}
        onBlur={() => setEscrito(null)}
        onFocus={(e) => e.target.select()}
        aria-label={etiqueta}
        className={cn(
          "tabular [appearance:textfield] border-x bg-transparent text-center font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          borde,
          angosta ? "w-10" : "w-14",
          error && "text-senal"
        )}
      />
      <button
        type="button"
        onClick={() => alCambiar(acotar(valor + 1))}
        disabled={valor >= maximo}
        aria-label="Una más"
        className="flex w-11 items-center justify-center transition-colors hover:bg-tinta hover:text-papel disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-tinta"
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}

/** Un monto en bolivianos, grande, para escribir dentro de una hoja. */
export function CampoMonto({
  id,
  etiqueta,
  valor,
  alCambiar,
  error,
  enfocar = false,
}: {
  id: string
  etiqueta: string
  valor: number | null
  alCambiar: (valor: number | null) => void
  error?: string
  enfocar?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {etiqueta}
      </label>
      <div
        className={cn(
          "flex items-baseline gap-2 border-b-2 border-tinta focus-within:border-senal",
          error && "border-senal"
        )}
      >
        <span className="font-titular text-xl font-extrabold text-tinta/50">
          {CURRENCY_SYMBOL}
        </span>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0"
          autoFocus={enfocar}
          value={valor ?? ""}
          onChange={(e) => alCambiar(leerMonto(e.target.value))}
          className="tabular min-w-0 flex-1 [appearance:textfield] bg-transparent py-1 font-titular text-3xl font-extrabold outline-none placeholder:text-tinta/25 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
      <ErrorDeAjuste texto={error} />
    </div>
  )
}

/** Si la pantalla es ancha: ahí la hoja sale del costado y no de abajo. */
function usePantallaAncha() {
  const [ancha, setAncha] = React.useState(false)
  React.useEffect(() => {
    const consulta = window.matchMedia("(min-width: 1024px)")
    const cambiar = () => setAncha(consulta.matches)
    cambiar()
    consulta.addEventListener("change", cambiar)
    return () => consulta.removeEventListener("change", cambiar)
  }, [])
  return ancha
}

/**
 * La hoja de un ajuste: sale de abajo en el celular —al alcance del pulgar— y
 * del costado en una pantalla ancha. Lo que se cambia adentro ya quedó en el
 * formulario; "Listo" solo la cierra.
 */
export function HojaDeAjuste({
  abierta,
  titulo,
  descripcion,
  alCerrar,
  sinListo = false,
  pie,
  children,
}: {
  abierta: boolean
  titulo: string
  descripcion: string
  alCerrar: () => void
  /** Para una hoja que se cierra sola al elegir, como la categoría. */
  sinListo?: boolean
  /** Otra acción en lugar de "Listo": "Agregar 3 productos". */
  pie?: React.ReactNode
  children: React.ReactNode
}) {
  const ancha = usePantallaAncha()
  return (
    <Sheet open={abierta} onOpenChange={(si) => (si ? null : alCerrar())}>
      <SheetContent
        side={ancha ? "right" : "bottom"}
        showCloseButton={false}
        className="gap-0 rounded-none border-tinta bg-papel p-0 text-tinta shadow-none data-[side=bottom]:max-h-[88dvh] data-[side=bottom]:border-t-2 data-[side=right]:w-full data-[side=right]:border-l-2 data-[side=right]:sm:max-w-md"
      >
        <div className="flex items-start gap-3 border-b border-tinta/15 px-4 pt-4 pb-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <SheetTitle className="font-titular text-xl leading-tight font-extrabold tracking-[-0.02em] text-tinta">
              {titulo}
            </SheetTitle>
            <SheetDescription className="text-sm text-tinta/65">
              {descripcion}
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center transition-colors hover:bg-tinta/[0.06]"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
          {children}
        </div>
        {sinListo ? null : pie ? (
          <div className="border-t border-tinta/15 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {pie}
          </div>
        ) : (
          <div className="border-t border-tinta/15 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={alCerrar}
              className="flex min-h-12 w-full items-center justify-center bg-tinta px-5 font-semibold text-papel transition-opacity hover:opacity-90"
            >
              Listo
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
