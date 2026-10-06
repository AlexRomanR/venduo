import { z } from "zod"

import { whatsappDeTienda } from "@/lib/validation/tienda"

/** Opcional de verdad: un campo vacío del formulario llega como "". */
const opcional = (max: number) =>
  z.string().max(max).optional().or(z.literal(""))

/** Datos de la persona. */
export const perfilSchema = z.object({
  nombre: z
    .string()
    .min(2, "Escribe tu nombre.")
    .max(80, "Máximo 80 caracteres."),
})

/** Ajustes de la tienda. El slug no está: cambiarlo rompe los QR impresos. */
export const tiendaSchema = z.object({
  nombre: z
    .string()
    .min(2, "Escribe el nombre de tu negocio.")
    .max(60, "Máximo 60 caracteres."),
  tagline: opcional(140),
  descripcion: opcional(600),
  // Obligatorio también acá: borrarlo dejaría el botón de compra de la tienda
  // sin nadie del otro lado.
  whatsapp: whatsappDeTienda,
  publicada: z.boolean(),
})

export type PerfilInput = z.infer<typeof perfilSchema>
export type TiendaInput = z.infer<typeof tiendaSchema>
