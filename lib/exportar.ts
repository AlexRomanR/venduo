import { diaEnBolivia, formatHora, sumarDias } from "@/lib/format"
import { noSeConcreto } from "@/lib/pedidos"
import { montoParaPlanilla, type Hoja } from "@/lib/planilla"
import type { OrderStatus } from "@/types"

/**
 * Lo que va en las planillas que descarga la tienda: sus pedidos y sus
 * productos. Neutral: arma las filas a partir de datos ya leídos, así lo usan
 * la ruta de la web y, más adelante, la de la app.
 */

export type Periodo = "este-mes" | "mes-pasado" | "todo"

export const PERIODOS: { valor: Periodo; nombre: string }[] = [
  { valor: "este-mes", nombre: "Este mes" },
  { valor: "mes-pasado", nombre: "Mes pasado" },
  { valor: "todo", nombre: "Todo" },
]

export function esPeriodo(valor: unknown): valor is Periodo {
  return PERIODOS.some((p) => p.valor === valor)
}

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

/**
 * Los días de un período en Bolivia (`desde` incluido, `hasta` excluido) y su
 * nombre para el archivo. "Todo" no tiene límites.
 */
export function limitesDe(
  periodo: Periodo,
  ahora: Date = new Date()
): { desde: string | null; hasta: string | null; nombre: string } {
  if (periodo === "todo") return { desde: null, hasta: null, nombre: "todo" }

  const hoy = diaEnBolivia(ahora)
  const [anio, mes] = hoy.split("-").map(Number)
  const primero = (a: number, m: number) =>
    `${a}-${String(m).padStart(2, "0")}-01`

  if (periodo === "este-mes") {
    return {
      desde: primero(anio, mes),
      hasta: sumarDias(hoy, 1),
      nombre: `${MESES[mes - 1]}-${anio}`,
    }
  }
  const anterior = mes === 1 ? { a: anio - 1, m: 12 } : { a: anio, m: mes - 1 }
  return {
    desde: primero(anterior.a, anterior.m),
    hasta: primero(anio, mes),
    nombre: `${MESES[anterior.m - 1]}-${anterior.a}`,
  }
}

/** Lo que cubre un período, dicho: "Del 1 al 23 de octubre". */
export function textoDePeriodo(periodo: Periodo, ahora: Date = new Date()) {
  if (periodo === "todo") return "Desde tu primer pedido"
  const { desde, hasta } = limitesDe(periodo, ahora)
  if (!desde || !hasta) return ""
  const [anio, mes] = desde.split("-").map(Number)
  if (periodo === "mes-pasado") return `Todo ${MESES[mes - 1]} de ${anio}`
  const ultimo = Number(sumarDias(hasta, -1).slice(8))
  return ultimo === 1
    ? `El 1 de ${MESES[mes - 1]}`
    : `Del 1 al ${ultimo} de ${MESES[mes - 1]}`
}

export interface PedidoParaPlanilla {
  numero: number
  creado: string
  pagado: string | null
  estado: OrderStatus
  directa: boolean
  totalCents: number
  nota: string | null
  items: {
    nombre: string
    variante: string | null
    cantidad: number
    precioCents: number
  }[]
}

const NOMBRE_DE_ESTADO: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  cancelado: "Cancelado",
}

/**
 * Dos hojas: "Pedidos", uno por fila, para mirar; y "Detalle", un producto
 * vendido por fila, para sumar por producto en Excel.
 */
