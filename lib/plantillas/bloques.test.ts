import { describe, expect, it } from "vitest"

import { descuento } from "@/lib/plantillas/bloques"
import type { Product } from "@/types"

const producto = (precio: number, antes: number | null) =>
  ({ price_cents: precio, compare_at_price_cents: antes }) as Product

describe("descuento", () => {
  it("es el porcentaje entero de rebaja sobre el precio anterior", () => {
    expect(descuento(producto(8000, 10000))).toBe(20)
    expect(descuento(producto(6666, 10000))).toBe(33)
  })

  it("no hay descuento sin precio anterior, o si no es más alto", () => {
    expect(descuento(producto(8000, null))).toBeNull()
    expect(descuento(producto(8000, 8000))).toBeNull()
    expect(descuento(producto(8000, 7000))).toBeNull()
  })
})
