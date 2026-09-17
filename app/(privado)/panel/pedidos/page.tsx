import Link from "next/link"
import { redirect } from "next/navigation"

import { getPedidos } from "@/lib/data/pedidos"
import { ESTADOS } from "@/lib/pedidos"
import { getMiTienda } from "@/lib/data/panel"
import { isSupabaseConfigured } from "@/lib/env"
import { formatMoney, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Cifra, Encabezado, Vacio } from "@/components/panel/piezas"
import { FilaPedido } from "@/components/pedidos/piezas"
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

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="max-w-[18ch] font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">
          Tus pedidos.
        </h1>
        <p className="mt-3 max-w-[58ch] text-sm leading-relaxed opacity-70">
          Confirma los pagos, coordina las entregas y lleva cada pedido hasta el
          final. Al confirmar un pago se acredita sola la comisión de quien lo
          trajo.
          {esDemo ? (
            <>
              {" "}
              <span className="font-semibold">
                Estás en modo demo: los pedidos son de ejemplo y los cambios no
                se guardan.
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          etiqueta="Esperando pago"
          valor={formatNumber(resumen.pendientes)}
          detalle={
            resumen.conComprobante > 0
              ? `${resumen.conComprobante} ya subieron su comprobante`
              : "Ninguno subió comprobante todavía"
          }
          alerta={resumen.conComprobante > 0}
        />
        <Cifra
          etiqueta="Por cobrar"
          valor={formatMoney(resumen.porCobrarCents)}
          detalle="Pedidos que todavía no confirmaste"
        />
        <Cifra
          etiqueta="Cobrado"
          valor={formatMoney(resumen.cobradoCents)}
          detalle={`${resumen.pagados + resumen.enCamino + resumen.entregados} pedidos confirmados`}
        />
        <Cifra
          etiqueta="En camino"
          valor={formatNumber(resumen.enCamino)}
          detalle={`${resumen.entregados} ya entregados`}
        />
      </div>

      <section className="border-t border-tinta/15 pt-10">
        <div className="flex flex-wrap items-center gap-2">
          <Ficha href="/panel/pedidos" activa={!filtro}>
            Todos
            <span className="tabular ml-1.5 opacity-45">{resumen.total}</span>
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
        </div>

        <div className="mt-10">
          {pedidos.length === 0 ? (
            filtro ? (
              <Vacio
                titulo="No hay pedidos en ese estado"
                detalle="Prueba con otro filtro, o mira todos los pedidos de tu tienda."
                accion={{ href: "/panel/pedidos", texto: "Ver todos" }}
              />
            ) : (
              <Vacio
                titulo="Todavía no llegó ningún pedido"
                detalle="Cuando alguien compre en tu tienda aparece acá, con sus datos de contacto y su comprobante. Comparte el enlace de tu tienda para que empiecen a llegar."
                accion={{ href: "/panel", texto: "Ver mi enlace" }}
              />
            )
          ) : (
            <>
              <Encabezado
                etiqueta={`${pedidos.length} ${pedidos.length === 1 ? "pedido" : "pedidos"}`}
              />

              <ul className="mt-6 flex flex-col">
                {pedidos.map((pedido) => (
                  <FilaPedido
                    key={pedido.id}
                    pedido={pedido}
                    ver={verComprobante}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
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
      className={cn(
        "flex min-h-11 items-center border px-4 text-sm font-semibold transition-colors",
        activa
          ? "border-senal bg-senal text-white"
          : "border-tinta/25 hover:border-tinta"
      )}
    >
      {children}
    </Link>
  )
}
