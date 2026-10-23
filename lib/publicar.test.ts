import { describe, expect, it } from "vitest"

import { rebajaDe } from "@/lib/publicar"

const rebaja = (precioCents: number, precioAnteriorCents: number | null) =>
  rebajaDe({ precioCents, precioAnteriorCents })

describe("rebajaDe", () => {
  it("es el porcentaje entero de rebaja", () => {
    expect(rebaja(45000, 52000)).toBe(13)
    expect(rebaja(5000, 10000)).toBe(50)
  })

  it("no dice una rebaja de menos de 1 %", () => {
    expect(rebaja(9960, 10000)).toBeNull()
  })

  it("no hay rebaja sin precio anterior más alto", () => {
    expect(rebaja(5000, null)).toBeNull()
    expect(rebaja(5000, 5000)).toBeNull()
    expect(rebaja(5000, 4000)).toBeNull()
  })
})
