import Link from "next/link"

import { getAIStatus } from "@/lib/ai"
import {
  getGraficoConDatos,
  getGraficosGuardadosPromotor,
} from "@/lib/data/insights"
import {
  getMisComisiones,
  getMisCompradores,
  getMisEnlaces,
} from "@/lib/data/promotor"
import { formatDate, formatMoney, formatNumber } from "@/lib/format"
import { leerGrafico } from "@/lib/insights/lectura"
import {
  gananciaPorNegocio,
  gananciaSemanal,
  resumirPromotor,
  unidadesPorEnlace,
  type Fila,
} from "@/lib/promotor"
import { cn } from "@/lib/utils"
import { Estudio } from "@/components/insights/estudio"
import { Grafico, type EspecGrafico } from "@/components/insights/grafico"
import { Cifra, Encabezado, Vacio } from "@/components/panel/piezas"
import { borrar, guardar, preguntar } from "./acciones"

export const metadata = { title: "Mis estadísticas" }

const SUGERENCIAS = [
  "¿Cuánto gané en los últimos 30 días?",
  "Mis productos más vendidos",
  "Ganancia por semana de los últimos 3 meses",
  "¿Qué negocio me deja más?",
  "¿Cuántos compradores distintos tuve?",
]

/**
 * Los números del promotor, en dos pestañas.
 *
 * El resumen se calcula de sus propias comisiones y enlaces, sin IA. La otra
 * pestaña es la misma herramienta del negocio —preguntar en palabras, guardar
 * en un tablero y bajarlo en PDF— contra las vistas `promotor_*`, que cruzan
 * todos los negocios donde vende y ya están acotadas a él.
 */
export default async function EstadisticasPromotorPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>
}) {
  const { ver } = await searchParams
  const preguntando = ver === "preguntar"

  return (
    <div className="flex flex-col gap-10">
      <Titulo />
      <Pestanas preguntando={preguntando} />
      {preguntando ? <Preguntale /> : <Resumen />}
    </div>
  )
}

function Pestanas({ preguntando }: { preguntando: boolean }) {
  const pestanas = [
    { href: "/vendedor/estadisticas", texto: "Resumen", activa: !preguntando },
    {
      href: "/vendedor/estadisticas?ver=preguntar",
      texto: "Pregúntale a tus números",
      activa: preguntando,
    },
  ]

  return (
    <nav
      aria-label="Vistas de estadísticas"
      className="-mt-4 flex gap-6 border-b border-tinta/15"
    >
      {pestanas.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          aria-current={p.activa ? "page" : undefined}
          className={cn(
            "-mb-px flex min-h-11 items-center border-b-2 text-sm font-semibold transition-colors",
            p.activa
              ? "border-tinta"
              : "border-transparent opacity-55 hover:opacity-100"
          )}
        >
          {p.texto}
        </Link>
      ))}
    </nav>
  )
}

async function Preguntale() {
  const guardados = await getGraficosGuardadosPromotor()
  const graficos = await Promise.all(guardados.map(getGraficoConDatos))
  const ai = getAIStatus()

  return (
    <section className="flex flex-col gap-10">
      <p className="max-w-[58ch] text-sm leading-relaxed opacity-70">
        Pregunta en palabras por tus ventas, ganancias, productos o negocios.
        Solo se consultan tus datos como promotor, y solo se leen.
        {ai.demo ? (
          <>
            {" "}
            <span className="font-semibold">
              Estás en modo demo: el modelo devuelve una respuesta simulada,
              pero las cifras salen de tus datos reales.
            </span>
          </>
        ) : null}
      </p>

      <Estudio
        graficos={graficos}
        preguntar={preguntar}
        guardar={guardar}
        borrar={borrar}
        rutaPdf="/vendedor/estadisticas/pdf"
        sugerencias={SUGERENCIAS}
      />
    </section>
  )
}

