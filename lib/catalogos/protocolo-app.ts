import { z } from "zod"

import { propuestaDeCatalogoSchema } from "@/lib/ai/schemas"
import {
  bloqueSchema,
  CLAVES_HOJA,
  estiloSchema,
  packSchema,
  VARIANTES,
} from "@/lib/catalogos/modelo"

/**
 * Lo que se dicen la app móvil y el editor de catálogos que abre en su vista
 * previa (`/editor/app/catalogo`).
 *
 * Como en el editor de la tienda, la app dibuja sus controles y manda cambios;
 * esta página los aplica con las operaciones puras de
 * `lib/catalogos/operaciones.ts`, dibuja las hojas con las mismas variantes del
 * PDF y le devuelve el catálogo a la app. Todo lo que llega se valida.
 */

const id = z.string().min(1).max(64)
const tipoDeBloque = z.enum(
  Object.keys(VARIANTES) as [
    keyof typeof VARIANTES,
    ...(keyof typeof VARIANTES)[],
  ]
)

export const mensajeDeLaAppAlCatalogo = z.discriminatedUnion("tipo", [
  /** Los productos elegidos, en su orden. */
  z.object({ tipo: z.literal("productos"), ids: z.array(id).max(200) }),
  /** Mostrar la galería de plantillas armadas con los productos elegidos. */
  z.object({ tipo: z.literal("galeria") }),
  /** Volver a mostrar las hojas del catálogo. */
  z.object({ tipo: z.literal("hojas") }),
  z.object({
    tipo: z.literal("agregar"),
    bloque: tipoDeBloque,
    despuesDe: id.nullable(),
  }),
  z.object({ tipo: z.literal("cambiar"), bloque: bloqueSchema }),
  z.object({ tipo: z.literal("quitar"), id }),
  z.object({ tipo: z.literal("duplicar"), id }),
  z.object({
    tipo: z.literal("mover"),
    id,
    posicion: z.number().int().min(0),
  }),
  z.object({ tipo: z.literal("pack-agregar") }),
  z.object({ tipo: z.literal("pack-cambiar"), pack: packSchema }),
  z.object({ tipo: z.literal("pack-quitar"), id }),
  z.object({ tipo: z.literal("estilo"), estilo: estiloSchema }),
  z.object({ tipo: z.literal("nombre"), nombre: z.string().max(80) }),
  z.object({ tipo: z.literal("hoja"), hoja: z.enum(CLAVES_HOJA) }),
  /** Usar lo que propuso la IA: arma el catálogo entero de nuevo. */
  z.object({
    tipo: z.literal("propuesta"),
    propuesta: propuestaDeCatalogoSchema,
  }),
  z.object({ tipo: z.literal("enfocar"), id }),
  z.object({ tipo: z.literal("deshacer") }),
  z.object({ tipo: z.literal("rehacer") }),
  /** La app lo guardó: lo que hay es lo guardado. */
  z.object({ tipo: z.literal("guardado") }),
])

export type MensajeDeLaAppAlCatalogo = z.infer<typeof mensajeDeLaAppAlCatalogo>

/** Lo que la página le manda a la app. La app lo valida de su lado. */
export type MensajeDelCatalogoAlaApp =
  | {
      tipo: "estado"
      catalogo: unknown
      modo: "galeria" | "hojas"
      /** Las hojas que ocupa cada bloque, por su id. */
      hojasPorBloque: Record<string, number>
      faltantes: string[]
      problemasDeEstilo: string[]
      puedeDeshacer: boolean
      puedeRehacer: boolean
      sinGuardar: boolean
    }
  | { tipo: "tocar"; id: string }
  | { tipo: "sin-tienda" }
