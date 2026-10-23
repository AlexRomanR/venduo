import { describe, expect, it } from "vitest"

import { CLAVES_DE_FUNCION, esEstado, leerFunciones } from "@/lib/funciones"

describe("leerFunciones", () => {
  const [primera, segunda] = CLAVES_DE_FUNCION

  it("lee lo que la base apagó u ocultó", () => {
    const leidas = leerFunciones({
      [primera]: "desactivada",
      [segunda]: "oculta",
    })
    expect(leidas[primera]).toBe("desactivada")
    expect(leidas[segunda]).toBe("oculta")
  })

  // Así está decidido: si la base no dice nada, la función queda activa.
  it("una clave que falta o un valor raro queda activa", () => {
    const leidas = leerFunciones({ [primera]: "apagada" })
    expect(leidas[primera]).toBe("activa")
    expect(leidas[segunda]).toBe("activa")
    expect(Object.values(leerFunciones(null))).toEqual(
      CLAVES_DE_FUNCION.map(() => "activa")
    )
  })
})

describe("esEstado", () => {
  it("solo acepta los tres estados", () => {
    expect(esEstado("activa")).toBe(true)
    expect(esEstado("desactivada")).toBe(true)
    expect(esEstado("oculta")).toBe(true)
    expect(esEstado("Activa")).toBe(false)
    expect(esEstado(1)).toBe(false)
  })
})
