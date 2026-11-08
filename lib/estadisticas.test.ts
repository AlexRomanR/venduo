import { describe, expect, it } from "vitest"

import {
  cuantosSeCobran,
  diaDeLaSemana,
  diaFuerte,
  loQueMasDeja,
  limiteParaJuzgar,
  loQueNoSeMueve,
  porDiaDeLaSemana,
  type LineaVendida,
} from "@/lib/estadisticas"
import { armarSerie } from "@/lib/tablero"

const dia = (fecha: string, ventasCents: number, pedidos = 1) => ({
  dia: fecha,
  ventasCents,
  pedidos,
  gananciaCents: 0,
  ventasConCostoCents: 0,
})

describe("diaDeLaSemana", () => {
  it("pone el lunes en cero y el domingo en seis", () => {
    expect(diaDeLaSemana("2026-11-02")).toBe(0) // lunes
    expect(diaDeLaSemana("2026-11-07")).toBe(5) // sábado
    expect(diaDeLaSemana("2026-11-08")).toBe(6) // domingo
  })
})

describe("porDiaDeLaSemana", () => {
  it("promedia cada día por las veces que aparece, redondeado", () => {
    const semana = porDiaDeLaSemana([
      dia("2026-11-02", 1000), // lunes
      dia("2026-11-09", 0, 0), // lunes
      dia("2026-11-16", 501), // lunes
      dia("2026-11-07", 9000), // sábado
    ])
    expect(semana[0].promedioCents).toBe(500) // 1501 / 3 = 500,33
    expect(semana[0].dias).toBe(3)
    expect(semana[5].promedioCents).toBe(9000)
    expect(semana[1]).toMatchObject({ promedioCents: 0, dias: 0 })
    expect(diaFuerte(semana)?.nombre).toBe("sábado")
  })

  it("sin ventas no hay día fuerte", () => {
    expect(diaFuerte(porDiaDeLaSemana([dia("2026-11-02", 0, 0)]))).toBeNull()
  })
})

describe("cuantosSeCobran", () => {
  const ahora = new Date("2026-11-08T12:00:00Z")
  it("separa el pendiente vencido del que todavía se puede cobrar", () => {
    const cobros = cuantosSeCobran(
      [
        { estado: "pagado", creado: "2026-11-01T10:00:00Z" },
        { estado: "pagado", creado: "2026-11-07T10:00:00Z" },
        { estado: "cancelado", creado: "2026-11-05T10:00:00Z" },
        { estado: "pendiente", creado: "2026-11-07T10:00:00Z" },
        { estado: "pendiente", creado: "2026-10-20T10:00:00Z" },
      ],
      ahora
    )
    expect(cobros).toEqual({
      llegaron: 5,
      cobrados: 2,
      porCobrar: 1,
      noConcretados: 1,
      cancelados: 1,
    })
  })
})

const linea = (
  productoId: string | null,
  cantidad: number,
  precioCents: number,
  costoCents: number | null,
  creado = "2026-11-05T15:00:00Z"
): LineaVendida => ({
  productoId,
  nombre: productoId ?? "Borrado",
  foto: null,
  cantidad,
  precioCents,
  costoCents,
  creado,
})

describe("loQueMasDeja", () => {
  it("ordena por ganancia cuando todo tiene costo", () => {
    const { porGanancia, productos } = loQueMasDeja(
      [
        linea("a", 10, 1000, 900), // gana 1.000, vende 10.000
        linea("b", 2, 5000, 2000), // gana 6.000, vende 10.000
        linea("a", 1, 1000, 900),
      ],
      "2026-11-01"
    )
    expect(porGanancia).toBe(true)
    expect(productos.map((p) => p.id)).toEqual(["b", "a"])
    expect(productos[1]).toMatchObject({
      unidades: 11,
      montoCents: 11000,
      gananciaCents: 1100,
    })
  })

  it("con una venta sin costo ordena por monto y no inventa ganancia", () => {
    const { porGanancia, productos } = loQueMasDeja(
      [linea("a", 1, 9000, null), linea("b", 1, 3000, 1000)],
      "2026-11-01"
    )
    expect(porGanancia).toBe(false)
    expect(productos[0]).toMatchObject({ id: "a", gananciaCents: null })
  })

  it("deja fuera lo vendido antes del período y agrupa un producto borrado por nombre", () => {
    const { productos } = loQueMasDeja(
      [
        linea("a", 5, 1000, 100, "2026-10-01T15:00:00Z"),
        linea(null, 1, 700, 100),
        linea(null, 2, 700, 100),
      ],
      "2026-11-01"
    )
    expect(productos).toHaveLength(1)
    expect(productos[0]).toMatchObject({ id: null, unidades: 3 })
  })
})

