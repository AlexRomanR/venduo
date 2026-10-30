"use client"

import * as React from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { HojaDeAjuste } from "@/components/panel/ajustes"
import {
  BOTON_PRIMARIO,
  FICHA,
  FICHA_ELEGIDA,
  FICHA_LIBRE,
  GRILLA_DE_FICHAS,
} from "@/lib/estilos"
import { PERIODOS, type Periodo } from "@/lib/exportar"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

/** El enlace que va arriba de una lista: "Descargar", como el de categorías. */
export const ENLACE_DE_PANEL =
  "inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold underline underline-offset-4 transition-colors hover:text-senal disabled:opacity-50"

/**
 * Baja un archivo de una ruta del panel. Con `fetch` y no con un enlace: así
 * se puede decir "Preparando…" mientras se arma y avisar si falla, en vez de
 * abrir una página de error.
 */
async function descargar(url: string): Promise<boolean> {
  try {
    const respuesta = await fetch(url, { cache: "no-store" })
    if (!respuesta.ok) return false
    const nombre =
      /filename="([^"]+)"/.exec(
        respuesta.headers.get("Content-Disposition") ?? ""
      )?.[1] ?? "planilla.xlsx"
    const enlace = document.createElement("a")
    enlace.href = URL.createObjectURL(await respuesta.blob())
    enlace.download = nombre
    document.body.append(enlace)
    enlace.click()
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(enlace.href), 10_000)
    return true
  } catch {
    return false
  }
}

function avisar(bien: boolean, esDemo: boolean) {
  if (!bien) {
    toast.error("No pudimos preparar la planilla. Inténtalo de nuevo.")
  } else if (esDemo) {
    toast.info("Estás en modo demo: la planilla sale con datos de ejemplo.")
  } else {
    toast.success("Planilla descargada.")
  }
}

/** Productos: baja directo, sin preguntar nada. */
export function DescargarProductos({ esDemo }: { esDemo: boolean }) {
  const [preparando, setPreparando] = React.useState(false)
  return (
    <button
      type="button"
      disabled={preparando}
      onClick={async () => {
        setPreparando(true)
        avisar(await descargar("/panel/exportar/productos"), esDemo)
        setPreparando(false)
      }}
      className={ENLACE_DE_PANEL}
    >
      {preparando ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Download aria-hidden="true" className="size-4" />
      )}
      {preparando ? "Preparando…" : "Descargar"}
    </button>
  )
}

/** Pedidos: una hoja para elegir el período. */
export function DescargarPedidos({
  cuentas,
  textos,
  esDemo,
}: {
  cuentas: Record<Periodo, number>
  /** Lo que cubre cada período: "Del 1 al 23 de octubre". */
  textos: Record<Periodo, string>
  esDemo: boolean
}) {
  const [abierta, setAbierta] = React.useState(false)
  const [periodo, setPeriodo] = React.useState<Periodo>("este-mes")
  const [preparando, setPreparando] = React.useState(false)
  const cuantos = cuentas[periodo]

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className={ENLACE_DE_PANEL}
      >
        <Download aria-hidden="true" className="size-4" />
        Descargar
      </button>
      <HojaDeAjuste
        abierta={abierta}
        titulo="Descargar tus pedidos"
        descripcion="Se abre en Excel o Google Sheets."
        alCerrar={() => setAbierta(false)}
        pie={
          <button
            type="button"
            disabled={cuantos === 0 || preparando}
            onClick={async () => {
              setPreparando(true)
              const bien = await descargar(
                `/panel/exportar/pedidos?periodo=${periodo}`
              )
              setPreparando(false)
              avisar(bien, esDemo)
              if (bien) setAbierta(false)
            }}
            className={cn(BOTON_PRIMARIO, "w-full")}
          >
            {preparando ? (
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            ) : cuantos > 0 ? (
              <Download aria-hidden="true" className="size-5" />
            ) : null}
            {preparando
              ? "Preparando…"
              : cuantos === 0
                ? "Nada para descargar"
                : `Descargar ${formatNumber(cuantos)} ${cuantos === 1 ? "pedido" : "pedidos"}`}
          </button>
        }
      >
        <div
          role="radiogroup"
          aria-label="Qué pedidos"
          className={GRILLA_DE_FICHAS}
        >
          {PERIODOS.map(({ valor, nombre }) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={periodo === valor}
              onClick={() => setPeriodo(valor)}
              className={cn(
                FICHA,
                "w-full justify-center",
                periodo === valor ? FICHA_ELEGIDA : FICHA_LIBRE
              )}
            >
              <span className="truncate">{nombre}</span>
            </button>
          ))}
        </div>
        <p className="mt-5 font-titular text-2xl leading-tight font-extrabold tracking-[-0.02em]">
          <span className="tabular">{formatNumber(cuantos)}</span>{" "}
          {cuantos === 1 ? "pedido" : "pedidos"}
        </p>
        <p className="text-sm text-tinta/65">
          {cuantos === 0 ? "No hay pedidos en este período." : textos[periodo]}
        </p>
      </HojaDeAjuste>
    </>
  )
}
