import { describe, expect, it } from "vitest"

import { arregloDeEstilo, problemasDeEstilo } from "@/lib/catalogos/estilo"
import type { Bloque, Catalogo, Estilo } from "@/lib/catalogos/modelo"
import {
  agregarPack,
  conservarEdicion,
  faltantes,
  ponerDescuentoAlPack,
  ponerPrecioAlPack,
  ponerProductosAlPack,
  precioConDescuento,
} from "@/lib/catalogos/operaciones"

const portada = (id: string, titulo: string): Bloque => ({
  id,
  tipo: "portada",
  variante: "foto",
  titulo,
  bajada: "",
  foto: null,
})
const oferta = (id: string): Bloque => ({
  id,
  tipo: "oferta",
  variante: "banner",
  titulo: "Ofertas",
  texto: "",
  etiqueta: "-20%",
})
const cierre = (id: string): Bloque => ({
  id,
  tipo: "contraportada",
  variante: "contacto",
  titulo: "Escríbenos",
  texto: "",
  redes: "",
  pago: "",
  whatsapp: true,
  qr: false,
})

const con = (bloques: Bloque[]) => ({ bloques }) as Catalogo

describe("conservarEdicion", () => {
  const base = con([portada("a", "Mi tienda"), cierre("b")])
  const nueva = con([portada("x", "Mi tienda"), cierre("y")])

  it("sin nada editado deja la plantilla nueva como vino", () => {
    const { catalogo, conservados } = conservarEdicion(base, base, nueva)
    expect(catalogo.bloques).toEqual(nueva.bloques)
    expect(conservados).toBe(0)
  })

  it("pasa los textos cambiados a la parte equivalente", () => {
    const actual = con([portada("a", "Colección de verano"), cierre("b")])
    const { catalogo, conservados } = conservarEdicion(actual, base, nueva)
    expect(catalogo.bloques[0]).toMatchObject({
      id: "x",
      titulo: "Colección de verano",
    })
    expect(conservados).toBe(1)
  })

  it("mantiene las partes agregadas, antes de la contraportada", () => {
    const actual = con([portada("a", "Mi tienda"), oferta("o"), cierre("b")])
    const { catalogo } = conservarEdicion(actual, base, nueva)
    expect(catalogo.bloques.map((bloque) => bloque.id)).toEqual(["x", "o", "y"])
  })
})

describe("arregloDeEstilo", () => {
  const estilo = (colores: Estilo["colores"]) =>
    ({
      colores,
      letras: { titular: "geist", cuerpo: "geist", mayusculas: false },
      esquinas: "rectas",
      invertido: false,
    }) as Estilo

  it("arregla el texto cuando lo que no se lee es el texto", () => {
    const mal = estilo({
      papel: "#edf3f6",
      tinta: "#dfe6ea",
      acento: "#1d5f8c",
    })
    const arreglo = arregloDeEstilo(mal)
    expect(arreglo?.color).toBe("tinta")
    const bien = {
      ...mal,
      colores: { ...mal.colores, tinta: arreglo?.hex ?? "" },
    }
    expect(problemasDeEstilo(bien)).toEqual([])
  })

  it("arregla el color destacado cuando se pierde en el fondo", () => {
    const mal = estilo({
      papel: "#ffffff",
      tinta: "#111111",
      acento: "#eeeeee",
    })
    expect(arregloDeEstilo(mal)?.color).toBe("acento")
  })
})

describe("agregarPack", () => {
  const catalogo = {
    nombre: "Octubre",
    productos: ["a", "b", "c"],
    packs: [],
    bloques: [portada("p", "Mi tienda")],
  } as unknown as Catalogo

  const precios = { a: 12000, b: 15500, c: 9900 }

  it("nace al diez por ciento menos, en bolivianos enteros", () => {
    const { pack } = agregarPack(catalogo, precios)
    // 120 + 155 = 275; el 90% es 247,50, que queda en 248.
    expect(pack.precioCents).toBe(24800)
    expect(pack.productos).toEqual(["a", "b"])
  })

  it("no toma productos agotados si hay otros", () => {
    const { pack } = agregarPack(catalogo, precios, new Set(["a"]))
    expect(pack.productos).toEqual(["b", "c"])
  })

  it("con el precio en cero no se puede guardar ni mandar", () => {
    const { catalogo: armado, pack } = agregarPack(catalogo, precios)
    const conPack = {
      ...armado,
      packs: armado.packs.map((otro) => ({ ...otro, precioCents: 0 })),
    }
    expect(faltantes(conPack)).toContain(
      `Ponle precio al combo «${pack.nombre}».`
    )
    const conPrecio = {
      ...conPack,
      packs: conPack.packs.map((otro) => ({ ...otro, precioCents: 24800 })),
    }
    expect(faltantes(conPrecio)).toEqual([])
  })

  it("nace con el 10% de descuento guardado", () => {
    expect(agregarPack(catalogo, precios).pack.descuentoBps).toBe(1000)
  })
})

describe("el precio de un combo", () => {
  const precios = { a: 12000, b: 15500, c: 9900 }
  const pack = {
    id: "pk",
    nombre: "Combo",
    productos: ["a", "b"],
    precioCents: 24800,
    descuentoBps: 1000,
    nota: "",
  }

  it("con descuento, se recalcula sobre todos los productos al sumar uno", () => {
    // 120 + 155 + 99 = 374; el 90% es 336,60, que queda en 337.
    expect(
      ponerProductosAlPack(pack, ["a", "b", "c"], precios).precioCents
    ).toBe(33700)
  })

  it("y al quitar uno", () => {
    // 120 + 99 = 219; el 90% es 197,10, que queda en 197.
    expect(ponerProductosAlPack(pack, ["a", "c"], precios).precioCents).toBe(
      19700
    )
  })

  it("un producto repetido cuenta las dos veces", () => {
    expect(precioConDescuento(["a", "a"], precios, 1000)).toBe(21600)
  })

  it("a mano, el precio no cambia al sumar productos", () => {
    const aMano = ponerPrecioAlPack(pack, 30000)
    expect(aMano.descuentoBps).toBeNull()
    expect(
      ponerProductosAlPack(aMano, ["a", "b", "c"], precios).precioCents
    ).toBe(30000)
  })

  it("elegir otro descuento recalcula el precio y vuelve a seguirlo", () => {
    const conQuince = ponerDescuentoAlPack(
      ponerPrecioAlPack(pack, 30000),
      1500,
      precios
    )
    // 275 al 85% es 233,75, que queda en 234.
    expect(conQuince).toMatchObject({ descuentoBps: 1500, precioCents: 23400 })
  })

  it("el descuento se queda entre 0 y 90%", () => {
    expect(ponerDescuentoAlPack(pack, 12000, precios).descuentoBps).toBe(9000)
    expect(ponerDescuentoAlPack(pack, -5, precios).descuentoBps).toBe(0)
  })
})
