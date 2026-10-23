import { z } from "zod"

import {
  MAXIMO_DE_OPCIONES,
  MAXIMO_DE_VALORES,
  MAXIMO_DE_VARIANTES,
} from "@/lib/variantes"

/**
 * El producto tal como lo carga el emprendedor.
 *
 * Vive fuera de la Server Action porque un archivo `"use server"` solo puede
 * exportar funciones async, y porque el formulario valida con este mismo
 * esquema: las reglas se escriben una vez.
 *
 * Los montos entran en bolivianos —que es lo que la persona escribe— y la
 * acción los pasa a centavos. Nunca al revés: redondear en el formulario
 * escondería el error.
 */
export const productoSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre es muy corto.")
      .max(120, "El nombre es muy largo."),
    descripcion: z
      .string()
      .trim()
      .max(600, "Máximo 600 caracteres.")
      .default(""),
    precio: z
      .number({ error: "Pon un precio." })
      .nonnegative("El precio no puede ser negativo.")
      .max(9_999_999, "Ese precio es demasiado alto."),
    precioAnterior: z
      .number()
      .nonnegative("El precio anterior no puede ser negativo.")
      .max(9_999_999)
      .nullable()
      .default(null),
    /** Lo que le cuesta a la tienda. Solo lo ve ella: da la ganancia. */
    costo: z
      .number()
      .nonnegative("El costo no puede ser negativo.")
      .max(9_999_999, "Ese costo es demasiado alto.")
      .nullable()
      .default(null),
    stock: z
      .number({ error: "Pon cuántas unidades tienes." })
      .int("El stock va en unidades enteras.")
      .min(0, "El stock no puede ser negativo.")
      .max(999_999),
    avisoStock: z.number().int().min(0).max(9999).default(3),
    categoriaId: z.uuid().nullable().default(null),
    sku: z.string().trim().max(40, "El código es muy largo.").default(""),
    fotos: z
      .array(z.url())
      .max(6, "Hasta seis fotos por producto.")
      .default([]),
    activo: z.boolean().default(true),
    destacado: z.boolean().default(false),
    /** Talla, color, número: hasta dos, cada una con sus valores. */
    opciones: z
      .array(
        z.object({
          nombre: z
            .string()
            .trim()
            .min(1, "Ponle nombre a la opción: Talla, Color…")
            .max(30, "El nombre de la opción es muy largo."),
          valores: z
            .array(z.string().trim().min(1).max(30, "Ese valor es muy largo."))
            .min(1, "Agrega al menos un valor a cada opción.")
            .max(MAXIMO_DE_VALORES, "Hasta 20 valores por opción."),
        })
      )
      .max(MAXIMO_DE_OPCIONES, "Hasta dos opciones por producto.")
      .default([]),
    /** Una por combinación, con su stock y, si es distinto, su precio. */
    variantes: z
      .array(
        z.object({
          valores: z.record(z.string(), z.string()),
          stock: z
            .number({ error: "Pon cuántas unidades hay de cada opción." })
            .int("El stock va en unidades enteras.")
            .min(0, "El stock no puede ser negativo.")
            .max(999_999),
          precio: z
            .number()
            .nonnegative("El precio no puede ser negativo.")
            .max(9_999_999, "Ese precio es demasiado alto.")
            .nullable(),
          imagen: z.string().nullable(),
        })
      )
      .max(MAXIMO_DE_VARIANTES, "Son demasiadas combinaciones: hasta 60.")
      .default([]),
  })
  .superRefine((valores, ctx) => {
    // Dos opciones con el mismo nombre, o un valor repetido, armarían dos
    // combinaciones iguales.
    const nombres = valores.opciones.map((o) => o.nombre.toLowerCase())
    if (new Set(nombres).size !== nombres.length) {
      ctx.addIssue({
        code: "custom",
        path: ["opciones"],
        message: "Dos opciones tienen el mismo nombre.",
      })
    }
    for (const opcion of valores.opciones) {
      const propios = opcion.valores.map((v) => v.toLowerCase())
      if (new Set(propios).size !== propios.length) {
        ctx.addIssue({
          code: "custom",
          path: ["opciones"],
          message: `Hay un valor repetido en ${opcion.nombre}.`,
        })
      }
    }

    // El precio anterior es lo que produce el descuento tachado. Si no es mayor
    // que el actual no hay descuento, hay un error de carga.
    if (
      valores.precioAnterior !== null &&
      valores.precioAnterior <= valores.precio
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["precioAnterior"],
        message: "El precio anterior tiene que ser mayor que el actual.",
      })
    }
  })

export type ProductoInput = z.input<typeof productoSchema>
export type ProductoValidado = z.output<typeof productoSchema>

/** Las categorías del catálogo. */
export const categoriaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre es muy corto.")
    .max(60, "El nombre es muy largo."),
  descripcion: z.string().trim().max(200).default(""),
})

export type CategoriaInput = z.input<typeof categoriaSchema>
