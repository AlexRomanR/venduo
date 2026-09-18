"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CircleDollarSign,
  Clock3,
  Loader2,
  LockKeyhole,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import {
  abrirDisputa,
  confirmarRecepcion,
  simularPago,
} from "@/app/(marketplace)/pedido/acciones"
import { formatDate, formatMoney } from "@/lib/format"
import type { PedidoPublicoConTienda } from "@/lib/data/tienda-publica"

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: "Esperando pago",
  pagado: "Pago retenido",
  enviado: "En camino",
  entregado: "Entregado y liberado",
  en_disputa: "Pago congelado",
  cancelado: "Cancelado",
}

export function PagoProtegido({ pedido }: { pedido: PedidoPublicoConTienda }) {
  const router = useRouter()
  const [enCurso, setEnCurso] = React.useState<string | null>(null)
  const [reclamar, setReclamar] = React.useState(false)
  const [motivo, setMotivo] = React.useState("")

  const whatsapp = pedido.tienda.whatsapp?.replace(/\D/g, "")
  const mensaje = `Hola ${pedido.tienda.nombre}, soy ${pedido.comprador}. Quiero coordinar la entrega del pedido #${pedido.numero} de Venduo.`

  async function pagar() {
    setEnCurso("pagar")
    const resultado = await simularPago(pedido.id)
    setEnCurso(null)
    if (!resultado.ok) return toast.error(resultado.error)
    toast.success("Pago confirmado y retenido por PagoFácil.")
    router.refresh()
  }

  async function recibir() {
    if (
      !window.confirm(
        "¿Confirmas que recibiste el pedido en buenas condiciones?"
      )
    )
      return
    setEnCurso("recibir")
    const resultado = await confirmarRecepcion(pedido.id)
    setEnCurso(null)
    if (!resultado.ok) return toast.error(resultado.error)
    toast.success("Entrega confirmada. Pago liberado.")
    router.refresh()
  }

  async function disputar() {
    setEnCurso("disputar")
    const resultado = await abrirDisputa(pedido.id, motivo)
    setEnCurso(null)
    if (!resultado.ok) return toast.error(resultado.error)
    toast.success("Reclamo abierto. El pago quedó congelado.")
    setReclamar(false)
    router.refresh()
  }

  return (
    <article className="border-t-2 border-tinta pt-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-senal uppercase">
            Pedido #{pedido.numero}
          </p>
          <h2 className="mt-2 font-titular text-2xl font-extrabold tracking-[-0.03em]">
            {pedido.tienda.nombre}
          </h2>
        </div>
        <span className="inline-flex min-h-8 items-center border border-tinta/30 px-3 text-xs font-semibold tracking-[0.08em] uppercase">
          {ETIQUETA_ESTADO[pedido.estado] ?? pedido.estado}
        </span>
      </div>

      <ul className="mt-6">
        {pedido.items.map((item, indice) => (
          <li
            key={`${item.nombre}-${indice}`}
            className="flex items-baseline justify-between gap-4 border-b border-tinta/15 py-3 first:border-t first:border-tinta/15"
          >
            <span className="min-w-0">
              <span className="tabular mr-2 opacity-45">{item.cantidad}×</span>
              {item.nombre}
            </span>
            <span className="tabular shrink-0 font-semibold">
              {formatMoney(item.totalCents)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-baseline justify-between gap-5">
        <span className="font-titular text-lg font-bold">Total</span>
        <span className="tabular font-titular text-3xl font-extrabold tracking-[-0.04em]">
          {formatMoney(pedido.totalCents)}
        </span>
      </div>

      {pedido.estado === "pendiente" ? (
        <div className="mt-7 border-2 border-tinta p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-tinta text-papel">
              <CircleDollarSign aria-hidden="true" className="size-5" />
            </div>
            <div>
              <h3 className="font-titular text-xl font-bold tracking-[-0.02em]">
                PagoFácil protegido
              </h3>
              <p className="mt-2 max-w-[52ch] text-sm leading-relaxed opacity-65">
                Esta pasarela es una simulación del MVP. Al pagar, PagoFácil
                confirma el cobro y retiene el monto; Venduo no lo recibe.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={pagar}
            disabled={enCurso !== null}
            className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-plantilla bg-senal px-6 font-semibold text-white hover:bg-senal-alta disabled:opacity-60"
          >
            {enCurso === "pagar" ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <LockKeyhole aria-hidden="true" className="size-4" />
            )}
            Pagar {formatMoney(pedido.totalCents)} y retener
          </button>
          <p className="mt-3 text-center text-xs opacity-45">
            No se hace un cargo real en esta simulación.
          </p>
        </div>
      ) : null}

      {pedido.estado !== "pendiente" ? (
        <div className="mt-7 bg-tinta px-5 py-6 text-papel sm:px-7">
          <div className="flex items-start gap-3">
            {pedido.estado === "en_disputa" ? (
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-senal"
              />
            ) : (
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-senal"
              />
            )}
            <div>
              <h3 className="font-titular text-xl font-bold tracking-[-0.02em]">
                {pedido.estado === "en_disputa"
                  ? "El pago está congelado."
                  : pedido.estado === "entregado"
                    ? "Pago liberado y repartido."
                    : "Tu dinero está retenido."}
              </h3>
              <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-papel/65">
                {pedido.estado === "en_disputa"
                  ? "Venduo revisará el reclamo antes de liberar o devolver el monto."
                  : pedido.estado === "entregado"
                    ? "PagoFácil repartió directamente al negocio, al promotor cuando corresponde y a Venduo."
                    : "Nadie puede retirar el monto hasta que la entrega quede confirmada."}
              </p>
              {pedido.paymentReference ? (
                <p className="tabular mt-4 text-xs text-papel/45">
                  Referencia {pedido.paymentReference}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {pedido.estado !== "pendiente" && pedido.estado !== "cancelado" ? (
        <ol className="mt-7 grid gap-0 sm:grid-cols-3">
          <Paso
            icono={BadgeCheck}
            titulo="Pago confirmado"
            detalle={
              pedido.pagadoEn
                ? formatDate(pedido.pagadoEn)
                : "PagoFácil lo confirmó"
            }
            listo={Boolean(pedido.pagadoEn)}
          />
          <Paso
            icono={PackageCheck}
            titulo="Pedido enviado"
            detalle={
              pedido.enviadoEn
                ? formatDate(pedido.enviadoEn)
                : "El negocio lo marcará"
            }
            listo={Boolean(pedido.enviadoEn)}
          />
          <Paso
            icono={Check}
            titulo="Entrega confirmada"
            detalle={
              pedido.entregadoEn
                ? formatDate(pedido.entregadoEn)
                : "Tú confirmas al recibir"
            }
            listo={Boolean(pedido.entregadoEn)}
          />
        </ol>
      ) : null}

      {pedido.estado === "pagado" || pedido.estado === "enviado" ? (
        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          {pedido.estado === "enviado" ? (
            <button
              type="button"
              onClick={recibir}
              disabled={enCurso !== null}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-plantilla bg-senal px-5 font-semibold text-white hover:bg-senal-alta disabled:opacity-60"
            >
              {enCurso === "recibir" ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Check aria-hidden="true" className="size-4" />
              )}
              Lo recibí en buenas condiciones
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setReclamar((actual) => !actual)}
            className="flex min-h-12 items-center justify-center border-2 border-tinta px-5 font-semibold hover:bg-tinta hover:text-papel"
          >
            Tengo un problema
          </button>
        </div>
      ) : null}

      {reclamar ? (
        <div className="mt-4 border border-tinta/25 p-5">
          <label>
            <span className="text-sm font-semibold">Cuéntanos qué pasó</span>
            <textarea
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              rows={4}
              maxLength={500}
              placeholder="El producto no llegó, llegó dañado o no coincide con lo publicado…"
              className="mt-3 w-full resize-y border border-tinta/30 bg-transparent p-3 outline-none placeholder:text-tinta/35 focus:border-senal"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={disputar}
              disabled={enCurso !== null || motivo.trim().length < 10}
              className="flex min-h-11 items-center gap-2 bg-tinta px-4 text-sm font-semibold text-papel disabled:opacity-40"
            >
              {enCurso === "disputar" ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : null}
              Congelar pago y reclamar
            </button>
            <button
              type="button"
              onClick={() => setReclamar(false)}
              className="min-h-11 px-4 text-sm font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {whatsapp && pedido.estado !== "cancelado" ? (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:text-senal"
        >
          <MessageCircle aria-hidden="true" className="size-4" />
          Coordinar entrega por WhatsApp
        </a>
      ) : null}

      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed opacity-50">
        <Clock3 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        Guarda esta página. El enlace es tu comprobante y seguimiento del
        pedido.
      </p>
      <Link
        href={`/negocio/${pedido.tienda.slug}`}
        className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold hover:text-senal"
      >
        Ver más de {pedido.tienda.nombre}
      </Link>
    </article>
  )
}

function Paso({
  icono: Icono,
  titulo,
  detalle,
  listo,
}: {
  icono: typeof Check
  titulo: string
  detalle: string
  listo: boolean
}) {
  return (
    <li className="flex gap-3 border-t border-tinta/20 py-4 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0">
      <Icono
        aria-hidden="true"
        className={`mt-0.5 size-4 shrink-0 ${listo ? "text-senal" : "opacity-25"}`}
      />
      <div>
        <p className="text-sm font-semibold">{titulo}</p>
        <p className="mt-1 text-xs opacity-50">{detalle}</p>
      </div>
    </li>
  )
}
