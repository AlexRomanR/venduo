import * as React from "react"
import path from "node:path"
import {
  Document,
  Font,
  Line,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer"

import type { InsightSql } from "@/lib/ai/schemas"
import type { FilaInsight } from "@/lib/data/insights"
import {
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatNumberCompact,
} from "@/lib/format"
import { leerGrafico } from "@/lib/insights/lectura"

/** Los mismos valores de `globals.css`. Si cambian allá, cambian acá. */
const PAPEL = "#f1f0ee"
const TINTA = "#16171a"
const SENAL = "#d62d12"
const FILETE = "#d6d4d0"
const APAGADO = "#6f7076"

/**
 * Las fuentes del sistema, leídas del disco y no de una URL.
 *
 * Bajar la tipografía en el momento de generar el PDF haría que un corte de
 * red durante una demostración devolviera un documento con otra letra. Viven
 * en `public/fuentes`, que es una carpeta que el despliegue siempre incluye.
 */
function registrarFuentes() {
  const carpeta = path.join(process.cwd(), "public", "fuentes")

  Font.register({
    family: "Archivo",
    fonts: [
      { src: path.join(carpeta, "archivo-700.ttf"), fontWeight: 700 },
      { src: path.join(carpeta, "archivo-800.ttf"), fontWeight: 800 },
    ],
  })

  Font.register({
    family: "Geist",
    fonts: [
      { src: path.join(carpeta, "geist-400.ttf"), fontWeight: 400 },
      { src: path.join(carpeta, "geist-600.ttf"), fontWeight: 600 },
    ],
  })

  // Sin esto una palabra larga parte por cualquier lado. El diccionario por
  // defecto es inglés y acá todo el texto es español.
  Font.registerHyphenationCallback((palabra) => [palabra])
}

export interface GraficoDelInforme {
  id: string
  titulo: string
  pregunta: string
  consulta: InsightSql
  filas: FilaInsight[]
}

/* Márgenes de la hoja y el marco que los dibuja. Todo en puntos: 1mm = 2.835. */
const MARGEN = 38
const MARCO = 20

const e = StyleSheet.create({
  pagina: {
    backgroundColor: PAPEL,
    color: TINTA,
    fontFamily: "Geist",
    fontSize: 9,
    paddingTop: MARGEN,
    paddingBottom: MARGEN + 14,
    paddingHorizontal: MARGEN,
  },

  // El marco: un borde fino a 20pt del filo, en todas las páginas.
  marco: {
    position: "absolute",
    top: MARCO,
    left: MARCO,
    right: MARCO,
    bottom: MARCO,
    borderWidth: 0.75,
    borderColor: TINTA,
  },

  cabecera: {
    borderBottomWidth: 1.5,
    borderBottomColor: TINTA,
    paddingBottom: 8,
  },
  filaCabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  marca: {
    fontFamily: "Archivo",
    fontWeight: 800,
    fontSize: 19,
    letterSpacing: -0.6,
  },
  tienda: { fontFamily: "Archivo", fontWeight: 700, fontSize: 10 },
  rotulo: {
    fontSize: 7,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontWeight: 600,
  },
  rotuloSenal: { color: SENAL },
  rotuloApagado: { color: APAGADO },

  bloque: {
    paddingTop: 20,
    paddingBottom: 22,
    borderBottomWidth: 0.75,
    borderBottomColor: FILETE,
  },
  numero: { color: SENAL, fontWeight: 600 },
  pregunta: {
    fontSize: 7,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: APAGADO,
    fontWeight: 600,
  },
  titulo: {
    fontFamily: "Archivo",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: -0.3,
    marginTop: 5,
  },
  epigrafe: { fontSize: 8, color: APAGADO, marginTop: 3, lineHeight: 1.45 },

  lectura: {
    marginTop: 12,
    borderLeftWidth: 1.5,
    borderLeftColor: SENAL,
    paddingLeft: 9,
    fontSize: 9,
    lineHeight: 1.5,
  },

  reglaGrafico: {
    borderTopWidth: 1.5,
    borderTopColor: TINTA,
    marginTop: 14,
    paddingTop: 12,
  },

  // Barras: nombre y valor arriba, la barra debajo, a lo ancho de la caja.
  barraFila: { marginBottom: 9 },
  barraTexto: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  barraNombre: { fontWeight: 600, fontSize: 9, flex: 1, paddingRight: 10 },
  barraValor: { fontFamily: "Archivo", fontWeight: 700, fontSize: 9 },
  barraRiel: { height: 4, backgroundColor: "#e0deda", marginTop: 4 },
  barraLlena: { height: 4, backgroundColor: SENAL },

  cifra: {
    fontFamily: "Archivo",
    fontWeight: 800,
    fontSize: 40,
    color: SENAL,
    letterSpacing: -1.4,
  },

  tablaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: FILETE,
  },

  pie: {
    position: "absolute",
    left: MARGEN,
    right: MARGEN,
    bottom: MARGEN - 16,
    borderTopWidth: 1.5,
    borderTopColor: TINTA,
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
})

/* -------------------------------------------------------------------------
 * Las formas. Cada una recibe filas ya calculadas y solo dibuja.
 * ---------------------------------------------------------------------- */

/** El mismo criterio que en pantalla: el eje no es lugar para una fecha ISO. */
function etiquetaCorta(valor: string) {
  const mes = valor.match(/^(\d{4})-(\d{2})$/)
  if (mes) return `${mes[2]}/${mes[1].slice(2)}`

  const dia = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dia) return `${dia[3]}/${dia[2]}`

  return valor
}

