"use client"

import * as React from "react"
import Link from "next/link"
import {
  CalendarDays,
  Check,
  CircleDollarSign,
  HandCoins,
  Minus,
  Package,
  PackageCheck,
  PackageOpen,
  Scale,
  Sprout,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import {
  diaFuerte,
  type Estadisticas,
  type EstadisticasDelPeriodo,
} from "@/lib/estadisticas"
import {
  BOTON_PRIMARIO,
  FICHA,
  FICHA_ELEGIDA,
  FICHA_LIBRE,
} from "@/lib/estilos"
import { formatDia, formatMoney, formatNumber } from "@/lib/format"
import { PERIODOS, variacion, type Periodo } from "@/lib/tablero"
import { cn } from "@/lib/utils"
import { Contador } from "@/components/panel/contador"
import { Miniatura, Seccion } from "@/components/panel/piezas"

/*
 * El tablero fijo de Estadísticas: lo que se ve al entrar, sin preguntarle
 * nada a la IA. Va más a fondo que el Resumen —cada cifra contra su período
 * anterior, cuántos pedidos se cobran, qué deja más plata, qué no se mueve y
 * qué días se vende más— y en el cuaderno quieto: nada se mueve al deslizar,
 * responde solo lo que se toca. Las cuentas están en `lib/estadisticas.ts`.
 */

const enlaceDe = (dias: Periodo) =>
  dias === 30 ? "/panel/estadisticas" : `/panel/estadisticas?dias=${dias}`

/** Las fichas del período: 7, 30 y 90 días, en la URL. */
export function Periodos({ dias }: { dias: Periodo }) {
  return (
    <nav aria-label="Período" className="grid grid-cols-3 gap-1.5">
      {PERIODOS.map((opcion) => (
        <Link
          key={opcion}
          href={enlaceDe(opcion)}
          scroll={false}
          aria-current={opcion === dias ? "page" : undefined}
          className={cn(
            FICHA,
            "justify-center text-sm",
            opcion === dias ? FICHA_ELEGIDA : FICHA_LIBRE
          )}
        >
          {opcion} días
        </Link>
      ))}
    </nav>
  )
}

/** "23% más", "4% menos", "Igual" o, sin nada contra qué comparar, nada. */
function Cambio({ actual, anterior }: { actual: number; anterior: number }) {
  // Sin nada antes no hay porcentaje: subir desde cero no es un "%".
  if (anterior === 0) {
    return actual === 0 ? null : (
      <span className="text-sm text-tinta/65">Antes no hubo</span>
    )
  }
  const por = variacion(actual, anterior) ?? 0
  const Icono = por > 0 ? TrendingUp : por < 0 ? TrendingDown : Minus
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold">
      <Icono aria-hidden="true" className="size-4" />
      {por > 0
        ? `${formatNumber(por)}% más`
        : por < 0
          ? `${formatNumber(-por)}% menos`
          : "Igual"}
    </span>
  )
}

function Celda({
  etiqueta,
  valor,
  anterior,
  tipo,
  children,
}: {
  etiqueta: string
  valor: number | null
  anterior: number | null
  tipo: "numero" | "dinero"
  children?: React.ReactNode
}) {
  const escribir = (n: number) =>
    tipo === "dinero" ? formatMoney(n) : formatNumber(n)
  return (
    <div className="pieza-celda -mr-px -mb-px flex min-w-0 flex-col gap-1 border-r border-b border-tinta/10 px-4 py-4 sm:px-5">
      <dt className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
        {etiqueta}
      </dt>
      <dd className="tabular font-titular text-[clamp(1.35rem,4.5vw,1.75rem)] leading-tight font-extrabold tracking-[-0.035em]">
        {valor === null ? "—" : <Contador valor={valor} tipo={tipo} />}
      </dd>
      {children ??
        (valor !== null ? (
          <dd className="flex flex-col gap-0.5">
            <Cambio actual={valor} anterior={anterior ?? 0} />
            {anterior ? (
              <span className="text-sm text-tinta/65">
                Antes {escribir(anterior)}
              </span>
            ) : null}
          </dd>
        ) : null)}
    </div>
  )
}

