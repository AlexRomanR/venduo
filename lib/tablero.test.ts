import { describe, expect, it } from "vitest"

import { columnas, diasVacios, totales, variacion } from "@/lib/tablero"

const dia = (
  fecha: string,
  ventasCents: number,
  pedidos: number,
  gananciaCents = 0,
  ventasConCostoCents = 0
) => ({ dia: fecha, ventasCents, pedidos, gananciaCents, ventasConCostoCents })

describe("totales", () => {
  it("suma, redondea el ticket y elige el mejor día", () => {
    const resultado = totales([
      dia("2026-10-21", 10000, 3),
      dia("2026-10-22", 25000, 1),
      dia("2026-10-23", 0, 0),
    ])
    expect(resultado.ventasCents).toBe(35000)
    expect(resultado.pedidos).toBe(4)
    expect(resultado.ticketCents).toBe(8750)
    expect(resultado.mejorDia?.dia).toBe("2026-10-22")
  })

  it("sin pedidos no hay ticket ni mejor día", () => {
    const resultado = totales([dia("2026-10-23", 0, 0)])
    expect(resultado.ticketCents).toBeNull()
    expect(resultado.mejorDia).toBeNull()
  })

  it("la ganancia es parcial si algo vendido no tenía costo", () => {
    const parcial = totales([dia("2026-10-23", 10000, 2, 3000, 6000)])
    expect(parcial.gananciaCents).toBe(3000)
    expect(parcial.gananciaParcial).toBe(true)

    const completa = totales([dia("2026-10-23", 10000, 2, 3000, 10000)])
    expect(completa.gananciaParcial).toBe(false)
  })

  it("sin costos cargados no hay ganancia que decir", () => {
    expect(totales([dia("2026-10-23", 10000, 2)]).gananciaCents).toBeNull()
  })
})

describe("variacion", () => {
  it("es el cambio en por ciento, redondeado", () => {
    expect(variacion(150, 100)).toBe(50)
    expect(variacion(50, 100)).toBe(-50)
    expect(variacion(1, 3)).toBe(-67)
  })

  it("subir desde cero no es un porcentaje", () => {
    expect(variacion(100, 0)).toBeNull()
  })
})

describe("diasVacios y columnas", () => {
  it("la serie termina hoy", () => {
    expect(diasVacios("2026-10-23", 3).map((d) => d.dia)).toEqual([
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
    ])
  })

  it("en 90 días agrupa por semana y la última termina hoy", () => {
    const serie = diasVacios("2026-10-23", 90)
    const semanas = columnas(serie)
    expect(semanas).toHaveLength(13)
    expect(semanas.at(-1)?.hasta).toBe("2026-10-23")
    expect(semanas[0].desde).toBe(serie[0].dia)
  })
})
