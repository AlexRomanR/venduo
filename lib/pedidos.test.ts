import { describe, expect, it } from "vitest"

import {
  enlaceDeWhatsApp,
  grupoDeFecha,
  mensajeDePedido,
  noSeConcreto,
  numeroDeWhatsApp,
  SIGUIENTES,
  tituloDePedido,
} from "@/lib/pedidos"

describe("numeroDeWhatsApp", () => {
  it("le pone el 591 a un celular de Bolivia", () => {
    expect(numeroDeWhatsApp("70145823")).toBe("59170145823")
    expect(numeroDeWhatsApp("61234567")).toBe("59161234567")
  })

  it("ignora espacios, guiones y paréntesis", () => {
    expect(numeroDeWhatsApp("701 458 23")).toBe("59170145823")
    expect(numeroDeWhatsApp("(701)-45823")).toBe("59170145823")
  })

  it("deja como está un número que ya trae su código", () => {
    expect(numeroDeWhatsApp("+591 70145823")).toBe("59170145823")
    expect(numeroDeWhatsApp("5491123456789")).toBe("5491123456789")
  })

  it("no toca lo que no es un celular de Bolivia", () => {
    expect(numeroDeWhatsApp("22123456")).toBe("22123456")
    expect(numeroDeWhatsApp("7014582")).toBe("7014582")
  })
})

describe("enlaceDeWhatsApp", () => {
  it("abre el chat de la tienda con el mensaje codificado", () => {
    expect(enlaceDeWhatsApp("70145823", "Hola & chau")).toBe(
      "https://wa.me/59170145823?text=Hola%20%26%20chau"
    )
  })
})

describe("mensajeDePedido", () => {
  it("lleva el número, cada línea con su variante y el total", () => {
    const mensaje = mensajeDePedido({
      numero: 42,
      tienda: "Rosa Deportes",
      lineas: [
        {
          nombre: "Buzo",
          variante: "M · Negro",
          cantidad: 2,
          totalCents: 30000,
        },
        { nombre: "Gorra", cantidad: 1, totalCents: 8500 },
      ],
      totalCents: 38500,
    })
    // `Intl` separa "Bs" del monto con un espacio que no siempre es el común.
    expect(mensaje.replace(/\s/g, " ")).toBe(
      [
        "Hola Rosa Deportes, quiero hacer este pedido (#42):",
        "",
        "· 2× Buzo (M · Negro) — Bs 300",
        "· 1× Gorra — Bs 85",
        "",
        "Total: Bs 385",
      ].join(" ")
    )
  })
})

describe("SIGUIENTES", () => {
  it("es lo que permite el disparador de la base", () => {
    expect(SIGUIENTES).toEqual({
      pendiente: ["pagado", "cancelado"],
      pagado: ["cancelado"],
      cancelado: [],
    })
  })
})

describe("noSeConcreto", () => {
  const ahora = new Date("2026-10-23T12:00:00Z")

  it("un pendiente de hace más de 7 días ya no se concretó", () => {
    expect(
      noSeConcreto(
        { estado: "pendiente", creado: "2026-10-16T11:59:59+00:00" },
        ahora
      )
    ).toBe(true)
  })

  it("un pendiente de justo 7 días todavía cuenta", () => {
    expect(
      noSeConcreto(
        { estado: "pendiente", creado: "2026-10-16T12:00:00Z" },
        ahora
      )
    ).toBe(false)
  })

  it("un pagado nunca queda como no concretado", () => {
    expect(
      noSeConcreto({ estado: "pagado", creado: "2026-01-01T00:00:00Z" }, ahora)
    ).toBe(false)
  })
})

describe("grupoDeFecha", () => {
  it("cuenta los días en hora de Bolivia, no en UTC", () => {
    // Las 02:00 UTC del 23 son las 22:00 del 22 en La Paz.
    const ahora = new Date("2026-10-23T02:00:00Z")
    expect(grupoDeFecha("2026-10-22T13:00:00Z", ahora)).toBe("Hoy")
    expect(grupoDeFecha("2026-10-21T20:00:00Z", ahora)).toBe("Ayer")
  })

  it("agrupa por semana, mes y antes", () => {
    const ahora = new Date("2026-10-23T15:00:00Z")
    expect(grupoDeFecha("2026-10-18T15:00:00Z", ahora)).toBe("Esta semana")
    expect(grupoDeFecha("2026-10-01T15:00:00Z", ahora)).toBe("Este mes")
    expect(grupoDeFecha("2026-08-01T15:00:00Z", ahora)).toBe("Antes")
  })
})

describe("tituloDePedido", () => {
  it("nombra lo que se pidió cuando no se sabe quién compró", () => {
    expect(
      tituloDePedido({
        comprador: null,
        items: [
          { nombre: "Polera", cantidad: 2 },
          { nombre: "Gorra", cantidad: 1 },
        ],
      })
    ).toBe("2× Polera y 1 más")
    expect(tituloDePedido({ comprador: null, items: [] })).toBe(
      "Pedido por WhatsApp"
    )
    expect(tituloDePedido({ comprador: "Ana", items: [] })).toBe("Ana")
  })
})
