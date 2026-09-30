import { z } from "zod"

import { personalizacionSchema } from "@/lib/plantillas/apariencia"
import { TIPOS_DE_BLOQUE } from "@/lib/plantillas/bloques"
import type { Borrador } from "@/lib/plantillas/borrador"

/**
 * Lo que se dicen el editor y su vista previa.
 *
 * La vista previa es un `<iframe>` con la tienda real: así el modo celular
 * responde a su propio ancho, como en un teléfono, y los colores del borrador
 * tiñen la tienda sin teñir los controles del editor. Los dos lados son del
 * mismo origen, pero igual se valida cada mensaje: la apariencia que llega
 * termina dentro de una etiqueta `<style>`.
 *
 * Sin dependencias de servidor.
 */

export const VISTAS = ["inicio", "catalogo", "producto", "carrito"] as const
export type Vista = (typeof VISTAS)[number]

const seccionSchema = z.object({
  id: z.string().min(1).max(64),
  tipo: z.enum(TIPOS_DE_BLOQUE),
  visible: z.boolean(),
  props: z.record(z.string(), z.unknown()),
})

/** La forma de un borrador, sin juzgar su contenido: eso lo hacen las operaciones. */
export const borradorSchema = z.object({
  personalizacion: personalizacionSchema,
  logoUrl: z.string().nullable(),
  secciones: z.array(seccionSchema).max(40),
})

export const mensajeAlaVistaPrevia = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("estado"),
    borrador: borradorSchema,
    vista: z.enum(VISTAS),
    productoId: z.string().nullable(),
    seleccion: z.string().nullable(),
    /** Las secciones que cambió la propuesta que se está mirando. */
    marcas: z.array(z.string()),
  }),
  z.object({ tipo: z.literal("enfocar"), seccion: z.string() }),
])

export const mensajeAlEditor = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("lista") }),
  z.object({ tipo: z.literal("seleccionar"), seccion: z.string() }),
  z.object({
    tipo: z.literal("soltar-imagen"),
    seccion: z.string(),
    archivo: z.instanceof(File),
  }),
])

export type MensajeAlaVistaPrevia = z.infer<typeof mensajeAlaVistaPrevia>
export type MensajeAlEditor = z.infer<typeof mensajeAlEditor>

/**
 * El mensaje de estado que arma el editor. Tiparlo con el `Borrador` del editor
 * hace que un cambio en su forma que la vista previa no acepte no compile.
 */
export type EstadoParaLaVistaPrevia = Extract<
  MensajeAlaVistaPrevia,
  { tipo: "estado" }
> & { borrador: Borrador }
