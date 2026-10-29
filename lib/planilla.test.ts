import { describe, expect, it } from "vitest"

import {
  crc32,
  crearXlsx,
  diaDeExcel,
  filasDeTexto,
  indiceDeColumna,
  leerCsv,
  leerXlsx,
  leerZip,
  letraDeColumna,
  montoParaPlanilla,
} from "@/lib/planilla"

const bytes = (texto: string) => new TextEncoder().encode(texto)

describe("el ZIP", () => {
  it("calcula el CRC32 estándar", () => {
    expect(crc32(bytes("123456789"))).toBe(0xcbf43926)
  })

  it("lee un ZIP comprimido, como el que guarda Excel", async () => {
    const xml = bytes("<hola>Bolivia</hola>")
    const comprimido = new Uint8Array(
      await new Response(
        new Blob([xml])
          .stream()
          .pipeThrough(new CompressionStream("deflate-raw"))
      ).arrayBuffer()
    )
    const archivos = await leerZip(zipConUnArchivo("a.xml", comprimido, xml))
    expect(new TextDecoder().decode(archivos.get("a.xml"))).toBe(
      "<hola>Bolivia</hola>"
    )
  })
})

describe("crearXlsx y leerXlsx", () => {
  it("lo que se escribe se vuelve a leer, con tildes y saltos de línea", async () => {
    const archivo = crearXlsx([
      {
        nombre: "Pedidos",
        columnas: [
          { titulo: "Número", tipo: "entero" },
          { titulo: "Nota" },
          { titulo: "Total (Bs)", tipo: "monto" },
          { titulo: "Fecha", tipo: "fecha" },
        ],
        filas: [
          [291, "Entrega el sábado & pagó <la mitad>", 450.5, "2026-10-23"],
          [292, null, 85, "2026-10-24"],
        ],
      },
      {
        nombre: "Detalle",
        columnas: [{ titulo: "Producto" }],
        filas: [["Polera"]],
      },
    ])

    const filas = await leerXlsx(archivo)
    expect(filas[0]).toEqual(["Número", "Nota", "Total (Bs)", "Fecha"])
    expect(filas[1]).toEqual([
      "291",
      "Entrega el sábado & pagó <la mitad>",
      "450.5",
      String(diaDeExcel("2026-10-23")),
    ])
    // La celda vacía queda vacía y la siguiente en su columna.
    expect(filas[2]).toEqual([
      "292",
      "",
      "85",
      String(diaDeExcel("2026-10-24")),
    ])
  })

  it("el texto que empieza con = no se vuelve fórmula", async () => {
    const archivo = crearXlsx([
      { nombre: "x", columnas: [{ titulo: "A" }], filas: [["=1+1"]] },
    ])
    const xml = new TextDecoder().decode(
      (await leerZip(archivo)).get("xl/worksheets/sheet1.xml")
    )
    expect(xml).toContain('t="inlineStr"')
    expect(xml).not.toContain("<f>")
  })
})

describe("montos y fechas", () => {
  it("centavos a bolivianos", () => {
    expect(montoParaPlanilla(8550)).toBe(85.5)
    expect(montoParaPlanilla(0)).toBe(0)
  })

  it("el día de Excel", () => {
    expect(diaDeExcel("1900-01-01")).toBe(2)
    expect(diaDeExcel("2026-10-23")).toBe(46318)
    expect(diaDeExcel("23/10/2026")).toBeNull()
  })

  it("letras de columna", () => {
    expect(letraDeColumna(0)).toBe("A")
    expect(letraDeColumna(25)).toBe("Z")
    expect(letraDeColumna(26)).toBe("AA")
    expect(indiceDeColumna("AA")).toBe(26)
    expect(indiceDeColumna("C")).toBe(2)
  })
})

describe("leerCsv", () => {
  it("adivina el separador", () => {
    expect(leerCsv("Producto;Precio\nPolera;85,50")).toEqual([
      ["Producto", "Precio"],
      ["Polera", "85,50"],
    ])
    expect(leerCsv("Producto,Precio\r\nPolera,85")).toEqual([
      ["Producto", "Precio"],
      ["Polera", "85"],
    ])
    expect(leerCsv("A\tB\n1\t2")).toEqual([
      ["A", "B"],
      ["1", "2"],
    ])
  })

  it("respeta comillas, comillas dobles y saltos de línea adentro", () => {
    expect(
      leerCsv('Nombre,Nota\n"Polera, negra","Dijo ""ya""\nmañana"')
    ).toEqual([
      ["Nombre", "Nota"],
      ["Polera, negra", 'Dijo "ya"\nmañana'],
    ])
  })

  it("quita la marca BOM y las filas vacías", () => {
    expect(leerCsv("﻿A;B\n\n;\n1;2\n")).toEqual([
      ["A", "B"],
      ["1", "2"],
    ])
  })
})

/** Un ZIP con un solo archivo comprimido, para probar la lectura. */
function zipConUnArchivo(
  nombre: string,
  comprimido: Uint8Array,
  original: Uint8Array
) {
  const n = bytes(nombre)
  const local = new Uint8Array(30 + n.length)
  const l = new DataView(local.buffer)
  l.setUint32(0, 0x04034b50, true)
  l.setUint16(8, 8, true)
  l.setUint32(14, crc32(original), true)
  l.setUint32(18, comprimido.length, true)
  l.setUint32(22, original.length, true)
  l.setUint16(26, n.length, true)
  local.set(n, 30)
  const central = new Uint8Array(46 + n.length)
  const c = new DataView(central.buffer)
  c.setUint32(0, 0x02014b50, true)
  c.setUint16(10, 8, true)
  c.setUint32(16, crc32(original), true)
  c.setUint32(20, comprimido.length, true)
  c.setUint32(24, original.length, true)
  c.setUint16(28, n.length, true)
  c.setUint32(42, 0, true)
  central.set(n, 46)
  const fin = new Uint8Array(22)
  const f = new DataView(fin.buffer)
  f.setUint32(0, 0x06054b50, true)
  f.setUint16(8, 1, true)
  f.setUint16(10, 1, true)
  f.setUint32(12, central.length, true)
  f.setUint32(16, local.length + comprimido.length, true)
  const todo = new Uint8Array(
    local.length + comprimido.length + central.length + fin.length
  )
  todo.set(local, 0)
  todo.set(comprimido, local.length)
  todo.set(central, local.length + comprimido.length)
  todo.set(fin, local.length + comprimido.length + central.length)
  return todo
}

describe("filasDeTexto", () => {
  it("reconoce una tabla pegada, con comas o copiada de Excel", () => {
    expect(
      filasDeTexto("x1,Polera,Poleras,85\nx2,Buzo,Buzos,180\nx3,Gorra,,55")
    ).toHaveLength(3)
    expect(filasDeTexto("Polera\t85\t3\nBuzo\t180\t6")).toEqual([
      ["Polera", "85", "3"],
      ["Buzo", "180", "6"],
    ])
  })

  it("una lista suelta no es una tabla", () => {
    expect(filasDeTexto("Polera básica 65\nShort deportivo 90")).toBeNull()
    expect(
      filasDeTexto("Medias de algodón, pack de 3\nGorra, negra\nShort 90")
    ).toBeNull()
    expect(filasDeTexto("Polera, negra, M, 85")).toBeNull()
  })
})
