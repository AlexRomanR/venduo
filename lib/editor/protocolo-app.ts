import { z } from "zod"

import {
  VISTAS,
  borradorSchema,
  rutaDeAjusteSchema,
} from "@/lib/editor/protocolo"
import { operacionSchema } from "@/lib/plantillas/borrador"

/**
 * Lo que se dicen la app móvil y el editor que abre en su vista previa.
 *
 * En la app, los controles son nativos y la tienda se ve en un WebView con
 * `/editor/app`. La app no sabe aplicar un cambio: manda **operaciones** —las
 * mismas que usan el editor de la web y la IA— y esta página las aplica con
 * `aplicarOperaciones`, las valida y le devuelve cómo quedó el borrador. Así
 * lo que la app deja hacer es exactamente lo que la web acepta, y una sección
 * o un ajuste nuevo llega a la app sin escribirlo dos veces.
 *
 * Todo lo que llega se valida: el WebView recibe texto y podría venir roto.
 * Sin dependencias de servidor.
 */

export const mensajeDeLaApp = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("operaciones"),
    operaciones: z.array(operacionSchema).min(1).max(60),
    /** Escribir seguido en un campo es un solo paso de deshacer. */
    agrupar: z.string().max(120).optional(),
  }),
  z.object({ tipo: z.literal("deshacer") }),
  z.object({ tipo: z.literal("rehacer") }),
  /** Vuelve a lo publicado: tira todos los cambios del borrador. */
  z.object({ tipo: z.literal("descartar") }),
  z.object({
    tipo: z.literal("vista"),
    vista: z.enum(VISTAS),
    productoId: z.string().nullable().optional(),
  }),
  z.object({ tipo: z.literal("seleccionar"), seccion: z.string().nullable() }),
  z.object({ tipo: z.literal("enfocar"), seccion: z.string() }),
  /** Llevar la vista hasta lo que cambia un ajuste y hacerlo latir. */
  z.object({ tipo: z.literal("senalar"), ruta: rutaDeAjusteSchema }),
  /**
   * Ver la tienda como en un celular o como en una computadora. Hay ajustes
   * que solo se notan en una de las dos: las columnas del catálogo son de la
   * pantalla ancha, la barra fija de compra es del celular.
   */
  z.object({
    tipo: z.literal("pantalla"),
    pantalla: z.enum(["celular", "computadora"]),
  }),
  /**
   * Mirar una propuesta de la IA sin aplicarla: se dibuja encima del borrador
   * y se marcan las secciones que toca. `null` vuelve al borrador.
   */
  z.object({
    tipo: z.literal("mirar"),
    operaciones: z.array(operacionSchema).max(60).nullable(),
  }),
  /** Lo que quedó publicado después de que la app publicó por la API. */
  z.object({ tipo: z.literal("publicado"), borrador: borradorSchema }),
  /** Qué hacer con un borrador guardado de una vez anterior. */
  z.object({ tipo: z.literal("recuperar"), si: z.boolean() }),
])

export type MensajeDeLaApp = z.infer<typeof mensajeDeLaApp>

export interface CambioParaLaApp {
  tipo: "apariencia" | "logo" | "seccion"
  texto: string
  color?: string
  colorAntes?: string
}

/** Lo que la página le manda a la app. La app lo valida de su lado. */
export type MensajeAlaApp =
  | {
      tipo: "estado"
      borrador: unknown
      publicado: unknown
      /** La apariencia que resulta: la base de la plantilla más lo cambiado. */
      apariencia: unknown
      hayCambios: boolean
      puedeDeshacer: boolean
      puedeRehacer: boolean
      /** Lo que impide publicar, en palabras. Vacío: se puede publicar. */
      problemas: string[]
      cambios: CambioParaLaApp[]
      /** Hay un borrador de otra vez para recuperar, guardado en esa fecha. */
      recuperable: number | null
    }
  | { tipo: "rechazado"; motivos: string[] }
  | { tipo: "seleccionar"; seccion: string }
  | { tipo: "fija"; nombre: string; ayuda: string }
  /** Lo que cambia ese ajuste no se ve en esta pantalla. */
  | { tipo: "sin-senal"; ruta: string }
  | { tipo: "sin-tienda" }
