"use client"

import * as React from "react"
import { CheckCircle2, Loader2, MessageCircle, Minus, Plus } from "lucide-react"
import { toast } from "sonner"

import {
  AYUDA_CAMPO,
  BOTON_PRIMARIO,
  CAMPO_LINEA,
  ETIQUETA_CAMPO,
} from "@/lib/estilos"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Product } from "@/types"
import type { PedidoInput, ResultadoPedido } from "@/app/t/[slug]/acciones"

/**
 * Pedir un producto.
 *
 * No hay carrito y no es un olvido: la compra típica de este público es un
 * producto que vio en TikTok, desde el celular y con datos contados. Un carrito
 * agrega tres pantallas entre la decisión y el pedido.
 *
 * El precio que se muestra es informativo. El que vale lo recalcula
 * `create_order` desde el catálogo, del lado del servidor.
 */
export function FormularioPedido({
  producto,
  referido,
  crear,
}: {
  producto: Product
  /** Código del vendedor que trajo la visita, si el enlace lo traía. */
  referido: string | null
  crear: (entrada: PedidoInput) => Promise<ResultadoPedido>
}) {
  const [cantidad, setCantidad] = React.useState(1)
  const [nombre, setNombre] = React.useState("")
  const [telefono, setTelefono] = React.useState("")
  const [correo, setCorreo] = React.useState("")
  const [enCurso, setEnCurso] = React.useState(false)
  const [hecho, setHecho] = React.useState<ResultadoPedido | null>(null)

  const agotado = producto.stock === 0
  const tope = Math.max(producto.stock, 1)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    if (enCurso || agotado) return

    setEnCurso(true)
    const resultado = await crear({
      nombre,
      telefono,
      correo,
      cantidad,
      productoId: producto.id,
      referido,
    })
    setEnCurso(false)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos tomar el pedido.")
      return
    }

    setHecho(resultado)
  }

  if (hecho) {
    return (
      <div className="border-t-2 border-tinta pt-8">
        <CheckCircle2 aria-hidden="true" className="size-8 text-senal" />
        <h2 className="mt-4 font-titular text-2xl font-extrabold tracking-[-0.03em]">
          Pedido tomado.
        </h2>
        <p className="mt-3 max-w-[48ch] leading-relaxed opacity-70">
          La tienda ya lo tiene. La entrega y el pago se coordinan por WhatsApp,
          así que escríbeles para cerrar los detalles.
        </p>

        {hecho.whatsapp ? (
          <a
            href={hecho.whatsapp}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(BOTON_PRIMARIO, "mt-6 inline-flex w-full sm:w-auto")}
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Escribir por WhatsApp
          </a>
        ) : null}
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="border-t-2 border-tinta pt-8">
      <h2 className="font-titular text-xl font-bold tracking-[-0.02em]">
        {agotado ? "Sin stock por ahora" : "Pedir este producto"}
      </h2>

      {agotado ? (
        <p className="mt-3 max-w-[48ch] leading-relaxed opacity-70">
          Este producto se agotó. Escríbele a la tienda para saber cuándo
          vuelve.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className={ETIQUETA_CAMPO}>Cantidad</span>
              <div className="mt-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  disabled={cantidad <= 1}
                  aria-label="Quitar una unidad"
                  className="flex size-11 items-center justify-center border border-tinta/30 transition-colors hover:border-senal hover:text-senal disabled:opacity-30"
                >
                  <Minus aria-hidden="true" className="size-4" />
                </button>

                <span
                  aria-live="polite"
                  className="tabular flex h-11 w-14 items-center justify-center font-titular text-lg font-bold"
                >
                  {cantidad}
                </span>

                <button
                  type="button"
                  onClick={() => setCantidad((c) => Math.min(tope, c + 1))}
                  disabled={cantidad >= tope}
                  aria-label="Agregar una unidad"
                  className="flex size-11 items-center justify-center border border-tinta/30 transition-colors hover:border-senal hover:text-senal disabled:opacity-30"
                >
                  <Plus aria-hidden="true" className="size-4" />
                </button>
              </div>
            </div>

            <p className="tabular font-titular text-2xl font-extrabold tracking-[-0.03em]">
              {formatMoney(producto.price_cents * cantidad)}
            </p>
          </div>

          <div className="mt-8 grid gap-6">
            <label className="block">
              <span className={ETIQUETA_CAMPO}>Tu nombre</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                maxLength={120}
                autoComplete="name"
                className={cn(CAMPO_LINEA, "mt-2 w-full outline-none")}
              />
            </label>

            <label className="block">
              <span className={ETIQUETA_CAMPO}>Tu WhatsApp</span>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
                type="tel"
                inputMode="tel"
                placeholder="70000000"
                autoComplete="tel"
                className={cn(CAMPO_LINEA, "mt-2 w-full outline-none")}
              />
              <span className={cn(AYUDA_CAMPO, "mt-2 block")}>
                Por acá se coordina la entrega y el pago.
              </span>
            </label>

            <label className="block">
              <span className={ETIQUETA_CAMPO}>Tu correo (opcional)</span>
              <input
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                type="email"
                autoComplete="email"
                className={cn(CAMPO_LINEA, "mt-2 w-full outline-none")}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={enCurso}
            className={cn(BOTON_PRIMARIO, "mt-8 w-full sm:w-auto")}
          >
            {enCurso ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            Hacer el pedido
          </button>

          <p className={cn(AYUDA_CAMPO, "mt-4 max-w-[52ch] leading-relaxed")}>
            No se paga nada ahora. El pedido queda registrado y la tienda te
            escribe para coordinar.
          </p>
        </>
      )}
    </form>
  )
}
