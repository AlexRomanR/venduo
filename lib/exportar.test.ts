import { describe, expect, it } from "vitest"

import {
  hojaDeProductos,
  hojasDePedidos,
  limitesDe,
  textoDePeriodo,
} from "@/lib/exportar"
import { inicioDelDia } from "@/lib/format"

describe("limitesDe", () => {
  // Las 02:00 UTC del 1 de noviembre todavía son las 22:00 del 31 de octubre.
  const ahora = new Date("2026-11-01T02:00:00Z")

  it("este mes se cuenta en Bolivia, no en UTC", () => {
    expect(limitesDe("este-mes", ahora)).toEqual({
      desde: "2026-10-01",
      hasta: "2026-11-01",
      nombre: "octubre-2026",
    })
  })

  it("el mes pasado de enero es diciembre del año anterior", () => {
    expect(limitesDe("mes-pasado", new Date("2027-01-15T15:00:00Z"))).toEqual({
      desde: "2026-12-01",
      hasta: "2027-01-01",
      nombre: "diciembre-2026",
    })
  })

  it("todo no tiene límites", () => {
    expect(limitesDe("todo", ahora)).toEqual({
      desde: null,
      hasta: null,
      nombre: "todo",
    })
  })

  it("dice qué cubre cada período", () => {
    const hoy = new Date("2026-10-23T15:00:00Z")
    expect(textoDePeriodo("este-mes", hoy)).toBe("Del 1 al 23 de octubre")
    expect(textoDePeriodo("mes-pasado", hoy)).toBe("Todo septiembre de 2026")
    expect(textoDePeriodo("todo", hoy)).toBe("Desde tu primer pedido")
    expect(textoDePeriodo("este-mes", new Date("2026-10-01T15:00:00Z"))).toBe(
      "El 1 de octubre"
    )
  })

  it("un día empieza a las 04:00 UTC", () => {
    expect(inicioDelDia("2026-10-01")).toBe("2026-10-01T04:00:00.000Z")
  })
})

describe("hojasDePedidos", () => {
  const ahora = new Date("2026-10-23T15:00:00Z")
  const [pedidos, detalle] = hojasDePedidos(
    [
      {
        numero: 291,
        creado: "2026-10-23T02:30:00Z",
        pagado: null,
        estado: "pendiente",
        directa: false,
        totalCents: 38500,
        nota: "Pagó la mitad",
        items: [
          {
            nombre: "Buzo",
            variante: "M · Negro",
            cantidad: 2,
            precioCents: 15000,
          },
          { nombre: "Gorra", variante: null, cantidad: 1, precioCents: 8500 },
        ],
      },
      {
        numero: 280,
        creado: "2026-10-01T15:00:00Z",
        pagado: null,
        estado: "pendiente",
        directa: true,
        totalCents: 1000,
        nota: null,
        items: [
          { nombre: "Gorra", variante: null, cantidad: 1, precioCents: 1000 },
        ],
      },
    ],
    ahora
  )

  it("una fila por pedido, con la fecha en Bolivia y los montos en Bs", () => {
    expect(pedidos.filas[0]).toEqual([
      291,
      "2026-10-22",
      "22:30",
      "Tienda",
      "Pendiente",
      "2 × Buzo (M · Negro); 1 × Gorra",
      3,
      385,
      null,
      "Pagó la mitad",
    ])
  })

  it("un pendiente viejo sale como no concretado", () => {
    expect(pedidos.filas[1][3]).toBe("Venta directa")
    expect(pedidos.filas[1][4]).toBe("No concretado")
  })

  it("el detalle tiene un producto por fila, con su subtotal", () => {
    expect(detalle.filas).toHaveLength(3)
    expect(detalle.filas[0]).toEqual([
      291,
      "2026-10-22",
      "Pendiente",
      "Buzo",
      "M · Negro",
      2,
      150,
      300,
    ])
  })
})

describe("hojaDeProductos", () => {
  const base = {
    nombre: "Buzo",
    categoria: "Ropa",
    precioCents: 18000,
    ofertaCents: 20000,
    costoCents: 9000,
    stock: 5,
    visible: true,
    destacado: false,
    descripcion: null,
    codigo: "BZ-1",
    enlace: "https://venduo.bo/t/rosa/p/1",
  }

  it("sin tallas, una fila", () => {
    const hoja = hojaDeProductos([{ ...base, variantes: [] }])
    expect(hoja.filas).toEqual([
      [
        "Buzo",
        null,
        "Ropa",
        180,
        200,
        90,
        5,
        "Sí",
        "No",
        "BZ-1",
        null,
        base.enlace,
      ],
    ])
  })

  it("con tallas, una fila por cada una, con su precio si es distinto", () => {
    const hoja = hojaDeProductos([
      {
        ...base,
        variantes: [
          { nombre: "M", precioCents: null, stock: 2, codigo: null },
          { nombre: "L", precioCents: 21000, stock: 3, codigo: "BZ-L" },
        ],
      },
    ])
    expect(hoja.filas.map((f) => [f[1], f[3], f[4], f[6], f[9]])).toEqual([
      ["M", 180, 200, 2, "BZ-1"],
      // El precio anterior no se muestra si no es mayor que el precio.
      ["L", 210, null, 3, "BZ-L"],
    ])
  })
})
