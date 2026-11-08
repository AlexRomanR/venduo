import { diaEnBolivia, sumarDias } from "@/lib/format"
import { noSeConcreto } from "@/lib/pedidos"
import type { DiaDeVentas, Periodo, TotalesDelPeriodo } from "@/lib/tablero"
import type { OrderStatus } from "@/types"

/*
 * Las cuentas de Estadísticas: lo que va más a fondo que el Resumen.
 *
 * Puras y sin la base, para que las lean el servidor y el cliente, y para que
 * la API de la app las use igual. Las consultas están en
 * `lib/data/estadisticas.ts`. Todo el dinero en centavos enteros.
 */

/** Los días de la semana, de lunes a domingo. */
export const DIAS_DE_LA_SEMANA = [
  { nombre: "lunes", corto: "Lun" },
  { nombre: "martes", corto: "Mar" },
  { nombre: "miércoles", corto: "Mié" },
  { nombre: "jueves", corto: "Jue" },
  { nombre: "viernes", corto: "Vie" },
  { nombre: "sábado", corto: "Sáb" },
  { nombre: "domingo", corto: "Dom" },
] as const

export interface DiaDeLaSemana {
  /** 0 es el lunes, 6 el domingo. */
  indice: number
  nombre: string
  corto: string
  /** Lo vendido en promedio ese día de la semana, redondeado. */
  promedioCents: number
  /** Cuántos días de esos entraron en el período. */
  dias: number
}

/** El día de la semana de un `AAAA-MM-DD`, con el lunes en 0. */
export function diaDeLaSemana(dia: string): number {
  // Al mediodía UTC el día no cambia con ninguna zona horaria.
  const domingoEnCero = new Date(`${dia}T12:00:00Z`).getUTCDay()
  return (domingoEnCero + 6) % 7
}

/**
 * Lo vendido en promedio cada día de la semana.
 *
 * Promedio y no total: treinta días traen cuatro o cinco de cada día, y con
 * el total el que aparece cinco veces gana sin vender más.
 */
export function porDiaDeLaSemana(dias: DiaDeVentas[]): DiaDeLaSemana[] {
  const suma = Array<number>(7).fill(0)
  const veces = Array<number>(7).fill(0)
  for (const dia of dias) {
    const indice = diaDeLaSemana(dia.dia)
    suma[indice] += dia.ventasCents
    veces[indice] += 1
  }
  return DIAS_DE_LA_SEMANA.map((dia, indice) => ({
    indice,
    nombre: dia.nombre,
    corto: dia.corto,
    promedioCents:
      veces[indice] > 0 ? Math.round(suma[indice] / veces[indice]) : 0,
    dias: veces[indice],
  }))
}

/** El día de la semana que más vende, o `null` si no se vendió nada. */
export function diaFuerte(semana: DiaDeLaSemana[]): DiaDeLaSemana | null {
  return semana.reduce<DiaDeLaSemana | null>(
    (mejor, dia) =>
      dia.promedioCents > 0 &&
      (!mejor || dia.promedioCents > mejor.promedioCents)
        ? dia
        : mejor,
    null
  )
}

export interface Cobros {
  /** Los pedidos que llegaron en el período, de cualquier estado. */
  llegaron: number
  cobrados: number
  /** Pendientes todavía dentro del plazo: esperan que la tienda cobre. */
  porCobrar: number
  /** Pendientes que pasaron el plazo sin pagarse. */
  noConcretados: number
  cancelados: number
}

/**
 * De los pedidos que llegaron, cuántos se cobraron. Un pendiente viejo ya no
 * espera nada (`noSeConcreto`): cuenta aparte, no como por cobrar.
 */
export function cuantosSeCobran(
  pedidos: { estado: OrderStatus; creado: string }[],
  ahora: Date = new Date()
): Cobros {
  const cobros: Cobros = {
    llegaron: pedidos.length,
    cobrados: 0,
    porCobrar: 0,
    noConcretados: 0,
    cancelados: 0,
  }
  for (const pedido of pedidos) {
    if (pedido.estado === "pagado") cobros.cobrados += 1
    else if (pedido.estado === "cancelado") cobros.cancelados += 1
    else if (noSeConcreto(pedido, ahora)) cobros.noConcretados += 1
    else cobros.porCobrar += 1
  }
  return cobros
}

/** Una línea de un pedido pagado, con su producto y la fecha de su pedido. */
export interface LineaVendida {
  productoId: string | null
  nombre: string
  foto: string | null
  cantidad: number
  precioCents: number
  costoCents: number | null
  creado: string
}

export interface ProductoQueDeja {
  id: string | null
  nombre: string
  foto: string | null
  unidades: number
  montoCents: number
  /** `null` si alguna de sus ventas no tenía costo. */
  gananciaCents: number | null
}

/**
 * Los productos que más plata dejan desde `desde` (un día de Bolivia).
 *
 * Por ganancia solo si todo lo vendido tenía costo: mezclar ganancias con
 * montos ordenaría primero lo que no tiene costo cargado. Si no, por monto.
 */
