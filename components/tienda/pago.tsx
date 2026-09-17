"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  CheckCircle2,
  Copy,
  ImageUp,
  Loader2,
  MessageCircle,
  QrCode,
} from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { formatMoney } from "@/lib/format"
import { BUCKETS, uploadPrivateFile } from "@/lib/supabase/storage"
import { cn } from "@/lib/utils"
import type { PedidoPublicoConTienda as PedidoPublico } from "@/lib/data/tienda-publica"
import { useCarrito } from "@/components/tienda/carrito"

/**
 * Pagar el pedido.
 *
 * Venduo no procesa el cobro: muestra el QR del comercio, guarda el
 * comprobante y abre la conversación. Eso es deliberado y está en la
 * especificación —el cobro queda entre las dos personas—, así que la pantalla
 * tiene que ser honesta sobre qué pasa después y no fingir una pasarela.
 */
export function Pago({
  pedido,
  adjuntar,
}: {
  pedido: PedidoPublico
  adjuntar: (
    pedidoId: string,
    url: string
  ) => Promise<{ ok: boolean; error?: string }>
}) {
  const { vaciar } = useCarrito()
  const entrada = React.useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = React.useState(false)
  const [listo, setListo] = React.useState(pedido.tieneComprobante)

  // El pedido ya está en la base: el carrito cumplió su función y dejarlo
  // lleno haría que el siguiente pedido duplique todo.
  React.useEffect(() => {
    vaciar()
  }, [vaciar])

  const whatsapp = React.useMemo(() => {
    const texto = `Hola ${pedido.tienda.nombre}, soy ${pedido.comprador}. Acabo de hacer el pedido #${pedido.numero} por ${formatMoney(pedido.totalCents)} en su tienda de Venduo.`
    const numero = pedido.tienda.whatsapp?.replace(/\D/g, "") ?? ""
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
  }, [pedido])

  async function subir(archivo: File | undefined) {
    if (!archivo) return

    setSubiendo(true)
    try {
      // Se guarda la ruta y no una URL: el comprobante vive en un bucket
      // privado, y quien lo suba no puede firmarlo ni leerlo de vuelta.
      const subida = await uploadPrivateFile(
        BUCKETS.paymentProofs,
        archivo,
        pedido.id
      )
      const resultado = await adjuntar(pedido.id, subida.path)

      if (!resultado.ok) {
        toast.error(resultado.error ?? "No pudimos guardar el comprobante.")
        return
      }

      setListo(true)
      toast.success("Comprobante recibido.")
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.includes("MB")
          ? error.message
          : "No pudimos subir esa imagen. Prueba con otra."
      )
    } finally {
      setSubiendo(false)
      if (entrada.current) entrada.current.value = ""
    }
  }

  if (listo) {
    return <Confirmado pedido={pedido} whatsapp={whatsapp} />
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
      <section>
        <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          Pedido #{pedido.numero}
        </p>
        <h1 className="mt-3 max-w-[16ch] font-titular text-[clamp(1.75rem,5vw,2.75rem)] leading-[1.03] font-extrabold tracking-[-0.03em]">
          Ya casi. Falta el pago.
        </h1>
        <p className="mt-4 max-w-[48ch] leading-relaxed opacity-70">
          Transfiere el total al QR de {pedido.tienda.nombre} y sube la captura.
          Cuando la tienda lo confirme, coordinan la entrega por WhatsApp.
        </p>

        <ul className="mt-9 border-t-2 border-tinta pt-5">
          {pedido.items.map((item, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between gap-4 border-b border-tinta/15 py-3 last:border-b-0"
            >
              <span className="min-w-0 flex-1">
                <span className="tabular mr-2 opacity-45">
                  {item.cantidad}×
                </span>
                {item.nombre}
              </span>
              <span className="tabular shrink-0 font-semibold">
                {formatMoney(item.totalCents)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-baseline justify-between border-t-2 border-tinta pt-5">
          <span className="font-titular text-lg font-bold tracking-[-0.02em]">
            Total a pagar
          </span>
          <span className="tabular font-titular text-[clamp(1.75rem,6vw,2.5rem)] leading-none font-extrabold tracking-[-0.04em] text-senal">
            {formatMoney(pedido.totalCents)}
          </span>
        </div>
      </section>

      <section>
        <div className="border-2 border-tinta p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
            Paso 1 · Transfiere
          </p>

          {pedido.tienda.qrUrl ? (
            <div className="mx-auto mt-6 w-full max-w-[280px]">
              <Image
                src={pedido.tienda.qrUrl}
                alt={`QR de pago de ${pedido.tienda.nombre}`}
                width={560}
                height={560}
                unoptimized
                className="w-full border border-tinta/15 bg-white object-contain"
              />
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center border border-dashed border-tinta/30 px-5 py-10 text-center">
              <QrCode aria-hidden="true" className="size-8 opacity-25" />
              <p className="mt-4 max-w-[34ch] text-sm leading-relaxed opacity-60">
                Esta tienda todavía no cargó su QR de pago. Escríbeles por
                WhatsApp y te pasan los datos para transferir.
              </p>
            </div>
          )}

          {pedido.tienda.instrucciones ? (
            <div className="mt-6 border-t border-tinta/15 pt-5">
              <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
                Datos de la cuenta
              </p>
              <p className="mt-2 leading-relaxed whitespace-pre-line">
                {pedido.tienda.instrucciones}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              navigator.clipboard
                ?.writeText(String(pedido.totalCents / 100))
                .then(() => toast.success("Monto copiado."))
                .catch(() => toast.error("No pudimos copiarlo."))
            }}
            className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
          >
            <Copy aria-hidden="true" className="size-4" />
            Copiar el monto exacto
          </button>
        </div>

        <div className="mt-6 border-2 border-tinta p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
            Paso 2 · Sube tu comprobante
          </p>
          <p className="mt-3 max-w-[44ch] text-sm leading-relaxed opacity-70">
            La captura de la transferencia. Es lo que la tienda mira para
            confirmar tu pedido.
          </p>

          <button
            type="button"
            onClick={() => entrada.current?.click()}
            disabled={subiendo}
            className={cn(BOTON_PRIMARIO, "mt-6 w-full")}
          >
            {subiendo ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <ImageUp aria-hidden="true" className="size-4" />
            )}
            {subiendo ? "Subiendo…" : "Subir comprobante"}
          </button>

          <input
            ref={entrada}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            capture="environment"
            className="sr-only"
            onChange={(e) => subir(e.target.files?.[0])}
          />

          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(BOTON_SECUNDARIO, "mt-3 w-full")}
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Escribir a la tienda
          </a>
        </div>
      </section>
    </div>
  )
}

function Confirmado({
  pedido,
  whatsapp,
}: {
  pedido: PedidoPublico
  whatsapp: string
}) {
  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-senal" />

      <p className="mt-7 text-xs font-semibold tracking-[0.12em] text-senal uppercase">
        Pedido #{pedido.numero}
      </p>
      <h1 className="mt-3 font-titular text-[clamp(2rem,7vw,3.25rem)] leading-[1.02] font-extrabold tracking-[-0.04em]">
        Listo, {pedido.comprador.split(" ")[0]}.
      </h1>
      <p className="mx-auto mt-5 max-w-[46ch] text-lg leading-relaxed opacity-70">
        {pedido.tienda.nombre} ya tiene tu pedido y tu comprobante. Ahora
        coordinan la entrega contigo por WhatsApp.
      </p>

      <dl className="mx-auto mt-10 max-w-sm border-t-2 border-tinta pt-5 text-left">
        <div className="flex items-baseline justify-between py-2">
          <dt className="text-sm opacity-60">Número de pedido</dt>
          <dd className="tabular font-semibold">#{pedido.numero}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-tinta/15 py-2">
          <dt className="text-sm opacity-60">Artículos</dt>
          <dd className="tabular font-semibold">
            {pedido.items.reduce((t, i) => t + i.cantidad, 0)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-tinta/15 py-2">
          <dt className="text-sm opacity-60">Total</dt>
          <dd className="tabular font-titular text-lg font-bold">
            {formatMoney(pedido.totalCents)}
          </dd>
        </div>
      </dl>

      <a
        href={whatsapp}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(BOTON_PRIMARIO, "mt-9 w-full sm:mx-auto sm:w-auto")}
      >
        <MessageCircle aria-hidden="true" className="size-4" />
        Coordinar la entrega
      </a>

      <p className="mt-8 text-sm opacity-50">
        Guarda este enlace: acá puedes volver a ver tu pedido.
      </p>

      <Link
        href={`/t/${pedido.tienda.slug}`}
        className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold transition-colors hover:text-senal"
      >
        Seguir viendo {pedido.tienda.nombre}
      </Link>
    </div>
  )
}
