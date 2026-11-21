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
  /**
   * Usar lo que propuso la IA. Con un catálogo armado conserva lo editado y
   * cambia los productos, el nombre y el texto de la portada, como en la web;
   * sin catálogo, lo arma entero.
   */
  z.object({
    tipo: z.literal("propuesta"),
    propuesta: propuestaDeCatalogoSchema,
  }),
  /** Mostrar la propuesta en la vista previa sin aplicarla; `null` vuelve a lo de antes. */
  z.object({
    tipo: z.literal("mirar"),
    propuesta: propuestaDeCatalogoSchema.nullable(),
  }),
  z.object({ tipo: z.literal("enfocar"), id }),
  /** Lo que se dejó sin guardar la otra vez: seguir con eso o empezar de lo guardado. */
  z.object({ tipo: z.literal("recuperar"), si: z.boolean() }),
  z.object({ tipo: z.literal("deshacer") }),
  z.object({ tipo: z.literal("rehacer") }),
  /**
   * La app lo guardó: lo que hay es lo guardado. Trae su id si es la primera
   * vez, para que el borrador del teléfono quede a su nombre.
   */
  z.object({ tipo: z.literal("guardado"), id: id.optional() }),
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
      /**
       * Los estilos de la tienda para el panel Estilo: se aplican mandando su
       * `estilo`. `muestra` son sus tres colores ya resueltos, para dibujarlos.
       */
      sugeridos: {
        clave: string
        nombre: string
        estilo: unknown
        muestra: { papel: string; tinta: string; acento: string }
      }[]
      /** El estilo con los colores y la letra de la tienda: "De tu tienda". */
      estiloDeTienda: unknown
      /**
       * Cuándo se dejó sin guardar lo que quedó en este teléfono, si hay algo
       * distinto de lo guardado. La app pregunta si seguir con eso.
       */
      recuperable: number | null
    }
  | { tipo: "tocar"; id: string }
  | { tipo: "sin-tienda" }