/** 1 · Cada cifra del período contra la del período anterior. */
export function ContraElAnterior({
  periodo,
}: {
  periodo: EstadisticasDelPeriodo
}) {
  const { actual, anterior } = periodo
  return (
    <Seccion
      id="contra-el-anterior"
      icono={Scale}
      titulo={`Contra los ${periodo.dias} días anteriores`}
      bajada={`Del ${formatDia(periodo.desde, { conSemana: false })} al ${formatDia(periodo.hasta, { conSemana: false })}.`}
    >
      <div className="@container">
        <dl className="grid grid-cols-2 overflow-hidden @[36rem]:grid-cols-4">
          <Celda
            etiqueta="Vendido"
            valor={actual.ventasCents}
            anterior={anterior?.ventasCents ?? null}
            tipo="dinero"
          />
          <Celda
            etiqueta="Ventas"
            valor={actual.pedidos}
            anterior={anterior?.pedidos ?? null}
            tipo="numero"
          />
          <Celda
            etiqueta="Por pedido"
            valor={actual.ticketCents}
            anterior={anterior?.ticketCents ?? null}
            tipo="dinero"
          />
          <Celda
            etiqueta={actual.gananciaParcial ? "Ganancia*" : "Ganancia"}
            valor={actual.gananciaCents}
            anterior={anterior?.gananciaCents ?? null}
            tipo="dinero"
          >
            {actual.gananciaCents === null ? (
              <dd>
                <Link
                  href="/panel/productos"
                  className="inline-flex min-h-11 items-center text-sm font-semibold underline decoration-tinta/40 underline-offset-4 hover:decoration-tinta"
                >
                  Carga tus costos
                </Link>
              </dd>
            ) : undefined}
          </Celda>
        </dl>
      </div>
      {actual.gananciaParcial ? (
        <p className="px-4 py-3 text-sm text-tinta/70 sm:px-5">
          * Falta el costo de algunos productos.
        </p>
      ) : null}
    </Seccion>
  )
}

/** Una barra de tinta del largo de su parte. */
function Barra({ parte, senal = false }: { parte: number; senal?: boolean }) {
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-tinta/[0.07]">
      <span
        className={cn(
          "block h-full rounded-full",
          senal ? "bg-senal" : "bg-tinta"
        )}
        style={{ width: `${Math.max(parte * 100, parte > 0 ? 3 : 0)}%` }}
      />
    </span>
  )
}

