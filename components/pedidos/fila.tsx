import Link from "next/link"
import { MessageCircle, Receipt } from "lucide-react"

import { formatMoney, formatNumber, formatRelative } from "@/lib/format"
import { numeroDeWhatsApp } from "@/lib/pedidos"
import type { Pedido } from "@/lib/data/pedidos"
import { cn } from "@/lib/utils"
import { BotonComprobante, Estado } from "@/components/pedidos/piezas"

/**
 * Un pedido en la lista: la misma fila que "Últimos pedidos" del Resumen.
 *
 * La fila lleva al pedido, y a la derecha van los atajos que no necesitan
 * abrirlo: el comprobante mientras espera que alguien lo mire, y WhatsApp,
 * que es por donde se coordina todo. Son destinos distintos y por eso objetos distintos: un
 * enlace dentro de otro no se puede tocar bien con el dedo.
 *
 * Es de servidor para que "hace 26 min" se calcule una vez: en el navegador
 * podía salir otro minuto y React se quejaba de la diferencia.
 */
export function FilaPedido({
  pedido,
  ver,
}: {
  pedido: Pedido
  ver: (id: string) => Promise<{ ok: boolean; url?: string; error?: string }>
}) {
  const articulos = pedido.items.reduce(
    (total, item) => total + item.cantidad,
    0
  )
  // El comprobante pide una acción solo mientras el pedido espera el pago.
  const porRevisar =
    pedido.estado === "pendiente" && Boolean(pedido.comprobante)

  return (
    <li
      className={cn(
        "grid border-t border-tinta/15 first:border-t-0",
        porRevisar
          ? "grid-cols-[minmax(0,1fr)_auto_auto]"
          : "grid-cols-[minmax(0,1fr)_auto]"
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
              {pedido.comprador}
            </span>
          </span>
          <span className="mt-1 block truncate text-xs opacity-70">
            {formatRelative(pedido.creado)} · {formatNumber(articulos)}{" "}
            {articulos === 1 ? "artículo" : "artículos"} ·{" "}
            {pedido.vendedor
              ? `vendió ${pedido.vendedor.nombre}`
              : "venta directa"}
          </span>
          {porRevisar ? (
            <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.12em] text-senal uppercase">
              <Receipt aria-hidden="true" className="size-3" />
              Trajo comprobante
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="tabular font-titular font-bold">
            {formatMoney(pedido.totalCents)}
          </span>
          <Estado estado={pedido.estado} />
        </span>
      </Link>

      {porRevisar ? (
        <BotonComprobante pedidoId={pedido.id} ver={ver} icono />
      ) : null}

      <a
        href={`https://wa.me/${numeroDeWhatsApp(pedido.telefono)}`}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`Escribir a ${pedido.comprador} por WhatsApp`}
        title="Escribir por WhatsApp"
        className="flex w-12 items-center justify-center border-l border-tinta/15 transition-colors hover:bg-tinta hover:text-papel sm:w-14"
      >
        <MessageCircle aria-hidden="true" className="size-5" />
      </a>
    </li>
  )
}
