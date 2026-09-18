import { BadgeCheck } from "lucide-react"

import { formatDate, formatMoney, formatNumber } from "@/lib/format"
import {
  diasHasta,
  mensajeParaCompartir,
  type Comision,
  type Comprador,
  type Enlace,
} from "@/lib/promotor"
import { cn } from "@/lib/utils"
import type { CommissionStatus } from "@/types"
import { SoltarProducto } from "@/components/promotor/acciones"
import { CompartirEnlace } from "@/components/promotor/compartir"
import { FotoProducto } from "@/components/promotor/producto"

/**
 * Un enlace en una lista.
 *
 * En el móvil la foto, el nombre y la ganancia van arriba y las herramientas
 * abajo, a lo ancho: son lo que se toca con el pulgar. En escritorio todo va
 * en una fila.
 */
export function FilaEnlace({
  enlace,
  qr,
  completa = false,
  destacada = false,
}: {
  enlace: Enlace
  qr?: string | null
  /** Con las cifras de venta y la opción de dejar de promocionarlo. */
  completa?: boolean
  /** Acaba de crearse: confirma visualmente dónde quedó guardado. */
  destacada?: boolean
}) {
  return (
    <li
      id={`enlace-${enlace.productoId}`}
      className={cn(
        "group grid scroll-mt-24 gap-4 border-b py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6",
        destacada ? "border-senal" : "border-tinta/15"
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <FotoProducto
          src={enlace.imagenUrl}
          alt=""
          sizes="72px"
          className="size-16 shrink-0 sm:size-[4.5rem]"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold tracking-[0.12em] uppercase opacity-55">
            {enlace.negocio}
          </p>
          <h3 className="mt-1 truncate font-titular text-base font-bold tracking-[-0.02em] sm:text-lg">
            {enlace.nombre}
          </h3>
          {destacada ? (
            <p className="mt-1 text-xs font-semibold text-senal">
              Enlace creado y guardado
            </p>
          ) : null}
          <p className="tabular mt-1 text-sm">
            <span className="font-semibold text-senal">
              {formatMoney(enlace.gananciaCents)}
            </span>
            <span className="opacity-55"> por venta</span>
            {completa ? (
              <span className="opacity-55">
                {" · "}
                {enlace.unidades === 0
                  ? "sin ventas todavía"
                  : `${formatNumber(enlace.unidades)} ${enlace.unidades === 1 ? "vendido" : "vendidos"}`}
              </span>
            ) : null}
          </p>
          {!enlace.disponible ? (
            <p className="mt-1.5 text-xs font-semibold text-senal">
              {enlace.stock === 0
                ? "Sin stock: no lo compartas por ahora"
                : "El negocio lo retiró"}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
        <CompartirEnlace
          url={enlace.url}
          producto={enlace.nombre}
          qr={qr}
          compacto
          mensaje={mensajeParaCompartir(
            enlace.nombre,
            enlace.negocio,
            formatMoney(enlace.precioCents),
            enlace.url
          )}
        />
        {completa ? (
          <SoltarProducto
            productoId={enlace.productoId}
            nombre={enlace.nombre}
          />
        ) : null}
      </div>
    </li>
  )
}

/**
 * Cuánto le queda a la asociación, como un trazo que se vacía.
 *
 * Un número de días solo no dice si es mucho o poco; contra los 90 sí.
 */
function Vigencia({ comprador }: { comprador: Comprador }) {
  const total = Math.max(
    (new Date(comprador.vence).getTime() -
      new Date(comprador.desde).getTime()) /
      86_400_000,
    1
  )
  const quedan = diasHasta(comprador.vence)
  const proporcion = comprador.vigente ? Math.min(quedan / total, 1) : 0

  return (
    <div className="w-full sm:w-36">
      <p
        className={cn(
          "tabular text-xs font-semibold",
          comprador.vigente ? "" : "opacity-45"
        )}
      >
        {comprador.vigente
          ? `${formatNumber(quedan)} ${quedan === 1 ? "día" : "días"} más`
          : "Vencido"}
      </p>
      <div className="mt-1.5 h-0.5 w-full bg-tinta/15">
        <div
          className="h-full bg-senal transition-[width] duration-700"
          style={{ width: `${proporcion * 100}%` }}
        />
      </div>
    </div>
  )
}

export function FilaComprador({ comprador }: { comprador: Comprador }) {
  return (
    <li className="grid gap-4 border-b border-tinta/15 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-8">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-titular text-base font-bold tracking-[-0.01em] sm:text-lg">
          <span
            className={cn(
              "truncate",
              !comprador.registrado && "tabular tracking-[0.08em]"
            )}
          >
            {comprador.comprador}
          </span>
          {comprador.registrado ? (
            <BadgeCheck
              aria-label="Tiene cuenta en Venduo"
              className="size-4 shrink-0 text-senal"
            />
          ) : null}
        </p>
        <p className="mt-1 text-sm opacity-60">
          Llegó el {formatDate(comprador.desde)}
          {comprador.primeraTienda ? ` · ${comprador.primeraTienda}` : ""}
          {comprador.primeraCompraCents > 0
            ? ` · ${formatMoney(comprador.primeraCompraCents)}`
            : ""}
        </p>
      </div>

      <div className="flex items-baseline gap-6 sm:block sm:text-right">
        <p className="tabular font-titular text-lg font-extrabold tracking-[-0.03em]">
          {formatMoney(comprador.comisionIndirectaCents)}
        </p>
        <p className="text-xs opacity-55">
          {comprador.comprasIndirectas === 0
            ? "Todavía no volvió"
            : `${formatNumber(comprador.comprasIndirectas)} ${comprador.comprasIndirectas === 1 ? "compra" : "compras"} sin tu enlace`}
        </p>
      </div>

      <Vigencia comprador={comprador} />
    </li>
  )
}

export const ESTADO_COMISION: Record<
  CommissionStatus,
  { texto: string; clase: string }
> = {
  pendiente: { texto: "Retenida", clase: "border-tinta/25 opacity-60" },
  confirmada: { texto: "Por cobrar", clase: "border-tinta text-tinta" },
  pagada: { texto: "Cobrada", clase: "border-tinta bg-tinta text-papel" },
  anulada: { texto: "Anulada", clase: "border-tinta/15 opacity-40" },
}

export function EstadoComision({ estado }: { estado: CommissionStatus }) {
  const e = ESTADO_COMISION[estado]
  return (
    <span
      className={cn(
        "inline-flex border px-2 py-0.5 text-[11px] font-semibold tracking-[0.1em] whitespace-nowrap uppercase",
        e.clase
      )}
    >
      {e.texto}
    </span>
  )
}

export function FilaComision({ comision }: { comision: Comision }) {
  return (
    <li className="flex items-center gap-4 border-b border-tinta/15 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-titular font-bold tracking-[-0.01em]">
          {comision.negocio}
        </p>
        <p className="mt-0.5 text-xs opacity-55">
          {formatDate(comision.fecha)} ·{" "}
          {comision.tipo === "directa"
            ? "Con tu enlace"
            : "Comprador que trajiste"}
        </p>
      </div>
      <EstadoComision estado={comision.estado} />
      <p
        className={cn(
          "tabular w-20 text-right font-semibold",
          comision.estado === "anulada" && "line-through opacity-40"
        )}
      >
        {formatMoney(comision.montoCents)}
      </p>
    </li>
  )
}
