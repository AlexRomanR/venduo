/*
 * Las variantes de un producto: talla, color, número.
 *
 * Un producto puede tener hasta dos opciones —Talla: S, M, L; Color: Negro,
 * Blanco— y una variante por cada combinación, con su stock, su precio si es
 * distinto y su foto. Sin dependencias de servidor: lo leen el formulario del
 * producto, la ficha de la tienda, el carrito y el panel. La app tiene su
 * espejo en `src/nucleo/variantes.ts`.
 *
 * Quien guarda es la base, con `guardar_variantes`, que vuelve a validar todo.
 */

export const MAXIMO_DE_OPCIONES = 2
export const MAXIMO_DE_VALORES = 20
export const MAXIMO_DE_VARIANTES = 60

/**
 * Los tipos de opción que más se usan, con sus valores ya escritos: quien vende
 * los marca en vez de tipearlos. "Otra" —sabor, modelo— se escribe a mano.
 */
export interface TipoDeOpcion {
  /** El nombre que queda en la opción: "Talla". */
  nombre: string
  /** Para qué sirve, en dos o tres palabras. */
  detalle: string
  valores: string[]
  /** Cómo se llama agregar uno que no está: "Otra talla". */
  otro: string
}

export const TIPOS_DE_OPCION: TipoDeOpcion[] = [
  {
    nombre: "Talla",
    detalle: "De ropa",
    valores: ["XS", "S", "M", "L", "XL", "XXL"],
    otro: "Otra talla",
  },
  {
    nombre: "Número",
    detalle: "De calzado",
    valores: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"],
    otro: "Otro número",
  },
  {
    nombre: "Color",
    detalle: "Con su foto",
    valores: [
      "Negro",
      "Blanco",
      "Gris",
      "Beige",
      "Café",
      "Azul",
      "Celeste",
      "Verde",
      "Rojo",
      "Rosado",
      "Morado",
      "Amarillo",
      "Naranja",
    ],
    otro: "Otro color",
  },
  {
    nombre: "Tamaño",
    detalle: "Ml, gramos, litros",
    valores: ["30 ml", "50 ml", "100 ml", "200 ml", "500 ml", "1 litro"],
    otro: "Otro tamaño",
  },
]

/**
 * El color de muestra de cada color de la lista, para dibujar su punto. No es
 * un color de la interfaz: es el del producto, el mismo en cualquier tienda.
 */
export const MUESTRAS_DE_COLOR: Record<string, string> = {
  Negro: "#1b1b1b",
  Blanco: "#ffffff",
  Gris: "#9a9a9a",
  Beige: "#d9c7a7",
  Café: "#6b4426",
  Azul: "#1f4fbf",
  Celeste: "#7cc4ef",
  Verde: "#2f8a4a",
  Rojo: "#d32626",
  Rosado: "#f19bbd",
  Morado: "#7b3fb0",
  Amarillo: "#f2c81f",
  Naranja: "#f07b1f",
}

/** El tipo de una opción, por su nombre. `null` si es una que se escribió a mano. */
export function tipoDe(opcion: { nombre: string }): TipoDeOpcion | null {
  const nombre = opcion.nombre.trim().toLowerCase()
  return TIPOS_DE_OPCION.find((t) => t.nombre.toLowerCase() === nombre) ?? null
}

/**
 * Los valores de una opción en un orden que se lee: los de la lista en su
 * orden —S antes que M—, y los escritos a mano al final, como se agregaron.
 */
export function ordenarValores(
  tipo: TipoDeOpcion | null,
  valores: string[]
): string[] {
  if (!tipo) return valores
  const propios = tipo.valores.filter((v) => valores.includes(v))
  return [...propios, ...valores.filter((v) => !tipo.valores.includes(v))]
}

export interface Opcion {
  nombre: string
  valores: string[]
}

/** Un valor por opción: `{ Talla: "M", Color: "Negro" }`. */
export type Valores = Record<string, string>

export interface Variante {
  id: string
  valores: Valores
  /** "M · Negro", en el orden de las opciones. */
  nombre: string
  /** `null`: cuesta lo mismo que el producto. */
  precioCents: number | null
  stock: number
  sku: string | null
  /** Una de las fotos del producto: la ficha la muestra al elegir su color. */
  imagen: string | null
}

/** Una variante como la ve quien compra: sin su código interno. */
export type VariantePublica = Omit<Variante, "sku">

