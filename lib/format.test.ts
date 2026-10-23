import { describe, expect, it } from "vitest"

import {
  aCentavos,
  diaEnBolivia,
  formatMoney,
  formatPercent,
  sumarDias,
} from "@/lib/format"

/** `Intl` separa con espacios que cambian según la versión de Node. */
const plano = (texto: string) => texto.replace(/\s/g, " ")

describe("aCentavos", () => {
  it("convierte bolivianos a centavos enteros", () => {
    expect(aCentavos(85)).toBe(8500)
    expect(aCentavos(0)).toBe(0)
  })

  it("corrige el error del punto flotante", () => {
    // 19.99 * 100 da 1998.9999999999998.
    expect(aCentavos(19.99)).toBe(1999)
    expect(aCentavos(4.35)).toBe(435)
    expect(aCentavos(0.1 + 0.2)).toBe(30)
  })
})

describe("formatMoney", () => {
  it("escribe Bs, sin decimales y con punto de miles", () => {
    expect(plano(formatMoney(8500))).toBe("Bs 85")
    expect(plano(formatMoney(850000))).toBe("Bs 8.500")
    expect(plano(formatMoney(0))).toBe("Bs 0")
  })

  it("redondea los centavos", () => {
    expect(plano(formatMoney(8550))).toBe("Bs 86")
    expect(plano(formatMoney(8549))).toBe("Bs 85")
  })
})

describe("formatPercent", () => {
  it("lee puntos básicos", () => {
    // Si lleva espacio antes del % depende de la versión de Node: no importa.
    const sinEspacios = (bps: number) => formatPercent(bps).replace(/\s/g, "")
    expect(sinEspacios(1500)).toBe("15%")
    expect(sinEspacios(1250)).toBe("12,5%")
  })
})

describe("diaEnBolivia", () => {
  it("a las 03:00 UTC todavía es el día anterior en La Paz", () => {
    expect(diaEnBolivia("2026-10-23T03:00:00Z")).toBe("2026-10-22")
    expect(diaEnBolivia("2026-10-23T04:00:00Z")).toBe("2026-10-23")
  })
})

describe("sumarDias", () => {
  it("cruza meses y años", () => {
    expect(sumarDias("2026-10-31", 1)).toBe("2026-11-01")
    expect(sumarDias("2026-01-01", -1)).toBe("2025-12-31")
    expect(sumarDias("2028-02-28", 1)).toBe("2028-02-29")
  })
})
