import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowUpRight, Plus } from "lucide-react"

import { getVinculosDeVendedor } from "@/lib/data/panel"
import { urlDeReferido } from "@/lib/tienda"
import {
  getComisionesDeVendedor,
  getResumenVendedor,
  getResumenVendedorDemo,
} from "@/lib/data/vendedor"
import { COMISIONES_DEMO } from "@/lib/demo-data"
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env"
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
} from "@/lib/format"
import { toDataURL } from "@/lib/qr"
import { MaterialesVendedor } from "@/components/panel/materiales-vendedor"
import { Cifra, Encabezado, Vacio } from "@/components/panel/piezas"
import type { CommissionStatus } from "@/types"

export const metadata = { title: "Lo que vendo" }

const ESTADO: Record<CommissionStatus, { texto: string; clase: string }> = {
  pagada: {
    texto: "Pagada",
    clase: "border-tinta bg-tinta text-papel",
  },
  confirmada: {
    texto: "Confirmada",
    clase: "border-tinta text-tinta",
  },
  pendiente: {
    texto: "Pendiente",
    clase: "border-tinta/25 opacity-55",
  },
  anulada: {
    texto: "Anulada",
    clase: "border-tinta/15 opacity-40",
  },
}

/**
 * Panel del vendedor.
 *
 * Acá es donde el modelo cruza tenants: esta pantalla abarca todas las tiendas
 * donde la persona trabaja, así que nada se resuelve comparando contra
 * `my_store_id()`.
 *
 * El orden es deliberado: primero el historial, después el dinero, y al final
 * las herramientas. Lo que la plataforma le promete a un vendedor joven no es
 * la comisión de este mes sino el antecedente laboral que va acumulando, y la
 * pantalla tiene que decirlo antes que ninguna otra cosa.
 */
