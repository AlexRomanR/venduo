import Link from "next/link"

import { getMisComisiones } from "@/lib/data/promotor"
import { formatDate, formatMoney, formatPercent } from "@/lib/format"
import type { TipoComision } from "@/lib/promotor"
import { cn } from "@/lib/utils"
import { Cifra, Vacio } from "@/components/panel/piezas"
import { EstadoComision } from "@/components/promotor/piezas"

export const metadata = { title: "Mis ganancias" }

const FILTROS: Array<{ valor: TipoComision | null; texto: string }> = [
  { valor: null, texto: "Todas" },
  { valor: "directa", texto: "Con tu enlace" },
  { valor: "indirecta", texto: "De compradores que trajiste" },
]

/**
 * Cada comisión, con su estado y de dónde vino.
 *
 * El recorrido del dinero va arriba porque la pregunta que se repite es
 * "¿cuándo me pagan?", y la respuesta depende del pedido, no de Venduo.
 */
export default async function GananciasPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const { tipo } = await searchParams
  const filtro: TipoComision | null =
    tipo === "directa" || tipo === "indirecta" ? tipo : null

  const comisiones = await getMisComisiones()
  const lista = filtro
    ? comisiones.filter((c) => c.tipo === filtro)
    : comisiones

  const suma = (estado: string) =>
    comisiones
      .filter((c) => c.estado === estado)
      .reduce((acc, c) => acc + c.montoCents, 0)

  return (
    <div className="flex flex-col gap-12">
      <div>
        <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
          Ganancias
        </p>
        <h1 className="mt-3 max-w-[18ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em]">
          Lo que ganaste, y cuándo te llega.
        </h1>
      </div>

      <section className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          etiqueta="Por cobrar"
          valor={formatMoney(suma("confirmada"))}
          detalle="Confirmado, en camino a tu cuenta"
        />
        <Cifra
          etiqueta="Cobrado"
          valor={formatMoney(suma("pagada"))}
          detalle="Ya transferido"
        />
        <Cifra
          etiqueta="Retenido"
          valor={formatMoney(suma("pendiente"))}
          detalle="El pedido todavía no llegó"
        />
        <Cifra
          etiqueta="Anulado"
          valor={formatMoney(suma("anulada"))}
          detalle="Pedidos cancelados"
        />
      </section>

      <ol className="grid gap-0 border-t-2 border-tinta sm:grid-cols-3">
        {[
          {
            estado: "Retenida",
            texto:
              "El comprador pagó y el dinero queda guardado mientras el negocio le entrega.",
          },
          {
            estado: "Por cobrar",
            texto:
              "El pedido llegó. El pago se libera y se reparte: tu parte sale hacia ti.",
          },
          {
            estado: "Cobrada",
            texto:
              "La transferencia se hizo. Cuenta en tu historial para siempre.",
          },
        ].map((paso, i) => (
          <li
            key={paso.estado}
            className={cn(
              "border-b border-tinta/15 py-5 sm:border-b-0 sm:py-6",
              i > 0 && "sm:border-l sm:pl-6",
              i < 2 && "sm:pr-6"
            )}
          >
            <p className="tabular font-titular text-sm font-extrabold text-senal">
              {String(i + 1).padStart(2, "0")}
            </p>
            <p className="mt-2 font-titular text-lg font-bold tracking-[-0.02em]">
              {paso.estado}
            </p>
            <p className="mt-1 text-sm leading-relaxed opacity-70">
              {paso.texto}
            </p>
          </li>
        ))}
      </ol>

      <section>
        <nav
          aria-label="Filtrar comisiones"
          className="-mx-1 flex gap-1 overflow-x-auto pb-1"
        >
          {FILTROS.map((f) => {
            const activo = f.valor === filtro
            return (
              <Link
                key={f.texto}
                href={
                  f.valor
                    ? `/vendedor/ganancias?tipo=${f.valor}`
                    : "/vendedor/ganancias"
                }
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-semibold whitespace-nowrap transition-colors",
                  activo
                    ? "border-senal text-senal"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                {f.texto}
              </Link>
            )
          })}
        </nav>

        {lista.length === 0 ? (
          <div className="mt-6">
            <Vacio
              titulo={
                filtro === "indirecta"
                  ? "Todavía nadie volvió a comprar solo"
                  : "Todavía no hay comisiones"
              }
              detalle={
                filtro === "indirecta"
                  ? "Cuando un comprador que trajiste compra otra vez por su cuenta dentro de los 90 días, la comisión aparece acá."
                  : "Aparecen solas cuando alguien compra con tu enlace y el pago entra."
              }
              accion={{
                href: "/vendedor/enlaces",
                texto: "Compartir mis enlaces",
              }}
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b-2 border-tinta text-left text-xs tracking-[0.12em] uppercase">
                  <th className="pr-4 pb-3 font-semibold opacity-55">
                    Negocio
                  </th>
                  <th className="pr-4 pb-3 font-semibold opacity-55">Cómo</th>
                  <th className="pr-4 pb-3 font-semibold opacity-55">Fecha</th>
                  <th className="pr-4 pb-3 font-semibold opacity-55">Estado</th>
                  <th className="pb-3 text-right font-semibold opacity-55">
                    Tu parte
                  </th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-b border-tinta/15">
                    <td className="py-4 pr-4 font-titular font-bold tracking-[-0.01em]">
                      {c.negocio}
                    </td>
                    <td className="py-4 pr-4 opacity-70">
                      {c.tipo === "directa" ? "Tu enlace" : "Volvió solo"}
                    </td>
                    <td className="tabular py-4 pr-4 opacity-55">
                      {formatDate(c.fecha)}
                    </td>
                    <td className="py-4 pr-4">
                      <EstadoComision estado={c.estado} />
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={cn(
                          "tabular font-semibold",
                          c.estado === "anulada" && "line-through opacity-40"
                        )}
                      >
                        {formatMoney(c.montoCents)}
                      </span>
                      <span className="tabular block text-xs opacity-45">
                        {formatPercent(c.tasaBps)} de {formatMoney(c.baseCents)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
