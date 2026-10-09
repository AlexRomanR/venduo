import { NOMBRES_DE_ORIGEN, ORIGENES, type Origen } from "@/lib/visitas"

/**
 * Las visitas de una tienda, contadas: lo mismo para el panel del
 * administrador y para el del emprendedor, así los dos ven los mismos números.
 *
 * Sin dependencias de servidor: recibe las filas ya leídas.
 */

export interface FilaDeVisitas {
  day: string
  kind: string
  source: string
  product_id: string
  visits: number
  visitors: number
}

export interface ResumenDeVisitas {
  dias: number
  visitas: number
  visitantes: number
  serie: { dia: string; visitas: number; visitantes: number }[]
  origenes: { origen: Origen; nombre: string; visitas: number }[]
  /** Visitantes → vieron un producto → al carrito → pedido → pagado. */
  recorrido: { etapa: string; cantidad: number }[]
  productos: {
    id: string
    nombre: string
    vistas: number
    vendidos: number
  }[]
  /** Lo que se mira y no se compra: pide revisar precio, foto o descripción. */
  muyVistosPocoVendidos: {
    id: string
    nombre: string
    vistas: number
    vendidos: number
  }[]
  /** Las vistas de cada producto, todos: la lista de Productos las muestra. */
  vistasPorProducto: Record<string, number>
  /** Todos los muy vistos y poco vendidos, para filtrar la lista. */
  idsMuyVistosPocoVendidos: string[]
}

const SIN_PRODUCTO = "00000000-0000-0000-0000-000000000000"
const PAGINAS = new Set(["portada", "catalogo", "producto"])

/** Los días de Bolivia, del más viejo al de hoy. */
export function diasHastaHoy(dias: number, hoy: string): string[] {
  const base = new Date(`${hoy}T12:00:00Z`)
  return Array.from({ length: dias }, (_, i) => {
    const d = new Date(base)
    d.setUTCDate(base.getUTCDate() - (dias - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

export function resumirVisitas(
  filas: FilaDeVisitas[],
  {
    dias,
    hoy,
    nombres,
    vendidos,
    pagados,
  }: {
    dias: number
    hoy: string
    /** El nombre de cada producto, por id. */
    nombres: Record<string, string>
    /** Unidades vendidas (pagadas) de cada producto en el mismo período. */
    vendidos: Record<string, number>
    /** Pedidos pagados en el período. */
    pagados: number
  }
): ResumenDeVisitas {
  const calendario = diasHastaHoy(dias, hoy)
  const porDia = new Map(
    calendario.map((dia) => [dia, { dia, visitas: 0, visitantes: 0 }])
  )
  const porOrigen = new Map<Origen, number>()
  const porProducto = new Map<string, number>()
  const porTipo = new Map<string, number>()
  let visitas = 0
  let visitantes = 0

  for (const fila of filas) {
    const dia = porDia.get(fila.day)
    if (!dia) continue
    porTipo.set(fila.kind, (porTipo.get(fila.kind) ?? 0) + fila.visits)
    visitantes += fila.visitors
    dia.visitantes += fila.visitors

    if (!PAGINAS.has(fila.kind)) continue
    visitas += fila.visits
    dia.visitas += fila.visits
    const origen = fila.source as Origen
    porOrigen.set(origen, (porOrigen.get(origen) ?? 0) + fila.visits)
    if (fila.kind === "producto" && fila.product_id !== SIN_PRODUCTO) {
      porProducto.set(
        fila.product_id,
        (porProducto.get(fila.product_id) ?? 0) + fila.visits
      )
    }
  }

  const productos = [...porProducto.entries()]
    .filter(([id]) => nombres[id])
    .map(([id, vistas]) => ({
      id,
      nombre: nombres[id],
      vistas,
      vendidos: vendidos[id] ?? 0,
    }))
    .sort((a, b) => b.vistas - a.vistas)
  // Diez vistas o más y casi ninguna venta: con menos vistas todavía no dice
  // nada, y un producto que vende no es el problema.
  const muyVistos = productos.filter(
    (p) => p.vistas >= 10 && p.vendidos <= p.vistas * 0.02
  )

  return {
    dias,
    visitas,
    visitantes,
    serie: [...porDia.values()],
    origenes: ORIGENES.map((origen) => ({
      origen,
      nombre: NOMBRES_DE_ORIGEN[origen],
      visitas: porOrigen.get(origen) ?? 0,
    }))
      .filter((o) => o.visitas > 0)
      .sort((a, b) => b.visitas - a.visitas),
    recorrido: [
      { etapa: "Visitantes", cantidad: visitantes },
      { etapa: "Vieron un producto", cantidad: porTipo.get("producto") ?? 0 },
      { etapa: "Agregaron al carrito", cantidad: porTipo.get("carrito") ?? 0 },
      { etapa: "Mandaron el pedido", cantidad: porTipo.get("pedido") ?? 0 },
      { etapa: "Pagados", cantidad: pagados },
    ],
    productos: productos.slice(0, 10),
    muyVistosPocoVendidos: muyVistos.slice(0, 5),
    vistasPorProducto: Object.fromEntries(porProducto),
    idsMuyVistosPocoVendidos: muyVistos.map((p) => p.id),
  }
}
