"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from "@/lib/estilos"
import { cn } from "@/lib/utils"
import { SIGUIENTES } from "@/lib/pedidos"
import type { OrderStatus } from "@/types"
import { useConfirmacion } from "@/components/panel/confirmar"
import { useFestejo } from "@/components/panel/festejo"

const ASPECTO: Record<OrderStatus, string> = {
  // La señal solo en lo que pide una acción: un pedido por cobrar. Si todos
  // los estados fueran de color, el acento dejaría de señalar nada.
  pendiente: "border-senal text-senal",
  pagado: "border-tinta text-tinta",
  // Sin tachar: el que va tachado es el total.
  cancelado: "border-tinta/30 text-tinta/60",
}

/** Lo que dice el sello de cada estado. El pendiente pide algo: "Por cobrar". */
const ETIQUETA_DEL_SELLO: Record<OrderStatus, string> = {
  pendiente: "Por cobrar",
  pagado: "Pagado",
  cancelado: "Cancelado",
}

/**
 * El estado de un pedido como un sello de goma (`pieza-sello`): torcido, con
 * cada palabra en su renglón ("POR / COBRAR") en el cuaderno, y en una línea
 * de versalita en el diario. El que se acaba de confirmar se estampa; el
 * pendiente más viejo late (`app/globals.css`).
 *
 * Un pendiente que pasó el plazo dice "No concretado" y deja la señal: ya no
 * pide una acción. Lo decide quien llama, en el servidor, para que la hora del
 * navegador no dibuje otra cosa que la del servidor.
 */
export function Estado({
  estado,
  noConcretado = false,
  recien = false,
  late = false,
  className,
}: {
  estado: OrderStatus
  noConcretado?: boolean
  /** Se acaba de confirmar: en el cuaderno, el sello se estampa. */
  recien?: boolean
  /** Es el pendiente más viejo: el sello se levanta y golpea, despacio. */
  late?: boolean
  className?: string
}) {
  const etiqueta = noConcretado ? "No concretado" : ETIQUETA_DEL_SELLO[estado]

  return (
    <span
      className={cn(
        "pieza-sello inline-flex shrink-0 gap-x-1 border px-2 py-0.5 text-xs font-semibold tracking-[0.08em] uppercase",
        noConcretado ? "border-tinta/40 text-tinta/65" : ASPECTO[estado],
        recien && "sello-estampa",
        late && "sello-late",
        className
      )}
    >
      {etiqueta.split(" ").map((palabra) => (
        <span key={palabra}>{palabra}</span>
      ))}
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
    <div className="pieza-bandeja fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex gap-2 border-t border-tinta bg-papel px-4 py-3 lg:static lg:border-0 lg:p-0">
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
 * El sello del detalle de un pedido. Si todavía se puede cobrar, se toca, como
 * en la lista: pregunta y, con la base confirmada, "Pagado" se estampa. Quien
 * aprendió a cobrar tocando el sello en la lista no se encuentra acá con uno
 * que no hace nada. El botón "Marcar pagado" sigue: es el camino evidente.
 */
export function SelloQueCobra({
  pedido,
  noConcretado = false,
  cambiar,
  soloLectura = false,
}: {
  pedido: { id: string; numero: number; estado: OrderStatus }
  noConcretado?: boolean
  cambiar: Cambiar
  soloLectura?: boolean
}) {
  const router = useRouter()
  const { preguntar, dialogo } = useConfirmacion()
  const { festejo, festejar } = useFestejo()
  const [guardando, setGuardando] = React.useState(false)
  const [recien, setRecien] = React.useState(false)
  const sePuedePagar = !recien && SIGUIENTES[pedido.estado].includes("pagado")

  if (!sePuedePagar) {
    return (
      <Estado
        estado={recien ? "pagado" : pedido.estado}
        noConcretado={noConcretado && !recien}
        recien={recien}
      />
    )
  }

  async function cobrar() {
    if (soloLectura) {
      toast.info(AVISO_DE_DEMO)
      return
    }
    const si = await preguntar({
      titulo: `¿Marcar pagado el pedido #${pedido.numero}?`,
      texto:
        "Se descuenta de tu stock. Un pedido pagado no vuelve a pendiente.",
      confirmar: "Marcar pagado",
    })
    if (!si) return
    if (!navigator.onLine) {
      toast.error("Sin conexión. El pedido sigue por cobrar.")
      return
    }
    setGuardando(true)
    const resultado = await cambiar(pedido.id, "pagado")
    setGuardando(false)
    if (!resultado.ok) {
      toast.error(
        resultado.error ??
          "No pudimos marcar el pedido pagado. Inténtalo de nuevo."
      )
      return
    }
    setRecien(true)
    festejar()
    toast.success("Pago confirmado. Ya se descontó del stock.")
    // Se refresca después de que se vio el golpe del sello.
    window.setTimeout(() => router.refresh(), 900)
  }

  return (
    <>
      {dialogo}
      {festejo}
      <button
        type="button"
        onClick={cobrar}
        disabled={guardando}
        aria-busy={guardando || undefined}
        aria-label={`Marcar pagado el pedido #${pedido.numero}`}
        className="group/sello inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta disabled:opacity-50"
      >
        <Estado
          estado={pedido.estado}
          noConcretado={noConcretado}
          className="transition-[rotate,scale,color] duration-200 ease-out group-hover/sello:scale-105 group-hover/sello:[rotate:0deg] group-active/sello:scale-95 motion-reduce:transition-none"
        />
      </button>
    </>
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
