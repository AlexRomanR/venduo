import { notFound, redirect } from "next/navigation"
import { ListChecks, MessageCircle, ShoppingBag, UserRound } from "lucide-react"

import { getPedido } from "@/lib/data/pedidos"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { formatDate, formatMoney } from "@/lib/format"
import { numeroDeWhatsApp } from "@/lib/pedidos"
import type { OrderStatus } from "@/types"
import { Cabecera, Seccion, Volver } from "@/components/panel/piezas"
import { CambiarEstado, Estado } from "@/components/pedidos/piezas"
import { cambiarEstado } from "../acciones"

export const metadata = { title: "Pedido" }

/** Qué toca hacer con el pedido, según dónde está. */
const QUE_SIGUE: Record<OrderStatus, string> = {
  pendiente:
    "Te llegó por WhatsApp con este número. Cuando te paguen, márcalo pagado: ahí se descuenta del stock.",
  pagado: "Este pedido ya está pagado y descontado de tu stock.",
  cancelado: "Este pedido se canceló. No cuenta en tus ventas.",
}

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [tienda, pedido] = await Promise.all([getMiTienda(), getPedido(id)])
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  // `getPedido` solo devuelve pedidos de mi tienda, así que uno ajeno llega acá
  // como inexistente y no como prohibido: es lo mismo para quien lo pide.
  if (!pedido) notFound()

  const whatsapp = pedido.telefono
    ? `https://wa.me/${numeroDeWhatsApp(pedido.telefono)}`
    : null

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Volver href="/panel/pedidos">Tus pedidos</Volver>

      <Cabecera
        etiqueta="Pedido"
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            <span className="tabular">#{pedido.numero}</span>
            <Estado estado={pedido.estado} />
          </span>
        }
        bajada={
          <>
            Llegó el {formatDate(pedido.creado)}
            {pedido.pagado ? ` · pagado el ${formatDate(pedido.pagado)}` : ""}
          </>
        }
      >
        <p className="tabular font-titular text-[clamp(1.5rem,5vw,2rem)] leading-none font-extrabold tracking-[-0.03em]">
          {formatMoney(pedido.totalCents)}
        </p>
      </Cabecera>

      {/* Lo primero es qué hacer con el pedido, no leerlo. */}
      <Seccion
        id="que-sigue"
        icono={ListChecks}
        titulo="Qué sigue"
        bajada={QUE_SIGUE[pedido.estado]}
        relleno
      >
        <div className="flex flex-wrap items-center gap-3">
          <CambiarEstado pedido={pedido} cambiar={cambiarEstado} />

          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer noopener"
              className="flex min-h-11 items-center gap-2 rounded-plantilla border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              Escribir por WhatsApp
            </a>
          ) : null}
        </div>
      </Seccion>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Seccion
          id="que-compro"
          icono={ShoppingBag}
          titulo="Qué pidió"
          bajada="Los precios del pedido, aunque después cambien en tu catálogo."
        >
          <ul>
            {pedido.items.map((item, indice) => (
              <li
                key={indice}
                className="flex items-baseline justify-between gap-4 border-t border-tinta/15 px-4 py-3.5 first:border-t-0 sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="tabular mr-2 opacity-65">
                    {item.cantidad}×
                  </span>
                  <span className="font-semibold">{item.nombre}</span>
                  <span className="tabular mt-0.5 block text-xs opacity-65">
                    {formatMoney(item.precioCents)} c/u
                  </span>
                </span>
                <span className="tabular shrink-0 font-semibold">
                  {formatMoney(item.totalCents)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-auto border-t border-tinta/15 px-4 py-4 sm:px-5">
            <div className="flex items-baseline justify-between gap-4 py-1">
              <dt className="text-sm opacity-70">Total del pedido</dt>
              <dd className="tabular font-titular text-lg font-bold">
                {formatMoney(pedido.totalCents)}
              </dd>
            </div>
          </dl>
        </Seccion>

        {/* Solo los pedidos de antes de la compra por WhatsApp guardan quién
            compró: en los nuevos, esa persona está en el chat. */}
        {pedido.comprador || pedido.telefono ? (
          <Seccion
            id="quien-compro"
            icono={UserRound}
            titulo="Quién compró"
            bajada="Los datos que dejó al comprar."
          >
            <dl>
              {pedido.comprador ? (
                <Dato etiqueta="Nombre">
                  <span className="font-semibold">{pedido.comprador}</span>
                </Dato>
              ) : null}
              {whatsapp ? (
                <Dato etiqueta="WhatsApp">
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="tabular inline-flex min-h-11 items-center font-semibold underline-offset-4 transition-colors hover:text-senal hover:underline"
                  >
                    {pedido.telefono}
                  </a>
                </Dato>
              ) : null}
            </dl>
          </Seccion>
        ) : null}
      </div>
    </div>
  )
}

/** Un dato de quien compró: rótulo en versalita y el valor debajo. */
function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <div className="border-t border-tinta/15 px-4 py-3 first:border-t-0 sm:px-5">
      <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed">{children}</dd>
    </div>
  )
}
