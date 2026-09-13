import { z } from "zod"

/**
 * Esquema del producto, compartido entre el formulario y la Server Action.
 * Vive fuera de `actions.ts` porque un archivo "use server" solo puede
 * exportar funciones async.
 */
export const productSchema = z.object({
  storeId: z.uuid("Falta la tienda."),
  name: z.string().min(2, "El nombre es muy corto.").max(120),
  description: z.string().max(600).optional().or(z.literal("")),
  price: z
    .number({ error: "Poné un precio." })
    .nonnegative("El precio no puede ser negativo."),
  stock: z.number().int().min(0).max(9999),
  category: z.string().max(60).optional().or(z.literal("")),
  imageUrl: z.url().optional().or(z.literal("")),
})

export type ProductInput = z.infer<typeof productSchema>
