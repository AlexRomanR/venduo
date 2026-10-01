import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, MessageCircle } from "lucide-react"

import { getPedido, mensajeDeEntrega } from "@/lib/data/pedidos"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { formatDate, formatMoney } from "@/lib/format"
import {
  BotonComprobante,
  CambiarEstado,
  Estado,
} from "@/components/pedidos/piezas"
import { cambiarEstado, verComprobante } from "../acciones"

export const metadata = { title: "Pedido" }

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const { id } = await params
  const pedido = await getPedido(id)

  // `getPedido` solo devuelve pedidos de mi tienda, así que uno ajeno llega acá
  // como inexistente y no como prohibido: es lo mismo para quien lo pide.
  if (!pedido) notFound()

  const nombreTienda = tienda?.name ?? "tu tienda"

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link
        href="/panel/pedidos"
        className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors hover:text-senal"
      >
        <ArrowLeft
          aria-hidden="true"
          className="size-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none"
        />
        Tus pedidos
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="tabular font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-none font-extrabold tracking-[-0.03em]">
              #{pedido.numero}
            </h1>
            <Estado estado={pedido.estado} />
          </div>
          <p className="mt-3 text-sm opacity-55">
            {formatDate(pedido.creado)}
            {pedido.pagado ? ` · pagado el ${formatDate(pedido.pagado)}` : ""}
          </p>
        </div>

        <p className="tabular font-titular text-[clamp(1.5rem,5vw,2rem)] leading-none font-extrabold tracking-[-0.03em]">
          {formatMoney(pedido.totalCents)}
        </p>
      </div>

      {/* Lo primero es qué hacer con el pedido, no leerlo. */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t-2 border-tinta pt-6">
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

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <section>
          <h2 className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
            Qué compró
          </h2>

          <ul className="mt-6 border-t-2 border-tinta">
            {pedido.items.map((item, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-4 border-b border-tinta/15 py-4"
              >
                <span className="min-w-0 flex-1">
                  <span className="tabular mr-2 opacity-45">
                    {item.cantidad}×
                  </span>
                  {item.nombre}
                  <span className="tabular ml-2 text-xs opacity-45">
                    {formatMoney(item.precioCents)} c/u
                  </span>
                </span>
                <span className="tabular shrink-0 font-semibold">
                  {formatMoney(item.totalCents)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5">
            <div className="flex items-baseline justify-between py-1">
              <dt className="text-sm opacity-60">Total del pedido</dt>
              <dd className="tabular font-semibold">
                {formatMoney(pedido.totalCents)}
              </dd>
            </div>

            {pedido.vendedor ? (
              <>
                <div className="flex items-baseline justify-between py-1">
                  <dt className="text-sm opacity-60">
                    Comisión de {pedido.vendedor.nombre}
                  </dt>
                  <dd className="tabular text-senal">
                    −{formatMoney(pedido.comisionCents)}
                  </dd>
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t border-tinta/15 pt-3">
                  <dt className="font-semibold">Te queda</dt>
                  <dd className="tabular font-titular text-lg font-bold">
                    {formatMoney(pedido.netoCents)}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
            Quién compró
          </h2>

          <dl className="mt-6 border-t-2 border-tinta pt-5">
            <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
              Nombre
            </dt>
            <dd className="mt-1 font-semibold">{pedido.comprador}</dd>

            <dt className="mt-5 text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
              WhatsApp
            </dt>
            <dd className="mt-1">
              <a
                href={`https://wa.me/${pedido.telefono.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer noopener"
                className="tabular inline-flex min-h-11 items-center font-semibold transition-colors hover:text-senal"
              >
                {pedido.telefono}
              </a>
            </dd>

            {pedido.correo ? (
              <>
                <dt className="mt-5 text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
                  Correo
                </dt>
                <dd className="mt-1 break-all">{pedido.correo}</dd>
              </>
            ) : null}

            <dt className="mt-5 text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
              Cómo llegó
            </dt>
            <dd className="mt-1 leading-relaxed">
              {pedido.vendedor ? (
                <>
                  Por{" "}
                  <span className="font-semibold">
                    {pedido.vendedor.nombre}
                  </span>
                  {pedido.vendedor.codigo ? (
                    <span className="tabular block text-xs opacity-45">
                      código {pedido.vendedor.codigo}
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="opacity-60">
                  Venta directa, sin vendedor de por medio
                </span>
              )}
            </dd>

            <dt className="mt-5 text-xs font-semibold tracking-[0.12em] uppercase opacity-45">
              Comprobante
            </dt>
            <dd className="mt-1">
              {pedido.comprobante ? (
                <span className="text-sm">Subido por el comprador</span>
              ) : (
                <span className="text-sm opacity-55">
                  Todavía no subió ninguno
                </span>
              )}
            </dd>
          </dl>
        </section>
      </div>
    </div>
  )
}
