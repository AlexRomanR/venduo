"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Check,
  Loader2,
  MessageCircle,
  Package,
  ShoppingBag,
} from "lucide-react"
import { toast } from "sonner"

import { formatMoney, formatNumber, formatRelative } from "@/lib/format"
import { noSeConcreto, numeroDeWhatsApp } from "@/lib/pedidos"
import type { PedidoReciente } from "@/lib/tablero"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/types"
import { useConfirmacion } from "@/components/panel/confirmar"
import { useFestejo } from "@/components/panel/festejo"
import { Seccion, SinDatos } from "@/components/panel/piezas"
import { Estado } from "@/components/pedidos/piezas"

type Cobrar = (
  id: string,
  estado: OrderStatus
) => Promise<{ ok: boolean; error?: string }>

/**
 * Los cinco pedidos más nuevos, reconocibles por las fotos de lo que pidieron.
 *
 * Un pendiente lleva a la derecha el botón "Cobrado": es lo que se hace con un
 * pedido apenas te pagan por WhatsApp, y se hace sin salir del Resumen. Con
 * el botón al lado, la marca de pendiente sobra. Los pedidos anteriores a la
 * compra por WhatsApp guardan el teléfono de quien compró, y esos llevan el
 * atajo al chat.
 */
export function UltimosPedidos({
  pedidos,
  cobrar,
  soloLectura = false,
}: {
  pedidos: PedidoReciente[]
  cobrar: Cobrar
  /** El modo demo: se ve todo, nada se guarda. */
  soloLectura?: boolean
}) {
  const router = useRouter()
  const { preguntar, dialogo } = useConfirmacion()
  const { festejo, festejar } = useFestejo()
  const [cobrando, setCobrando] = React.useState<string | null>(null)

  async function marcarCobrado(pedido: PedidoReciente) {
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
    router.refresh()
  }

  return (
    <Seccion
      id="ultimos-pedidos"
      icono={ShoppingBag}
      titulo="Últimos pedidos"
      accion={
        pedidos.length > 0
          ? { href: "/panel/pedidos", texto: "Ver todos los pedidos" }
          : undefined
      }
    >
      {dialogo}
      {festejo}
      {pedidos.length === 0 ? (
        <SinDatos
          icono={ShoppingBag}
          titulo="Todavía no llegó ningún pedido"
          texto="Comparte tu tienda: cada carrito que te manden por WhatsApp aparece aquí."
        />
      ) : (
        <ul>
          {pedidos.map((pedido) => {
            const porCobrar = pedido.estado === "pendiente"
            return (
              <li
                key={pedido.id}
                className="flex items-stretch border-t border-tinta/15 first:border-t-0"
              >
                <Link
                  href={`/panel/pedidos/${pedido.id}`}
                  className="group flex min-h-[4.5rem] min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-tinta/[0.04] sm:px-5"
                >
                  <FotosDelPedido fotos={pedido.fotos} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="tabular font-titular text-lg leading-none font-extrabold tracking-[-0.02em]">
                        {formatMoney(pedido.totalCents)}
                      </span>
                      {porCobrar ? null : (
                        <Estado
                          estado={pedido.estado}
                          noConcretado={noSeConcreto(pedido)}
                        />
                      )}
                    </span>
                    <span className="mt-1 block truncate text-xs opacity-70">
                      <span className="tabular">#{pedido.numero}</span> ·{" "}
                      {formatRelative(pedido.creado)} ·{" "}
                      {formatNumber(pedido.articulos)}{" "}
                      {pedido.articulos === 1 ? "artículo" : "artículos"}
                    </span>
                  </span>
                </Link>

                {porCobrar ? (
                  <div className="flex items-center pr-4 sm:pr-5">
                    <button
                      type="button"
                      onClick={() => marcarCobrado(pedido)}
                      disabled={cobrando !== null}
                      className="flex min-h-11 items-center gap-1.5 rounded-plantilla bg-senal px-3.5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-senal-alta active:scale-[0.97] disabled:opacity-60 motion-reduce:transform-none"
                    >
                      {cobrando === pedido.id ? (
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                      ) : (
                        <Check
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={2.5}
                        />
                      )}
                      Cobrado
                    </button>
                  </div>
                ) : pedido.telefono ? (
                  <a
                    href={`https://wa.me/${numeroDeWhatsApp(pedido.telefono)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`Escribir a ${pedido.comprador ?? "quien compró"} por WhatsApp`}
                    title="Escribir por WhatsApp"
                    className="flex w-14 items-center justify-center border-l border-tinta/15 transition-colors hover:bg-tinta hover:text-papel"
                  >
                    <MessageCircle aria-hidden="true" className="size-5" />
                  </a>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </Seccion>
  )
}

/**
 * Las fotos de lo que se pidió, encimadas como cartas: un pedido se reconoce
 * por lo que lleva, no por su número.
 */
function FotosDelPedido({ fotos }: { fotos: string[] }) {
  if (fotos.length === 0) {
    return (
      <span className="flex size-12 shrink-0 items-center justify-center border border-tinta/15 bg-tinta/[0.05]">
        <Package aria-hidden="true" className="size-5 opacity-50" />
      </span>
    )
  }

  return (
    <span
      className="relative h-12 shrink-0"
      style={{ width: 48 + (fotos.length - 1) * 14 }}
    >
      {fotos.map((foto, indice) => (
        <span
          key={`${foto}-${indice}`}
          className={cn(
            "absolute top-0 size-12 overflow-hidden border border-papel bg-tinta/[0.05] outline outline-1 outline-tinta/15 transition-transform duration-300 motion-reduce:transform-none",
            indice > 0 && "group-hover:translate-x-1"
          )}
          style={{ left: indice * 14, zIndex: fotos.length - indice }}
        >
          <Image src={foto} alt="" fill sizes="48px" className="object-cover" />
        </span>
      ))}
    </span>
  )
}
