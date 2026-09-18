/**
 * Lo que el panel del promotor calcula sin ir a la base.
 *
 * Sin dependencias de servidor: lo usan las pantallas y sus componentes de
 * cliente. Las consultas viven en `lib/data/promotor.ts`.
 */

import type { CommissionStatus } from "@/types"

/** Un producto que el promotor tomó, con su enlace. */
export interface Enlace {
  id: string
  productoId: string
  nombre: string
  imagenUrl: string | null
  precioCents: number
  /** Lo que gana por cada unidad vendida con su enlace. */
  gananciaCents: number
  negocio: string
  negocioSlug: string
  codigo: string | null
  url: string
  tomadoEn: string
  /** Unidades vendidas con su enlace, sin contar lo cancelado. */
  unidades: number
  /** Lo que movieron esas ventas, al precio publicado. */
  ventasCents: number
  stock: number
  disponible: boolean
}

/** Un comprador que llegó por primera vez con su enlace. */
export interface Comprador {
  id: string
  /** El nombre si tiene cuenta en Venduo; si no, el teléfono censurado. */
  comprador: string
  registrado: boolean
  desde: string
  vence: string
  vigente: boolean
  primeraTienda: string | null
  primeraCompraCents: number
  comprasIndirectas: number
  comisionIndirectaCents: number
}

export type TipoComision = "directa" | "indirecta"

export interface Comision {
  id: string
  negocio: string
  montoCents: number
  baseCents: number
  tasaBps: number
  estado: CommissionStatus
  tipo: TipoComision
  fecha: string
}

export interface PromotorRanking {
  posicion: number
  userId: string
  nombre: string
  slug: string | null
  ciudad: string | null
  avatarUrl: string | null
  ventas: number
  ventasDirectas?: number
  ventasIndirectas?: number
  volumenCents: number
  comisionCents?: number
  tiendasCount?: number
  productos?: string[]
  promocionaMiTienda?: boolean
  desde?: string | null
}

export interface PromotorLocal {
  userId: string
  nombre: string
  slug: string | null
  ciudad?: string | null
  avatarUrl?: string | null
  productos: string[]
  desde: string | null
  ventas: number
  indirectas: number
  comisionCents: number
  volumenCents?: number
}

export function transformarARankingMiNegocio(
  promotores: PromotorLocal[]
): PromotorRanking[] {
  return promotores.map((p, idx) => ({
    posicion: idx + 1,
    userId: p.userId,
    nombre: p.nombre,
    slug: p.slug,
    ciudad: p.ciudad ?? null,
    avatarUrl: p.avatarUrl ?? null,
    ventas: p.ventas + p.indirectas,
    ventasDirectas: p.ventas,
    ventasIndirectas: p.indirectas,
    volumenCents: p.volumenCents ?? 0,
    comisionCents: p.comisionCents,
    productos: p.productos,
    promocionaMiTienda: true,
    desde: p.desde,
  }))
}

export interface PerfilPromotor {
  nombre: string
  slug: string | null
}

export interface ResumenPromotor {
  /** Confirmado y pagado: lo que ya es historial. */
  ganadoCents: number
  /** Confirmado y todavía no transferido. */
  porCobrarCents: number
  pagadoCents: number
  /** El pago sigue retenido: puede terminar devuelto. */
  pendienteCents: number
  ventasDirectas: number
  ventasIndirectas: number
  indirectoCents: number
  compradores: number
  compradoresVigentes: number
  enlaces: number
  negocios: number
  desde: string | null
}

export interface Fila {
  etiqueta: string
  valor: number
}

/** Solo lo confirmado cuenta como historial: lo pendiente todavía se anula. */
const CUENTAN: CommissionStatus[] = ["confirmada", "pagada"]

/**
 * Lo que gana el promotor por unidad.
 *
 * Es el componente de comisión del precio, calculado igual que en
 * `create_order`: el take-rate redondeado al centavo y la comisión como lo que
 * falta para llegar al precio. Así la cifra que se promete es la que se paga.
 */
export function gananciaPorUnidad(
  precioCents: number,
  baseCents: number,
  takeBps: number | null
): number {
  const take = Math.round((baseCents * (takeBps ?? 0)) / 10000)
  return Math.max(precioCents - baseCents - take, 0)
}