export function hojasDePedidos(
  pedidos: PedidoParaPlanilla[],
  ahora: Date = new Date()
): Hoja[] {
  const nombreDe = (item: PedidoParaPlanilla["items"][number]) =>
    item.variante ? `${item.nombre} (${item.variante})` : item.nombre

  return [
    {
      nombre: "Pedidos",
      columnas: [
        { titulo: "Número", tipo: "entero" },
        { titulo: "Fecha", tipo: "fecha" },
        { titulo: "Hora", ancho: 7 },
        { titulo: "Tipo", ancho: 14 },
        { titulo: "Estado", ancho: 15 },
        { titulo: "Productos", ancho: 48 },
        { titulo: "Unidades", tipo: "entero" },
        { titulo: "Total (Bs)", tipo: "monto" },
        { titulo: "Pagado el", tipo: "fecha" },
        { titulo: "Nota", ancho: 40 },
      ],
      filas: pedidos.map((p) => [
        p.numero,
        diaEnBolivia(p.creado),
        formatHora(p.creado),
        p.directa ? "Venta directa" : "Tienda",
        noSeConcreto(p, ahora) ? "No concretado" : NOMBRE_DE_ESTADO[p.estado],
        p.items.map((i) => `${i.cantidad} × ${nombreDe(i)}`).join("; "),
        p.items.reduce((t, i) => t + i.cantidad, 0),
        montoParaPlanilla(p.totalCents),
        p.pagado ? diaEnBolivia(p.pagado) : null,
        p.nota,
      ]),
    },
    {
      nombre: "Detalle",
      columnas: [
        { titulo: "Número", tipo: "entero" },
        { titulo: "Fecha", tipo: "fecha" },
        { titulo: "Estado", ancho: 15 },
        { titulo: "Producto", ancho: 36 },
        { titulo: "Opción", ancho: 16 },
        { titulo: "Cantidad", tipo: "entero" },
        { titulo: "Precio (Bs)", tipo: "monto" },
        { titulo: "Subtotal (Bs)", tipo: "monto" },
      ],
      filas: pedidos.flatMap((p) =>
        p.items.map((i) => [
          p.numero,
          diaEnBolivia(p.creado),
          noSeConcreto(p, ahora) ? "No concretado" : NOMBRE_DE_ESTADO[p.estado],
          i.nombre,
          i.variante,
          i.cantidad,
          montoParaPlanilla(i.precioCents),
          montoParaPlanilla(i.precioCents * i.cantidad),
        ])
      ),
    },
  ]
}

export interface ProductoParaPlanilla {
  nombre: string
  categoria: string | null
  precioCents: number
  ofertaCents: number | null
  costoCents: number | null
  stock: number
  visible: boolean
  destacado: boolean
  descripcion: string | null
  codigo: string | null
  enlace: string
  /** Si tiene tallas o colores, una fila por cada una. */
  variantes: {
    nombre: string
    precioCents: number | null
    stock: number
    codigo: string | null
  }[]
}

/** Una fila por producto, y una por opción si tiene tallas o colores. */
export function hojaDeProductos(productos: ProductoParaPlanilla[]): Hoja {
  return {
    nombre: "Productos",
    columnas: [
      { titulo: "Nombre", ancho: 36 },
      { titulo: "Opción", ancho: 16 },
      { titulo: "Categoría", ancho: 18 },
      { titulo: "Precio (Bs)", tipo: "monto" },
      { titulo: "Precio anterior (Bs)", tipo: "monto" },
      { titulo: "Costo (Bs)", tipo: "monto" },
      { titulo: "Stock", tipo: "entero" },
      { titulo: "Visible", ancho: 9 },
      { titulo: "Destacado", ancho: 11 },
      { titulo: "Código", ancho: 14 },
      { titulo: "Descripción", ancho: 48 },
      { titulo: "Enlace", ancho: 48 },
    ],
    filas: productos.flatMap((p) => {
      const fila = (
        opcion: string | null,
        precioCents: number,
        stock: number,
        codigo: string | null
      ) => [
        p.nombre,
        opcion,
        p.categoria,
        montoParaPlanilla(precioCents),
        p.ofertaCents !== null && p.ofertaCents > precioCents
          ? montoParaPlanilla(p.ofertaCents)
          : null,
        p.costoCents === null ? null : montoParaPlanilla(p.costoCents),
        stock,
        p.visible ? "Sí" : "No",
        p.destacado ? "Sí" : "No",
        codigo,
        p.descripcion,
        p.enlace,
      ]
      return p.variantes.length
        ? p.variantes.map((v) =>
            fila(
              v.nombre,
              v.precioCents ?? p.precioCents,
              v.stock,
              v.codigo ?? p.codigo
            )
          )
        : [fila(null, p.precioCents, p.stock, p.codigo)]
    }),
  }
}

/** "pedidos-rosa-deportes-octubre-2026.xlsx" */
export function nombreDeArchivo(que: string, tienda: string, cuando: string) {
  return `${que}-${tienda}-${cuando}.xlsx`
}

export const TIPO_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
