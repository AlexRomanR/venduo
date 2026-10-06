import Link from "next/link"
import { redirect } from "next/navigation"
import { ShoppingBag, Wallet } from "lucide-react"

import { getPedidos, type FiltroPedidos } from "@/lib/data/pedidos"
import { DIAS_PARA_CONCRETAR, ESTADOS } from "@/lib/pedidos"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { FICHA, FICHA_ELEGIDA, FICHA_LIBRE } from "@/lib/estilos"
import { formatMoney, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  Cabecera,
  Cifra,
  Cifras,
  Seccion,
  SinDatos,
} from "@/components/panel/piezas"
import { FilaPedido } from "@/components/pedidos/fila"

export const metadata = { title: "Pedidos" }

/**
 * Las fichas de la lista. "No concretados" va al final y sin rojo: son los
 * pendientes que pasaron el plazo, y están para encontrarlos, no para que
 * esperen algo de la tienda.
 */
const FILTROS: Array<{ valor: FiltroPedidos; etiqueta: string }> = [
  ...ESTADOS,
  { valor: "no_concretado", etiqueta: "No concretados" },
]

/**
 * Los pedidos de la tienda.
 *
 * Llegan por WhatsApp: el comprador manda su carrito con el número del pedido,
 * y acá queda registrado. Lo que manda el orden de la pantalla es qué pide una
 * acción: arriba, cuántos esperan que la tienda confirme el pago, que es lo
 * que descuenta el stock.
 */
export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const consulta = await searchParams
  const filtro = FILTROS.find((f) => f.valor === consulta.estado)?.valor

  const { pedidos, resumen, esDemo } = await getPedidos(filtro)

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Tus pedidos."
        bajada="Cada pedido llega a tu WhatsApp con su número. Cuando te paguen, márcalo pagado: así baja del stock."
        demo={
          esDemo &&
          "Estás en modo demo: los pedidos son de ejemplo y los cambios no se guardan."
        }
      />

      <Seccion
        id="cobros"
        icono={Wallet}
        titulo="Cómo van tus cobros"
        bajada="Lo que falta cobrar y lo que ya entró."
      >
        <Cifras>
          <Cifra
            etiqueta="Esperan pago"
            valor={formatNumber(resumen.pendientes)}
            detalle={
              resumen.pendientes > 0
                ? "Márcalos pagados cuando te paguen"
                : "Ninguno espera respuesta"
            }
            alerta={resumen.pendientes > 0}
          />
          <Cifra
            etiqueta="Por cobrar"
            valor={formatMoney(resumen.porCobrarCents)}
            detalle={`De los últimos ${DIAS_PARA_CONCRETAR} días`}
          />
          <Cifra
            etiqueta="Cobrado"
            valor={formatMoney(resumen.cobradoCents)}
            detalle={`${formatNumber(resumen.pagados)} ${resumen.pagados === 1 ? "pedido pagado" : "pedidos pagados"}`}
          />
          <Cifra
            etiqueta="No concretados"
            valor={formatNumber(resumen.noConcretados)}
            detalle={`Pendientes de hace más de ${DIAS_PARA_CONCRETAR} días`}
          />
        </Cifras>
      </Seccion>

      <Seccion
        id="lista"
        icono={ShoppingBag}
        titulo="Todos tus pedidos"
        bajada="Filtra por estado y toca uno para ver el detalle y cambiar su estado."
        extra={
          pedidos.length > 0 ? (
            <span className="tabular text-sm opacity-70">
              {formatNumber(pedidos.length)}{" "}
              {pedidos.length === 1 ? "pedido" : "pedidos"}
            </span>
          ) : null
        }
      >
        <nav
          aria-label="Filtrar por estado"
          className="flex flex-wrap gap-2 border-b border-tinta/15 px-4 py-3 sm:px-5"
        >
          <Ficha href="/panel/pedidos" activa={!filtro}>
            Todos
            <span className="tabular ml-1.5 opacity-65">
              {formatNumber(resumen.total)}
            </span>
          </Ficha>
          {FILTROS.map((f) => (
            <Ficha
              key={f.valor}
              href={`/panel/pedidos?estado=${f.valor}`}
              activa={filtro === f.valor}
            >
              {f.etiqueta}
              {f.valor === "no_concretado" && resumen.noConcretados > 0 ? (
                <span className="tabular ml-1.5 opacity-65">
                  {formatNumber(resumen.noConcretados)}
                </span>
              ) : null}
            </Ficha>
          ))}
        </nav>

        {pedidos.length === 0 ? (
          filtro ? (
            <SinDatos
              icono={ShoppingBag}
              titulo={
                filtro === "no_concretado"
                  ? "Ningún pedido quedó sin concretar"
                  : "No hay pedidos en ese estado"
              }
              texto={
                filtro === "no_concretado"
                  ? `Acá aparecen los pendientes que pasan ${DIAS_PARA_CONCRETAR} días sin concretarse: el cliente armó el carrito y no siguió. Se pueden marcar pagados igual si al final te pagan.`
                  : "Prueba con otro filtro, o mira todos los pedidos de tu tienda."
              }
            >
              <Link
                href="/panel/pedidos"
                className="inline-flex min-h-11 items-center text-sm font-semibold transition-colors hover:text-senal"
              >
                Ver todos
              </Link>
            </SinDatos>
          ) : (
            <SinDatos
              icono={ShoppingBag}
              titulo="Todavía no llegó ningún pedido"
              texto="Cuando alguien te mande su carrito por WhatsApp, el pedido aparece acá con el mismo número. Comparte el enlace de tu tienda para que empiecen a llegar."
            >
              <Link
                href="/panel"
                className="inline-flex min-h-11 items-center text-sm font-semibold transition-colors hover:text-senal"
              >
                Compartir mi tienda
              </Link>
            </SinDatos>
          )
        ) : (
          <ul>
            {pedidos.map((pedido) => (
              <FilaPedido key={pedido.id} pedido={pedido} />
            ))}
          </ul>
        )}
      </Seccion>
    </div>
  )
}

function Ficha({
  href,
  activa,
  children,
}: {
  href: string
  activa: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={activa ? "page" : undefined}
      className={cn(FICHA, activa ? FICHA_ELEGIDA : FICHA_LIBRE)}
    >
      {children}
    </Link>
  )
}
