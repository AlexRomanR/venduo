"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

import { formatMoney } from "@/lib/format"
import type { PedidoEnFila } from "@/lib/pedidos"
import { cn } from "@/lib/utils"
import type { OrderStatus } from "@/types"
import { useConfirmacion } from "@/components/panel/confirmar"
import { useFestejo } from "@/components/panel/festejo"
import { Estado } from "@/components/pedidos/piezas"
import { CompartirTienda } from "@/components/panel/tablero/compartir"
import { Flecha } from "@/components/portada/trazos"
import portada from "@/components/portada/portada.module.css"
import { entra, useEscena } from "@/components/panel/resumen/escena"
import {
  BAJADA,
  Mano,
  Rotulo,
  TITULAR,
} from "@/components/panel/resumen/piezas"
import estilos from "@/components/panel/resumen/resumen.module.css"

type Cobrar = (
  id: string,
  estado: OrderStatus
) => Promise<{ ok: boolean; error?: string }>

/** En el celular, los tres más nuevos; en una pantalla ancha, cinco. */
const EN_CELULAR = 3

/**
 * Los pedidos más nuevos, como tickets que llegan uno detrás del otro. El que
 * espera su cobro late y se marca pagado acá mismo: el sello se estampa.
 */
export function Pedidos({
  pedidos,
  cobrar,
  soloLectura,
  tienda,
}: {
  pedidos: PedidoEnFila[]
  cobrar: Cobrar
  soloLectura: boolean
  tienda: { nombre: string; slug: string; url: string; legible: string }
}) {
  const raiz = useRef<HTMLElement>(null)
  const router = useRouter()
  const { preguntar, dialogo } = useConfirmacion()
  const { festejo, festejar } = useFestejo()
  const [cobrando, setCobrando] = useState<string | null>(null)
  const [cobrados, setCobrados] = useState<Set<string>>(() => new Set())
  // Mientras se pregunta o se guarda, el sello no late.
  const [preguntando, setPreguntando] = useState(false)

  useEscena(raiz, (tl, piezas) => {
    entra(
      tl,
      piezas(".js-ticket"),
      {
        x: 80,
        rotate: (i) => (i % 2 ? 4 : -3),
        autoAlpha: 0,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.12,
      },
      0.15
    )
    entra(
      tl,
      piezas(".js-sello"),
      {
        scale: 2.2,
        autoAlpha: 0,
        duration: 0.45,
        ease: "back.out(2.4)",
        stagger: 0.12,
      },
      0.7
    )
  })

  async function marcarPagado(pedido: PedidoEnFila) {
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
    if (!navigator.onLine) {
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
    setCobrados((antes) => new Set(antes).add(pedido.id))
    festejar()
    toast.success("Pago confirmado. Ya se descontó del stock.")
    // Se refresca después de que se vio el golpe del sello.
    window.setTimeout(() => router.refresh(), 900)
  }

  // El pendiente más viejo: los pedidos llegan de lo más nuevo a lo más viejo.
  let masViejo = -1
  pedidos.forEach((pedido, indice) => {
    if (
      pedido.estado === "pendiente" &&
      !pedido.noConcretado &&
      !cobrados.has(pedido.id)
    ) {
      masViejo = indice
    }
  })

  return (
    <section
      ref={raiz}
      data-escena
      id="ultimos-pedidos"
      aria-labelledby="titulo-pedidos"
      className="grid gap-10 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 lg:py-20"
    >
      {dialogo}
      {festejo}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Rotulo>Últimos pedidos</Rotulo>
        <h2 id="titulo-pedidos" className={TITULAR}>
          Te escriben por WhatsApp.{" "}
          <span className={portada.resaltado}>Tú cobras aquí.</span>
        </h2>
        <p className={BAJADA}>
          Apenas te paguen, márcalo pagado: el stock baja solo.
        </p>
        {pedidos.length > 0 ? (
          <Link
            href="/panel/pedidos"
            className={cn(portada.enlace, "js-sube mt-4")}
          >
            Ver todos los pedidos
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </div>

      {pedidos.length === 0 ? (
        <div className="js-sube flex flex-col items-start gap-5 rounded-[20px] border-2 border-dashed border-[var(--regla)] p-6 sm:p-8">
          <ShoppingBag
            aria-hidden="true"
            className="size-8 text-[var(--tinta)]/35"
          />
          <div>
            <p className="text-[19px] font-semibold">
              Todavía no llegó ningún pedido
            </p>
            <p className="mt-1 text-[15.5px] text-[var(--tinta)]/60">
              Cada carrito que te manden por WhatsApp aparece aquí, como un
              ticket.
            </p>
          </div>
          <CompartirTienda {...tienda}>
            <button type="button" className={portada.boton}>
              Compartir tu tienda
            </button>
          </CompartirTienda>
        </div>
      ) : (
        <ol className="flex flex-col gap-3.5">
          {pedidos.map((pedido, indice) => {
            const estado: OrderStatus = cobrados.has(pedido.id)
              ? "pagado"
              : pedido.estado
            return (
              <li
                key={pedido.id}
                className={cn(
                  "js-ticket relative",
                  indice >= EN_CELULAR && "max-sm:hidden"
                )}
              >
                {indice === masViejo ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-9 right-6 z-10 hidden items-end gap-1 sm:flex"
                  >
                    <Mano className="text-[18px]">este espera tu cobro</Mano>
                    <Flecha className="h-7 w-9 translate-y-3 rotate-[95deg]" />
                  </span>
                ) : null}
                <Ticket
                  pedido={pedido}
                  estado={estado}
                  recien={cobrados.has(pedido.id)}
                  cobrando={cobrando === pedido.id}
                  ocupado={cobrando !== null}
                  late={
                    indice === masViejo && !preguntando && cobrando === null
                  }
                  alCobrar={() => void marcarPagado(pedido)}
                />
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function Ticket({
  pedido,
  estado,
  recien,
  cobrando,
  ocupado,
  late,
  alCobrar,
}: {
  pedido: PedidoEnFila
  estado: OrderStatus
  recien: boolean
  cobrando: boolean
  ocupado: boolean
  /** Es el pendiente más viejo: su sello late. */
  late: boolean
  alCobrar: () => void
}) {
  const pendiente = estado === "pendiente" && !pedido.noConcretado

  return (
    <div
      className={cn(
        estilos.nota,
        "grid overflow-hidden rounded-[16px] transition-transform duration-300 hover:-translate-y-0.5 sm:grid-cols-[1fr_auto]",
        estado === "cancelado" && "opacity-60"
      )}
    >
      <Link
        href={`/panel/pedidos/${pedido.id}`}
        className="group flex min-w-0 items-center gap-3.5 p-3.5 sm:gap-4 sm:p-4"
      >
        <span className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-[var(--tinta)]/[0.05] sm:size-16">
          {pedido.foto ? (
            <Image
              src={pedido.foto}
              alt=""
              fill
              sizes="64px"
              className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
            />
          ) : (
            <ShoppingBag
              aria-hidden="true"
              className="absolute inset-0 m-auto size-5 opacity-40"
            />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-[12.5px] font-semibold text-[var(--tinta)]/65 tabular-nums">
            #{pedido.numero} · {pedido.relativo}
            {pedido.directa ? " · Venta directa" : ""}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-[16.5px] leading-snug font-semibold decoration-[var(--tinta)]/40 underline-offset-4 group-hover:underline sm:truncate">
            {pedido.titulo}
          </span>
          {pedido.nota ? (
            <span className="mt-0.5 block truncate text-[13.5px] text-[var(--tinta)]/55 italic">
              {pedido.nota}
            </span>
          ) : null}
        </span>
      </Link>

      <div
        className={cn(
          estilos.picado,
          "flex items-center justify-between gap-2 border-t border-dashed border-[var(--tinta)]/25 px-3.5 py-2.5 max-sm:bg-none sm:min-w-[10rem] sm:flex-col sm:items-end sm:justify-center sm:gap-1.5 sm:border-t-0 sm:py-3 sm:pr-4 sm:pl-5"
        )}
      >
        <span
          className={cn(
            portada.titular,
            portada.cifras,
            "text-[clamp(1.2rem,2.4vw,1.5rem)] leading-none",
            estado === "cancelado" && "line-through",
            recien && "texto-recien"
          )}
        >
          {formatMoney(pedido.totalCents)}
        </span>
        {pendiente ? (
          // El sello "Por cobrar" se toca: pregunta y, con la base, se estampa.
          <button
            type="button"
            onClick={alCobrar}
            disabled={ocupado}
            aria-busy={cobrando || undefined}
            aria-label={`Marcar pagado el pedido #${pedido.numero}`}
            className="group/sello relative -my-1 -mr-1 inline-flex min-h-11 min-w-11 items-center justify-end rounded-[10px] p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tinta)] disabled:opacity-50"
          >
            <Estado
              estado="pendiente"
              late={late}
              className="transition-[rotate,scale,color] duration-200 ease-out group-hover/sello:scale-105 group-hover/sello:[rotate:0deg] group-hover/sello:text-[var(--senal-alta)] group-active/sello:scale-95 motion-reduce:transition-none"
            />
          </button>
        ) : (
          <Estado
            estado={estado}
            noConcretado={pedido.noConcretado && !recien}
            recien={recien}
            className={recien ? undefined : "js-sello"}
          />
        )}
      </div>
    </div>
  )
}
