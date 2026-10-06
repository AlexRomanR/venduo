import { sumarDias } from "@/lib/format"
import type { OrderStatus } from "@/types"

/**
 * El tablero del Resumen: sus tipos y las cuentas de los períodos.
 *
 * Vive fuera de `lib/data` porque lo usa también el gráfico, que es de
 * cliente, y ese módulo importa el cliente de servidor de Supabase. Las
 * consultas están en `lib/data/tablero.ts`.
 */

/**
 * Cuántos días trae la serie: los 90 del período más largo que se puede
 * mirar, y 90 más para compararlo con el anterior.
 */
export const DIAS_DE_SERIE = 180

/** Los períodos que se pueden mirar. El del medio es el de entrada. */
export const PERIODOS = [7, 30, 90] as const
export type Periodo = (typeof PERIODOS)[number]

export interface DiaDeVentas {
  /** `AAAA-MM-DD`, en hora de Bolivia. */
  dia: string
  ventasCents: number
  pedidos: number
}

export interface PedidoReciente {
  id: string
  numero: number
  /** Solo los pedidos anteriores a la compra por WhatsApp lo guardan. */
  comprador: string | null
  telefono: string | null
  totalCents: number
  estado: OrderStatus
  creado: string
  articulos: number
}

export interface ProductoVendido {
  id: string | null
  nombre: string
  foto: string | null
  unidades: number
  montoCents: number
}

export interface ProductoPorAcabarse {
  id: string
  nombre: string
  foto: string | null
  stock: number
}

export interface Tablero {
  /** El día de hoy en Bolivia: el último de la serie. */
  hoy: string
  /** Un día por fila, del más viejo a hoy, con los días sin ventas en cero. */
  serie: DiaDeVentas[]
  ultimosPedidos: PedidoReciente[]
  /** Los pedidos que esperan que la tienda confirme el pago. */
  porGestionar: { pendientes: number }
  masVendidos: ProductoVendido[]
  porAcabarse: ProductoPorAcabarse[]
  /** Los primeros pasos de una tienda nueva, hechos o no. */
  pasos: {
    producto: boolean
    estilo: boolean
    primerPedido: boolean
  }
  esDemo: boolean
}

/** Los días de la serie, del más viejo a hoy, todos en cero. */
export function diasVacios(
  hoy: string,
  cantidad: number = DIAS_DE_SERIE
): DiaDeVentas[] {
  return Array.from({ length: cantidad }, (_, indice) => ({
    dia: sumarDias(hoy, indice - (cantidad - 1)),
    ventasCents: 0,
    pedidos: 0,
  }))
}

export interface TotalesDelPeriodo {
  ventasCents: number
  pedidos: number
  /** Ventas sobre pedidos; `null` sin pedidos, porque no hay promedio de nada. */
  ticketCents: number | null
  mejorDia: DiaDeVentas | null
}

export function totales(dias: DiaDeVentas[]): TotalesDelPeriodo {
  const ventasCents = dias.reduce((total, d) => total + d.ventasCents, 0)
  const pedidos = dias.reduce((total, d) => total + d.pedidos, 0)
  const mejorDia = dias.reduce<DiaDeVentas | null>(
    (mejor, d) =>
      d.ventasCents > 0 && (!mejor || d.ventasCents > mejor.ventasCents)
        ? d
        : mejor,
    null
  )

  return {
    ventasCents,
    pedidos,
    ticketCents: pedidos > 0 ? Math.round(ventasCents / pedidos) : null,
    mejorDia,
  }
}

/** Los días del período y los del período anterior, del mismo largo. */
export function cortarPeriodo(serie: DiaDeVentas[], dias: Periodo) {
  return {
    actual: serie.slice(-dias),
    anterior: serie.slice(-dias * 2, -dias),
  }
}

/**
 * Cuánto cambió un valor contra el período anterior, en por ciento.
 *
 * `null` cuando no hay contra qué comparar: subir desde cero no es un
 * porcentaje, y un "+∞%" no le dice nada a nadie.
 */
export function variacion(actual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Math.round(((actual - anterior) / anterior) * 100)
}

export interface Columna {
  /** El primer día que cubre. */
  desde: string
  /** El último: igual a `desde` si la columna es de un solo día. */
  hasta: string
  ventasCents: number
  pedidos: number
}

/**
 * Las columnas del gráfico: una por día hasta 30 días, una por semana en 90.
 *
 * Noventa barras en un celular de 375 px son de tres píxeles cada una: no se
 * pueden tocar, y la forma de la semana se pierde en el ruido de cada día.
 * Trece semanas sí se leen. Se agrupa desde hoy hacia atrás, así la última
 * columna termina hoy y la primera puede quedar más corta.
 */
export function columnas(dias: DiaDeVentas[]): Columna[] {
  const porDia = dias.length <= 31
  if (porDia) {
    return dias.map((d) => ({
      desde: d.dia,
      hasta: d.dia,
      ventasCents: d.ventasCents,
      pedidos: d.pedidos,
    }))
  }

  const semanas: Columna[] = []
  for (let fin = dias.length; fin > 0; fin -= 7) {
    const tramo = dias.slice(Math.max(fin - 7, 0), fin)
    semanas.unshift({
      desde: tramo[0].dia,
      hasta: tramo[tramo.length - 1].dia,
      ventasCents: tramo.reduce((total, d) => total + d.ventasCents, 0),
      pedidos: tramo.reduce((total, d) => total + d.pedidos, 0),
    })
  }
  return semanas
}

/** Los pasos de una tienda nueva que faltan, en el orden en que conviene. */
export function pasosPendientes(pasos: Tablero["pasos"]): number {
  return [pasos.producto, pasos.estilo, pasos.primerPedido].filter(
    (hecho) => !hecho
  ).length
}
