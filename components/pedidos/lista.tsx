"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Loader2, MessageCircle, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import { formatMoney, formatNumber } from "@/lib/format"
import {
  numeroDeWhatsApp,
  SIGUIENTES,
  type GrupoDeFecha,
  type PedidoEnFila,
} from "@/lib/pedidos"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/types"
import { useConfirmacion } from "@/components/panel/confirmar"
import { useFestejo } from "@/components/panel/festejo"
import { Estado } from "@/components/pedidos/piezas"

type Cobrar = (
  id: string,
  estado: OrderStatus
) => Promise<{ ok: boolean; error?: string }>

/** Lo que muestra la lista: el título de un grupo de días, o un pedido. */
export type Renglon =
  | { tipo: "grupo"; grupo: GrupoDeFecha }
  | { tipo: "pedido"; pedido: PedidoEnFila }

/**
 * Una lista de pedidos: la misma en el Resumen y en Pedidos, y la misma de la
 * app. Los grupos de días —"Hoy", "Ayer"…— van en una franja gris entre las
 * filas, y la fila que sigue a una franja no lleva su regla de arriba.
 *
 * `cobrar` es la acción del servidor que cambia el estado. Marcar cobrado
 * pregunta antes, como en la app: se descuenta del stock y no se deshace.
 */
export function ListaDePedidos({
  renglones,
  cobrar,
  soloLectura = false,
  ocultarEnCelularDesde,
}: {
  renglones: Renglon[]
  cobrar: Cobrar
  /** El modo demo: se ve todo, nada se guarda. */
  soloLectura?: boolean
  /**
   * Desde qué pedido se esconden en el celular. El Inicio de la app muestra
   * tres —los que caben sin bajar—; en una pantalla ancha el Resumen tiene
   * lugar para cinco junto a los productos.
   */
  ocultarEnCelularDesde?: number
}) {
  const router = useRouter()
  const { preguntar, dialogo } = useConfirmacion()
  const { festejo, festejar } = useFestejo()
  const [cobrando, setCobrando] = React.useState<string | null>(null)

  async function marcarCobrado(pedido: PedidoEnFila) {
    if (soloLectura) {
      toast.info("Estás en modo demo: los cambios no se guardan.")
      return
    }
    const si = await preguntar({
      titulo: `¿Marcar pagado el pedido #${pedido.numero}?`,
      texto:
        "Se descuenta de tu stock. Un pedido pagado no vuelve a pendiente.",
      confirmar: "Marcar pagado",
    })
    if (!si) return

    setCobrando(pedido.id)
    const resultado = await cobrar(pedido.id, "pagado")
    setCobrando(null)
    if (!resultado.ok) {
      toast.error(resultado.error ?? "No pudimos marcar el pedido pagado.")
      return
    }
    festejar()
    toast.success("Pago confirmado. Ya se descontó del stock.")
    router.refresh()
  }

  let pedidos = 0

  return (
    <>
      {dialogo}
      {festejo}
      <ul>
        {renglones.map((renglon, indice) => {
          if (renglon.tipo === "grupo") {
            return (
              <li
                key={`grupo-${renglon.grupo}`}
                className="border-y border-tinta/15 bg-tinta/[0.04] px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase opacity-80 first:border-t-0 sm:px-5"
              >
                <h3>{renglon.grupo}</h3>
              </li>
            )
          }

          pedidos += 1
          const anterior = renglones[indice - 1]
          const pedido = renglon.pedido
          return (
            <FilaDePedido
              key={pedido.id}
              pedido={pedido}
              primera={!anterior || anterior.tipo === "grupo"}
              oculta={
                ocultarEnCelularDesde !== undefined &&
                pedidos > ocultarEnCelularDesde
              }
              cobrando={cobrando === pedido.id}
              ocupado={cobrando !== null}
              alCobrar={
                SIGUIENTES[pedido.estado].includes("pagado")
                  ? () => marcarCobrado(pedido)
                  : undefined
              }
            />
          )
        })}
      </ul>
    </>
  )
}

/**
 * Un pedido en una lista, el mismo de la app.
 *
 * La fila lleva al pedido. Un pendiente lleva a la derecha el botón
 * "Cobrado": es lo que más se hace con un pedido, y se hace sin abrirlo; con
 * el botón al lado, la marca de pendiente sobra. Los pedidos anteriores a la
 * compra por WhatsApp guardan el teléfono de quien compró, y esos llevan el
 * atajo al chat. Son destinos distintos y por eso objetos distintos: un enlace
 * dentro de otro no se toca bien con el dedo.
 */
function FilaDePedido({
  pedido,
  primera,
  oculta,
  cobrando,
  ocupado,
  alCobrar,
}: {
  pedido: PedidoEnFila
  primera: boolean
  oculta: boolean
  cobrando: boolean
  ocupado: boolean
  alCobrar?: () => void
}) {
  return (
    <li
      className={cn(
        "flex items-stretch bg-papel",
        !primera && "border-t border-tinta/15",
        oculta && "max-lg:hidden"
      )}
    >
      <Link
        href={`/panel/pedidos/${pedido.id}`}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-tinta/[0.04] active:bg-tinta/[0.08] sm:px-5"
      >
        <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden border border-tinta/15 bg-tinta/[0.05]">
          {pedido.foto ? (
            <Image
              src={pedido.foto}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
            />
          ) : (
            <ShoppingBag aria-hidden="true" className="size-4 opacity-35" />
          )}
        </span>

        {/* Dos renglones, cada uno con lo suyo a la derecha: así el nombre solo
            le cede lugar al monto, y no a la marca del estado, que es más ancha. */}
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex items-baseline gap-2">
            <span className="tabular shrink-0 text-sm opacity-65">
              #{pedido.numero}
            </span>
            <span className="min-w-0 flex-1 truncate font-titular text-base leading-5 font-bold tracking-[-0.01em]">
              {pedido.titulo}
            </span>
            <span className="tabular shrink-0 font-titular text-base leading-5 font-bold tracking-[-0.01em]">
              {formatMoney(pedido.totalCents)}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm opacity-70">
              {pedido.relativo} ·{" "}
              {pedido.directa
                ? "Venta directa"
                : `${formatNumber(pedido.articulos)} ${pedido.articulos === 1 ? "artículo" : "artículos"}`}
            </span>
            {alCobrar && !pedido.noConcretado ? null : (
              <Estado
                estado={pedido.estado}
                noConcretado={pedido.noConcretado}
              />
            )}
          </span>
        </span>
      </Link>

      {alCobrar ? (
        <button
          type="button"
          onClick={alCobrar}
          disabled={ocupado}
          aria-label={`Marcar cobrado el pedido ${pedido.numero}`}
          className="flex w-[72px] shrink-0 flex-col items-center justify-center gap-1 border-l border-tinta/15 text-xs font-semibold text-senal transition-colors hover:bg-senal/[0.06] active:bg-senal active:text-white disabled:opacity-50"
        >
          {cobrando ? (
            <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          ) : (
            <Check aria-hidden="true" className="size-5" strokeWidth={2.5} />
          )}
          Cobrado
        </button>
      ) : null}

      {pedido.telefono ? (
        <a
          href={`https://wa.me/${numeroDeWhatsApp(pedido.telefono)}`}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Escribir a quien hizo el pedido ${pedido.numero} por WhatsApp`}
          className="flex w-14 shrink-0 items-center justify-center border-l border-tinta/15 transition-colors hover:bg-tinta hover:text-papel"
        >
          <MessageCircle aria-hidden="true" className="size-5" />
        </a>
      ) : null}
    </li>
  )
}
