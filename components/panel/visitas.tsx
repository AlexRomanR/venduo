import { Eye, Footprints, Radar, TrendingDown } from "lucide-react"

import { formatNumber } from "@/lib/format"
import type { ResumenDeVisitas } from "@/lib/visitas-resumen"
import { Cifra, Cifras, Seccion, SinDatos } from "@/components/panel/piezas"

/**
 * Las visitas de una tienda: cuántas, de dónde vienen, cuántas terminan en
 * pedido y qué productos se miran sin venderse.
 *
 * La misma pieza en la ficha de una tienda en `/admin` y en el Resumen del
 * emprendedor, si Venduo le activó las visitas: los dos ven los mismos números.
 */
export function PanelDeVisitas({
  visitas,
  id = "visitas",
  titulo = "Quién visita tu tienda",
}: {
  visitas: ResumenDeVisitas
  id?: string
  titulo?: string
}) {
  const sinVisitas = visitas.visitas === 0 && visitas.visitantes === 0

  return (
    <Seccion
      id={id}
      icono={Eye}
      titulo={titulo}
      bajada={`Los últimos ${visitas.dias} días. Se cuentan sin identificar a nadie.`}
    >
      {sinVisitas ? (
        <SinDatos
          icono={Radar}
          titulo="Todavía sin visitas"
          texto="Cuando alguien abra la tienda desde WhatsApp, TikTok, un QR o un catálogo, va a aparecer acá."
        />
      ) : (
        <>
          <Cifras>
            <Cifra
              etiqueta="Visitas"
              valor={formatNumber(visitas.visitas)}
              detalle="Páginas vistas"
            />
            <Cifra
              etiqueta="Visitantes"
              valor={formatNumber(visitas.visitantes)}
              detalle="Personas distintas por día"
            />
            <Cifra
              etiqueta="Pedidos"
              valor={formatNumber(visitas.recorrido[3]?.cantidad ?? 0)}
              detalle="Mandados por WhatsApp"
            />
            <Cifra
              etiqueta="Pagados"
              valor={formatNumber(visitas.recorrido[4]?.cantidad ?? 0)}
              detalle="Ventas del período"
            />
          </Cifras>

          <div className="border-t border-tinta/15 px-4 py-5 sm:px-5">
            <GraficoDeVisitas serie={visitas.serie} />
          </div>

          <div className="grid border-t border-tinta/15 md:grid-cols-2">
            <div className="px-4 py-5 sm:px-5 md:border-r md:border-tinta/15">
              <h3 className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
                De dónde vienen
              </h3>
              <Barras
                filas={visitas.origenes.map((o) => ({
                  etiqueta: o.nombre,
                  valor: o.visitas,
                }))}
              />
            </div>
            <div className="border-t border-tinta/15 px-4 py-5 sm:px-5 md:border-t-0">
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
                <Footprints aria-hidden="true" className="size-3.5" />
                El recorrido
              </h3>
              <Barras
                filas={visitas.recorrido.map((r) => ({
                  etiqueta: r.etapa,
                  valor: r.cantidad,
                }))}
                ordenar={false}
              />
            </div>
          </div>

          {visitas.productos.length > 0 ? (
            <div className="border-t border-tinta/15 px-4 py-5 sm:px-5">
              <h3 className="text-xs font-semibold tracking-[0.12em] uppercase opacity-65">
                Los productos más vistos
              </h3>
              <ul className="mt-3">
                {visitas.productos.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-baseline justify-between gap-3 border-t border-tinta/10 py-2.5 text-sm first:border-t-0"
                  >
                    <span className="min-w-0 truncate font-semibold">
                      {p.nombre}
                    </span>
                    <span className="tabular shrink-0 opacity-70">
                      {formatNumber(p.vistas)} vistas ·{" "}
                      {formatNumber(p.vendidos)} vendidos
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {visitas.muyVistosPocoVendidos.length > 0 ? (
            <div className="border-t border-tinta/15 px-4 py-5 sm:px-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase">
                <TrendingDown aria-hidden="true" className="size-3.5" />
                Muy vistos, poco vendidos
              </h3>
              <p className="mt-1 text-sm opacity-70">
                Los miran y no los compran: revisa el precio, la foto o la
                descripción.
              </p>
              <ul className="mt-3">
                {visitas.muyVistosPocoVendidos.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-baseline justify-between gap-3 border-t border-tinta/10 py-2.5 text-sm first:border-t-0"
                  >
                    <span className="min-w-0 truncate font-semibold">
                      {p.nombre}
                    </span>
                    <span className="tabular shrink-0 opacity-70">
                      {formatNumber(p.vistas)} vistas ·{" "}
                      {formatNumber(p.vendidos)} vendidos
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </Seccion>
  )
}

/** Barras ordenadas con su etiqueta: la identidad la da el nombre, no el color. */
export function Barras({
  filas,
  ordenar = true,
}: {
  filas: { etiqueta: string; valor: number }[]
  ordenar?: boolean
}) {
  const lista = ordenar ? [...filas].sort((a, b) => b.valor - a.valor) : filas
  const maximo = Math.max(1, ...lista.map((f) => f.valor))

  if (lista.length === 0) {
    return <p className="mt-3 text-sm opacity-65">Todavía sin datos.</p>
  }

  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {lista.map((fila) => (
        <li key={fila.etiqueta}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold">{fila.etiqueta}</span>
            <span className="tabular opacity-70">
              {formatNumber(fila.valor)}
            </span>
          </div>
          <div className="mt-1 h-1.5 bg-tinta/[0.08]">
            <div
              className="h-full bg-senal"
              style={{ width: `${(fila.valor / maximo) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Las visitas por día, en barras. Dibujado a mano: una sola serie en la señal,
 * el eje desde cero y rotulados solo el primer y el último día.
 */
function GraficoDeVisitas({
  serie,
}: {
  serie: { dia: string; visitas: number }[]
}) {
  const ancho = 600
  const alto = 140
  const maximo = Math.max(1, ...serie.map((d) => d.visitas))
  const paso = ancho / Math.max(1, serie.length)
  const barra = Math.max(2, paso - 3)
  const corto = (dia: string) => {
    const [, mes, d] = dia.split("-")
    return `${Number(d)}/${Number(mes)}`
  }
  const total = serie.reduce((suma, d) => suma + d.visitas, 0)

  return (
    <figure>
      <svg
        viewBox={`0 0 ${ancho} ${alto + 22}`}
        role="img"
        aria-label={`Visitas por día: ${total} en ${serie.length} días`}
        className="h-auto w-full max-w-full"
      >
        <line
          x1="0"
          x2={ancho}
          y1={alto}
          y2={alto}
          stroke="var(--tinta)"
          strokeOpacity="0.3"
        />
        {serie.map((d, i) => {
          const h = (d.visitas / maximo) * (alto - 8)
          return (
            <rect
              key={d.dia}
              x={i * paso + (paso - barra) / 2}
              y={alto - h}
              width={barra}
              height={h}
              rx="2"
              className="fill-senal"
            >
              <title>{`${corto(d.dia)}: ${d.visitas} visitas`}</title>
            </rect>
          )
        })}
        {serie.length > 0 ? (
          <>
            <text
              x="0"
              y={alto + 16}
              className="fill-tinta text-[11px]"
              fillOpacity="0.65"
            >
              {corto(serie[0].dia)}
            </text>
            <text
              x={ancho}
              y={alto + 16}
              textAnchor="end"
              className="fill-tinta text-[11px]"
              fillOpacity="0.65"
            >
              {corto(serie[serie.length - 1].dia)}
            </text>
          </>
        ) : null}
      </svg>
    </figure>
  )
}
