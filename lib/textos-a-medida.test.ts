import { describe, expect, it } from "vitest"

import { textosDeDemostracion } from "@/lib/ai/providers/mock-textos"
import type { Seccion } from "@/lib/plantillas/borrador"
import {
  aplicarCambios,
  armarPropuesta,
  camposParaReescribir,
  ponerTextosGuardados,
  textosParaGuardar,
} from "@/lib/textos-a-medida"

const portada: Seccion[] = [
  {
    id: "h",
    tipo: "hero",
    visible: true,
    props: {
      title: "Color para todos los días",
      subtitle: "Elige tus favoritos.",
      ctaLabel: "Ver la colección",
      imageUrl: "https://ejemplo.bo/foto.jpg",
    },
  },
  {
    id: "c",
    tipo: "categories",
    visible: true,
    props: { title: "Encuentra el tuyo", limit: 8 },
  },
  {
    id: "o",
    tipo: "product_grid",
    visible: false,
    props: { title: "Oculta" },
  },
]

describe("camposParaReescribir", () => {
  it("sin semilla entran los textos de la lista, y nada más", () => {
    const campos = camposParaReescribir(portada, null)
    expect(campos.map((c) => `${c.id}:${c.campo}`)).toEqual([
      "h:title",
      "h:subtitle",
      "h:ctaLabel",
      "c:title",
    ])
    expect(campos[0].rotulo).toBe("Presentación · Título")
  })

  it("con semilla, no entra lo que la persona escribió", () => {
    const campos = camposParaReescribir(portada, [
      {
        tipo: "hero",
        props: { title: "Otro título", subtitle: "Elige tus favoritos." },
      },
    ])
    expect(campos.map((c) => c.campo)).toEqual(["subtitle"])
  })
})

describe("armarPropuesta", () => {
  const campos = camposParaReescribir(portada, null)

  it("descarta ids inventados, campos ajenos, lo igual y lo que no entra", () => {
    const { cambios } = armarPropuesta(
      campos,
      {
        descripcion: "",
        textos: [
          { id: "h", campo: "title", texto: "  Ropa   para todos los días " },
          { id: "h", campo: "imageUrl", texto: "https://malo.bo/x.jpg" },
          { id: "x", campo: "title", texto: "Sección que no existe" },
          { id: "c", campo: "title", texto: "Encuentra el tuyo" },
          { id: "h", campo: "ctaLabel", texto: "a".repeat(41) },
        ],
      },
      null
    )
    expect(cambios).toHaveLength(1)
    expect(cambios[0]).toMatchObject({
      id: "h",
      campo: "title",
      antes: "Color para todos los días",
      despues: "Ropa para todos los días",
    })
  })

  it("no acepta un título largo ni un texto en singular", () => {
    const { cambios, descripcion } = armarPropuesta(
      campos,
      {
        descripcion: "Vendo zapatillas y zapatos para gente joven.",
        textos: [
          {
            id: "h",
            campo: "title",
            texto: "Vendemos zapatillas y zapatos para jóvenes a buen precio",
          },
          { id: "h", campo: "subtitle", texto: "Vendo zapatillas de oferta." },
          { id: "c", campo: "title", texto: "Zapatillas" },
        ],
      },
      "vendo zapatillas y zapatos para gente joven"
    )
    expect(cambios.map((c) => c.id)).toEqual(["c"])
    expect(descripcion).toBeNull()
  })

  it("propone la descripción solo si cambia y tiene un largo válido", () => {
    const actual = "ropa de mujer blusas y vestidos en santa cruz"
    const salida = (descripcion: string) => ({ descripcion, textos: [] })
    expect(
      armarPropuesta(
        campos,
        salida("Ropa de mujer: blusas y vestidos, en Santa Cruz."),
        actual
      ).descripcion
    ).toEqual({
      antes: actual,
      despues: "Ropa de mujer: blusas y vestidos, en Santa Cruz.",
    })
    expect(
      armarPropuesta(campos, salida(actual), actual).descripcion
    ).toBeNull()
    expect(
      armarPropuesta(campos, salida("Muy corta."), actual).descripcion
    ).toBeNull()
    expect(
      armarPropuesta(campos, salida("Una descripción válida y larga."), null)
        .descripcion
    ).toBeNull()
  })
})