/** Las opciones como las guarda la base, leídas sin confiar en su forma. */
export function leerOpciones(crudo: unknown): Opcion[] {
  if (!Array.isArray(crudo)) return []
  return crudo
    .filter(
      (o): o is { nombre: string; valores: unknown[] } =>
        typeof o === "object" &&
        o !== null &&
        typeof (o as { nombre?: unknown }).nombre === "string" &&
        Array.isArray((o as { valores?: unknown }).valores)
    )
    .map((o) => ({
      nombre: o.nombre,
      valores: o.valores.filter((v): v is string => typeof v === "string"),
    }))
    .filter((o) => o.valores.length > 0)
    .slice(0, MAXIMO_DE_OPCIONES)
}

/** Los valores de una variante como los guarda la base. */
export function leerValores(crudo: unknown): Valores {
  if (typeof crudo !== "object" || crudo === null || Array.isArray(crudo)) {
    return {}
  }
  return Object.fromEntries(
    Object.entries(crudo).filter(
      (par): par is [string, string] => typeof par[1] === "string"
    )
  )
}

/** Todas las combinaciones de las opciones, en orden: S·Negro, S·Blanco, M·Negro… */
export function combinaciones(opciones: Opcion[]): Valores[] {
  return opciones.reduce<Valores[]>(
    (acumulado, opcion) =>
      acumulado.flatMap((parcial) =>
        opcion.valores.map((valor) => ({ ...parcial, [opcion.nombre]: valor }))
      ),
    opciones.length > 0 ? [{}] : []
  )
}

/** "M · Negro": los valores en el orden de las opciones. */
export function nombreDeVariante(opciones: Opcion[], valores: Valores): string {
  return opciones
    .map((o) => valores[o.nombre])
    .filter(Boolean)
    .join(" · ")
}

/** Si dos combinaciones son la misma. */
export function mismaCombinacion(a: Valores, b: Valores): boolean {
  const claves = Object.keys(a)
  return (
    claves.length === Object.keys(b).length &&
    claves.every((k) => a[k] === b[k])
  )
}

/** La variante de una combinación completa, si existe. */
export function varianteDe<T extends { valores: Valores }>(
  variantes: T[],
  valores: Valores
): T | null {
  return variantes.find((v) => mismaCombinacion(v.valores, valores)) ?? null
}

/**
 * Si un valor de una opción tiene stock, dado lo que ya se eligió en las otras.
 * Es lo que tacha en la ficha "L" cuando la L negra se agotó.
 */
export function hayStockDe<T extends { valores: Valores; stock: number }>(
  variantes: T[],
  opcion: string,
  valor: string,
  elegidos: Valores
): boolean {
  return variantes.some(
    (v) =>
      v.stock > 0 &&
      v.valores[opcion] === valor &&
      Object.entries(elegidos).every(
        ([clave, elegido]) => clave === opcion || v.valores[clave] === elegido
      )
  )
}

/** El precio más bajo y el más alto entre las variantes. */
export function rangoDePrecio(
  precioDelProducto: number,
  variantes: { precioCents: number | null }[]
): { desde: number; hasta: number } {
  const precios = variantes.length
    ? variantes.map((v) => v.precioCents ?? precioDelProducto)
    : [precioDelProducto]
  return { desde: Math.min(...precios), hasta: Math.max(...precios) }
}

/** La foto de un valor —un color—, si alguna de sus variantes la tiene. */
export function fotoDe<T extends { valores: Valores; imagen: string | null }>(
  variantes: T[],
  opcion: string,
  valor: string
): string | null {
  return (
    variantes.find((v) => v.valores[opcion] === valor && v.imagen)?.imagen ??
    null
  )
}

/**
 * La opción que lleva foto: aquella cuyas variantes con foto la tienen igual
 * para el mismo valor —todas las negras con la foto negra—. `null` si ninguna.
 */
export function opcionConFoto(
  opciones: Opcion[],
  variantes: { valores: Valores; imagen: string | null }[]
): string | null {
  const conFoto = variantes.filter((v) => v.imagen)
  if (conFoto.length === 0) return null
  return (
    opciones.find((o) =>
      conFoto.every(
        (v) => fotoDe(conFoto, o.nombre, v.valores[o.nombre] ?? "") === v.imagen
      )
    )?.nombre ?? null
  )
}

/**
 * Las opciones en una línea, para un catálogo: "S, M, L · Negro, Blanco".
 * Comas dentro de cada opción, porque la línea de detalle ya separa con
 * puntos. `null` si el producto no tiene opciones.
 */
export function resumenDeOpciones(opciones: Opcion[]): string | null {
  return opciones.length
    ? opciones.map((o) => o.valores.join(", ")).join(" · ")
    : null
}

/** Cuántas variantes salen de unas opciones, sin armarlas. */
export function cuantasVariantes(opciones: Opcion[]): number {
  return opciones.length === 0
    ? 0
    : opciones.reduce((total, o) => total * o.valores.length, 1)
}
