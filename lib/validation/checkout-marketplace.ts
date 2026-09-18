import { z } from "zod"

export const datosCompradorSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  telefono: z
    .string()
    .trim()
    .min(7, "Escribe un WhatsApp válido.")
    .max(30, "Ese número es demasiado largo."),
  correo: z.string().trim().email("Revisa tu correo.").or(z.literal("")),
})

export const checkoutMarketplaceSchema = datosCompradorSchema.extend({
  items: z
    .array(
      z.object({
        productoId: z.uuid("Uno de los productos no es válido."),
        cantidad: z.number().int().min(1).max(99),
        referido: z.string().trim().max(20).nullable(),
      })
    )
    .min(1, "Tu carrito está vacío.")
    .max(40, "Tu carrito tiene demasiados productos."),
})

export type DatosComprador = z.infer<typeof datosCompradorSchema>
export type CheckoutMarketplaceInput = z.infer<typeof checkoutMarketplaceSchema>
