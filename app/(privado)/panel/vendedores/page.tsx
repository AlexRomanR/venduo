import Link from "next/link"
import { redirect } from "next/navigation"
import { HandCoins, Send, UserPlus, Users } from "lucide-react"

import { getMiInvitacion, getRedDeMiTienda } from "@/lib/data/panel"
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env"
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
  formatRelative,
} from "@/lib/format"
import {
  Cabecera,
  Cifra,
  Cifras,
  Insignia,
  Seccion,
  SinDatos,
} from "@/components/panel/piezas"
import { EnlaceInvitacion } from "@/components/panel/enlace-invitacion"
import { DecidirSolicitud } from "@/components/panel/solicitud"
import { decidirSolicitud } from "./acciones"

export const metadata = { title: "Vendedores" }

const OTROS: Record<string, string> = {
  rechazado: "Rechazado",
  suspendido: "Suspendido",
}

/**
 * La red de vendedores de la tienda.
 *
 * Primero lo que espera una respuesta —quién pidió vender—, después cómo le
 * va a cada uno y al final la invitación. Lo que paga la tienda va arriba de
 * todo porque es la condición de todo lo demás: con la tasa a la vista, las
 * comisiones de abajo se entienden solas.
 */
export default async function VendedoresPage() {
  const [red, invitacion] = await Promise.all([
    getRedDeMiTienda(),
    getMiInvitacion(),
  ])

  if (!red) {
    if (isSupabaseConfigured) redirect("/crear")
    return null
  }

  const pendientes = red.vendedores.filter((v) => v.status === "pendiente")
  const activos = red.vendedores
    .filter((v) => v.status === "activo")
    .sort((a, b) => b.ventasCents - a.ventasCents)
  const otros = red.vendedores.filter(
    (v) => v.status !== "pendiente" && v.status !== "activo"
  )
  const vendido = activos.reduce((total, v) => total + v.ventasCents, 0)
  const comisiones = activos.reduce((total, v) => total + v.comisionCents, 0)
  const pedidos = activos.reduce((total, v) => total + v.pedidos, 0)
  const codigo = invitacion ?? (red.esDemo ? "ROSA24" : null)

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        titulo="Tu red de vendedores."
        bajada="Quién vende tus productos a comisión, cuánto vendió cada uno y cuánto le toca."
        demo={
          red.esDemo &&
          "Estás en modo demo: la red es de ejemplo y los cambios no se guardan."
        }
      />

      <Seccion
        id="como-trabaja"
        icono={HandCoins}
        titulo="Cómo trabaja tu red"
        bajada={
          red.activa
            ? "Lo que pagas por venta y lo que ya vendieron para ti."
            : "Tu tienda no acepta vendedores. Se enciende desde Mi cuenta."
        }
        accion={{
          href: "/cuenta#tienda",
          texto: red.activa
            ? "Cambiar la comisión o cómo entran"
            : "Abrir mi tienda a vendedores",
        }}
      >
        <Cifras>
          <Cifra
            etiqueta="Pagas"
            valor={red.activa ? formatPercent(red.comisionBps) : "—"}
            detalle="Por cada venta que traen"
          />
          <Cifra
            etiqueta="Vendiendo"
            valor={formatNumber(activos.length)}
            detalle={
              red.modo === "abierta"
                ? "Entran al instante"
                : "Entran con tu aprobación"
            }
          />
          <Cifra
            etiqueta="Vendieron"
            valor={formatMoney(vendido)}
            detalle={`${formatNumber(pedidos)} ${pedidos === 1 ? "pedido pagado" : "pedidos pagados"}`}
          />
          <Cifra
            etiqueta="Les toca"
            valor={formatMoney(comisiones)}
            detalle="Con la tasa de cada venta"
          />
        </Cifras>
      </Seccion>

      {pendientes.length > 0 ? (
        <Seccion
          id="solicitudes"
          icono={UserPlus}
          titulo="Quieren vender para ti"
          bajada="Aprueba a quien conozcas: desde ese momento las ventas con su enlace le cuentan."
          extra={
            <span className="tabular text-sm font-semibold text-senal">
              {formatNumber(pendientes.length)} esperando
            </span>
          }
        >
          <ul>
            {pendientes.map((vendedor) => (
              <li
                key={vendedor.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-tinta/15 px-4 py-3 first:border-t-0 sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-titular font-bold tracking-[-0.01em]">
                    {vendedor.nombre}
                  </span>
                  <span className="mt-0.5 block text-xs opacity-70">
                    Lo pidió {formatRelative(vendedor.joinedAt)}
                  </span>
                </span>
                <DecidirSolicitud
                  id={vendedor.id}
                  nombre={vendedor.nombre}
                  decidir={decidirSolicitud}
                  soloLectura={red.esDemo}
                />
              </li>
            ))}
          </ul>
        </Seccion>
      ) : null}

      <div className="grid items-start gap-6 md:gap-8 xl:grid-cols-[1.45fr_1fr]">
        <Seccion
          id="quien-vende"
          icono={Users}
          titulo="Quién vende para ti"
          bajada="Ordenados por lo que vendieron. La comisión se congela en cada venta."
          extra={
            activos.length > 0 ? (
              <span className="tabular text-sm opacity-70">
                {formatNumber(activos.length)}{" "}
                {activos.length === 1 ? "activo" : "activos"}
              </span>
            ) : null
          }
        >
          {activos.length === 0 && otros.length === 0 ? (
            <SinDatos
              icono={Users}
              titulo="Todavía no vende nadie para ti"
              texto="Comparte tu enlace de invitación con quienes quieres que vendan tus productos, o espera a que te encuentren en la lista de tiendas abiertas."
            />
          ) : (
            <ul>
              {activos.map((vendedor, indice) => (
                // El detalle va en una segunda línea a todo el ancho: a su
                // derecha, en 375 px, dejaba al nombre en cuatro letras.
                <li
                  key={vendedor.id}
                  className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5 border-t border-tinta/15 px-4 py-3 first:border-t-0 sm:px-5"
                >
                  <span className="tabular text-xs opacity-65">
                    {indice + 1}
                  </span>
                  <span className="truncate font-titular font-bold tracking-[-0.01em]">
                    {vendedor.nombre}
                  </span>
                  <span className="tabular font-titular font-bold">
                    {formatMoney(vendedor.ventasCents)}
                  </span>
                  <span className="tabular col-span-2 col-start-2 text-xs opacity-70">
                    {vendedor.referralCode} ·{" "}
                    {vendedor.pedidos === 0
                      ? `sin ventas todavía · desde el ${formatDate(vendedor.joinedAt)}`
                      : `${formatNumber(vendedor.pedidos)} ${vendedor.pedidos === 1 ? "pedido" : "pedidos"} · le toca ${formatMoney(vendedor.comisionCents)}`}
                  </span>
                </li>
              ))}
              {otros.map((vendedor) => (
                <li
                  key={vendedor.id}
                  className="flex items-center gap-3 border-t border-tinta/15 px-4 py-3 first:border-t-0 sm:px-5"
                >
                  <span className="w-5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate opacity-70">
                    {vendedor.nombre}
                  </span>
                  <Insignia tono="suave">
                    {OTROS[vendedor.status] ?? vendedor.status}
                  </Insignia>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion
          id="invitar"
          icono={Send}
          titulo="Invita a vender"
          bajada="Quien entra por este enlace queda activo al instante, sin esperar tu aprobación."
          relleno
        >
          {codigo ? (
            <EnlaceInvitacion
              slug={red.slug}
              codigo={codigo}
              siteUrl={getSiteUrl()}
              soloLectura={red.esDemo}
            />
          ) : (
            <p className="text-sm leading-relaxed opacity-70">
              No pudimos traer tu enlace ahora.{" "}
              <Link
                href="/panel/vendedores"
                className="font-semibold underline underline-offset-4"
              >
                Vuelve a intentarlo
              </Link>
              .
            </p>
          )}
        </Seccion>
      </div>
    </div>
  )
}