export function loQueMasDeja(
  lineas: LineaVendida[],
  desde: string,
  cuantos = 5
): { porGanancia: boolean; productos: ProductoQueDeja[] } {
  const porProducto = new Map<string, ProductoQueDeja>()
  let todasConCosto = true
  for (const linea of lineas) {
    if (diaEnBolivia(linea.creado) < desde) continue
    const clave = linea.productoId ?? `nombre:${linea.nombre}`
    const previo = porProducto.get(clave) ?? {
      id: linea.productoId,
      nombre: linea.nombre,
      foto: linea.foto,
      unidades: 0,
      montoCents: 0,
      gananciaCents: 0,
    }
    previo.unidades += linea.cantidad
    previo.montoCents += linea.cantidad * linea.precioCents
    if (linea.costoCents === null) {
      todasConCosto = false
      previo.gananciaCents = null
    } else if (previo.gananciaCents !== null) {
      previo.gananciaCents +=
        linea.cantidad * (linea.precioCents - linea.costoCents)
    }
    porProducto.set(clave, previo)
  }

  const porGanancia = porProducto.size > 0 && todasConCosto
  const productos = [...porProducto.values()]
    .sort((a, b) =>
      porGanancia
        ? (b.gananciaCents ?? 0) - (a.gananciaCents ?? 0) ||
          b.montoCents - a.montoCents
        : b.montoCents - a.montoCents || b.unidades - a.unidades
    )
    .slice(0, cuantos)
  return { porGanancia, productos }
}

export interface ProductoEnStock {
  id: string
  nombre: string
  foto: string | null
  stock: number
  precioCents: number
  costoCents: number | null
  creado: string
}

export interface ProductoQuieto {
  id: string
  nombre: string
  foto: string | null
  stock: number
  /** Lo que vale su stock: a costo si todos lo tienen, si no a precio. */
  valorCents: number
}

/** Lo que un producto tiene que llevar cargado para contar como que no se mueve. */
export const DIAS_PARA_JUZGAR = 14

/**
 * Desde qué día un producto es demasiado nuevo para decir que no se mueve: el
 * período, si es corto, o dos semanas. Exigir el período entero dejaba fuera,
 * a 90 días, a todo lo cargado en los últimos tres meses —en una tienda
 * nueva, todo—, y la tarjeta decía "Todo se movió" sin que nada se vendiera.
 */
export function limiteParaJuzgar(hoy: string, dias: number): string {
  return sumarDias(hoy, -(Math.min(dias, DIAS_PARA_JUZGAR) - 1))
}

/**
 * Los productos con stock que no se vendieron en el período.
 *
 * Uno cargado desde `limite` (`limiteParaJuzgar`) todavía no cuenta: es muy
 * nuevo para decir que no se vende. Se cuentan aparte, en `recientes`, para no
 * decir "Todo se movió" cuando en realidad no se juzgó nada. El valor parado
 * va a costo solo si todos tienen costo; si no, todo a precio de venta, para
 * no sumar las dos cosas.
 */
export function loQueNoSeMueve(
  productos: ProductoEnStock[],
  vendidos: Set<string>,
  limite: string
): {
  aCosto: boolean
  valorCents: number
  productos: ProductoQuieto[]
  recientes: number
} {
  const sinVender = productos.filter(
    (producto) => producto.stock > 0 && !vendidos.has(producto.id)
  )
  const quietos = sinVender.filter(
    (producto) => diaEnBolivia(producto.creado) < limite
  )
  const aCosto =
    quietos.length > 0 && quietos.every((p) => p.costoCents !== null)
  const lista = quietos
    .map((producto) => ({
      id: producto.id,
      nombre: producto.nombre,
      foto: producto.foto,
      stock: producto.stock,
      valorCents:
        producto.stock *
        (aCosto ? (producto.costoCents ?? 0) : producto.precioCents),
    }))
    .sort(
      (a, b) => b.valorCents - a.valorCents || a.nombre.localeCompare(b.nombre)
    )
  return {
    aCosto,
    valorCents: lista.reduce((total, p) => total + p.valorCents, 0),
    productos: lista,
    recientes: sinVender.length - quietos.length,
  }
}

/** Lo que la pantalla necesita de un período. */
export interface EstadisticasDelPeriodo {
  dias: Periodo
  /** El primer y el último día del período, `AAAA-MM-DD`. */
  desde: string
  hasta: string
  actual: TotalesDelPeriodo
  /** `null` si la serie no alcanza para un período anterior entero. */
  anterior: TotalesDelPeriodo | null
  cobros: Cobros
  masDeja: { porGanancia: boolean; productos: ProductoQueDeja[] }
  quietos: ReturnType<typeof loQueNoSeMueve>
  semana: DiaDeLaSemana[]
}

export interface Estadisticas {
  hoy: string
  periodo: EstadisticasDelPeriodo
  /** Si la tienda vendió alguna vez: sin eso, la pantalla enseña cómo se llena. */
  vendioAlgunaVez: boolean
  /** Si tiene al menos un producto. */
  tieneProductos: boolean
  esDemo: boolean
}
