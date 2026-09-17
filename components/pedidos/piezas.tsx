"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Receipt } from "lucide-react"
import { toast } from "sonner"

import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Pedido } from "@/lib/data/pedidos"
import { ESTADOS } from "@/lib/pedidos"
import type { OrderStatus } from "@/types"

const ASPECTO: Record<OrderStatus, string> = {
  // Rojo solo en lo que pide una acción: un pedido sin gestionar. Si todos los
  // estados fueran de color, el acento dejaría de señalar nada.
  pendiente: "border-senal text-senal",
  pagado: "border-tinta text-tinta",
  enviado: "border-tinta/40 text-tinta/70",
  entregado: "border-tinta/25 text-tinta/45",
  cancelado: "border-tinta/25 text-tinta/40 line-through",
}

export function Estado({ estado }: { estado: OrderStatus }) {
  const etiqueta = ESTADOS.find((e) => e.valor === estado)?.etiqueta ?? estado

  return (
    <span
      className={cn(
        "inline-flex shrink-0 border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase",
        ASPECTO[estado]
      )}
    >
      {etiqueta}
    </span>
  )
}

/** De quién vino la venta. Es lo que decide si alguien cobra comisión. */
export function Origen({ pedido }: { pedido: Pedido }) {
  if (!pedido.vendedor) {
    return <span className="text-xs opacity-45">Venta directa</span>
  }

  return (
    <span className="text-xs">
      <span className="opacity-45">Vendió </span>
      <span className="font-semibold text-senal">{pedido.vendedor.nombre}</span>
    </span>
  )
}

/**
 * Ver el comprobante.
 *
 * Se pide al hacer clic y no al cargar la lista: la URL viene firmada por una
 * hora, y firmar veinte de una vez para que se miren dos es trabajo tirado.
 */
export function BotonComprobante({
  pedidoId,
  ver,
  compacto = false,
}: {
  pedidoId: string
  ver: (id: string) => Promise<{ ok: boolean; url?: string; error?: string }>
  compacto?: boolean
}) {
  const [cargando, setCargando] = React.useState(false)

  async function abrir() {
    setCargando(true)
    const resultado = await ver(pedidoId)
    setCargando(false)

    if (!resultado.ok || !resultado.url) {
      toast.error(resultado.error ?? "No pudimos abrir el comprobante.")
      return
    }

    window.open(resultado.url, "_blank", "noopener,noreferrer")
  }

  return (
    <button
      type="button"
      onClick={abrir}
      disabled={cargando}
      className={cn(
        "flex min-h-11 items-center gap-2 text-xs font-semibold transition-colors hover:text-senal",
        compacto
          ? ""
          : "border-2 border-tinta px-4 hover:bg-tinta hover:text-papel"
      )}
    >
      {cargando ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Receipt aria-hidden="true" className="size-4" />
      )}
      Ver comprobante
    </button>
  )
}

/**
 * Cambiar el estado.
 *
 * Cada paso avisa qué va a pasar además de cambiar la etiqueta, porque lo que
 * pasa no es obvio: marcar pagado le acredita la comisión al vendedor, y
 * cancelar devuelve el stock al catálogo.
 */
export function CambiarEstado({
  pedido,
  cambiar,
  soloLectura = false,
}: {
  pedido: Pedido
  cambiar: (
    id: string,
    estado: OrderStatus
  ) => Promise<{ ok: boolean; error?: string }>
  soloLectura?: boolean
}) {
  const router = useRouter()
  const [enCurso, setEnCurso] = React.useState<OrderStatus | null>(null)

  const siguientes = PASOS[pedido.estado]

  async function aplicar(estado: OrderStatus, aviso: string) {
    if (soloLectura) {
      toast.info("Estás en modo demo: los cambios no se guardan.")
      return
    }

    if (estado === "cancelado") {
      const confirmar = window.confirm(
        `¿Cancelar el pedido #${pedido.numero}? El stock vuelve a tu catálogo` +
          (pedido.vendedor ? " y la comisión de su vendedor se anula." : ".")
      )
      if (!confirmar) return
    }

    setEnCurso(estado)
    const resultado = await cambiar(pedido.id, estado)
    setEnCurso(null)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos cambiar el estado.")
      return
    }

    toast.success(aviso)
    router.refresh()
  }

  if (siguientes.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {siguientes.map((paso) => (
        <button
          key={paso.estado}
          type="button"
          onClick={() => aplicar(paso.estado, paso.aviso)}
          disabled={enCurso !== null}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-plantilla px-4 text-sm font-semibold transition-colors disabled:opacity-50",
            paso.principal
              ? "bg-senal text-white hover:bg-senal-alta"
              : "border-2 border-tinta hover:bg-tinta hover:text-papel"
          )}
        >
          {enCurso === paso.estado ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {paso.texto}
        </button>
      ))}
    </div>
  )
}

interface Paso {
  estado: OrderStatus
  texto: string
  aviso: string
  principal?: boolean
}

/** El camino de un pedido. Un entregado o cancelado ya no se mueve. */
const PASOS: Record<OrderStatus, Paso[]> = {
  pendiente: [
    {
      estado: "pagado",
      texto: "Confirmar el pago",
      aviso: "Pago confirmado. Si vino de un vendedor, su comisión ya está.",
      principal: true,
    },
    { estado: "cancelado", texto: "Cancelar", aviso: "Pedido cancelado." },
  ],
  pagado: [
    {
      estado: "enviado",
      texto: "Marcar como enviado",
      aviso: "Marcado como enviado.",
      principal: true,
    },
    { estado: "cancelado", texto: "Cancelar", aviso: "Pedido cancelado." },
  ],
  enviado: [
    {
      estado: "entregado",
      texto: "Marcar como entregado",
      aviso: "Entregado. Pedido cerrado.",
      principal: true,
    },
  ],
  entregado: [],
  cancelado: [],
}

/** Una fila de la lista. */
export function FilaPedido({
  pedido,
  ver,
}: {
  pedido: Pedido
  ver: (id: string) => Promise<{ ok: boolean; url?: string; error?: string }>
}) {
  return (
    <li className="border-t border-tinta/15 py-5 first:border-t-0">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link
              href={`/panel/pedidos/${pedido.id}`}
              className="tabular inline-flex min-h-11 items-center font-titular text-base font-bold tracking-[-0.01em] transition-colors hover:text-senal"
            >
              #{pedido.numero}
            </Link>
            <Estado estado={pedido.estado} />
            {pedido.estado === "pendiente" && pedido.comprobante ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.12em] text-senal uppercase">
                <Receipt aria-hidden="true" className="size-3" />
                Con comprobante
              </span>
            ) : null}
          </div>

          <p className="mt-2 font-semibold">{pedido.comprador}</p>
          <p className="tabular mt-0.5 text-sm opacity-55">{pedido.telefono}</p>

          <p className="mt-2">
            <Origen pedido={pedido} />
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <p className="tabular font-titular text-lg font-bold tracking-[-0.02em]">
            {formatMoney(pedido.totalCents)}
          </p>

          <div className="flex items-center gap-3">
            {pedido.comprobante ? (
              <BotonComprobante pedidoId={pedido.id} ver={ver} compacto />
            ) : null}

            <Link
              href={`/panel/pedidos/${pedido.id}`}
              className="flex min-h-11 items-center text-sm font-semibold transition-colors hover:text-senal"
            >
              Ver el pedido
            </Link>
          </div>
        </div>
      </div>
    </li>
  )
}
