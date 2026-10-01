import { notFound, redirect } from "next/navigation"
import { ListChecks, MessageCircle, ShoppingBag, UserRound } from "lucide-react"

import { getPedido, mensajeDeEntrega } from "@/lib/data/pedidos"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { formatDate, formatMoney } from "@/lib/format"
import { numeroDeWhatsApp } from "@/lib/pedidos"
import type { OrderStatus } from "@/types"
import { Cabecera, Seccion, Volver } from "@/components/panel/piezas"
import {
  BotonComprobante,
  CambiarEstado,
  Estado,
} from "@/components/pedidos/piezas"
import { cambiarEstado, verComprobante } from "../acciones"

export const metadata = { title: "Pedido" }

/** Qué toca hacer con el pedido, según dónde está. */
const QUE_SIGUE: Record<OrderStatus, string> = {
  pendiente:
    "Cuando veas el pago en tu cuenta, confírmalo: si lo trajo un vendedor, su comisión se acredita en ese momento.",
  pagado:
    "Coordina la entrega por WhatsApp y márcalo como enviado cuando salga.",
  enviado: "Cuando llegue a su dueño, márcalo como entregado y se cierra.",
  entregado: "Este pedido ya se cerró. No hay nada más que hacer.",
  en_disputa:
    "Hay un reclamo abierto. Mientras se resuelve, el pago queda congelado.",
  cancelado: "Este pedido se canceló y su stock volvió a tu catálogo.",
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

  const nombreTienda = tienda?.name ?? "tu tienda"
  const whatsapp = `https://wa.me/${numeroDeWhatsApp(pedido.telefono)}`

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

          <a
            href={mensajeDeEntrega(pedido, nombreTienda)}
            target="_blank"
            rel="noreferrer noopener"
            className="flex min-h-11 items-center gap-2 rounded-plantilla border-2 border-tinta px-4 text-sm font-semibold transition-colors hover:bg-tinta hover:text-papel"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Coordinar la entrega
          </a>

          {pedido.comprobante ? (
            <BotonComprobante pedidoId={pedido.id} ver={verComprobante} />
          ) : null}
        </div>
      </Seccion>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.3fr_1fr]">
        <Seccion
          id="que-compro"
          icono={ShoppingBag}
          titulo="Qué compró"
          bajada="Los precios con los que se cobró, aunque después cambien."
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
              <dd className="tabular font-semibold">
                {formatMoney(pedido.totalCents)}
              </dd>
            </div>

            {pedido.vendedor ? (
              <>
                <div className="flex items-baseline justify-between gap-4 py-1">
                  <dt className="text-sm opacity-70">
                    Comisión de {pedido.vendedor.nombre}
                  </dt>
                  <dd className="tabular">
                    −{formatMoney(pedido.comisionCents)}
                  </dd>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-tinta/15 pt-3">
                  <dt className="font-semibold">Te queda</dt>
                  <dd className="tabular font-titular text-lg font-bold">
                    {formatMoney(pedido.netoCents)}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
        </Seccion>

        <Seccion
          id="quien-compro"
          icono={UserRound}
          titulo="Quién compró"
          bajada="Sus datos para coordinar la entrega."
        >
          <dl>
            <Dato etiqueta="Nombre">
              <span className="font-semibold">{pedido.comprador}</span>
            </Dato>
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
            {pedido.correo ? (
              <Dato etiqueta="Correo">
                <span className="break-all">{pedido.correo}</span>
              </Dato>
            ) : null}
            <Dato etiqueta="Cómo llegó">
              {pedido.vendedor ? (
                <>
                  Por{" "}
                  <span className="font-semibold">
                    {pedido.vendedor.nombre}
                  </span>
                  {pedido.vendedor.codigo ? (
                    <span className="tabular block text-xs opacity-65">
                      código {pedido.vendedor.codigo}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="opacity-70">
                  Venta directa, sin vendedor de por medio
                </span>
              )}
            </Dato>
            <Dato etiqueta="Comprobante">
              {pedido.comprobante ? (
                "Subido por quien compró"
              ) : (
                <span className="opacity-70">Todavía no subió ninguno</span>
              )}
            </Dato>
          </dl>
        </Seccion>
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