export function resumirPromotor(
  enlaces: Enlace[],
  comisiones: Comision[],
  compradores: Comprador[]
): ResumenPromotor {
  let porCobrarCents = 0
  let pagadoCents = 0
  let pendienteCents = 0
  let ventasDirectas = 0
  let ventasIndirectas = 0
  let indirectoCents = 0

  for (const c of comisiones) {
    if (c.estado === "confirmada") porCobrarCents += c.montoCents
    if (c.estado === "pagada") pagadoCents += c.montoCents
    if (c.estado === "pendiente") pendienteCents += c.montoCents
    if (!CUENTAN.includes(c.estado)) continue

    if (c.tipo === "directa") ventasDirectas += 1
    else {
      ventasIndirectas += 1
      indirectoCents += c.montoCents
    }
  }

  const fechas = comisiones
    .filter((c) => CUENTAN.includes(c.estado))
    .map((c) => c.fecha)
    .sort()

  return {
    ganadoCents: porCobrarCents + pagadoCents,
    porCobrarCents,
    pagadoCents,
    pendienteCents,
    ventasDirectas,
    ventasIndirectas,
    indirectoCents,
    compradores: compradores.length,
    compradoresVigentes: compradores.filter((c) => c.vigente).length,
    enlaces: enlaces.length,
    negocios: new Set(enlaces.map((e) => e.negocioSlug)).size,
    desde: fechas[0] ?? null,
  }
}

/** El lunes de la semana de una fecha, como `YYYY-MM-DD`. */
function lunesDe(fecha: Date): string {
  const d = new Date(
    Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate())
  )
  const dia = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dia)
  return d.toISOString().slice(0, 10)
}

/**
 * Lo ganado por semana, las últimas `semanas`, con las vacías en cero.
 *
 * Una semana sin ventas es un dato, no un hueco: si se omitiera, la línea
 * uniría dos semanas buenas y escondería la caída.
 */
export function gananciaSemanal(
  comisiones: Comision[],
  semanas = 12,
  hoy = new Date()
): Fila[] {
  const filas: Fila[] = []
  const indice = new Map<string, number>()

  for (let i = semanas - 1; i >= 0; i--) {
    const d = new Date(hoy.getTime() - i * 7 * 86_400_000)
    const etiqueta = lunesDe(d)
    indice.set(etiqueta, filas.length)
    filas.push({ etiqueta, valor: 0 })
  }

  for (const c of comisiones) {
    if (c.estado === "anulada") continue
    const posicion = indice.get(lunesDe(new Date(c.fecha)))
    if (posicion !== undefined) filas[posicion].valor += c.montoCents
  }

  return filas
}

/** Lo ganado por negocio, de mayor a menor. */
export function gananciaPorNegocio(comisiones: Comision[]): Fila[] {
  const totales = new Map<string, number>()
  for (const c of comisiones) {
    if (c.estado === "anulada") continue
    totales.set(c.negocio, (totales.get(c.negocio) ?? 0) + c.montoCents)
  }
  return [...totales.entries()]
    .map(([etiqueta, valor]) => ({ etiqueta, valor }))
    .sort((a, b) => b.valor - a.valor)
}

/** Unidades vendidas por enlace, de mayor a menor, sin los que no vendieron. */
export function unidadesPorEnlace(enlaces: Enlace[]): Fila[] {
  return enlaces
    .filter((e) => e.unidades > 0)
    .map((e) => ({ etiqueta: e.nombre, valor: e.unidades }))
    .sort((a, b) => b.valor - a.valor)
}

/**
 * El mensaje listo para WhatsApp.
 *
 * Sin emojis: se pegan en chats de todo tipo y en algunos teléfonos viejos
 * llegan como cuadraditos. Lo que vende es el producto, el precio y el enlace.
 */
export function mensajeParaCompartir(
  producto: string,
  negocio: string,
  precio: string,
  url: string
): string {
  return `Mira esto: ${producto}, de ${negocio}, a ${precio}. Lo pides acá y te lo entregan coordinando por WhatsApp: ${url}`
}

/** Cuántos días faltan hasta una fecha, redondeado hacia arriba. */
export function diasHasta(fecha: string, hoy = new Date()): number {
  return Math.max(
    Math.ceil((new Date(fecha).getTime() - hoy.getTime()) / 86_400_000),
    0
  )
}
