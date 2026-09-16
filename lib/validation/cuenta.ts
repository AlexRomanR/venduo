import { z } from "zod"

/** Opcional de verdad: un campo vacío del formulario llega como "". */
const opcional = (max: number) =>
  z.string().max(max).optional().or(z.literal(""))

/** Datos de la persona, comunes a los dos roles. */
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
  publicada: z.boolean(),
  aceptaVendedores: z.boolean(),
  comisionBps: z.number().int().min(0).max(5000),
  modoAlta: z.enum(["abierta", "con_aprobacion"]),
})

/** Identidad pública del vendedor: es lo que se ve en su historial laboral. */
export const vendedorSchema = z.object({
  nombre: z
    .string()
    .min(2, "Escribe cómo quieres que te vean.")
    .max(80, "Máximo 80 caracteres."),
  ciudad: opcional(60),
  bio: opcional(400),
  telefono: opcional(30),
})

export type PerfilInput = z.infer<typeof perfilSchema>
export type TiendaInput = z.infer<typeof tiendaSchema>
export type VendedorInput = z.infer<typeof vendedorSchema>
