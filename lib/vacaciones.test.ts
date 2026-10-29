import { describe, expect, it } from "vitest"

import {
  deVacaciones,
  diaEnPalabras,
  fechaDeVueltaValida,
  textoDeVuelta,
} from "@/lib/vacaciones"

describe("deVacaciones", () => {
  const desde = "2026-10-20T15:00:00Z"

  it("sin haberlas empezado, no está de vacaciones", () => {
    expect(deVacaciones({ desde: null, hasta: null })).toBe(false)
  })

  it("sin fecha de vuelta, está de vacaciones hasta que las corte", () => {
    expect(
      deVacaciones({ desde, hasta: null }, new Date("2027-06-01T12:00:00Z"))
    ).toBe(true)
  })

  it("el día de su vuelta, en Bolivia, ya recibe pedidos", () => {
    const hasta = "2026-11-05"
    // Las 03:59 UTC del 5 todavía son las 23:59 del 4 en La Paz.
    expect(
      deVacaciones({ desde, hasta }, new Date("2026-11-05T03:59:00Z"))
    ).toBe(true)
    expect(
      deVacaciones({ desde, hasta }, new Date("2026-11-05T04:00:00Z"))
    ).toBe(false)
  })
})

describe("fechaDeVueltaValida", () => {
  const ahora = new Date("2026-10-23T15:00:00Z")

  it("desde mañana y hasta un año", () => {
    expect(fechaDeVueltaValida("2026-10-23", ahora)).toBe(false)
    expect(fechaDeVueltaValida("2026-10-24", ahora)).toBe(true)
    expect(fechaDeVueltaValida("2027-10-23", ahora)).toBe(true)
    expect(fechaDeVueltaValida("2027-10-24", ahora)).toBe(false)
    expect(fechaDeVueltaValida("24/10/2026", ahora)).toBe(false)
  })
})

describe("textoDeVuelta", () => {
  const ahora = new Date("2026-10-23T15:00:00Z")

  it("dice el día de la semana, y el año solo si no es este", () => {
    expect(diaEnPalabras("2026-11-02", ahora)).toBe("lunes 2 de noviembre")
    expect(diaEnPalabras("2027-01-04", ahora)).toBe("lunes 4 de enero de 2027")
    expect(textoDeVuelta("2026-11-02", ahora)).toBe(
      "Volvemos el lunes 2 de noviembre."
    )
    expect(textoDeVuelta(null, ahora)).toBe("Volvemos pronto.")
  })
})