/** 2 · De los pedidos que llegaron, cuántos se cobraron. */
function SeCobran({ periodo }: { periodo: EstadisticasDelPeriodo }) {
  const { cobros } = periodo
  if (cobros.llegaron === 0) return null
  const filas = [
    { clave: "cobrados", nombre: "Cobrados", cuenta: cobros.cobrados },
    { clave: "por-cobrar", nombre: "Por cobrar", cuenta: cobros.porCobrar },
    {
      clave: "no-concretados",
      nombre: "No concretados",
      cuenta: cobros.noConcretados,
    },
    { clave: "cancelados", nombre: "Cancelados", cuenta: cobros.cancelados },
  ].filter((fila) => fila.clave === "cobrados" || fila.cuenta > 0)

  return (
    <Seccion
      id="se-cobran"
      icono={HandCoins}
      titulo="Cuántos pedidos se cobran"
      bajada={
        cobros.llegaron === 1
          ? "Del único que llegó."
          : `De los ${formatNumber(cobros.llegaron)} que llegaron.`
      }
    >
      <p className="px-4 pt-4 font-titular text-2xl leading-tight font-extrabold tracking-[-0.03em] sm:px-5">
        Cobraste {formatNumber(cobros.cobrados)} de{" "}
        {formatNumber(cobros.llegaron)}.
      </p>
      <ul className="flex flex-col py-2">
        {filas.map((fila) => {
          const parte = fila.cuenta / cobros.llegaron
          const porCobrar = fila.clave === "por-cobrar"
          const contenido = (
            <>
              <span className="flex items-baseline justify-between gap-3">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    porCobrar && "text-senal"
                  )}
                >
                  {fila.nombre}
                </span>
                <span className="tabular text-sm text-tinta/70">
                  <span className="font-semibold text-tinta">
                    {formatNumber(fila.cuenta)}
                  </span>{" "}
                  · {Math.round(parte * 100)}%
                </span>
              </span>
              <Barra parte={parte} senal={porCobrar} />
            </>
          )
          return (
            <li key={fila.clave}>
              {porCobrar ? (
                <Link
                  href="/panel/pedidos?estado=pendiente"
                  className="flex min-h-11 flex-col justify-center gap-1.5 px-4 py-2 transition-colors hover:bg-tinta/[0.04] sm:px-5"
                >
                  {contenido}
                </Link>
              ) : (
                <div className="flex min-h-11 flex-col justify-center gap-1.5 px-4 py-2 sm:px-5">
                  {contenido}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Seccion>
  )
}

/** Una fila de producto: su número, su foto, su nombre y su barra. */
function FilaDeProducto({
  numero,
  id,
  nombre,
  foto,
  detalle,
  monto,
  parte,
}: {
  numero?: number
  id: string | null
  nombre: string
  foto: string | null
  detalle: string
  monto: string
  parte: number
}) {
  const cuerpo = (
    <>
      {numero ? (
        <span className="tabular w-4 shrink-0 text-sm font-semibold text-tinta/65">
          {numero}
        </span>
      ) : null}
      <Miniatura foto={foto} icono={Package} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate font-semibold">{nombre}</span>
          <span className="tabular shrink-0 font-semibold">{monto}</span>
        </span>
        <span className="text-sm text-tinta/65">{detalle}</span>
        <Barra parte={parte} />
      </span>
    </>
  )
  const clase =
    "flex items-center gap-3 border-t border-tinta/12 px-4 py-3 first:border-t-0 sm:px-5"
  return (
    <li>
      {id ? (
        <Link
          href={`/panel/productos/${id}`}
          className={cn(clase, "transition-colors hover:bg-tinta/[0.04]")}
        >
          {cuerpo}
        </Link>
      ) : (
        <div className={clase}>{cuerpo}</div>
      )}
    </li>
  )
}

/** 3 · Los productos que más plata dejan. */
function MasDeja({ periodo }: { periodo: EstadisticasDelPeriodo }) {
  const { porGanancia, productos } = periodo.masDeja
  if (productos.length === 0) return null
  const valor = (p: (typeof productos)[number]) =>
    porGanancia ? (p.gananciaCents ?? 0) : p.montoCents
  const maximo = Math.max(...productos.map(valor), 1)
  return (
    <Seccion
      id="mas-deja"
      icono={CircleDollarSign}
      titulo="Lo que más te deja"
      bajada={
        porGanancia
          ? "Por ganancia, ya restado el costo."
          : "Por lo vendido, en bolivianos."
      }
      accion={
        porGanancia
          ? undefined
          : {
              href: "/panel/productos",
              texto: "Carga tus costos para verlo por ganancia",
            }
      }
    >
      <ol>
        {productos.map((producto, indice) => (
          <FilaDeProducto
            key={producto.id ?? producto.nombre}
            numero={indice + 1}
            id={producto.id}
            nombre={producto.nombre}
            foto={producto.foto}
            detalle={`${formatNumber(producto.unidades)} ${producto.unidades === 1 ? "vendido" : "vendidos"}`}
            monto={formatMoney(valor(producto))}
            parte={valor(producto) / maximo}
          />
        ))}
      </ol>
    </Seccion>
  )
}

const A_LA_VISTA = 5

/** 4 · Lo que tiene stock y no se vendió en el período. */
function NoSeMueve({ periodo }: { periodo: EstadisticasDelPeriodo }) {
  const { aCosto, valorCents, productos, recientes } = periodo.quietos
  const [todos, setTodos] = React.useState(false)
  const maximo = Math.max(...productos.map((p) => p.valorCents), 1)
  const visibles = todos ? productos : productos.slice(0, A_LA_VISTA)

  return (
    <Seccion
      id="no-se-mueve"
      icono={PackageOpen}
      titulo="Lo que no se mueve"
      bajada={`Con stock y sin ventas en estos ${periodo.dias} días.`}
    >
      {productos.length === 0 ? (
        <div className="flex items-center gap-4 px-4 py-5 sm:px-5">
          <PackageCheck
            aria-hidden="true"
            className="size-6 shrink-0 opacity-50"
          />
          {recientes > 0 ? (
            <span>
              <span className="block font-titular text-lg font-bold tracking-[-0.02em]">
                Todavía es pronto
              </span>
              <span className="block text-sm text-tinta/70">
                {recientes === 1
                  ? "El producto con stock sin vender se cargó hace menos de dos semanas."
                  : `Los ${formatNumber(recientes)} productos con stock sin vender se cargaron hace menos de dos semanas.`}
              </span>
            </span>
          ) : (
            <span>
              <span className="block font-titular text-lg font-bold tracking-[-0.02em]">
                Todo se movió
              </span>
              <span className="block text-sm text-tinta/70">
                Cada producto con stock se vendió al menos una vez en estos{" "}
                {periodo.dias} días.
              </span>
            </span>
          )}
        </div>
      ) : (
        <>
          <div className="px-4 pt-4 pb-2 sm:px-5">
            <p className="font-titular text-2xl leading-tight font-extrabold tracking-[-0.03em]">
              {formatMoney(valorCents)} en stock sin venderse
            </p>
            <p className="mt-0.5 text-sm text-tinta/70">
              {aCosto ? "A lo que te costaron." : "A precio de venta."}
            </p>
          </div>
          <ul>
            {visibles.map((producto) => (
              <FilaDeProducto
                key={producto.id}
                id={producto.id}
                nombre={producto.nombre}
                foto={producto.foto}
                detalle={`${formatNumber(producto.stock)} en stock`}
                monto={formatMoney(producto.valorCents)}
                parte={producto.valorCents / maximo}
              />
            ))}
          </ul>
          {!todos && productos.length > A_LA_VISTA ? (
            <button
              type="button"
              onClick={() => setTodos(true)}
              className="flex min-h-12 items-center border-t border-tinta/15 px-4 text-sm font-semibold transition-colors hover:bg-tinta/[0.04] sm:px-5"
            >
              Ver los {formatNumber(productos.length)}
            </button>
          ) : null}
        </>
      )}
    </Seccion>
  )
}

/** "Los sábados", "Los lunes": el plural de un día de la semana. */
const enPlural = (nombre: string) =>
  `Los ${nombre.endsWith("s") ? nombre : `${nombre}s`}`

/** 5 · Lo que se vende en promedio cada día de la semana. */
function DiasFuertes({ periodo }: { periodo: EstadisticasDelPeriodo }) {
  const fuerte = diaFuerte(periodo.semana)
  const [elegido, setElegido] = React.useState<number | null>(null)
  if (!fuerte) return null
  const maximo = fuerte.promedioCents
  const unaSemana = periodo.dias === 7
  const tocado = elegido === null ? null : periodo.semana[elegido]

  return (
    <Seccion
      id="dias-fuertes"
      icono={CalendarDays}
      titulo="Tus días fuertes"
      bajada={
        unaSemana
          ? "Lo que vendiste cada día de esta semana."
          : `Lo que vendes en promedio cada día, en estos ${periodo.dias} días.`
      }
    >
      <p
        aria-live="polite"
        className="min-h-14 px-4 pt-4 font-titular text-lg leading-snug font-bold tracking-[-0.02em] sm:px-5"
      >
        {tocado
          ? `${tocado.nombre[0].toUpperCase()}${tocado.nombre.slice(1)} · ${formatMoney(tocado.promedioCents)}${unaSemana ? "" : " en promedio"}`
          : unaSemana
            ? `El ${fuerte.nombre} vendiste más: ${formatMoney(fuerte.promedioCents)}.`
            : `${enPlural(fuerte.nombre)} vendes más: ${formatMoney(fuerte.promedioCents)} en promedio.`}
      </p>
      <div className="grid grid-cols-7 items-end gap-1.5 px-4 pt-8 pb-4 sm:gap-3 sm:px-5">
        {periodo.semana.map((dia) => {
          const esFuerte = dia.indice === fuerte.indice
          const activo = elegido === dia.indice
          return (
            <button
              key={dia.indice}
              type="button"
              onClick={() => setElegido(activo ? null : dia.indice)}
              aria-pressed={activo}
              aria-label={`${dia.nombre}: ${formatMoney(dia.promedioCents)}`}
              className="group relative flex min-h-11 flex-col items-center gap-2"
            >
              {esFuerte ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -top-7 font-[family-name:var(--fuente-mano)] text-sm whitespace-nowrap text-senal",
                    // En los bordes la nota se apoya hacia adentro: centrada
                    // sobre el domingo se salía de la tarjeta.
                    dia.indice <= 1
                      ? "left-0"
                      : dia.indice >= 5
                        ? "right-0"
                        : "left-1/2 -translate-x-1/2"
                  )}
                >
                  tu día fuerte
                </span>
              ) : null}
              <span className="flex h-28 w-full items-end">
                <span
                  className={cn(
                    "block w-full rounded-t-[6px] transition-colors",
                    activo
                      ? "bg-senal"
                      : esFuerte
                        ? "bg-tinta"
                        : "bg-tinta/30 group-hover:bg-tinta/50"
                  )}
                  style={{
                    height: `${Math.max((dia.promedioCents / maximo) * 100, dia.promedioCents > 0 ? 4 : 2)}%`,
                  }}
                />
              </span>
              <span
                className={cn(
                  "text-xs",
                  esFuerte || activo ? "font-semibold" : "text-tinta/70"
                )}
              >
                {dia.corto}
              </span>
            </button>
          )
        })}
      </div>
    </Seccion>
  )
}

/**
 * Las tarjetas que van debajo de "Tu tablero". Si el período no tiene ventas,
 * en vez de cuatro tarjetas vacías, un solo aviso con el camino a otro.
 */
export function TarjetasDelPeriodo({ datos }: { datos: Estadisticas }) {
  const { periodo } = datos
  if (periodo.actual.pedidos === 0 && periodo.cobros.llegaron === 0) {
    const otro = periodo.dias === 7 ? 30 : periodo.dias === 30 ? 90 : null
    return (
      <Seccion
        id="sin-ventas-en-el-periodo"
        icono={CalendarDays}
        titulo={`Sin ventas en estos ${periodo.dias} días`}
        bajada={
          otro
            ? `Mira los últimos ${otro === 30 ? "30 o 90" : "90"} días.`
            : "Cuando vendas, aquí verás qué te deja más y qué días vendes mejor."
        }
      >
        {otro ? (
          <div className="px-4 py-4 sm:px-5">
            <Link
              href={enlaceDe(otro)}
              scroll={false}
              className={cn(BOTON_PRIMARIO, "w-full sm:w-fit")}
            >
              Ver {otro} días
            </Link>
          </div>
        ) : null}
      </Seccion>
    )
  }
  return (
    <>
      <SeCobran periodo={periodo} />
      <MasDeja periodo={periodo} />
      <NoSeMueve key={periodo.dias} periodo={periodo} />
      <DiasFuertes key={`dias-${periodo.dias}`} periodo={periodo} />
    </>
  )
}

/* -------------------------------------------------------------------------
 * Sin ventas todavía
 * ---------------------------------------------------------------------- */

/** El sello "Ejemplo": lo que sigue no son cifras de la tienda. */
function SelloDeEjemplo() {
  return (
    <span className="pieza-sello inline-flex shrink-0 border border-tinta/40 px-2 py-0.5 text-xs font-semibold tracking-[0.08em] text-tinta/65 uppercase">
      Ejemplo
    </span>
  )
}

/** Una forma quieta donde va a ir un dato. No late: no está cargando. */
function Forma({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block rounded-full bg-tinta/[0.07]", className)}
    />
  )
}

function TarjetaDeEjemplo({
  titulo,
  icono,
  children,
}: {
  titulo: string
  icono: typeof Scale
  children: React.ReactNode
}) {
  return (
    <div aria-hidden="true">
      <Seccion
        id={`ejemplo-${titulo.toLowerCase().replace(/\s+/g, "-")}`}
        icono={icono}
        titulo={titulo}
        extra={<SelloDeEjemplo />}
        extraEnLinea
      >
        {children}
      </Seccion>
    </div>
  )
}

/**
 * Una tienda sin ventas: qué falta para que esto se llene, con una sola
 * acción, y cómo se va a ver, con formas sin cifras. Nunca montos de
 * mentira: alguien podría creer que vendió eso.
 */
export function SinVentasTodavia({ datos }: { datos: Estadisticas }) {
  const pasos = [
    { hecho: datos.tieneProductos, titulo: "Carga tu primer producto" },
    {
      hecho: false,
      titulo: "Recibe tu primer pedido",
      detalle: "Por tu tienda, o regístralo si vendiste por chat o en persona.",
    },
  ]
  return (
    <>
      <Seccion
        id="para-que-se-llene"
        icono={Sprout}
        titulo="Para que esto se llene"
        bajada="Tus estadísticas salen de lo que vendes."
      >
        <ol className="flex flex-col gap-4 px-4 py-5 sm:px-5">
          {pasos.map((paso, indice) => (
            <li key={paso.titulo} className="flex gap-3">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  paso.hecho
                    ? "bg-tinta text-papel"
                    : "border-[1.5px] border-tinta"
                )}
              >
                {paso.hecho ? (
                  <Check aria-hidden="true" className="size-4" />
                ) : (
                  indice + 1
                )}
                <span className="sr-only">{paso.hecho ? "Hecho: " : ""}</span>
              </span>
              <span className="pt-0.5">
                <span
                  className={cn(
                    "block font-semibold",
                    paso.hecho && "text-tinta/65 line-through"
                  )}
                >
                  {paso.titulo}
                </span>
                {paso.detalle ? (
                  <span className="mt-0.5 block text-sm text-tinta/70">
                    {paso.detalle}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
          <li>
            <Link
              href={
                datos.tieneProductos
                  ? "/panel/pedidos/nueva"
                  : "/panel/productos/nuevo"
              }
              className={cn(BOTON_PRIMARIO, "w-full sm:w-fit")}
            >
              {datos.tieneProductos ? "Nueva venta" : "Nuevo producto"}
            </Link>
          </li>
        </ol>
      </Seccion>

      <p
        aria-hidden="true"
        className="-mb-3 pl-2 font-[family-name:var(--fuente-mano)] text-lg text-senal"
      >
        así se va a ver ↘
      </p>

      <TarjetaDeEjemplo titulo="Contra los 30 días anteriores" icono={Scale}>
        <dl className="grid grid-cols-2 overflow-hidden">
          {["Vendido", "Ventas", "Por pedido", "Ganancia"].map((etiqueta) => (
            <div
              key={etiqueta}
              className="pieza-celda -mr-px -mb-px flex flex-col gap-2 border-r border-b border-tinta/10 px-4 py-4 sm:px-5"
            >
              <dt className="text-xs font-semibold tracking-[0.12em] text-tinta/65 uppercase">
                {etiqueta}
              </dt>
              <dd>
                <Forma className="h-6 w-24" />
                <Forma className="mt-2 h-3 w-16" />
              </dd>
            </div>
          ))}
        </dl>
      </TarjetaDeEjemplo>

      <TarjetaDeEjemplo titulo="Tus días fuertes" icono={CalendarDays}>
        <div className="grid grid-cols-7 items-end gap-1.5 px-4 pt-6 pb-4 sm:gap-3 sm:px-5">
          {[30, 45, 35, 50, 70, 95, 60].map((alto, indice) => (
            <div key={indice} className="flex flex-col items-center gap-2">
              <span className="flex h-24 w-full items-end">
                <span
                  className="block w-full rounded-t-[6px] bg-tinta/[0.12]"
                  style={{ height: `${alto}%` }}
                />
              </span>
              <span className="text-xs text-tinta/65">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][indice]}
              </span>
            </div>
          ))}
        </div>
      </TarjetaDeEjemplo>

      <TarjetaDeEjemplo titulo="Lo que más te deja" icono={CircleDollarSign}>
        <ul>
          {[80, 55, 35].map((ancho, indice) => (
            <li
              key={ancho}
              className="flex items-center gap-3 border-t border-tinta/12 px-4 py-3 first:border-t-0 sm:px-5"
            >
              <span className="w-4 text-sm font-semibold text-tinta/65">
                {indice + 1}
              </span>
              <span className="size-11 shrink-0 rounded-[10px] bg-tinta/[0.07]" />
              <span className="flex flex-1 flex-col gap-2">
                <Forma className="h-3.5 w-2/3" />
                <span className="block h-2 rounded-full bg-tinta/[0.07]">
                  <span
                    className="block h-full rounded-full bg-tinta/[0.12]"
                    style={{ width: `${ancho}%` }}
                  />
                </span>
              </span>
            </li>
          ))}
        </ul>
      </TarjetaDeEjemplo>
    </>
  )
}