/* Los <Text> de un <Svg> no heredan la familia de la página. */
const EJE = { fontFamily: "Geist", fontSize: 6.5, fill: APAGADO } as const

const ANCHO_UTIL = 595.28 - MARGEN * 2
const ALTO_SERIE = 150

function Barras({
  filas,
  fmt,
}: {
  filas: FilaInsight[]
  fmt: (v: number) => string
}) {
  const maximo = Math.max(...filas.map((f) => f.valor), 1)

  return (
    <View>
      {filas.slice(0, 14).map((fila, i) => (
        <View key={i} style={e.barraFila} wrap={false}>
          <View style={e.barraTexto}>
            <Text style={e.barraNombre}>{fila.etiqueta}</Text>
            <Text style={e.barraValor}>{fmt(fila.valor)}</Text>
          </View>
          <View style={e.barraRiel}>
            <View
              style={[
                e.barraLlena,
                // Un mínimo visible: una barra de cero ancho parece un error
                // de dibujo y no un valor chico.
                { width: `${Math.max((fila.valor / maximo) * 100, 1.5)}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  )
}

function Serie({
  filas,
  corto,
  columnas,
}: {
  filas: FilaInsight[]
  corto: (v: number) => string
  columnas: boolean
}) {
  const izq = 44
  const abajo = 16
  const util = ANCHO_UTIL - izq - 4
  const alto = ALTO_SERIE - abajo - 6

  const maximo = Math.max(...filas.map((f) => f.valor), 1)
  // La escala arranca en cero siempre: un eje truncado exagera la variación.
  const y = (v: number) => 6 + alto - (v / maximo) * alto
  const x = (i: number) =>
    filas.length === 1 ? izq + util / 2 : izq + (i / (filas.length - 1)) * util

  const marcas = [0, maximo / 2, maximo]

  return (
    <Svg width={ANCHO_UTIL} height={ALTO_SERIE}>
      {marcas.map((v, i) => (
        <React.Fragment key={i}>
          <Line
            x1={izq}
            y1={y(v)}
            x2={izq + util}
            y2={y(v)}
            strokeWidth={0.5}
            stroke={FILETE}
          />
          <Text x={izq - 6} y={y(v) + 3} style={{ ...EJE, textAnchor: "end" }}>
            {corto(v)}
          </Text>
        </React.Fragment>
      ))}

      {columnas
        ? filas.map((fila, i) => {
            const ancho = Math.max(util / filas.length - 6, 3)
            return (
              <Path
                key={i}
                d={`M ${x(i) - ancho / 2} ${y(fila.valor)} h ${ancho} v ${y(0) - y(fila.valor)} h -${ancho} Z`}
                fill={SENAL}
              />
            )
          })
        : [
            <Path
              key="linea"
              d={filas
                .map((f, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(f.valor)}`)
                .join(" ")}
              stroke={SENAL}
              strokeWidth={1.6}
              fill="none"
            />,
          ]}

      {/* Solo el primero y el último del eje: rotular los treinta no se lee. */}
      <Text x={izq} y={ALTO_SERIE - 4} style={EJE}>
        {etiquetaCorta(filas[0].etiqueta)}
      </Text>
      {filas.length > 1 ? (
        <Text
          x={izq + util}
          y={ALTO_SERIE - 4}
          style={{ ...EJE, textAnchor: "end" }}
        >
          {etiquetaCorta(filas[filas.length - 1].etiqueta)}
        </Text>
      ) : null}
    </Svg>
  )
}

function Tabla({
  filas,
  fmt,
}: {
  filas: FilaInsight[]
  fmt: (v: number) => string
}) {
  return (
    <View>
      {filas.slice(0, 30).map((fila, i) => (
        <View key={i} style={e.tablaFila} wrap={false}>
          <Text style={{ flex: 1, paddingRight: 12 }}>{fila.etiqueta}</Text>
          <Text style={{ fontFamily: "Archivo", fontWeight: 700 }}>
            {fmt(fila.valor)}
          </Text>
        </View>
      ))}
    </View>
  )
}

function Forma({ grafico }: { grafico: GraficoDelInforme }) {
  const { consulta, filas } = grafico
  const dinero = consulta.formato === "dinero"
  const fmt = (v: number) => (dinero ? formatMoney(v) : formatNumber(v))
  const corto = (v: number) =>
    dinero ? formatMoneyCompact(v) : formatNumberCompact(v)

  if (filas.length === 0) {
    return (
      <Text style={{ color: APAGADO, fontSize: 9 }}>
        La consulta corrió bien, pero no hay filas todavía.
      </Text>
    )
  }

  if (consulta.grafico === "numero") {
    return <Text style={e.cifra}>{fmt(filas[0].valor)}</Text>
  }

  if (consulta.grafico === "tabla") return <Tabla filas={filas} fmt={fmt} />

  if (consulta.grafico === "barra") return <Barras filas={filas} fmt={fmt} />

  return (
    <Serie
      filas={filas}
      corto={corto}
      columnas={consulta.grafico === "columna"}
    />
  )
}

/* -------------------------------------------------------------------------
 * El documento.
 *
 * Se llama como función y no se monta como componente: no tiene estado ni
 * usa hooks, y `renderToBuffer` espera el elemento `Document` ya armado.
 * ---------------------------------------------------------------------- */

export function construirInforme({
  graficos,
  tienda,
  fecha,
}: {
  graficos: GraficoDelInforme[]
  tienda: string
  fecha: string
}) {
  registrarFuentes()

  const unico = graficos.length === 1

  return (
    <Document
      title={unico ? graficos[0].titulo : `Informe de ${tienda}`}
      author="Venduo"
      subject="Informe de estadísticas"
    >
      <Page size="A4" style={e.pagina}>
        {/* El marco y el pie se repiten en cada hoja. */}
        <View style={e.marco} fixed />

        <View style={e.cabecera} fixed>
          <View style={e.filaCabecera}>
            <Text style={e.marca}>Venduo</Text>
            <Text style={e.tienda}>{tienda}</Text>
          </View>
          <View style={[e.filaCabecera, { marginTop: 3 }]}>
            <Text style={[e.rotulo, e.rotuloSenal]}>
              {unico ? "Gráfico" : "Informe de estadísticas"}
            </Text>
            <Text style={[e.rotulo, e.rotuloApagado]}>{fecha}</Text>
          </View>
        </View>
        {graficos.map((grafico, i) => {
          const lectura = leerGrafico(grafico.consulta, grafico.filas)

          return (
            <View
              key={grafico.id}
              style={[
                e.bloque,
                ...(i === graficos.length - 1
                  ? [{ borderBottomWidth: 0 }]
                  : []),
              ]}
              wrap={grafico.consulta.grafico === "tabla"}
            >
              <Text style={e.pregunta}>
                <Text style={e.numero}>{String(i + 1).padStart(2, "0")}</Text>
                {"   "}
                {grafico.pregunta}
              </Text>

              <Text style={e.titulo}>{grafico.consulta.titulo}</Text>
              <Text style={e.epigrafe}>{grafico.consulta.explicacion}</Text>

              <View style={e.reglaGrafico}>
                <Forma grafico={grafico} />
              </View>

              {lectura ? <Text style={e.lectura}>{lectura}</Text> : null}
            </View>
          )
        })}

        <View style={e.pie} fixed>
          <Text style={[e.rotulo, e.rotuloApagado]}>
            <Text style={e.rotuloSenal}>Venduo</Text>
            {"   ·   "}
            {tienda}
            {"   ·   "}
            {fecha}
          </Text>
          <Text
            style={[e.rotulo, e.rotuloApagado]}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
