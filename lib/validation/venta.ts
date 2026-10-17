import { z } from "zod"

/**
 * Una venta directa: lo que se vendió fuera de la tienda —en el chat o en
 * persona— y la tienda registra para que el stock y las estadísticas digan la
 * verdad. No lleva datos de quien compra.
 *
 * El precio entra en bolivianos, que es lo que la persona escribe, y la acción
 * lo pasa a centavos. Es el que se cobró de verdad: puede llevar una rebaja.
 */
export const ventaSchema = z.object({
  lineas: z
    .array(
      z.object({
        productoId: z.string().min(1).max(64),
        /** La opción que se vendió, si el producto las tiene. */
        varianteId: z.string().min(1).max(64).nullable().default(null),
        cantidad: z
          .number()
          .int("Las unidades van enteras.")
          .min(1, "Pon al menos una unidad.")
          .max(999, "Son demasiadas unidades."),
        precio: z
          .number({ error: "Pon el precio al que lo vendiste." })
          .nonnegative("El precio no puede ser negativo.")
          .max(1_000_000, "Ese precio es demasiado alto."),
      })
    )
    .min(1, "Elige al menos un producto.")
    .max(50, "Son demasiados productos para una venta."),
})

export type VentaInput = z.input<typeof ventaSchema>