async function Resumen() {
  const [enlaces, comisiones, compradores] = await Promise.all([
    getMisEnlaces(),
    getMisComisiones(),
    getMisCompradores(),
  ])

  if (comisiones.length === 0) {
    return (
      <Vacio
        titulo="Tus números empiezan con tu primera venta"
        detalle="Acá vas a ver cuánto ganas por semana, qué productos te funcionan y qué negocios te dejan más. Comparte tus enlaces para empezar."
        accion={{ href: "/vendedor/enlaces", texto: "Compartir mis enlaces" }}
      />
    )
  }

  const resumen = resumirPromotor(enlaces, comisiones, compradores)
  const semanas = gananciaSemanal(comisiones, 12)
  const productos = unidadesPorEnlace(enlaces).slice(0, 8)
  const negocios = gananciaPorNegocio(comisiones).slice(0, 8)

  const validas = comisiones.filter((c) => c.estado !== "anulada")
  const promedio =
    validas.length > 0
      ? Math.round(
          validas.reduce((a, c) => a + c.montoCents, 0) / validas.length
        )
      : 0
  const mejor = [...semanas].sort((a, b) => b.valor - a.valor)[0]
  const directo = resumen.ganadoCents - resumen.indirectoCents
  const parteIndirecta =
    resumen.ganadoCents > 0 ? resumen.indirectoCents / resumen.ganadoCents : 0

  return (
    <div className="flex flex-col gap-14">
      <section className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          etiqueta="Por venta, en promedio"
          valor={formatMoney(promedio)}
          detalle={`En ${formatNumber(validas.length)} comisiones`}
        />
        <Cifra
          etiqueta="Tu mejor semana"
          valor={formatMoney(mejor?.valor ?? 0)}
          detalle={
            mejor && mejor.valor > 0
              ? `La del ${formatDate(mejor.etiqueta)}`
              : "Todavía por venir"
          }
        />
        <Cifra
          etiqueta="Productos que venden"
          valor={`${formatNumber(enlaces.filter((e) => e.unidades > 0).length)} de ${formatNumber(enlaces.length)}`}
          detalle="De los que promocionas"
        />
        <Cifra
          etiqueta="Promocionas desde"
          valor={resumen.desde ? formatDate(resumen.desde) : "—"}
          detalle="Tu primera venta confirmada"
        />
      </section>

      <Bloque
        etiqueta="Ganancia por semana"
        titulo="Las últimas 12 semanas"
        spec={{
          titulo: "Ganancia por semana",
          explicacion:
            "Tus comisiones directas e indirectas, sin las anuladas.",
          grafico: "columna",
          formato: "dinero",
        }}
        filas={semanas}
      />

      <section>
        <Encabezado etiqueta="De dónde viene lo que ganas" />
        <div className="mt-6 border-t-2 border-tinta pt-6">
          <div className="flex h-3 w-full overflow-hidden bg-tinta/10">
            <div
              className="h-full bg-senal"
              style={{ width: `${(1 - parteIndirecta) * 100}%` }}
            />
            <div
              className="h-full border-l-2 border-papel bg-tinta"
              style={{ width: `${parteIndirecta * 100}%` }}
            />
          </div>
          <dl className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase">
                <span aria-hidden="true" className="size-2.5 bg-senal" />
                Con tu enlace
              </dt>
              <dd className="tabular mt-2 font-titular text-2xl font-extrabold tracking-[-0.03em]">
                {formatMoney(directo)}
              </dd>
              <dd className="text-sm opacity-55">
                {formatNumber(resumen.ventasDirectas)} ventas que hiciste tú
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-xs font-semibold tracking-[0.12em] uppercase">
                <span aria-hidden="true" className="size-2.5 bg-tinta" />
                De compradores que volvieron
              </dt>
              <dd className="tabular mt-2 font-titular text-2xl font-extrabold tracking-[-0.03em]">
                {formatMoney(resumen.indirectoCents)}
              </dd>
              <dd className="text-sm opacity-55">
                {formatNumber(resumen.ventasIndirectas)} compras sin tu enlace
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="grid gap-14 lg:grid-cols-2">
        <Bloque
          etiqueta="Tus productos"
          titulo="Unidades vendidas por producto"
          spec={{
            titulo: "Unidades por producto",
            explicacion: "Lo que se vendió con cada uno de tus enlaces.",
            grafico: "barra",
            formato: "cantidad",
          }}
          filas={productos}
          vacio="Ninguno de tus productos vendió todavía."
        />
        <Bloque
          etiqueta="Tus negocios"
          titulo="Lo que te dejó cada negocio"
          spec={{
            titulo: "Ganancia por negocio",
            explicacion: "Tus comisiones agrupadas por negocio.",
            grafico: "barra",
            formato: "dinero",
          }}
          filas={negocios}
        />
      </div>
    </div>
  )
}

function Titulo() {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.12em] text-senal uppercase">
        Estadísticas
      </p>
      <h1 className="mt-3 max-w-[18ch] font-titular text-[clamp(1.9rem,5vw,2.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em]">
        Qué te funciona y qué no.
      </h1>
      <p className="mt-3 max-w-[54ch] leading-relaxed opacity-70">
        Tus ventas, contadas de tus propias comisiones. Sirve para decidir qué
        compartir más y qué dejar.
      </p>
    </div>
  )
}

function Bloque({
  etiqueta,
  titulo,
  spec,
  filas,
  vacio,
}: {
  etiqueta: string
  titulo: string
  spec: EspecGrafico
  filas: Fila[]
  vacio?: string
}) {
  const conDatos = filas.some((f) => f.valor > 0)
  const lectura = conDatos ? leerGrafico(spec, filas) : null

  return (
    <section>
      <Encabezado etiqueta={etiqueta} titulo={titulo} />
      <div className="mt-6">
        {!conDatos ? (
          <p className="border-t-2 border-tinta pt-6 text-sm opacity-70">
            {vacio ?? "Todavía no hay datos para este gráfico."}
          </p>
        ) : (
          <Grafico spec={spec} filas={filas} />
        )}
      </div>
      {lectura ? (
        <p className="mt-4 max-w-[60ch] text-sm leading-relaxed opacity-70">
          {lectura}
        </p>
      ) : null}
    </section>
  )
}
