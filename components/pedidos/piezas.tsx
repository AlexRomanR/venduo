"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type { Pedido } from "@/lib/data/pedidos"
import { ESTADOS, SIGUIENTES } from "@/lib/pedidos"
import type { OrderStatus } from "@/types"

const ASPECTO: Record<OrderStatus, string> = {
  // Rojo solo en lo que pide una acción: un pedido sin gestionar. Si todos los
  // estados fueran de color, el acento dejaría de señalar nada.
  pendiente: "border-senal text-senal",
  pagado: "border-tinta text-tinta",
  cancelado: "border-tinta/25 text-tinta/40 line-through",
}

/**
 * El estado de un pedido, en versalita.
 *
 * Un pendiente que pasó el plazo dice "Sin respuesta" y deja el rojo: ya no
 * pide una acción. Lo decide quien llama, en el servidor, para que la hora del
 * navegador no dibuje otra cosa que la del servidor.
 */
export function Estado({
  estado,
  sinRespuesta = false,
}: {
  estado: OrderStatus
  sinRespuesta?: boolean
}) {
  const etiqueta = sinRespuesta
    ? "Sin respuesta"
    : (ESTADOS.find((e) => e.valor === estado)?.etiqueta ?? estado)

  return (
    <span
      className={cn(
        "inline-flex shrink-0 border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase",
        sinRespuesta ? "border-tinta/40 text-tinta/65" : ASPECTO[estado]
      )}
    >
      {etiqueta}
    </span>
  )
}

/**
 * Cambiar el estado.
 *
 * Cada paso avisa qué va a pasar además de cambiar la etiqueta, porque lo que
 * pasa no es obvio: marcar pagado descuenta el stock, y cancelar un pagado lo
 * devuelve al catálogo.
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

  const siguientes = SIGUIENTES[pedido.estado].map((estado) => PASOS[estado])

  async function aplicar(paso: Paso) {
    if (soloLectura) {
      toast.info("Estás en modo demo: los cambios no se guardan.")
      return
    }

    if (paso.estado === "cancelado") {
      const confirmar = window.confirm(
        `¿Cancelar el pedido #${pedido.numero}?` +
          (pedido.estado === "pagado"
            ? " Sus productos vuelven a tu stock."
            : "")
      )
      if (!confirmar) return
    }

    setEnCurso(paso.estado)
    const resultado = await cambiar(pedido.id, paso.estado)
    setEnCurso(null)

    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos cambiar el estado.")
      return
    }

    toast.success(paso.aviso)
    router.refresh()
  }

  if (siguientes.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {siguientes.map((paso) => (
        <button
          key={paso.estado}
          type="button"
          onClick={() => aplicar(paso)}
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

/** Cómo se ofrece en pantalla pasar a cada estado. */
const PASOS: Record<OrderStatus, Paso> = {
  pendiente: {
    estado: "pendiente",
    texto: "Volver a pendiente",
    aviso: "Pedido pendiente.",
  },
  pagado: {
    estado: "pagado",
    texto: "Marcar pagado",
    aviso: "Pago confirmado. Ya se descontó del stock.",
    principal: true,
  },
  cancelado: {
    estado: "cancelado",
    texto: "Cancelar",
    aviso: "Pedido cancelado.",
  },
}
