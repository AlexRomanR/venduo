import { formatDate, formatMoney, formatNumber } from "@/lib/format"
import { ESTADOS } from "@/lib/pedidos"
import {
  mensajeParaCompartir,
  type Comision,
  type CompraConEnlace,
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

/**
 * Una compra hecha con su enlace.
 *
 * Mientras el pago no entra no hay comisión todavía: se dice en qué estado
 * está el pedido en vez de mostrar un cero que parece definitivo.
 */
export function FilaCompra({ compra }: { compra: CompraConEnlace }) {
  const estadoPedido =
    ESTADOS.find((e) => e.valor === compra.estado)?.etiqueta ?? compra.estado

  return (
    <li className="grid gap-3 border-b border-tinta/15 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-8">
      <div className="min-w-0">
        <p className="flex items-baseline gap-2 font-titular text-base font-bold tracking-[-0.01em] sm:text-lg">
          <span className="truncate">{compra.comprador}</span>
          <span className="tabular text-xs font-normal tracking-[0.08em] opacity-55">
            {compra.telefono}
          </span>
        </p>
        <p className="mt-1 truncate text-sm opacity-70">{compra.productos}</p>
        <p className="mt-0.5 text-xs opacity-55">
          {formatDate(compra.fecha)} · {compra.negocio}
        </p>
      </div>

      <p className="tabular text-sm opacity-70 sm:text-right">
        {formatMoney(compra.totalCents)}
      </p>

      <div className="flex items-center justify-between gap-3 sm:w-40 sm:flex-col sm:items-end sm:justify-center">
        {compra.comision ? (
          <>
            <p className="tabular font-titular text-lg font-extrabold tracking-[-0.03em]">
              {formatMoney(compra.comision.montoCents)}
            </p>
            <EstadoComision estado={compra.comision.estado} />
          </>
        ) : (
          <p className="text-xs opacity-55">
            {compra.estado === "pendiente"
              ? "Pago pendiente · tu ganancia aparece al pagarse"
              : `${estadoPedido} · sin comisión`}
          </p>
        )}
      </div>
    </li>
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
