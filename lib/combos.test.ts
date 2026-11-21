import { describe, expect, it } from "vitest"

import {
  agotadosDelCombo,
  ahorroDelCombo,
  claveDeCombo,
  enumerar,
  esLineaDeCombo,
  idDeLineaDeCombo,
  topeDeCombos,
} from "@/lib/combos"

const combo = {
  catalogo: "tok",
  id: "verano",
  partes: [
    { productoId: "polera", nombre: "Polera" },
    {
      productoId: "short",
      varianteId: "short-32",
      nombre: "Short",
      variante: "32",
    },
  ],
}

describe("claveDeCombo", () => {
  it("el mismo combo con las mismas tallas es la misma línea", () => {
    expect(claveDeCombo(combo)).toBe(claveDeCombo({ ...combo }))
  })

  it("con otra talla es otra línea", () => {
    const otro = {
      ...combo,
      partes: [combo.partes[0], { ...combo.partes[1], varianteId: "short-34" }],
    }
    expect(claveDeCombo(otro)).not.toBe(claveDeCombo(combo))
  })

  it("no se confunde con la de un producto", () => {
    expect(esLineaDeCombo({ productoId: idDeLineaDeCombo(combo) })).toBe(true)
    expect(esLineaDeCombo({ productoId: "polera" })).toBe(false)
  })
})

describe("topeDeCombos", () => {
  it("lo pone el producto que menos tiene", () => {
    expect(
      topeDeCombos([
        { productoId: "a", nombre: "A", stock: 5 },
        { productoId: "b", nombre: "B", stock: 2 },
      ])
    ).toBe(2)
  })

  it("un producto que va dos veces cuenta dos veces", () => {
    expect(
      topeDeCombos([
        { productoId: "a", nombre: "A", stock: 5 },
        { productoId: "a", nombre: "A", stock: 5 },
      ])
    ).toBe(2)
  })

  it("cuenta la talla elegida, no el producto", () => {
    expect(
      topeDeCombos([
        { productoId: "a", varianteId: "a-m", nombre: "A", stock: 1 },
        { productoId: "a", varianteId: "a-l", nombre: "A", stock: 3 },
      ])
    ).toBe(1)
  })

  it("sin stock, cero", () => {
    expect(topeDeCombos([{ productoId: "a", nombre: "A", stock: 0 }])).toBe(0)
    expect(topeDeCombos([])).toBe(0)
  })
})

describe("agotadosDelCombo", () => {
  it("nombra los que no alcanzan para un combo, sin repetir", () => {
    expect(
      agotadosDelCombo([
        { productoId: "a", nombre: "Polera", stock: 3 },
        { productoId: "b", nombre: "Short", stock: 0 },
        { productoId: "c", nombre: "Gorra", stock: 1 },
        { productoId: "c", nombre: "Gorra", stock: 1 },
      ])
    ).toEqual(["Short", "Gorra"])
  })
})

describe("ahorroDelCombo", () => {
  it("lo que se ahorra y su porcentaje", () => {
    expect(ahorroDelCombo(25000, 33000)).toEqual({
      cents: 8000,
      porcentaje: 24,
    })
  })

  it("sin ahorro no hay nada que mostrar", () => {
    expect(ahorroDelCombo(33000, 33000)).toBeNull()
    expect(ahorroDelCombo(40000, 33000)).toBeNull()
    expect(ahorroDelCombo(0, 33000)).toBeNull()
  })
})

describe("enumerar", () => {
  it("como se dice en castellano", () => {
    expect(enumerar(["Short"])).toBe("Short")
    expect(enumerar(["Short", "Gorra"])).toBe("Short y Gorra")
    expect(enumerar(["Short", "Gorra", "Polera"])).toBe("Short, Gorra y Polera")
  })
})