describe("el modo demo", () => {
  it("adapta cada campo en vez de copiar la frase", () => {
    const campos = camposParaReescribir(portada, null)
    const descripcion =
      "vendo zapatillas y zapatos para jovenes mujeres y hombres a precios de oferta"
    const salida = textosDeDemostracion(
      `<<CONTEXTO>>${JSON.stringify({ descripcion, campos })}<</CONTEXTO>>`
    )
    expect(salida).not.toBeNull()
    const { cambios, descripcion: corregida } = armarPropuesta(
      campos,
      salida!,
      descripcion
    )
    const de = (campo: string) =>
      cambios.find((c) => c.id === "h" && c.campo === campo)?.despues
    expect(de("title")).toBe("Zapatillas y zapatos")
    expect(de("subtitle")).toMatch(/^Vendemos zapatillas/)
    expect(de("ctaLabel")).toBe("Ver zapatillas y zapatos")
    expect(corregida?.despues).toMatch(/^Vendemos zapatillas/)
  })
})

describe("aplicarCambios", () => {
  const cambios = armarPropuesta(
    camposParaReescribir(portada, null),
    {
      descripcion: "",
      textos: [
        { id: "h", campo: "title", texto: "Ropa para todos los días" },
        { id: "c", campo: "title", texto: "Por categoría" },
      ],
    },
    null
  ).cambios

  it("cambia lo propuesto y deja el resto de la sección", () => {
    const { secciones, aplicados, saltados } = aplicarCambios(portada, cambios)
    expect(secciones[0].props.title).toBe("Ropa para todos los días")
    expect(secciones[0].props.imageUrl).toBe("https://ejemplo.bo/foto.jpg")
    expect(aplicados).toHaveLength(2)
    expect(saltados).toBe(0)
    expect(portada[0].props.title).toBe("Color para todos los días")
  })

  it("no pisa lo que la persona cambió después", () => {
    const editada = portada.map((s) =>
      s.id === "h" ? { ...s, props: { ...s.props, title: "Mío" } } : s
    )
    const { secciones, aplicados, saltados } = aplicarCambios(editada, cambios)
    expect(secciones[0].props.title).toBe("Mío")
    expect(aplicados.map((c) => c.id)).toEqual(["c"])
    expect(saltados).toBe(1)
  })
})

describe("los textos guardados", () => {
  it("pasan a otra plantilla, en la primera sección de cada tipo", () => {
    const guardados = textosParaGuardar([
      {
        id: "h",
        tipo: "hero",
        campo: "title",
        rotulo: "",
        antes: "",
        despues: "Ropa para todos los días",
      },
      {
        id: "a",
        tipo: "product_grid",
        campo: "title",
        rotulo: "",
        antes: "",
        despues: "Lo nuevo en ropa",
      },
      {
        id: "b",
        tipo: "product_grid",
        campo: "title",
        rotulo: "",
        antes: "",
        despues: "Lo más pedido",
      },
    ])
    expect(guardados.product_grid.title).toBe("Lo nuevo en ropa")

    const nueva: Seccion[] = [
      { id: "1", tipo: "hero", visible: true, props: { title: "Semilla" } },
      { id: "2", tipo: "product_grid", visible: true, props: { title: "A" } },
      { id: "3", tipo: "product_grid", visible: true, props: { title: "B" } },
    ]
    const puestas = ponerTextosGuardados(nueva, guardados)
    expect(puestas.map((s) => s.props.title)).toEqual([
      "Ropa para todos los días",
      "Lo nuevo en ropa",
      "B",
    ])
  })

  it("ignora un campo fuera de la lista", () => {
    const nueva: Seccion[] = [
      { id: "1", tipo: "hero", visible: true, props: { title: "Semilla" } },
    ]
    const puestas = ponerTextosGuardados(nueva, {
      hero: { imageUrl: "https://malo.bo/x.jpg" },
    })
    expect(puestas[0].props).toEqual({ title: "Semilla" })
  })
})
