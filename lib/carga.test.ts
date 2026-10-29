import { describe, expect, it } from "vitest"

import {
  aplicarMapeo,
  asignarCampo,
  esFotoDeMiTienda,
  faltaEn,
  leerColumnas,
  leerEntero,
  leerPrecio,
  mapeoDeLectura,
  repetidos,
  type Lectura,
} from "@/lib/carga"

/** Qué campo quedó en cada columna, y cuáles en duda: `["nombre", "precio?"]`. */
const resumen = (lectura: Lectura) =>
  lectura.columnas.map((c) => `${c.campo ?? "—"}${c.seguro ? "" : "?"}`)

describe("leerPrecio", () => {
  it("lee los precios como se escriben en Bolivia", () => {
    expect(leerPrecio("85")).toBe(85)
    expect(leerPrecio("Bs 85")).toBe(85)
    expect(leerPrecio("85 Bs.")).toBe(85)
    expect(leerPrecio("85.-")).toBe(85)
    expect(leerPrecio("85,50")).toBe(85.5)
    expect(leerPrecio("12.5")).toBe(12.5)
    expect(leerPrecio("1.250")).toBe(1250)
    expect(leerPrecio("1.250,50")).toBe(1250.5)
    expect(leerPrecio("1,250.50")).toBe(1250.5)
    expect(leerPrecio("Bs 1.250.000")).toBe(1250000)
    expect(leerPrecio(180)).toBe(180)
  })

  it("no inventa un precio de lo que no lo es", () => {
    expect(leerPrecio("")).toBeNull()
    expect(leerPrecio("consultar")).toBeNull()
    expect(leerPrecio("1.2.3")).toBeNull()
    expect(leerPrecio("-5")).toBeNull()
    expect(leerPrecio(null)).toBeNull()
  })
})

describe("leerEntero", () => {
  it("lee el stock", () => {
    expect(leerEntero("12")).toBe(12)
    expect(leerEntero("12 u")).toBe(12)
    expect(leerEntero("12,0")).toBe(12)
    expect(leerEntero("")).toBeNull()
    expect(leerEntero("muchos")).toBeNull()
  })
})

describe("leerColumnas", () => {
  it("con encabezados conocidos, todo seguro y en su columna", () => {
    const lectura = leerColumnas([
      ["Lista de precios octubre"],
      ["Cód.", "Producto", "Cant.", "P/U", "Tipo"],
      ["A1", "Polera negra", "10", "85,50", "Ropa"],
      ["A2", "Short", "3", "90,00", "Ropa"],
      ["A3", "Gorra", "5", "55,00", "Accesorios"],
    ])
    expect(lectura.filaDeEncabezado).toBe(1)
    expect(resumen(lectura)).toEqual([
      "codigo",
      "nombre",
      "stock",
      "precio",
      "categoria",
    ])
  })

  it("sin encabezados, deduce por el contenido", () => {
    const lectura = leerColumnas([
      ["Polera negra", "Bs 85,50", "Ropa", "S, M, L"],
      ["Short deportivo", "Bs 90", "Ropa", "M, L"],
      ["Gorra", "Bs 55", "Accesorios", "Única"],
      ["Mochila", "Bs 240", "Accesorios", "Única"],
    ])
    expect(lectura.filaDeEncabezado).toBeNull()
    expect(lectura.columnas.map((c) => c.campo)).toEqual([
      "nombre",
      "precio",
      "categoria",
      "talla",
    ])
    // Textos que se repiten pueden ser categoría o no: se pregunta.
    expect(lectura.columnas[2].seguro).toBe(false)
    expect(lectura.columnas[3].seguro).toBe(true)
  })

  it("una fila por talla: el nombre se repite y sigue siendo el nombre", () => {
    const lectura = leerColumnas([
      ["Polera negra", "M", "negro", "3"],
      ["Polera negra", "L", "negro", "2"],
      ["Polera blanca", "M", "blanco", "4"],
      ["Short", "S", "azul", "1"],
    ])
    expect(lectura.columnas.map((c) => c.campo)).toEqual([
      "nombre",
      "talla",
      "color",
      "stock",
    ])
    expect(lectura.columnas[0].seguro).toBe(true)
  })

  it("una columna de enteros puede ser stock o precio: queda en duda", () => {
    const lectura = leerColumnas([
      ["Producto", "Columna rara"],
      ["Polera", "12"],
      ["Short", "8"],
      ["Gorra", "30"],
    ])
    expect(resumen(lectura)).toEqual(["nombre", "stock?"])
  })

  it("si el encabezado y el contenido se contradicen, pregunta", () => {
    const lectura = leerColumnas([
      ["Nombre", "Precio"],
      ["Polera", "S, M"],
      ["Short", "L"],
      ["Gorra", "M"],
    ])
    expect(resumen(lectura)).toEqual(["nombre", "precio?"])
  })

  it("sin encabezados: la descripción, y precio, stock y costo por sus montos", () => {
    const lectura = leerColumnas([
      [
        "x1",
        "Polera oversize",
        "Poleras",
        "Algodón peinado de 220 g",
        "Negro",
        "M",
        "85",
        "3",
        "P-001",
        "40",
      ],
      [
        "x2",
        "Buzo canguro",
        "Buzos",
        "Frisa con capucha",
        "Gris",
        "L",
        "180",
        "6",
        "B-002",
        "95",
      ],
      [
        "x3",
        "Short deportivo",
        "Shorts",
        "Tela dry fit",
        "Azul",
        "M",
        "90",
        "5",
        "S-003",
        "45",
      ],
      [
        "x4",
        "Gorra plana",
        "Accesorios",
        "Visera recta",
        "Negro",
        "",
        "55",
        "8",
        "G-004",
        "25",
      ],
      [
        "x5",
        "Zapatilla urbana",
        "Calzado",
        "Suela de goma",
        "Blanco",
        "40",
        "350",
        "2",
        "Z-005",
        "210",
      ],
      [
        "x6",
        "Medias pack",
        "Accesorios",
        "Pack de tres pares",
        "Blanco",
        "",
        "30",
        "12",
        "M-006",
        "12",
      ],
    ])
    expect(lectura.columnas.map((c) => c.campo)).toEqual([
      "codigo",
      "nombre",
      "categoria",
      "descripcion",
      "color",
      "talla",
      "precio",
      "stock",
      "codigo",
      "costo",
    ])
  })

  it("la persona decide una columna: queda segura, y libera la otra", () => {
    const lectura = leerColumnas([
      ["Polera", "12", "85,50"],
      ["Short", "8", "90,00"],
      ["Gorra", "30", "55,00"],
    ])
    const corregida = asignarCampo(lectura, 2, "stock")
    expect(resumen(corregida)).toEqual(["nombre", "—", "stock"])
  })
})

