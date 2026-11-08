"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MessageCircle, ShoppingBag, StickyNote } from "lucide-react"
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
 * `cobrar` es la acción del servidor que cambia el estado. Marcar pagado
 * pregunta antes, como en la app: se descuenta del stock y no se deshace.
 *
 * Solo late el pendiente más viejo: con diez pendientes, diez latidos dejan de
 * ser una señal. La lista llega de lo más nuevo a lo más viejo, así que el más
 * viejo es el último pendiente. Cuando la base confirma un pago, el sello
 * "Pagado" se estampa y recién después de verlo se refresca la lista.
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
  const [recienCobrado, setRecienCobrado] = React.useState<string | null>(null)
  // Mientras se pregunta o se guarda, ningún sello late.
  const [preguntando, setPreguntando] = React.useState(false)

  async function marcarCobrado(pedido: PedidoEnFila) {
    if (soloLectura) {
      toast.info("Estás en modo demo: los cambios no se guardan.")
      return
    }
    setPreguntando(true)
    const si = await preguntar({
      titulo: `¿Marcar pagado el pedido #${pedido.numero}?`,
      texto:
        "Se descuenta de tu stock. Un pedido pagado no vuelve a pendiente.",
      confirmar: "Marcar pagado",
    })
    setPreguntando(false)
    if (!si) return
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("Sin conexión. El pedido sigue por cobrar.")
      return
    }

    setCobrando(pedido.id)
    const resultado = await cobrar(pedido.id, "pagado")
    setCobrando(null)
    if (!resultado.ok) {
      toast.error(
        resultado.error ??
          "No pudimos marcar el pedido pagado. Inténtalo de nuevo."
      )
      return
    }
    // La regla del sello verdadero: se estampa recién con la base confirmada,
    // y la lista se refresca después de que se vio el golpe.
    setRecienCobrado(pedido.id)
    festejar()
    toast.success("Pago confirmado. Ya se descontó del stock.")
    window.setTimeout(() => router.refresh(), 900)
  }

  // El pendiente más viejo de lo que se muestra: el último de la lista.
  let masViejo: string | null = null
  for (const renglon of renglones) {
    if (
      renglon.tipo === "pedido" &&
      renglon.pedido.estado === "pendiente" &&
      !renglon.pedido.noConcretado &&
      renglon.pedido.id !== recienCobrado
    ) {
      masViejo = renglon.pedido.id
    }
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
                className="border-t border-tinta/15 px-4 pt-4 pb-1.5 text-xs font-semibold tracking-[0.12em] uppercase opacity-70 first:border-t-0 sm:px-5"
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
              recien={recienCobrado === pedido.id}
              late={masViejo === pedido.id && !preguntando && cobrando === null}
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
 * Un pedido en una lista, como un ticket: la foto de lo que pidieron, su número
 * y qué pidió, y a la derecha, separado por una línea punteada, el talón con el
 * total y su estado como un sello de goma.
 *
 * En un pendiente, el sello "Por cobrar" es el botón que lo marca pagado: es lo
 * que más se hace con un pedido, y se hace sin abrirlo. Al confirmarse, el
 * sello "Pagado" se estampa. Los pedidos anteriores a la compra por WhatsApp
 * guardan el teléfono de quien compró, y esos llevan el atajo al chat. Son
 * destinos distintos y por eso objetos distintos: un enlace dentro de otro no
 * se toca bien con el dedo.
 */
function FilaDePedido({
  pedido,
  primera,
  oculta,
  cobrando,
  ocupado,
  recien,
  late,
  alCobrar,
}: {
  pedido: PedidoEnFila
  primera: boolean
  oculta: boolean
  cobrando: boolean
  ocupado: boolean
  /** Se acaba de marcar pagado: el sello se estampa. */
  recien: boolean
  /** Es el pendiente más viejo: su sello late. */
  late: boolean
  alCobrar?: () => void
}) {
  const pendiente = Boolean(alCobrar) && !pedido.noConcretado && !recien
  const estado: OrderStatus = recien ? "pagado" : pedido.estado

  return (
    <li
      className={cn(
        "flex items-stretch",
        !primera && "border-t border-tinta/12",
        oculta && "max-lg:hidden"
      )}
    >
      <Link
        href={`/panel/pedidos/${pedido.id}`}
        className="group flex min-h-[4.75rem] min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-tinta/[0.03] active:bg-tinta/[0.06] sm:px-5"
      >
        <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-tinta/[0.05]">
          {pedido.foto ? (
            <Image
              src={pedido.foto}
              alt=""
              fill
              sizes="48px"
              className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
            />
          ) : (
            <ShoppingBag aria-hidden="true" className="size-4 opacity-35" />
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="tabular truncate text-[12.5px] font-semibold text-tinta/65">
            #{pedido.numero} · {pedido.relativo}
            <span className="max-sm:hidden">
              {" · "}
              {pedido.directa
                ? "Venta directa"
                : `${formatNumber(pedido.articulos)} ${pedido.articulos === 1 ? "artículo" : "artículos"}`}
            </span>
          </span>
          <span className="line-clamp-2 font-titular text-[16.5px] leading-snug font-bold tracking-[-0.015em] decoration-tinta/40 underline-offset-4 group-hover:underline sm:truncate">
            {pedido.titulo}
          </span>
          {pedido.nota ? (
            <span className="flex min-w-0 items-center gap-1.5 text-sm text-tinta/65">
              <StickyNote aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="sr-only">Nota:</span>
              <span className="truncate">{pedido.nota.split("\n")[0]}</span>
            </span>
          ) : null}
        </span>
      </Link>

      {/* El chat, antes del talón: así la línea punteada queda a la misma
          altura en todas las filas. */}
      {pedido.telefono ? (
        <a
          href={`https://wa.me/${numeroDeWhatsApp(pedido.telefono)}`}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Escribir a quien hizo el pedido ${pedido.numero} por WhatsApp`}
          className="mr-2 flex size-11 shrink-0 items-center justify-center self-center rounded-full border border-tinta/15 transition-colors hover:border-tinta hover:bg-tinta hover:text-papel sm:mr-3"
        >
          <MessageCircle aria-hidden="true" className="size-5" />
        </a>
      ) : null}

      {/* El talón: el total y el estado, separados por la línea punteada. El
          pendiente lleva su sello adentro de un botón: tocarlo cobra. */}
      <div className="flex w-[8.5rem] shrink-0 flex-col items-end justify-center gap-1.5 border-l border-dashed border-tinta/25 px-3 py-3 sm:w-[9.5rem] sm:pr-5 sm:pl-4 lg:w-[10rem]">
        <span
          className={cn(
            "tabular font-titular text-[17px] leading-none font-extrabold tracking-[-0.02em] sm:text-lg",
            estado === "cancelado" && "text-tinta/60 line-through",
            recien && "texto-recien"
          )}
        >
          {formatMoney(pedido.totalCents)}
        </span>
        {pendiente ? (
          <button
            type="button"
            onClick={alCobrar}
            disabled={ocupado}
            aria-busy={cobrando || undefined}
            aria-label={`Marcar pagado el pedido #${pedido.numero}`}
            className="group/sello relative -my-1 -mr-1 inline-flex min-h-11 min-w-11 items-center justify-end rounded-[10px] p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta disabled:opacity-50"
          >
            <Estado
              estado="pendiente"
              late={late}
              className="transition-[rotate,scale,color] duration-200 ease-out group-hover/sello:scale-105 group-hover/sello:[rotate:0deg] group-hover/sello:text-senal-alta group-active/sello:scale-95 motion-reduce:transition-none"
            />
          </button>
        ) : (
          <Estado
            estado={estado}
            noConcretado={pedido.noConcretado && !recien}
            recien={recien}
          />
        )}
      </div>
    </li>
  )
}
