import type { InsightSql } from "@/lib/ai/schemas"
import type { FilaInsight } from "@/lib/data/insights"
import { formatMoney, formatNumber } from "@/lib/format"

/**
 * La lectura del gráfico, calculada desde las filas.
 *
 * La `explicacion` que devuelve la IA se escribe **antes** de ejecutar la
 * consulta, así que solo puede describir la intención: "voy a mostrar las
 * ventas por producto". Eso no es leer el gráfico.
 *
 * Esto sí lo lee, y se calcula acá y no con una segunda pasada por el modelo
 * por dos razones: sale al instante —el viaje al proveedor cuesta entre 11 y 23
 * segundos— y las cifras no pueden estar mal, porque salen del mismo resultado
 * que se está dibujando.
 */
export function leerGrafico(
  consulta: InsightSql,
  filas: FilaInsight[]
): string | null {
  if (filas.length === 0) return null

  const dinero = consulta.formato === "dinero"
  const fmt = (v: number) => (dinero ? formatMoney(v) : formatNumber(v))

  if (filas.length === 1) {
    const fila = filas[0]
    // Una fila con etiqueta propia es una categoría que resultó ser la única,
    // no un total. Decir solo la cifra tira el nombre, que es la mitad de la
    // respuesta: "5" no contesta "¿en qué estado están mis pedidos?".
    return esEtiquetaDeTotal(fila.etiqueta)
      ? `${fmt(fila.valor)} en total.`
      : `Todo cae en un solo grupo: ${fechaLegible(fila.etiqueta)}, con ${fmt(fila.valor)}.`
  }

  return esSerieDeTiempo(filas)
    ? leerSerie(filas, fmt)
    : leerRanking(filas, fmt)
}

/**
 * Si la etiqueta es un rótulo de total y no una categoría.
 *
 * `select 'Total' as etiqueta, sum(...)` devuelve una fila cuya etiqueta no
 * dice nada; `group by status` que resultó en un solo estado devuelve una fila
 * cuya etiqueta lo dice todo. Son dos cosas distintas y se muestran distinto.
 */
export function esEtiquetaDeTotal(etiqueta: string) {
  return /^(total|totales|todos|todas|general|suma|resultado)$/i.test(
    etiqueta.trim()
  )
}

/** Una etiqueta con forma de fecha ISO delata una serie de tiempo. */
function esSerieDeTiempo(filas: FilaInsight[]) {
  const fecha = /^\d{4}-\d{2}(-\d{2})?$/
  return filas.every((f) => fecha.test(f.etiqueta))
}

function leerRanking(filas: FilaInsight[], fmt: (v: number) => string) {
  const total = filas.reduce((acc, f) => acc + f.valor, 0)
  const primera = filas[0]
  const partes: string[] = []

  if (total > 0) {
    const cuota = Math.round((primera.valor / total) * 100)
    partes.push(
      `${primera.etiqueta} encabeza con ${fmt(primera.valor)}, el ${cuota}% del total.`
    )
  } else {
    partes.push(`${primera.etiqueta} encabeza con ${fmt(primera.valor)}.`)
  }

  // La distancia con el segundo dice si hay un líder claro o un empate.
  const segunda = filas[1]
  if (segunda && segunda.valor > 0) {
    const veces = primera.valor / segunda.valor
    if (veces >= 1.8) {
      partes.push(
        `Casi ${veces >= 2.8 ? "el triple" : "el doble"} que ${segunda.etiqueta}.`
      )
    } else if (veces <= 1.1) {
      partes.push(`Muy parejo con ${segunda.etiqueta}.`)
    }
  }

  partes.push(`Entre ${filas.length} suman ${fmt(total)}.`)

  return partes.join(" ")
}

function leerSerie(filas: FilaInsight[], fmt: (v: number) => string) {
  const total = filas.reduce((acc, f) => acc + f.valor, 0)
  const pico = filas.reduce((a, b) => (b.valor > a.valor ? b : a))
  const partes: string[] = [`${fmt(total)} en ${filas.length} períodos.`]

  // Se comparan las dos mitades: una sola lectura de punta a punta confunde
  // un pico aislado con una tendencia.
  const mitad = Math.floor(filas.length / 2)
  if (mitad > 0) {
    const previa = filas.slice(0, mitad).reduce((a, f) => a + f.valor, 0)
    const reciente = filas.slice(mitad).reduce((a, f) => a + f.valor, 0)

    if (previa > 0) {
      const cambio = Math.round(((reciente - previa) / previa) * 100)
      if (Math.abs(cambio) >= 10) {
        partes.push(
          `La segunda mitad del período ${cambio > 0 ? "subió" : "bajó"} ${Math.abs(cambio)}%.`
        )
      } else {
        partes.push("Se mantiene parejo a lo largo del período.")
      }
    }
  }

  partes.push(
    `El pico fue ${fechaLegible(pico.etiqueta)} con ${fmt(pico.valor)}.`
  )

  return partes.join(" ")
}

function fechaLegible(valor: string) {
  const mes = valor.match(/^(\d{4})-(\d{2})$/)
  if (mes) return `${mes[2]}/${mes[1]}`

  const dia = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dia) return `el ${dia[3]}/${dia[2]}`

  return valor
}
