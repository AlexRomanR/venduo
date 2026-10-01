import Link from "next/link"
import { redirect } from "next/navigation"
import { ShoppingBag, Wallet } from "lucide-react"

import { getPedidos } from "@/lib/data/pedidos"
import { ESTADOS } from "@/lib/pedidos"
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
import { verComprobante } from "./acciones"

export const metadata = { title: "Pedidos" }

/**
 * Los pedidos de la tienda.
 *
 * Lo que manda el orden de la pantalla es qué pide una acción: arriba, cuánto
 * falta cobrar y cuántos pedidos llegaron con su comprobante esperando que
 * alguien los mire. Un pedido pendiente con comprobante es plata que ya está y
 * una comisión que todavía no se pagó.
 */
export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const tienda = await getMiTienda()
  if (isSupabaseConfigured && !tienda?.template_key) redirect("/crear")

  const consulta = await searchParams
  const filtro =
    typeof consulta.estado === "string" ? consulta.estado : undefined

  const { pedidos, resumen, esDemo } = await getPedidos(filtro)
  const confirmados = resumen.pagados + resumen.enCamino + resumen.entregados

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Tus pedidos."
        bajada="Confirma los pagos, coordina las entregas y lleva cada pedido hasta el final."
        demo={
          esDemo &&
          "Estás en modo demo: los pedidos son de ejemplo y los cambios no se guardan."
        }
      />

      <Seccion
        id="cobros"
        icono={Wallet}
        titulo="Cómo van tus cobros"
        bajada="Lo que falta confirmar y lo que ya entró, sin los cancelados."
      >
        <Cifras>
          <Cifra
            etiqueta="Esperan pago"
            valor={formatNumber(resumen.pendientes)}
            detalle={
              resumen.conComprobante > 0
                ? `${formatNumber(resumen.conComprobante)} ya subieron su comprobante`
                : "Ninguno subió comprobante todavía"
            }
            alerta={resumen.conComprobante > 0}
          />
          <Cifra
            etiqueta="Por cobrar"
            valor={formatMoney(resumen.porCobrarCents)}
            detalle="De los que esperan pago"
          />
          <Cifra
            etiqueta="Cobrado"
            valor={formatMoney(resumen.cobradoCents)}
            detalle={`${formatNumber(confirmados)} ${confirmados === 1 ? "pedido confirmado" : "pedidos confirmados"}`}
          />
          <Cifra
            etiqueta="En camino"
            valor={formatNumber(resumen.enCamino)}
            detalle={`${formatNumber(resumen.entregados)} ya ${resumen.entregados === 1 ? "entregado" : "entregados"}`}
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
          {ESTADOS.map((estado) => (
            <Ficha
              key={estado.valor}
              href={`/panel/pedidos?estado=${estado.valor}`}
              activa={filtro === estado.valor}
            >
              {estado.etiqueta}
            </Ficha>
          ))}
        </nav>

        {pedidos.length === 0 ? (
          filtro ? (
            <SinDatos
              icono={ShoppingBag}
              titulo="No hay pedidos en ese estado"
              texto="Prueba con otro filtro, o mira todos los pedidos de tu tienda."
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
              texto="Cuando alguien compre en tu tienda aparece acá, con su WhatsApp para coordinar la entrega. Comparte el enlace de tu tienda para que empiecen a llegar."
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
              <FilaPedido
                key={pedido.id}
                pedido={pedido}
                ver={verComprobante}
              />
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