describe("aplicarMapeo", () => {
  it("arma un borrador por fila, sin la de encabezados ni las vacías", () => {
    const filas = [
      ["Producto", "Precio", "Stock"],
      ["Polera negra", "Bs 85,50", "10"],
      ["", "90", "2"],
      ["Short", "consultar", ""],
    ]
    const borradores = aplicarMapeo(filas, mapeoDeLectura(leerColumnas(filas)))
    expect(borradores.map((b) => [b.nombre, b.precio, b.stock])).toEqual([
      ["Polera negra", 85.5, 10],
      ["Short", null, 1],
    ])
    expect(faltaEn(borradores[0])).toBeNull()
    expect(faltaEn(borradores[1])).toBe("precio")
  })

  it("junta las filas de un mismo producto en uno con sus tallas", () => {
    const filas = [
      ["Producto", "Talla", "Color", "Stock", "Precio"],
      ["Polera", "M", "negro", "3", "85"],
      ["Polera", "L", "negro", "2", "85"],
      ["Polera", "M", "Blanco", "4", "85"],
      ["Gorra", "", "", "5", "55"],
    ]
    const borradores = aplicarMapeo(filas, mapeoDeLectura(leerColumnas(filas)))
    expect(borradores).toHaveLength(2)
    const [polera, gorra] = borradores
    expect(polera.opciones).toEqual([
      { nombre: "Talla", valores: ["M", "L"] },
      { nombre: "Color", valores: ["Negro", "Blanco"] },
    ])
    expect(polera.variantes.map((v) => [v.valores, v.stock])).toEqual([
      [{ Talla: "M", Color: "Negro" }, 3],
      [{ Talla: "L", Color: "Negro" }, 2],
      [{ Talla: "M", Color: "Blanco" }, 4],
    ])
    expect(polera.stock).toBe(9)
    expect(gorra.variantes).toEqual([])
    expect(gorra.stock).toBe(5)
  })

  it("tallas en una celda: crea cada una y el stock va a la primera", () => {
    const filas = [
      ["Nombre", "Tallas", "Stock", "Precio"],
      ["Buzo", "S, M, L", "6", "180"],
      ["Zapatilla", "38/39/40", "2", "350"],
    ]
    const [buzo, zapatilla] = aplicarMapeo(
      filas,
      mapeoDeLectura(leerColumnas(filas))
    )
    expect(buzo.opciones).toEqual([
      { nombre: "Talla", valores: ["S", "M", "L"] },
    ])
    expect(buzo.variantes.map((v) => v.stock)).toEqual([6, 0, 0])
    expect(zapatilla.opciones[0].nombre).toBe("Número")
  })

  it("una talla con otro precio lo lleva como precio propio", () => {
    const filas = [
      ["Nombre", "Talla", "Precio"],
      ["Polera", "M", "85"],
      ["Polera", "XL", "95"],
      ["Short", "M", "90"],
    ]
    const [polera] = aplicarMapeo(filas, mapeoDeLectura(leerColumnas(filas)))
    expect(polera.precio).toBe(85)
    expect(polera.variantes.map((v) => v.precio)).toEqual([null, 95])
  })

  it("marca los que ya existen, sin importar tildes ni mayúsculas", () => {
    const filas = [["Nombre"], ["Pantalón cargo"], ["Gorra"]]
    const borradores = aplicarMapeo(filas, mapeoDeLectura(leerColumnas(filas)))
    const ya = repetidos(borradores, ["pantalon  CARGO"])
    expect(borradores.filter((b) => ya.has(b.id)).map((b) => b.nombre)).toEqual(
      ["Pantalón cargo"]
    )
  })
})

describe("esFotoDeMiTienda", () => {
  const base = "https://abc.supabase.co"
  const tienda = "1111-2222"

  it("acepta solo fotos de la carpeta de la tienda", () => {
    expect(
      esFotoDeMiTienda(
        `${base}/storage/v1/object/public/product-images/${tienda}/foto.jpg`,
        base,
        tienda
      )
    ).toBe(true)
    expect(
      esFotoDeMiTienda(
        `${base}/storage/v1/object/public/product-images/otra-tienda/foto.jpg`,
        base,
        tienda
      )
    ).toBe(false)
    expect(
      esFotoDeMiTienda(
        `https://otro.com/storage/v1/object/public/product-images/${tienda}/foto.jpg`,
        base,
        tienda
      )
    ).toBe(false)
    expect(
      esFotoDeMiTienda("http://169.254.169.254/latest", base, tienda)
    ).toBe(false)
    expect(esFotoDeMiTienda("no es una url", base, tienda)).toBe(false)
  })
})
