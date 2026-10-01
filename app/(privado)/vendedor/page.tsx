import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowUpRight,
  BadgeCheck,
  Plus,
  QrCode,
  Store,
  Wallet,
} from "lucide-react"

import { getVinculosDeVendedor } from "@/lib/data/panel"
import { urlDeReferido } from "@/lib/tienda"
import {
  getComisionesDeVendedor,
  getResumenVendedor,
  getResumenVendedorDemo,
} from "@/lib/data/vendedor"
import { COMISIONES_DEMO } from "@/lib/demo-data"
import { isSupabaseConfigured } from "@/lib/env"
import { BOTON_SECUNDARIO } from "@/lib/estilos"
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatPercent,
} from "@/lib/format"
import { toDataURL } from "@/lib/qr"
import { cn } from "@/lib/utils"
import { MaterialesVendedor } from "@/components/panel/materiales-vendedor"
import {
  Cabecera,
  Cifra,
  Cifras,
  Insignia,
  Seccion,
  SinDatos,
} from "@/components/panel/piezas"
import type { CommissionStatus } from "@/types"

export const metadata = { title: "Lo que vendo" }

const ESTADO: Record<
  CommissionStatus,
  { texto: string; tono: "llena" | "tinta" | "suave" | "anulada" }
> = {
  pagada: { texto: "Pagada", tono: "llena" },
  confirmada: { texto: "Confirmada", tono: "tinta" },
  pendiente: { texto: "Pendiente", tono: "suave" },
  anulada: { texto: "Anulada", tono: "anulada" },
}

