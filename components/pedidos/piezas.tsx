"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { ESTADOS, SIGUIENTES } from "@/lib/pedidos"
import type { OrderStatus } from "@/types"
import { useConfirmacion } from "@/components/panel/confirmar"
import { useFestejo } from "@/components/panel/festejo"

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
 * Un pendiente que pasó el plazo dice "No concretado" y deja el rojo: ya no
 * pide una acción. Lo decide quien llama, en el servidor, para que la hora del
 * navegador no dibuje otra cosa que la del servidor.
 */
export function Estado({
  estado,
  noConcretado = false,
}: {
  estado: OrderStatus
  noConcretado?: boolean
}) {
  const etiqueta = noConcretado
    ? "No concretado"
    : (ESTADOS.find((e) => e.valor === estado)?.etiqueta ?? estado)

  return (
    <span
      className={cn(
        "inline-flex shrink-0 border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase",
        noConcretado ? "border-tinta/40 text-tinta/65" : ASPECTO[estado]
      )}
    >
      {etiqueta}
    </span>
  )
}

type Cambiar = (
  id: string,
  estado: OrderStatus
) => Promise<{ ok: boolean; error?: string }>

const AVISO_DE_DEMO = "Estás en modo demo: los cambios no se guardan."

/**
 * Lo que se hace con un pedido, sin tener que buscarlo: escribirle por
 * WhatsApp y marcarlo pagado. En el celular va fijo abajo, sobre las
 * pestañas, como en la app; en una pantalla ancha, bajo el total.
 *
 * Marcar pagado no pregunta: acá se toca a propósito, con el pedido abierto.
 * En una lista sí, porque ahí se toca sin querer.
 */
export function CobrarPedido({
  pedido,
  cambiar,
  whatsapp,
  soloLectura = false,
}: {
  pedido: { id: string; estado: OrderStatus }
  cambiar: Cambiar
  /** El chat con quien compró, en los pedidos que lo guardan. */
  whatsapp: string | null
  soloLectura?: boolean
}) {
  const router = useRouter()
  const { festejo, festejar } = useFestejo()
  const [guardando, setGuardando] = React.useState(false)
  const sePuedePagar = SIGUIENTES[pedido.estado].includes("pagado")

  if (!sePuedePagar && !whatsapp) return null

  async function pagar() {
    if (soloLectura) {
      toast.info(AVISO_DE_DEMO)
      return
    }
    setGuardando(true)
    const resultado = await cambiar(pedido.id, "pagado")
    setGuardando(false)
    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos marcar el pedido pagado.")
      return
    }
    festejar()
    toast.success("Pago confirmado. Ya se descontó del stock.")
    router.refresh()
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex gap-2 border-t border-tinta bg-papel px-4 py-3 lg:static lg:border-0 lg:p-0">
      {festejo}
      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(
            BOTON_SECUNDARIO,
            "min-h-12 px-4",
            sePuedePagar ? "shrink-0" : "flex-1 lg:flex-none"
          )}
        >
          <MessageCircle aria-hidden="true" className="size-5" />
          {sePuedePagar ? "WhatsApp" : "Escribir por WhatsApp"}
        </a>
      ) : null}
      {sePuedePagar ? (
        <button
          type="button"
          onClick={pagar}
          disabled={guardando}
          className={cn(BOTON_PRIMARIO, "min-h-12 flex-1 lg:flex-none lg:px-8")}
        >
          {guardando ? (
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          ) : null}
          Marcar pagado
        </button>
      ) : null}
    </div>
  )
}

/**
 * Cancelar, discreto y al final: es lo que menos se hace y no se deshace, así
 * que pregunta antes.
 */
export function CancelarPedido({
  pedido,
  cambiar,
  soloLectura = false,
}: {
  pedido: { id: string; numero: number; estado: OrderStatus }
  cambiar: Cambiar
  soloLectura?: boolean
}) {
  const router = useRouter()
  const { preguntar, dialogo } = useConfirmacion()
  const [guardando, setGuardando] = React.useState(false)

  if (!SIGUIENTES[pedido.estado].includes("cancelado")) return null

  async function cancelar() {
    if (soloLectura) {
      toast.info(AVISO_DE_DEMO)
      return
    }
    const si = await preguntar({
      titulo: `¿Cancelar el pedido #${pedido.numero}?`,
      texto:
        pedido.estado === "pagado"
          ? "Sus productos vuelven a tu stock. Un pedido cancelado no se puede reabrir."
          : "Un pedido cancelado no se puede reabrir.",
      confirmar: "Cancelar el pedido",
    })
    if (!si) return

    setGuardando(true)
    const resultado = await cambiar(pedido.id, "cancelado")
    setGuardando(false)
    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos cancelar el pedido.")
      return
    }
    toast.success("Pedido cancelado.")
    router.refresh()
  }

  return (
    <>
      {dialogo}
      <button
        type="button"
        onClick={cancelar}
        disabled={guardando}
        className="mx-auto flex min-h-12 items-center gap-2 px-4 font-semibold transition-colors hover:text-senal disabled:opacity-50 lg:mx-0 lg:px-0"
      >
        {guardando ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : null}
        Cancelar el pedido
      </button>
    </>
  )
}
