import Link from "next/link"
import { MessageCircle, ShoppingBag } from "lucide-react"

import { formatMoney, formatNumber, formatRelative } from "@/lib/format"
import { numeroDeWhatsApp } from "@/lib/pedidos"
import type { PedidoReciente } from "@/lib/tablero"
import { Estado } from "@/components/pedidos/piezas"
import { Seccion, SinDatos } from "@/components/panel/piezas"

/**
 * Los cinco pedidos más nuevos, con su estado.
 *
 * Cada fila lleva al pedido. Los anteriores a la compra por WhatsApp guardan
 * el teléfono de quien compró, y esos llevan al lado el atajo al chat: son dos
 * destinos y por eso dos objetos, porque un enlace dentro de otro no se puede
 * tocar bien con el dedo.
 */
export function UltimosPedidos({ pedidos }: { pedidos: PedidoReciente[] }) {
  return (
    <Seccion
      id="ultimos-pedidos"
      icono={ShoppingBag}
      titulo="Últimos pedidos"
      bajada="Toca uno para ver el detalle y cambiar su estado."
      accion={
        pedidos.length > 0
          ? { href: "/panel/pedidos", texto: "Ver todos los pedidos" }
          : undefined
      }
    >
      {pedidos.length === 0 ? (
        <SinDatos
          icono={ShoppingBag}
          titulo="Todavía no llegó ningún pedido"
          texto="Cuando alguien te mande su carrito por WhatsApp, el pedido aparece acá con el mismo número."
        />
      ) : (
        <ul>
          {pedidos.map((pedido) => (
            <li
              key={pedido.id}
              className={
                pedido.telefono
                  ? "grid grid-cols-[minmax(0,1fr)_auto] border-t border-tinta/15 first:border-t-0"
                  : "grid grid-cols-[minmax(0,1fr)] border-t border-tinta/15 first:border-t-0"
              }
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
                  <span className="mt-1 block text-xs opacity-70">
                    {formatRelative(pedido.creado)} ·{" "}
                    {formatNumber(pedido.articulos)}{" "}
                    {pedido.articulos === 1 ? "artículo" : "artículos"}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="tabular font-titular font-bold">
                    {formatMoney(pedido.totalCents)}
                  </span>
                  <Estado estado={pedido.estado} />
                </span>
              </Link>
              {pedido.telefono ? (
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
          ))}
        </ul>
      )}
    </Seccion>
  )
}
