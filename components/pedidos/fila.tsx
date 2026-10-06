import Link from "next/link"
import { MessageCircle } from "lucide-react"

import { formatMoney, formatNumber, formatRelative } from "@/lib/format"
import { numeroDeWhatsApp, quedoSinRespuesta } from "@/lib/pedidos"
import type { Pedido } from "@/lib/data/pedidos"
import { cn } from "@/lib/utils"
import { Estado } from "@/components/pedidos/piezas"

/**
 * Un pedido en la lista: la misma fila que "Últimos pedidos" del Resumen.
 *
 * La fila lleva al pedido. Los pedidos anteriores a la compra por WhatsApp
 * guardan el teléfono de quien compró, y para esos va a la derecha el atajo al
 * chat: son destinos distintos y por eso objetos distintos, porque un enlace
 * dentro de otro no se puede tocar bien con el dedo. Los nuevos no lo
 * necesitan: el chat ya lo abrió el comprador.
 *
 * Es de servidor para que "hace 26 min" se calcule una vez: en el navegador
 * podía salir otro minuto y React se quejaba de la diferencia.
 */
export function FilaPedido({ pedido }: { pedido: Pedido }) {
  const articulos = pedido.items.reduce(
    (total, item) => total + item.cantidad,
    0
  )

  return (
    <li
      className={cn(
        "grid border-t border-tinta/15 first:border-t-0",
        pedido.telefono
          ? "grid-cols-[minmax(0,1fr)_auto]"
          : "grid-cols-[minmax(0,1fr)]"
      )}
    >
      <Link
        href={`/panel/pedidos/${pedido.id}`}
        className="group flex min-h-16 min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-tinta/[0.04] sm:px-5"
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="tabular shrink-0 text-xs opacity-65">
              #{pedido.numero}
            </span>
            <span className="truncate font-titular font-bold tracking-[-0.01em] transition-colors group-hover:text-senal">
              {pedido.comprador ?? "Pedido por WhatsApp"}
            </span>
          </span>
          <span className="mt-1 block truncate text-xs opacity-70">
            {formatRelative(pedido.creado)} · {formatNumber(articulos)}{" "}
            {articulos === 1 ? "artículo" : "artículos"}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="tabular font-titular font-bold">
            {formatMoney(pedido.totalCents)}
          </span>
          <Estado
            estado={pedido.estado}
            sinRespuesta={quedoSinRespuesta(pedido)}
          />
        </span>
      </Link>

      {pedido.telefono ? (
        <a
          href={`https://wa.me/${numeroDeWhatsApp(pedido.telefono)}`}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Escribir a ${pedido.comprador ?? "quien compró"} por WhatsApp`}
          title="Escribir por WhatsApp"
          className="flex w-12 items-center justify-center border-l border-tinta/15 transition-colors hover:bg-tinta hover:text-papel sm:w-14"
        >
          <MessageCircle aria-hidden="true" className="size-5" />
        </a>
      ) : null}
    </li>
  )
}