describe("loQueNoSeMueve", () => {
  const producto = (
    id: string,
    stock: number,
    costoCents: number | null,
    creado = "2026-09-01T12:00:00Z"
  ) => ({
    id,
    nombre: id,
    foto: null,
    stock,
    precioCents: 1000,
    costoCents,
    creado,
  })

  it("cuenta los que tienen stock, no se vendieron y no son nuevos", () => {
    const { aCosto, valorCents, productos, recientes } = loQueNoSeMueve(
      [
        producto("quieto", 3, 400),
        producto("vendido", 3, 400),
        producto("sin-stock", 0, 400),
        producto("nuevo", 3, 400, "2026-11-05T12:00:00Z"),
        producto("otro", 1, 600),
      ],
      new Set(["vendido"]),
      "2026-11-01"
    )
    expect(aCosto).toBe(true)
    expect(productos.map((p) => p.id)).toEqual(["quieto", "otro"])
    expect(valorCents).toBe(3 * 400 + 600)
    expect(recientes).toBe(1)
  })

  it("a 90 días no deja fuera lo cargado hace más de dos semanas", () => {
    // Una tienda nueva: todo se cargó dentro de los 90 días, nada se vendió.
    const limite = limiteParaJuzgar("2026-11-08", 90)
    expect(limite).toBe("2026-10-26")
    const { productos, recientes } = loQueNoSeMueve(
      [
        producto("septiembre", 3, 400, "2026-09-15T12:00:00Z"),
        producto("octubre", 2, 400, "2026-10-08T12:00:00Z"),
        producto("ayer", 2, 400, "2026-11-07T12:00:00Z"),
      ],
      new Set(),
      limite
    )
    expect(productos.map((p) => p.id)).toEqual(["septiembre", "octubre"])
    expect(recientes).toBe(1)
  })

  it("a 7 días el límite es el período", () => {
    expect(limiteParaJuzgar("2026-11-08", 7)).toBe("2026-11-02")
  })

  it("si a uno le falta el costo, valora todo a precio de venta", () => {
    const { aCosto, valorCents } = loQueNoSeMueve(
      [producto("a", 2, 400), producto("b", 1, null)],
      new Set(),
      "2026-11-01"
    )
    expect(aCosto).toBe(false)
    expect(valorCents).toBe(3 * 1000)
  })
})

describe("armarSerie", () => {
  it("pone cada pedido en su día de Bolivia y la ganancia solo con costo", () => {
    const serie = armarSerie(
      "2026-11-08",
      [
        // 02:00 UTC del 8 son las 22:00 del 7 en Bolivia.
        { total_cents: 5000, created_at: "2026-11-08T02:00:00Z" },
        { total_cents: 3000, created_at: "2026-11-08T15:00:00Z" },
      ],
      [
        {
          quantity: 2,
          unit_price_cents: 1500,
          unit_cost_cents: 1000,
          creado: "2026-11-08T15:00:00Z",
        },
        {
          quantity: 1,
          unit_price_cents: 5000,
          unit_cost_cents: null,
          creado: "2026-11-08T02:00:00Z",
        },
      ],
      3
    )
    expect(serie.map((d) => d.dia)).toEqual([
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
    ])
    expect(serie[1]).toMatchObject({
      ventasCents: 5000,
      pedidos: 1,
      gananciaCents: 0,
    })
    expect(serie[2]).toMatchObject({
      ventasCents: 3000,
      pedidos: 1,
      gananciaCents: 1000,
      ventasConCostoCents: 3000,
    })
  })
})
