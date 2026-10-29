import { z } from "zod"

import { LIMITES_DE_CARGA } from "@/lib/carga"
import {
  MAXIMO_DE_OPCIONES,
  MAXIMO_DE_VALORES,
  MAXIMO_DE_VARIANTES,
} from "@/lib/variantes"

/**
 * Un borrador listo para crearse: lo que la persona revisó. Los mismos topes
 * que el formulario del producto (`productoSchema`); los montos en bolivianos.
 * Las fotos se vuelven a comprobar en la acción: tienen que ser de la carpeta
 * de la tienda.
 */
export const borradorParaCrearSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Falta el nombre.")
    .max(120, "El nombre es muy largo."),
  precio: z
    .number({ error: "Falta el precio." })
    .nonnegative("El precio no puede ser negativo.")
    .max(9_999_999, "Ese precio es demasiado alto."),
  stock: z.number().int().min(0).max(999_999),
  categoria: z.string().trim().max(60).nullable(),
  descripcion: z.string().trim().max(600),
  codigo: z.string().trim().max(40).nullable(),
  costo: z.number().nonnegative().max(9_999_999).nullable(),
  fotos: z.array(z.url()).max(6),
  /** Talla y color, si la planilla los traía. La base vuelve a validarlo. */
  opciones: z
    .array(
      z.object({
        nombre: z.string().trim().min(1).max(30),
        valores: z
          .array(z.string().trim().min(1).max(30))
          .min(1)
          .max(MAXIMO_DE_VALORES),
      })
    )
    .max(MAXIMO_DE_OPCIONES),
  variantes: z
    .array(
      z.object({
        valores: z.record(z.string(), z.string().max(30)),
        stock: z.number().int().min(0).max(999_999),
        precio: z.number().nonnegative().max(9_999_999).nullable(),
      })
    )
    .max(MAXIMO_DE_VARIANTES),
})

export const crearProductosSchema = z.object({
  borradores: z
    .array(borradorParaCrearSchema)
    .min(1, "No hay productos para crear.")
    .max(LIMITES_DE_CARGA.productos, "Son demasiados productos de una vez."),
  visibles: z.boolean(),
})

export type BorradorParaCrear = z.infer<typeof borradorParaCrearSchema>
