"use client"

import * as React from "react"
import { StickyNote } from "lucide-react"
import { toast } from "sonner"

import { Fila, HojaDeAjuste } from "@/components/panel/ajustes"
import { Textarea } from "@/components/ui/textarea"
import { CAMPO } from "@/lib/estilos"
import { LARGO_DE_NOTA } from "@/lib/pedidos"
import { cn } from "@/lib/utils"

/**
 * La nota interna de un pedido o de una venta: "entrega el sábado", "pagó la
 * mitad". Una fila que la muestra entera y una hoja para escribirla. Solo la
 * ve la tienda: no llega a quien compra ni al mensaje de WhatsApp.
 *
 * Quien la usa decide qué hacer con el texto al cerrar la hoja: el detalle del
 * pedido lo guarda, Nueva venta lo lleva junto con la venta.
 */
export function FilaDeNota({
  nota,
  titulo,
  soloLectura = false,
  alCambiar,
}: {
  nota: string | null
  /** El título de la hoja: "Nota del pedido #291". */
  titulo: string
  soloLectura?: boolean
  /** Con el texto nuevo, ya recortado; `null` si quedó vacía. */
  alCambiar: (nota: string | null) => void
}) {
  const [abierta, setAbierta] = React.useState(false)

  return (
    <>
      <Fila
        icono={StickyNote}
        titulo="Nota"
        valor={nota ? (soloLectura ? "" : "Editar") : "Sin agregar"}
        apagado={!nota}
        detalle={nota ?? undefined}
        soloLectura={soloLectura}
        alTocar={() => setAbierta(true)}
      />
      {abierta ? (
        <HojaDeNota
          titulo={titulo}
          nota={nota}
          alCerrar={(nueva) => {
            setAbierta(false)
            if (nueva !== nota) alCambiar(nueva)
          }}
        />
      ) : null}
    </>
  )
}

function HojaDeNota({
  titulo,
  nota,
  alCerrar,
}: {
  titulo: string
  nota: string | null
  alCerrar: (nota: string | null) => void
}) {
  const [texto, setTexto] = React.useState(nota ?? "")
  const limpia = () => texto.trim() || null

  return (
    <HojaDeAjuste
      abierta
      titulo={titulo}
      descripcion="Solo la ves tú. No llega a quien compra."
      alCerrar={() => alCerrar(limpia())}
    >
      <label className="flex flex-col gap-2">
        <span className="sr-only">Nota</span>
        <Textarea
          autoFocus
          rows={4}
          value={texto}
          maxLength={LARGO_DE_NOTA}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Por ejemplo: entrega el sábado, pagó la mitad."
          className={cn("min-h-28 resize-y py-3", CAMPO)}
        />
        <span className="tabular self-end text-xs text-tinta/65">
          {texto.length} / {LARGO_DE_NOTA}
        </span>
      </label>
      {nota ? (
        <button
          type="button"
          onClick={() => alCerrar(null)}
          className="mt-2 flex min-h-11 items-center self-start text-sm font-semibold underline underline-offset-4"
        >
          Borrar nota
        </button>
      ) : null}
    </HojaDeAjuste>
  )
}

/**
 * La nota en el detalle de un pedido: se guarda al cerrar la hoja, si cambió.
 * Mientras guarda se ve la nueva; si falla, vuelve la de antes.
 */
export function NotaDelPedido({
  id,
  numero,
  nota,
  soloLectura,
  guardar,
}: {
  id: string
  numero: number
  nota: string | null
  soloLectura: boolean
  guardar: (
    id: string,
    nota: string | null
  ) => Promise<{ ok: boolean; error?: string }>
}) {
  const [actual, setActual] = React.useState(nota)

  async function cambiar(nueva: string | null) {
    const antes = actual
    setActual(nueva)
    const resultado = await guardar(id, nueva).catch(() => ({
      ok: false,
      error:
        "No pudimos guardar la nota. Revisa tu conexión e inténtalo de nuevo.",
    }))
    if (!resultado.ok) {
      setActual(antes)
      toast.error(resultado.error ?? "No pudimos guardar la nota.")
      return
    }
    toast.success(nueva ? "Nota guardada." : "Nota borrada.")
  }

  return (
    <ul className="border border-tinta">
      <FilaDeNota
        nota={actual}
        titulo={`Nota del pedido #${numero}`}
        soloLectura={soloLectura}
        alCambiar={(nueva) => void cambiar(nueva)}
      />
    </ul>
  )
}