/**
 * Panel del vendedor.
 *
 * Acá es donde el modelo cruza tenants: esta pantalla abarca todas las tiendas
 * donde la persona trabaja, así que nada se resuelve comparando contra
 * `my_store_id()`.
 *
 * El orden es deliberado: primero el historial, después las tiendas y el
 * dinero. Lo que la plataforma le promete a un vendedor joven no es la
 * comisión de este mes sino el antecedente laboral que va acumulando, y la
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

  const activos = vinculos.filter((v) => v.status === "activo")
  const principal = activos[0]

  const qr = principal
    ? await toDataURL(
        urlDeReferido(principal.storeSlug, principal.referralCode),
        { size: 320, margin: 1, dark: "#16171a" }
      )
    : null

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Cabecera
        etiqueta="Tu historial laboral"
        titulo={resumen.perfil?.displayName ?? "Lo que vendo"}
        bajada="Cada venta confirmada queda registrada con tu nombre, la tienda y la fecha. Nadie la edita a mano, y sobrevive aunque la tienda cierre."
      >
        {resumen.perfil ? (
          <Link
            href={`/v/${resumen.perfil.slug}`}
            className={cn(BOTON_SECUNDARIO, "min-h-11 px-4 text-sm")}
          >
            Ver mi perfil público
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </Cabecera>

      <Seccion
        id="historial"
        icono={BadgeCheck}
        titulo="Tu historial hasta hoy"
        bajada="Cuentan las ventas confirmadas: una pendiente todavía puede cancelarse."
      >
        <Cifras>
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
                ? `${formatNumber(resumen.tiendasActivas)} ${resumen.tiendasActivas === 1 ? "activa" : "activas"} ahora`
                : "Ninguna activa ahora"
            }
          />
          <Cifra
            etiqueta="Desde"
            valor={resumen.desde ? formatDate(resumen.desde) : "—"}
            detalle={resumen.desde ? "Tu primera venta" : "Todavía sin ventas"}
          />
        </Cifras>

        {resumen.porEstado.pendiente > 0 ? (
          <p className="border-t border-tinta/15 px-4 py-3 text-sm leading-relaxed sm:px-5">
            Tienes{" "}
            <span className="tabular font-semibold">
              {formatMoney(resumen.porEstado.pendiente)}
            </span>{" "}
            en comisiones pendientes:{" "}
            <span className="opacity-70">
              se suman cuando la tienda confirme esas ventas.
            </span>
          </p>
        ) : null}
      </Seccion>

      <Seccion
        id="tiendas"
        icono={Store}
        titulo="Tus tiendas"
        bajada="Tu código y tu enlace en cada una: compártelos y la venta te cuenta."
        accion={{ href: "/sumarme", texto: "Sumarme a otra tienda" }}
      >
        {vinculos.length === 0 ? (
          <SinDatos
            icono={Store}
            titulo="Todavía no vendes para ninguna tienda"
            texto="Elige una tienda o un producto de las vitrinas, o entra con el enlace que te pasó su dueño."
          />
        ) : (
          <ul className="grid gap-px bg-tinta/15 md:grid-cols-2 md:[&>*:last-child:nth-child(odd)]:col-span-2">
            {vinculos.map((vinculo) => (
              <li
                key={vinculo.id}
                className="flex flex-col bg-papel px-4 py-4 sm:px-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="flex-1 font-titular text-lg font-bold tracking-[-0.02em]">
                    {vinculo.storeName}
                  </h3>
                  {vinculo.status !== "activo" ? (
                    <Insignia tono="suave">
                      {vinculo.status === "pendiente"
                        ? "Esperando"
                        : vinculo.status}
                    </Insignia>
                  ) : null}
                </div>

                {vinculo.status === "activo" ? (
                  <>
                    <p className="mt-3 text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
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
                    Cuando el dueño apruebe tu solicitud vas a recibir tu código
                    y tu enlace. Si te pasó un enlace de invitación, úsalo y
                    entras al instante.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <div className="grid items-start gap-6 md:gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Seccion
          id="comisiones"
          icono={Wallet}
          titulo="Tus comisiones"
          bajada="Lo que ganaste en cada venta, con la tasa que tenía ese día."
        >
          {comisiones.length === 0 ? (
            <SinDatos
              icono={Wallet}
              titulo="Todavía no tienes comisiones"
              texto="Aparecen solas cuando alguien compra con tu enlace y la tienda confirma el pago. Comparte tu enlace para empezar."
            >
              <Link
                href="/explorar/productos"
                className="inline-flex min-h-11 items-center text-sm font-semibold transition-colors hover:text-senal"
              >
                Ver qué vender
              </Link>
            </SinDatos>
          ) : (
            <ul>
              {comisiones.map((comision) => {
                const estado = ESTADO[comision.status]
                const anulada = comision.status === "anulada"

                return (
                  <li
                    key={comision.id}
                    className="flex items-center gap-3 border-t border-tinta/15 px-4 py-3 first:border-t-0 sm:px-5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-titular font-bold tracking-[-0.01em]">
                        {comision.storeName}
                      </span>
                      <span className="tabular mt-0.5 block text-xs opacity-70">
                        {formatPercent(comision.rateBps)} de{" "}
                        {formatMoney(comision.baseCents)} ·{" "}
                        {formatDate(comision.createdAt)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={cn(
                          "tabular font-titular font-bold",
                          anulada && "line-through opacity-55"
                        )}
                      >
                        {formatMoney(comision.amountCents)}
                      </span>
                      <Insignia tono={estado.tono}>{estado.texto}</Insignia>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Seccion>

        {qr && principal ? (
          <Seccion
            id="qr"
            icono={QrCode}
            titulo="Tu código QR"
            bajada={`Lleva a ${principal.storeName} con tu código ya puesto.`}
            relleno
          >
            <Image
              src={qr}
              alt={`Código QR de tu enlace para ${principal.storeName}`}
              width={320}
              height={320}
              unoptimized
              className="mx-auto h-auto w-full max-w-60 border border-tinta/15"
            />
            <p className="text-xs leading-relaxed opacity-70">
              Muéstralo desde el celular o imprímelo.
            </p>
          </Seccion>
        ) : null}
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-tinta/15 pt-5 text-sm">
        <span className="flex-1 opacity-70">
          ¿Además quieres vender lo tuyo? Puedes abrir tu propia tienda sin
          dejar de ser vendedor.
        </span>
        <Link
          href="/crear?abrir=1"
          className="inline-flex min-h-11 items-center gap-2 font-semibold transition-colors hover:text-senal"
        >
          <Plus aria-hidden="true" className="size-4" />
          Abrir mi tienda
        </Link>
      </p>
    </div>
  )
}
