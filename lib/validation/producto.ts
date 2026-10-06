import { z } from "zod"

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
    stock: z
      .number({ error: "Pon cuántas unidades tienes." })
      .int("El stock va en unidades enteras.")
      .min(0, "El stock no puede ser negativo.")
      .max(999_999),
    avisoStock: z.number().int().min(0).max(9999).default(3),
    categoriaId: z.uuid().nullable().default(null),
    condicion: z.enum(["nuevo", "segunda_mano", "reacondicionado"]),
    notaCondicion: z.string().trim().max(300).default(""),
    sku: z.string().trim().max(40, "El código es muy largo.").default(""),
    fotos: z
      .array(z.url())
      .max(6, "Hasta seis fotos por producto.")
      .default([]),
    activo: z.boolean().default(true),
    destacado: z.boolean().default(false),
  })
  .superRefine((valores, ctx) => {
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

    // Quien compra usado quiere saber en qué estado está. Pedirlo acá evita
    // catálogos de segunda mano sin una sola descripción.
    if (valores.condicion !== "nuevo" && valores.notaCondicion.length < 10) {
      ctx.addIssue({
        code: "custom",
        path: ["notaCondicion"],
        message: "Cuenta en qué estado está: quien compra usado lo pregunta.",
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

/** Las etiquetas de la condición, en un solo lugar. */
export const CONDICIONES = [
  { valor: "nuevo", etiqueta: "Nuevo" },
  { valor: "segunda_mano", etiqueta: "Segunda mano" },
  { valor: "reacondicionado", etiqueta: "Reacondicionado" },
] as const
