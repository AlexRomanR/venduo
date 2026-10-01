import { z } from "zod"

import {
  CLAVES_HOJA,
  CLAVES_PLANTILLA,
  VARIANTES,
  type Campos,
  type TipoDeBloque,
} from "@/lib/catalogos/constantes"
import { CLAVES_FUENTE } from "@/lib/plantillas/fuentes"

export * from "@/lib/catalogos/constantes"

/*
 * El catálogo en PDF: qué guarda y qué valida.
 *
 * Un catálogo es una lista de **bloques** —portada, páginas de productos,
 * separadores, packs, ofertas, textos, contraportada— más los productos
 * elegidos, los packs y un estilo. La plantilla solo decide con qué bloques y
 * variantes arranca: cualquier bloque se puede usar en cualquier plantilla, y
 * cada uno se dibuja con la variante que se elija.
 *
 * Nunca se guardan precios ni stock: solo los ids de los productos. Cada vez
 * que se arma el PDF se leen del catálogo de la tienda, así que un catálogo
 * guardado hace un mes sale con los precios de hoy.
 *
 * Todo lo que llega del navegador o de la IA pasa por `catalogoSchema` antes
 * de guardarse o dibujarse. Es un módulo neutral: lo leen la vista previa, el
 * servidor y la capa de IA.
 */

const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Un color se escribe como #rrggbb")

const id = z.string().min(1).max(64)

/** Un texto corto que se puede dejar vacío. */
const texto = (maximo: number) => z.string().max(maximo)

function variantes<T extends TipoDeBloque>(tipo: T) {
  return z.enum(
    Object.keys(VARIANTES[tipo]) as [
      keyof (typeof VARIANTES)[T] & string,
      ...(keyof (typeof VARIANTES)[T] & string)[],
    ]
  )
}

export const estiloSchema = z.object({
  colores: z.object({
    /** El fondo de las hojas. */
    papel: color,
    /** El texto. */
    tinta: color,
    /** Los precios, las etiquetas y los campos de color. */
    acento: color,
  }),
  letras: z.object({
    titular: z.enum(CLAVES_FUENTE),
    cuerpo: z.enum(CLAVES_FUENTE),
    mayusculas: z.boolean(),
  }),
  esquinas: z.enum(["rectas", "suaves"]),
  /** El fondo toma el color del texto, y el texto el del fondo. */
  invertido: z.boolean(),
})

export type Estilo = z.infer<typeof estiloSchema>

export const camposSchema = z.object({
  precio: z.boolean(),
  precioAnterior: z.boolean(),
  descripcion: z.boolean(),
  categoria: z.boolean(),
  condicion: z.boolean(),
  stock: z.boolean(),
  codigo: z.boolean(),
})

// El tipo es el de `constantes.ts`: este esquema lo valida, no lo define.
export type { Campos }

/** Qué productos muestra una página de productos. */
export const cualesSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("todos") }),
  z.object({ tipo: z.literal("categoria"), categoria: id }),
  z.object({ tipo: z.literal("elegidos"), productos: z.array(id).max(60) }),
])

export type Cuales = z.infer<typeof cualesSchema>

export const bloqueSchema = z.discriminatedUnion("tipo", [
  z.object({
    id,
    tipo: z.literal("portada"),
    variante: variantes("portada"),
    titulo: texto(80),
    bajada: texto(200),
    /** El producto cuya foto va en la portada. */
    foto: id.nullable(),
  }),
  z.object({
    id,
    tipo: z.literal("productos"),
    variante: variantes("productos"),
    /** Un título opcional arriba de cada página. */
    titulo: texto(80),
    cuales: cualesSchema,
    porPagina: z.number().int().min(1).max(24),
    campos: camposSchema,
  }),
  z.object({
    id,
    tipo: z.literal("separador"),
    variante: variantes("separador"),
    titulo: texto(80),
    bajada: texto(200),
    foto: id.nullable(),
  }),
  z.object({
    id,
    tipo: z.literal("pack"),
    variante: variantes("pack"),
    pack: id,
  }),
  z.object({
    id,
    tipo: z.literal("oferta"),
    variante: variantes("oferta"),
    titulo: texto(80),
    texto: texto(240),
    /** Lo que va en grande: "-20%", "2x1", "Liquidación". */
    etiqueta: texto(24),
  }),
  z.object({
    id,
    tipo: z.literal("contraportada"),
    variante: variantes("contraportada"),
    titulo: texto(80),
    texto: texto(240),
    /** Dónde encontrarte: "@rosa.deportes en TikTok e Instagram". */
    redes: texto(120),
    /** Cómo se paga. */
    pago: texto(240),
    whatsapp: z.boolean(),
    qr: z.boolean(),
  }),
  z.object({
    id,
    tipo: z.literal("texto"),
    variante: variantes("texto"),
    titulo: texto(80),
    texto: texto(800),
  }),
])

export type Bloque = z.infer<typeof bloqueSchema>
export type BloqueDe<T extends TipoDeBloque> = Extract<Bloque, { tipo: T }>

export const packSchema = z.object({
  id,
  nombre: z.string().min(1).max(60),
  productos: z.array(id).min(2).max(8),
  /** El precio del pack junto, en centavos. Solo se muestra en el PDF. */
  precioCents: z.number().int().min(0).max(100_000_000),
  nota: texto(160),
})

export type Pack = z.infer<typeof packSchema>

export const catalogoSchema = z.object({
  version: z.literal(1),
  nombre: z.string().trim().min(1, "Ponle un nombre").max(80),
  plantilla: z.enum(CLAVES_PLANTILLA),
  hoja: z.enum(CLAVES_HOJA),
  estilo: estiloSchema,
  /** Los productos elegidos, en el orden en que aparecen. */
  productos: z.array(id).max(200),
  packs: z.array(packSchema).max(12),
  bloques: z.array(bloqueSchema).min(1).max(40),
})

export type Catalogo = z.infer<typeof catalogoSchema>
