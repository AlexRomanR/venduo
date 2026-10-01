"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Receipt } from "lucide-react"
import { toast } from "sonner"

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
  // Quedó en el enum de la base y nada lo escribe; si apareciera, pide acción.
  en_disputa: "border-senal text-senal",
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

/**
 * Ver el comprobante.
 *
 * Se pide al hacer clic y no al cargar la lista: la URL viene firmada por una
 * hora, y firmar veinte de una vez para que se miren dos es trabajo tirado.
 */
export function BotonComprobante({
  pedidoId,
  ver,
  icono = false,
}: {
  pedidoId: string
  ver: (id: string) => Promise<{ ok: boolean; url?: string; error?: string }>
  /** Solo el ícono, para la columna de atajos de una fila. */
  icono?: boolean
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

  const Icono = cargando ? Loader2 : Receipt

  if (icono) {
    return (
      <button
        type="button"
        onClick={abrir}
        disabled={cargando}
        aria-label="Ver el comprobante"
        title="Ver el comprobante"
        className="flex w-12 items-center justify-center border-l border-tinta/15 text-senal transition-colors hover:bg-tinta hover:text-papel sm:w-14"
      >
        <Icono
          aria-hidden="true"
          className={cn("size-5", cargando && "animate-spin")}
        />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={abrir}
      disabled={cargando}
      className="flex min-h-11 items-center gap-2 rounded-plantilla border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
    >
      <Icono
        aria-hidden="true"
        className={cn("size-4", cargando && "animate-spin")}
      />
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
  en_disputa: [
    { estado: "cancelado", texto: "Cancelar", aviso: "Pedido cancelado." },
  ],
  cancelado: [],
}
