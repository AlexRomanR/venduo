import { z } from "zod"

/**
 * Comisiones sugeridas al crear la tienda, en puntos básicos.
 *
 * No son redondas por capricho: cubren lo que se paga de verdad en el comercio
 * boliviano. Un margen apretado —electrónica, abarrotes— no aguanta más de 5%;
 * el 10% es lo habitual en indumentaria y es la cifra que la portada promete;
 * y el 20% aparece donde el margen es alto o la venta cuesta convencerla.
 * Para todo lo que quede entre medio está el valor personalizado.
 */
export const COMISIONES = [500, 800, 1000, 1500, 2000] as const

/** Tope que el servidor también impone: nadie declara un 90%. */
export const COMISION_MAXIMA_BPS = 5000

/**
 * Alta de la tienda, compartido entre el formulario del paso 2 y la llamada a
 * `create_store`. El slug no está acá: lo resuelve el servidor, porque tiene
 * que ser único entre todas las tiendas vivas.
 */
export const crearTiendaSchema = z.object({
  nombre: z
    .string()
    .min(2, "Escribe el nombre de tu negocio.")
    .max(60, "Máximo 60 caracteres."),
  // El mínimo no es capricho: con menos de una frase la IA no tiene de dónde
  // sacar el catálogo ni los textos en el paso siguiente.
  descripcion: z
    .string()
    .min(30, "Cuéntanos un poco más, con una o dos frases alcanza.")
    .max(600, "Máximo 600 caracteres."),
  aceptaVendedores: z.boolean(),
  // En puntos básicos y entero, como manda el sistema. El servidor lo vuelve
  // a acotar: este esquema es comodidad de la interfaz, no la defensa.
  comisionBps: z.number().int().min(0).max(5000),
})

export type CrearTiendaInput = z.infer<typeof crearTiendaSchema>
