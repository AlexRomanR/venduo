import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { Package, ShoppingBag, UserRound } from "lucide-react"

import { getPedido, type Pedido } from "@/lib/data/pedidos"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { formatDate, formatHora, formatMoney } from "@/lib/format"
import {
  DIAS_PARA_CONCRETAR,
  numeroDeWhatsApp,
  noSeConcreto,
} from "@/lib/pedidos"
import { cn } from "@/lib/utils"
import { Cabecera, Seccion, Volver } from "@/components/panel/piezas"
import { TituloDeLaBarra } from "@/components/panel/titulo-de-barra"
import {
  CancelarPedido,
  CobrarPedido,
  Estado,
} from "@/components/pedidos/piezas"
import { NotaDelPedido } from "@/components/pedidos/nota"
import { cambiarEstado, guardarNota } from "../acciones"

export const metadata = { title: "Pedido" }

/**
 * Un pedido, la misma pantalla de la app: cuánto es y en qué está, por dónde
 * pasó, qué pidió con sus fotos, y lo que se hace con él a mano.
 */
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

  const noConcretado = noSeConcreto(pedido)
  const whatsapp = pedido.telefono
    ? `https://wa.me/${numeroDeWhatsApp(pedido.telefono)}`
    : null
  const soloLectura = !isSupabaseConfigured

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 max-lg:pb-20 md:gap-8">
      <TituloDeLaBarra
        titulo={`Pedido #${pedido.numero}`}
        volver="/panel/pedidos"
      />
      <Volver href="/panel/pedidos">Pedidos</Volver>
      {/* En el celular, el nombre del pedido va en la barra de arriba. */}
      <div className="max-lg:sr-only">
        <Cabecera titulo={`Pedido #${pedido.numero}`} />
      </div>

      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="tabular font-titular text-[40px] leading-[44px] font-extrabold tracking-[-0.03em] lg:text-5xl lg:leading-[52px]">
            {formatMoney(pedido.totalCents)}
          </p>
          <Estado estado={pedido.estado} noConcretado={noConcretado} />
        </div>
        <LineaDeEstado pedido={pedido} />
        {noConcretado ? (
          <p className="text-sm opacity-70">
            Pasaron más de {DIAS_PARA_CONCRETAR} días sin pagarse. Si te pagan,
            márcalo igual.
          </p>
        ) : null}
        <CobrarPedido
          pedido={pedido}
          cambiar={cambiarEstado}
          whatsapp={whatsapp}
          soloLectura={soloLectura}
        />
      </header>

      <NotaDelPedido
        id={pedido.id}
        numero={pedido.numero}
        nota={pedido.nota}
        soloLectura={soloLectura}
        guardar={guardarNota}
      />

      <Seccion
        id="que-pidio"
        icono={ShoppingBag}
        titulo={pedido.directa ? "Qué vendiste" : "Qué pidió"}
        bajada={
          pedido.directa
            ? "Al precio que lo vendiste."
            : "Con los precios del día del pedido."
        }
      >
        <ul>
          {pedido.items.map((item, indice) => (
            <li
              key={indice}
              className="flex items-center gap-3 border-t border-tinta/15 px-4 py-3 first:border-t-0 sm:px-5"
            >
              <span className="relative shrink-0">
                <span className="relative flex size-[52px] items-center justify-center overflow-hidden border border-tinta/15 bg-tinta/[0.05]">
                  {item.foto ? (
                    <Image
                      src={item.foto}
                      alt=""
                      fill
                      sizes="52px"
                      className="object-cover"
                    />
                  ) : (
                    <Package aria-hidden="true" className="size-5 opacity-35" />
                  )}
                </span>
                {item.cantidad > 1 ? (
                  <span
                    aria-hidden="true"
                    className="tabular absolute -top-1.5 -right-1.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-tinta px-1.5 text-xs font-semibold text-papel"
                  >
                    {item.cantidad}
                  </span>
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 font-semibold">
                  <span className="sr-only">{item.cantidad} de </span>
                  {item.nombre}
                </span>
                {item.variante ? (
                  <span className="mt-0.5 block text-sm font-semibold">
                    {item.variante}
                  </span>
                ) : null}
                <span className="tabular mt-0.5 block text-sm opacity-65">
                  {item.cantidad} × {formatMoney(item.precioCents)}
                </span>
              </span>
              <span className="tabular shrink-0 font-semibold">
                {formatMoney(item.totalCents)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between gap-4 border-t border-tinta/15 px-4 py-4 sm:px-5">
          <span className="text-sm opacity-70">Total</span>
          <span className="tabular font-titular text-xl font-bold tracking-[-0.02em]">
            {formatMoney(pedido.totalCents)}
          </span>
        </div>
      </Seccion>

      {/* Solo los pedidos de antes de la compra por WhatsApp guardan quién
          compró: en los nuevos, esa persona está en el chat. */}
      {pedido.comprador || whatsapp ? (
        <Seccion
          id="quien-compro"
          icono={UserRound}
          titulo="Quién compró"
          bajada="Lo que dejó al comprar."
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
                  className="tabular inline-flex min-h-11 items-center font-semibold underline underline-offset-4 transition-colors hover:text-senal"
                >
                  {pedido.telefono}
                </a>
              </Dato>
            ) : null}
          </dl>
        </Seccion>
      ) : null}

      <CancelarPedido
        pedido={pedido}
        cambiar={cambiarEstado}
        soloLectura={soloLectura}
      />
    </div>
  )
}

/**
 * Por dónde pasó el pedido: llegó y después se pagó o se canceló. Dos puntos y
 * una línea: se entiende de un vistazo dónde está y qué falta.
 */
function LineaDeEstado({ pedido }: { pedido: Pedido }) {
  const cancelado = pedido.estado === "cancelado"
  const pagado = pedido.estado === "pagado"
  const pasos = [
    {
      titulo: pedido.directa ? "Venta directa" : "Llegó",
      detalle: `${formatDate(pedido.creado)} · ${formatHora(pedido.creado)}`,
      hecho: true,
      rojo: false,
    },
    cancelado
      ? { titulo: "Cancelado", detalle: "", hecho: true, rojo: false }
      : {
          titulo: "Pagado",
          detalle: pedido.pagado ? formatDate(pedido.pagado) : "Falta cobrar",
          hecho: pagado,
          rojo: !pagado,
        },
  ]

  return (
    <ol className="flex max-w-md">
      {pasos.map((paso, indice) => (
        <li key={paso.titulo} className="flex flex-1 flex-col gap-2">
          <span className="flex items-center">
            <span
              aria-hidden="true"
              className={cn(
                "size-3.5 shrink-0 rounded-full border-2",
                paso.rojo ? "border-senal" : "border-tinta",
                paso.hecho ? "bg-tinta" : "bg-papel"
              )}
            />
            {indice < pasos.length - 1 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-1 h-0.5 flex-1",
                  pasos[indice + 1].hecho ? "bg-tinta" : "bg-tinta/15"
                )}
              />
            ) : null}
          </span>
          <span>
            <span
              className={cn(
                "block text-sm font-semibold",
                paso.rojo && "text-senal"
              )}
            >
              {paso.titulo}
            </span>
            {paso.detalle ? (
              <span className="tabular block text-sm opacity-65">
                {paso.detalle}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
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
      <dd className="mt-1">{children}</dd>
    </div>
  )
}
