import { describe, expect, it } from "vitest"

import {
  combinaciones,
  cuantasVariantes,
  hayStockDe,
  leerOpciones,
  mismaCombinacion,
  nombreDeVariante,
  ordenarValores,
  rangoDePrecio,
  tipoDe,
  tipoSugerido,
  varianteDe,
} from "@/lib/variantes"

const talla = { nombre: "Talla", valores: ["S", "M"] }
const color = { nombre: "Color", valores: ["Negro", "Blanco"] }

describe("combinaciones", () => {
  it("arma una por cada par, en el orden de las opciones", () => {
    expect(combinaciones([talla, color])).toEqual([
      { Talla: "S", Color: "Negro" },
      { Talla: "S", Color: "Blanco" },
      { Talla: "M", Color: "Negro" },
      { Talla: "M", Color: "Blanco" },
    ])
    expect(cuantasVariantes([talla, color])).toBe(4)
  })

  it("sin opciones no hay variantes", () => {
    expect(combinaciones([])).toEqual([])
    expect(cuantasVariantes([])).toBe(0)
  })
})

describe("nombreDeVariante", () => {
  it("sigue el orden de las opciones, no el de los valores", () => {
    expect(
      nombreDeVariante([talla, color], { Color: "Negro", Talla: "M" })
    ).toBe("M · Negro")
  })
})

describe("mismaCombinacion y varianteDe", () => {
  const variantes = [
    { id: "a", valores: { Talla: "S", Color: "Negro" } },
    { id: "b", valores: { Talla: "M", Color: "Negro" } },
  ]

  it("no depende del orden de las claves", () => {
    expect(
      mismaCombinacion(
        { Talla: "S", Color: "Negro" },
        { Color: "Negro", Talla: "S" }
      )
    ).toBe(true)
  })

  it("una combinación incompleta no es la misma", () => {
    expect(
      mismaCombinacion({ Talla: "S" }, { Talla: "S", Color: "Negro" })
    ).toBe(false)
    expect(varianteDe(variantes, { Talla: "M" })).toBeNull()
  })

  it("encuentra la variante de una combinación completa", () => {
    expect(varianteDe(variantes, { Color: "Negro", Talla: "M" })?.id).toBe("b")
  })
})

describe("hayStockDe", () => {
  const variantes = [
    { valores: { Talla: "L", Color: "Negro" }, stock: 0 },
    { valores: { Talla: "L", Color: "Blanco" }, stock: 3 },
  ]

  it("tacha la L si la L del color elegido se agotó", () => {
    expect(hayStockDe(variantes, "Talla", "L", { Color: "Negro" })).toBe(false)
    expect(hayStockDe(variantes, "Talla", "L", { Color: "Blanco" })).toBe(true)
  })

  it("sin color elegido, la L tiene stock si alguna lo tiene", () => {
    expect(hayStockDe(variantes, "Talla", "L", {})).toBe(true)
  })
})

describe("rangoDePrecio", () => {
  it("una variante sin precio propio cuesta lo del producto", () => {
    expect(
      rangoDePrecio(10000, [{ precioCents: null }, { precioCents: 12000 }])
    ).toEqual({ desde: 10000, hasta: 12000 })
  })

  it("sin variantes, el precio del producto", () => {
    expect(rangoDePrecio(10000, [])).toEqual({ desde: 10000, hasta: 10000 })
  })
})

describe("leerOpciones", () => {
  it("descarta lo que no tiene forma de opción", () => {
    expect(
      leerOpciones([
        { nombre: "Talla", valores: ["S", 3, "M"] },
        { nombre: "Vacía", valores: [] },
        { valores: ["X"] },
        "texto",
      ])
    ).toEqual([{ nombre: "Talla", valores: ["S", "M"] }])
    expect(leerOpciones(null)).toEqual([])
  })
})

describe("tipoSugerido", () => {
  it("reconoce el comienzo de cada palabra, con o sin tildes", () => {
    expect(tipoSugerido("Buzos")?.nombre).toBe("Talla")
    expect(tipoSugerido("Pantalones de jean")?.nombre).toBe("Talla")
    expect(tipoSugerido("Botines")?.nombre).toBe("Número")
    expect(tipoSugerido("Perfumes y lociones")?.nombre).toBe("Tamaño")
    expect(tipoSugerido("Lociónes")?.nombre).toBe("Tamaño")
  })

  it("calzado gana a deportivo", () => {
    expect(tipoSugerido("Zapatillas deportivas")?.nombre).toBe("Número")
  })

  it("no confunde una palabra que solo contiene la raíz", () => {
    expect(tipoSugerido("Laptops")).toBeNull()
    expect(tipoSugerido("Tops")?.nombre).toBe("Talla")
  })

  it("sin categoría o desconocida, nada", () => {
    expect(tipoSugerido(null)).toBeNull()
    expect(tipoSugerido("Celulares")).toBeNull()
  })
})

describe("ordenarValores", () => {
  it("los de la lista en su orden y los escritos al final", () => {
    expect(
      ordenarValores(tipoDe({ nombre: "talla" }), ["XL", "Única", "S"])
    ).toEqual(["S", "XL", "Única"])
  })
})