export default async function VendedorPage() {
  // Las tres lecturas no dependen entre sí: en serie eran tres viajes a la
  // base antes de dibujar nada. Si no hay vínculos se redirige igual, y lo
  // leído de más es poco.
  const [vinculos, resumenLeido, comisiones] = await Promise.all([
    getVinculosDeVendedor(),
    getResumenVendedor(),
    isSupabaseConfigured ? getComisionesDeVendedor() : COMISIONES_DEMO,
  ])

  if (isSupabaseConfigured && vinculos.length === 0) redirect("/sumarme")

  const resumen = resumenLeido ?? getResumenVendedorDemo()

  const sitio = getSiteUrl()
  const activos = vinculos.filter((v) => v.status === "activo")
  const principal = activos[0]

  const qr = principal
    ? await toDataURL(
        urlDeReferido(principal.storeSlug, principal.referralCode),
        { size: 320, margin: 1, dark: "#16171a" }
      )
    : null

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        <div className="flex-1">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
            Tu historial laboral
          </p>
          <h1 className="mt-3 max-w-[18ch] font-titular text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">
            {resumen.perfil?.displayName ?? "Lo que vendo"}
          </h1>
          <p className="mt-3 max-w-[54ch] text-sm leading-relaxed opacity-70">
            Cada venta confirmada queda registrada con tu nombre, la tienda y la
            fecha. Nadie lo edita a mano, y sobrevive aunque la tienda cierre.
          </p>
        </div>

        {resumen.perfil ? (
          <Link
            href={`/v/${resumen.perfil.slug}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-plantilla bg-senal px-5 text-sm font-semibold text-white transition-colors hover:bg-senal-alta"
          >
            Ver mi perfil público
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </div>

      <section>
        <Encabezado etiqueta="Tu historial hasta hoy" />
        <div className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          <Cifra
            etiqueta="Ganado"
            valor={formatMoney(resumen.ganadoCents)}
            detalle="Confirmado y pagado"
          />
          <Cifra
            etiqueta="Ventas"
            valor={formatNumber(resumen.ventas)}
            detalle={`${formatMoney(resumen.volumenCents)} movidos`}
          />
          <Cifra
            etiqueta="Tiendas"
            valor={formatNumber(resumen.tiendasEnHistorial)}
            detalle={
              resumen.tiendasActivas > 0
                ? `${formatNumber(resumen.tiendasActivas)} activas ahora`
                : "Ninguna activa ahora"
            }
          />
          <Cifra
            etiqueta="Desde"
            valor={resumen.desde ? formatDate(resumen.desde) : "—"}
            detalle={resumen.desde ? "Tu primera venta" : "Todavía sin ventas"}
          />
        </div>

        {resumen.porEstado.pendiente > 0 ? (
          <p className="mt-6 border-t border-tinta/15 pt-4 text-sm opacity-70">
            Tienes{" "}
            <span className="tabular font-semibold text-senal">
              {formatMoney(resumen.porEstado.pendiente)}
            </span>{" "}
            en comisiones pendientes: todavía no cuentan como historial porque
            el pedido puede cancelarse.
          </p>
        ) : null}
      </section>

      <section>
        <Encabezado
          etiqueta="Mis tiendas"
          accion={{ href: "/sumarme", texto: "Sumarme a otra" }}
        />

        <div className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {vinculos.map((vinculo) => (
            <div
              key={vinculo.id}
              className="flex flex-col border-t border-tinta/15 py-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="flex-1 font-titular text-lg font-bold tracking-[-0.02em]">
                  {vinculo.storeName}
                </h3>
                {vinculo.status !== "activo" ? (
                  <span className="rounded-full border border-tinta/25 px-2 py-0.5 text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
                    {vinculo.status === "pendiente"
                      ? "Esperando"
                      : vinculo.status}
                  </span>
                ) : null}
              </div>

              {vinculo.status === "activo" ? (
                <>
                  <p className="mt-3 text-xs tracking-[0.12em] uppercase opacity-55">
                    Tu código
                  </p>
                  <p className="tabular font-titular text-xl font-bold tracking-[0.1em]">
                    {vinculo.referralCode}
                  </p>
                  <div className="mt-4">
                    <MaterialesVendedor
                      storeName={vinculo.storeName}
                      enlace={urlDeReferido(
                        vinculo.storeSlug,
                        vinculo.referralCode
                      )}
                      codigo={vinculo.referralCode}
                    />
                  </div>
                </>
              ) : (
                <p className="mt-3 max-w-[46ch] text-sm leading-relaxed opacity-70">
                  Cuando el dueño apruebe tu solicitud vas a recibir tu código y
                  tu enlace. Si te pasó un enlace de invitación, úsalo y entras
                  al instante.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
        <div>
          <Encabezado etiqueta="Tus comisiones" />

          {comisiones.length === 0 ? (
            <div className="mt-6">
              <Vacio
                titulo="Todavía no tienes comisiones"
                detalle="Aparecen solas cuando alguien compra con tu enlace y la tienda confirma el pago. Comparte tu enlace para empezar."
                accion={{
                  href: "/explorar/productos",
                  texto: "Ver qué vender",
                }}
              />
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[30rem] text-sm">
                <thead>
                  <tr className="border-b border-tinta/15 text-left">
                    <th className="pr-4 pb-3 text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
                      Tienda
                    </th>
                    <th className="pr-4 pb-3 text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
                      Tu comisión
                    </th>
                    <th className="pr-4 pb-3 text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
                      Estado
                    </th>
                    <th className="pb-3 text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comisiones.map((comision) => {
                    const estado = ESTADO[comision.status]

                    return (
                      <tr
                        key={comision.id}
                        className="border-b border-tinta/15 last:border-0"
                      >
                        <td className="py-4 pr-4 font-titular font-bold tracking-[-0.01em]">
                          {comision.storeName}
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className={
                              comision.status === "anulada"
                                ? "tabular font-semibold line-through opacity-40"
                                : "tabular font-semibold"
                            }
                          >
                            {formatMoney(comision.amountCents)}
                          </span>
                          <span className="tabular ml-2 text-xs opacity-45">
                            {formatPercent(comision.rateBps)} de{" "}
                            {formatMoney(comision.baseCents)}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold tracking-[0.12em] uppercase ${estado.clase}`}
                          >
                            {estado.texto}
                          </span>
                        </td>
                        <td className="tabular py-4 opacity-55">
                          {formatDate(comision.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {qr && principal ? (
          <div className="lg:w-56">
            <Encabezado etiqueta="Tu código QR" />
            <div className="mt-6 border border-tinta p-4">
              <Image
                src={qr}
                alt={`Código QR de tu enlace para ${principal.storeName}`}
                width={320}
                height={320}
                unoptimized
                className="h-auto w-full"
              />
            </div>
            <p className="mt-3 text-sm leading-relaxed opacity-55">
              Lleva a {principal.storeName} con tu código ya puesto. Muéstralo
              desde el celular o imprímelo.
            </p>
          </div>
        ) : null}
      </section>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-tinta/15 pt-6 text-sm opacity-55">
        <span className="flex-1">
          ¿Además quieres vender lo tuyo? Puedes abrir tu propia tienda sin
          dejar de ser vendedor.
        </span>
        <Link
          href="/crear?abrir=1"
          className="inline-flex min-h-11 items-center gap-2 font-semibold opacity-100 transition-colors hover:text-senal"
        >
          <Plus aria-hidden="true" className="size-4" />
          Abrir mi tienda
        </Link>
      </p>
    </div>
  )
}
