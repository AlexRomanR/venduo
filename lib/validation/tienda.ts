import { z } from "zod"

/**
 * El WhatsApp de la tienda, que es a donde llega cada pedido.
 *
 * Se cuentan las cifras y no el texto: la gente lo escribe con espacios,
 * guiones o el +591 adelante, y todo eso vale. Ocho cifras es un celular de
 * Bolivia; hasta quince, uno con su código de país. `create_store` vuelve a
 * comprobarlo: este esquema es comodidad de la interfaz, no la defensa.
 */
export const whatsappDeTienda = z
  .string()
  .trim()
  .refine((valor) => {
    const cifras = soloCifras(valor).length
    return cifras >= 8 && cifras <= 15
  }, "Escribe el WhatsApp de tu tienda: tu celular, con sus 8 cifras.")

/** Lo que se guarda del número: solo las cifras, sin espacios ni signos. */
export function soloCifras(valor: string): string {
  return valor.replace(/\D/g, "")
}

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
  whatsapp: whatsappDeTienda,
})

export type CrearTiendaInput = z.infer<typeof crearTiendaSchema>
