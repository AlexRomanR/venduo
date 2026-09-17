"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ImageOff,
  Loader2,
  Lock,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  AYUDA_CAMPO,
  BOTON_PRIMARIO,
  CAMPO_LINEA,
  ETIQUETA_CAMPO,
} from "@/lib/estilos"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { PedidoInput, ResultadoPedido } from "@/app/t/[slug]/acciones"
import { useCarrito } from "@/components/tienda/carrito"

/**
 * Carrito y checkout, en una sola pantalla.
 *
 * Separarlos agrega una pantalla entre la decisión y el pedido, y el tráfico de
 * esta tienda llega de un enlace de WhatsApp con datos contados. En escritorio
 * quedan en dos columnas, con el resumen fijo al costado.
 */
export function Checkout({
  slug,
  nombreTienda,
  crear,
}: {
  slug: string
  nombreTienda: string
  crear: (entrada: PedidoInput) => Promise<ResultadoPedido>
}) {
  const router = useRouter()
  const { lineas, referido, subtotalCents, unidades, listo, cambiar, quitar } =
    useCarrito()

  const [nombre, setNombre] = React.useState("")
  const [telefono, setTelefono] = React.useState("")
  const [correo, setCorreo] = React.useState("")
  const [enCurso, setEnCurso] = React.useState(false)

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    if (enCurso || lineas.length === 0) return

    setEnCurso(true)
    const resultado = await crear({
      nombre,
      telefono,
      correo,
      referido,
      items: lineas.map((l) => ({
        productoId: l.productoId,
        cantidad: l.cantidad,
      })),
    })

    if (!resultado.ok || !resultado.pedidoId) {
      setEnCurso(false)
      toast.error(resultado.error ?? "No pudimos tomar el pedido.")
      return
    }

    // El carrito se vacía en la pantalla de pago, no acá: si algo fallara en el
    // camino, el comprador se quedaría sin carrito y sin pedido.
    router.push(`/t/${slug}/pedido/${resultado.pedidoId}`)
  }

  if (!listo) {
    return (
      <div className="py-20 text-center opacity-40">
        <Loader2 aria-hidden="true" className="mx-auto size-6 animate-spin" />
      </div>
    )
  }

  if (lineas.length === 0) {
    return (
      <div className="border-t-2 border-tinta py-14">
        <ShoppingBag aria-hidden="true" className="size-8 opacity-25" />
        <h2 className="mt-5 font-titular text-2xl font-extrabold tracking-[-0.03em]">
          Tu carrito está vacío.
        </h2>
        <p className="mt-3 max-w-[46ch] leading-relaxed opacity-70">
          Mira el catálogo de {nombreTienda} y agrega lo que te guste. No pagas
          nada hasta coordinar con la tienda.
        </p>
        <Link
          href={`/t/${slug}`}
          className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-sm bg-senal px-6 font-semibold text-white transition-colors hover:bg-senal-alta"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Ver el catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
      <section>
        <h2 className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          Tu carrito · {unidades} {unidades === 1 ? "artículo" : "artículos"}
        </h2>

        <ul className="mt-6 flex flex-col">
          {lineas.map((linea) => (
            <li
              key={linea.productoId}
              className="flex gap-4 border-t border-tinta/15 py-5 first:border-t-0 first:pt-0"
            >
              <Link
                href={`/t/${slug}/p/${linea.productoId}`}
                className="size-20 shrink-0 overflow-hidden border border-tinta/15 bg-tinta/5 sm:size-24"
              >
                {linea.imagen ? (
                  <Image
                    src={linea.imagen}
                    alt={linea.nombre}
                    width={192}
                    height={192}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center">
                    <ImageOff
                      aria-hidden="true"
                      className="size-5 opacity-25"
                    />
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <h3 className="min-w-0 flex-1 font-titular text-base font-bold tracking-[-0.01em]">
                    <Link
                      href={`/t/${slug}/p/${linea.productoId}`}
                      className="transition-colors hover:text-senal"
                    >
                      {linea.nombre}
                    </Link>
                  </h3>
                  <p className="tabular font-titular font-bold">
                    {formatMoney(linea.precioCents * linea.cantidad)}
                  </p>
                </div>

                <p className="tabular mt-1 text-xs opacity-45">
                  {formatMoney(linea.precioCents)} cada uno
                </p>

                <div className="mt-3 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      cambiar(linea.productoId, linea.cantidad - 1)
                    }
                    aria-label={`Quitar una unidad de ${linea.nombre}`}
                    className="flex size-11 items-center justify-center border border-tinta/25 transition-colors hover:border-senal hover:text-senal"
                  >
                    <Minus aria-hidden="true" className="size-3.5" />
                  </button>
                  <span
                    aria-live="polite"
                    className="tabular flex h-11 w-11 items-center justify-center font-semibold"
                  >
                    {linea.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      cambiar(linea.productoId, linea.cantidad + 1)
                    }
                    disabled={linea.cantidad >= linea.stock}
                    aria-label={`Agregar una unidad de ${linea.nombre}`}
                    className="flex size-11 items-center justify-center border border-tinta/25 transition-colors hover:border-senal hover:text-senal disabled:opacity-30"
                  >
                    <Plus aria-hidden="true" className="size-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => quitar(linea.productoId)}
                    aria-label={`Quitar ${linea.nombre} del carrito`}
                    className="ml-auto flex size-11 items-center justify-center opacity-40 transition-colors hover:text-senal hover:opacity-100"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </div>

                {linea.cantidad >= linea.stock ? (
                  <p className="mt-2 text-xs text-senal">
                    Es todo el stock que queda.
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        <Link
          href={`/t/${slug}`}
          className="group mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
        >
          <ArrowLeft
            aria-hidden="true"
            className="size-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none"
          />
          Seguir comprando
        </Link>
      </section>

      <section className="lg:sticky lg:top-24 lg:self-start">
        <form onSubmit={enviar} className="border-t-2 border-tinta pt-7">
          <h2 className="font-titular text-xl font-bold tracking-[-0.02em]">
            Tus datos
          </h2>
          <p className="mt-2 max-w-[44ch] text-sm leading-relaxed opacity-60">
            La tienda los usa para coordinar la entrega. No se publican en
            ningún lado.
          </p>

          <div className="mt-7 grid gap-6">
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
                Por aquí se coordina la entrega y el pago.
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

          <dl className="mt-8 border-t border-tinta/15 pt-5">
            <div className="flex items-baseline justify-between">
              <dt className="text-sm opacity-60">Subtotal</dt>
              <dd className="tabular text-sm">{formatMoney(subtotalCents)}</dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <dt className="text-sm opacity-60">Entrega</dt>
              <dd className="text-sm opacity-60">Se coordina por WhatsApp</dd>
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t-2 border-tinta pt-4">
              <dt className="font-titular text-lg font-bold tracking-[-0.02em]">
                Total
              </dt>
              <dd className="tabular font-titular text-2xl font-extrabold tracking-[-0.03em]">
                {formatMoney(subtotalCents)}
              </dd>
            </div>
          </dl>

          {referido ? (
            <p className="mt-5 border-l-2 border-senal pl-4 text-sm leading-relaxed opacity-70">
              Tu compra queda referida al vendedor{" "}
              <span className="font-semibold text-senal">{referido}</span>.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={enCurso}
            className={cn(BOTON_PRIMARIO, "mt-7 w-full")}
          >
            {enCurso ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : null}
            Confirmar pedido
          </button>

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed opacity-50">
            <Lock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            Todavía no pagas nada. En el paso siguiente ves el QR de la tienda
            para transferir, y subes tu comprobante.
          </p>
        </form>
      </section>
    </div>
  )
}
