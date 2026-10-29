import { z } from "zod"

import { CURRENCY } from "@/lib/format"
import { RUTAS_DE_AJUSTE } from "@/lib/plantillas/apariencia"
import { TIPOS_DE_BLOQUE } from "@/lib/plantillas/bloques"
import { CLAVES_PLANTILLA } from "@/lib/catalogos/modelo"

/* -------------------------------------------------------------------------
 * Entradas (formularios y cuerpos de request)
 * ---------------------------------------------------------------------- */

export const generateStoreRequestSchema = z.object({
  prompt: z
    .string()
    .min(15, "Cuenta un poco más sobre el negocio (mínimo 15 caracteres).")
    .max(2000),
  // La moneda del sistema es el boliviano, no el peso argentino con el que
  // venía este esquema.
  currency: z.string().length(3).default(CURRENCY),
  productCount: z.number().int().min(3).max(12).default(6),
})
export type GenerateStoreRequest = z.infer<typeof generateStoreRequestSchema>

export const insightsRequestSchema = z.object({
  question: z.string().min(5).max(500),
  sales: z
    .array(
      z.object({
        date: z.string(),
        revenueCents: z.number().int().nonnegative(),
        orders: z.number().int().nonnegative(),
      })
    )
    .min(1),
})
export type InsightsRequest = z.infer<typeof insightsRequestSchema>

/* -------------------------------------------------------------------------
 * Salidas de la IA (se validan con estos esquemas antes de usarse)
 * ---------------------------------------------------------------------- */

export const generatedProductSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(600),
  priceCents: z.number().int().min(0),
  category: z.string().min(1).max(60),
  stock: z.number().int().min(0).max(9999),
})
export type GeneratedProduct = z.infer<typeof generatedProductSchema>

export const storeBlueprintSchema = z.object({
  store: z.object({
    name: z.string().min(1).max(80),
    slug: z
      .string()
      .min(1)
      .max(60)
      .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones."),
    tagline: z.string().min(1).max(140),
    description: z.string().min(1).max(800),
    currency: z.string().length(3),
  }),
  categories: z.array(z.string().min(1).max(60)).min(1).max(8),
  products: z.array(generatedProductSchema).min(1).max(12),
  marketing: z.object({
    headline: z.string().min(1).max(140),
    instagramCaption: z.string().min(1).max(600),
    whatsappMessage: z.string().min(1).max(600),
  }),
})
export type StoreBlueprint = z.infer<typeof storeBlueprintSchema>

export const salesInsightSchema = z.object({
  summary: z.string().min(1).max(800),
  insights: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        detail: z.string().min(1).max(500),
        impact: z.enum(["alto", "medio", "bajo"]),
      })
    )
    .min(1)
    .max(5),
  recommendations: z.array(z.string().min(1).max(300)).min(1).max(5),
})
export type SalesInsight = z.infer<typeof salesInsightSchema>

/**
 * Lo que la IA devuelve para una pregunta de inteligencia de negocio.
 *
 * Escribe la consulta. Lo que la hace segura no es confiar en el modelo sino
 * dónde corre: `run_insight_sql` la ejecuta en una transacción de solo lectura
 * —Postgres rechaza cualquier escritura— y solo contra vistas ya acotadas a la
 * tienda de quien pregunta, donde `store_id` ni siquiera existe.
 *
 * El contrato de columnas es lo que permite dibujar sin adivinar: toda consulta
 * devuelve `etiqueta` y `valor`.
 */
export const insightSqlSchema = z.object({
  titulo: z.string().min(1).max(60),
  /** Qué se va a mostrar y de dónde sale, en una frase. */
  explicacion: z.string().min(1).max(300),
  /** Paso 1 del razonamiento: qué forma pide la pregunta. */
  grafico: z.enum(["linea", "area", "columna", "barra", "numero", "tabla"]),
  /** Si `valor` son centavos o un conteo. Decide cómo se formatea. */
  formato: z.enum(["dinero", "cantidad"]),
  /** Paso 2: qué vistas hacen falta. Se pide explícito para poder auditarlo. */
  vistas: z
    .array(
      z.enum([
        "mis_ventas",
        "mis_items",
        "mis_productos",
        "mis_variantes",
        "mis_visitas",
      ])
    )
    .min(1)
    .max(5),
  /** Paso 3: la consulta. Devuelve `etiqueta` y `valor`, nada más. */
  sql: z.string().min(10).max(2000),
})
export type InsightSql = z.infer<typeof insightSqlSchema>

/**
 * Los textos para publicar un producto en redes, uno por canal.
 *
 * Sin el precio ni el enlace: los agrega el sistema al final, con los datos
 * de la base. Un precio escrito por el modelo puede salir mal, y en una
 * publicación eso es una promesa a quien compra.
 */
export const publicacionesSchema = z.object({
  whatsapp: z
    .string()
    .min(1)
    .max(320)
    .describe(
      "Para el estado o un mensaje de WhatsApp: dos o tres líneas, directo."
    ),
  instagram: z
    .string()
    .min(1)
    .max(500)
    .describe(
      "Para Instagram y TikTok: la primera línea engancha; después, dos o tres frases cortas."
    ),
  facebook: z
    .string()
    .min(1)
    .max(700)
    .describe(
      "Para Facebook y Marketplace: más descriptivo, con lo que alguien pregunta antes de comprar."
    ),
  hashtags: z
    .array(
      z
        .string()
        .regex(/^#?[\p{L}\p{N}_]{2,30}$/u)
        .describe("Una palabra, sin espacios.")
    )
    .min(3)
    .max(8),
})
export type Publicaciones = z.infer<typeof publicacionesSchema>

/**
 * Lo que la IA propone para la tienda: operaciones, nunca el estado final.
 *
 * Son las mismas operaciones que usa el editor a mano, salvo el logo, que la
 * IA no puede subir. Este esquema solo mira la forma: si una sección existe,
 * si un color se lee o si una categoría es de la tienda lo decide
 * `aplicarOperaciones`, que corre después y es todo o nada.
 */
const propiedadesDeSeccion = z
  .record(z.string(), z.unknown())
  .describe("Solo los campos que cambian, con sus claves exactas.")

export const operacionDeIaSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("apariencia"),
    ruta: z.enum(RUTAS_DE_AJUSTE),
    valor: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  }),
  z.object({ op: z.literal("restablecer"), ruta: z.enum(RUTAS_DE_AJUSTE) }),
  z.object({
    op: z.literal("agregar"),
    tipo: z.enum(TIPOS_DE_BLOQUE),
    posicion: z.number().int().min(0),
    props: propiedadesDeSeccion,
  }),
  z.object({
    op: z.literal("editar"),
    seccion: z.string().describe("El id exacto de la sección."),
    props: propiedadesDeSeccion,
  }),
  z.object({
    op: z.literal("mover"),
    seccion: z.string(),
    posicion: z.number().int().min(0),
  }),
  z.object({
    op: z.literal("mostrar"),
    seccion: z.string(),
    visible: z.boolean(),
  }),
  z.object({ op: z.literal("quitar"), seccion: z.string() }),
])

export const propuestaDeDisenoSchema = z.object({
  /** Qué va a cambiar, en una frase y en primera persona. */
  resumen: z.string().min(1).max(280),
  operaciones: z.array(operacionDeIaSchema).max(20),
})
export type PropuestaDeDiseno = z.infer<typeof propuestaDeDisenoSchema>

/* -------------------------------------------------------------------------
 * Catálogos en PDF
 * ---------------------------------------------------------------------- */

/**
 * Un catálogo propuesto desde una frase: qué productos, en qué orden, con qué
 * plantilla y cómo se llama. Nunca precios: el modelo elige ids de la lista que
 * recibe, y el sistema descarta los que no son de la tienda antes de armarlo.
 */
export const propuestaDeCatalogoSchema = z.object({
  /** El nombre del catálogo, corto: "Zapatillas en oferta". */
  nombre: z.string().min(1).max(60),
  plantilla: z.enum(CLAVES_PLANTILLA),
  /** Los ids elegidos, en el orden en que tienen que aparecer. */
  productos: z.array(z.string().min(1).max(64)).min(1).max(60),
  /** La bajada de la portada, una línea. */
  bajada: z.string().max(160),
  /** Por qué eligió eso, para que la persona decida. */
  explicacion: z.string().min(1).max(280),
})
export type PropuestaDeCatalogo = z.infer<typeof propuestaDeCatalogoSchema>

/* -------------------------------------------------------------------------
 * Cargar productos de una vez
 * ---------------------------------------------------------------------- */

/**
 * Los productos que la IA lee de fotos o de una lista escrita. Nunca inventa
 * un precio: si no se lee, va `null` y la persona lo completa. La pantalla
 * vuelve a validar cada uno contra el esquema del producto al crearlo.
 */
export const borradoresDeProductosSchema = z.object({
  borradores: z
    .array(
      z.object({
        /** Vacío si no se pudo leer: la persona lo escribe. */
        nombre: z.string().max(120),
        /** En bolivianos, tal como estaba escrito. `null` si no se ve. */
        precio: z.number().nonnegative().max(9_999_999).nullable(),
        stock: z.number().int().min(0).max(999_999).nullable(),
        categoria: z.string().max(60).nullable(),
        descripcion: z.string().max(300),
        /** Con fotos de productos: el número de la foto, desde 0. */
        foto: z.number().int().min(0).max(39).nullable(),
        /** Lo que no se pudo leer, en pocas palabras: "no se ve el precio". */
        duda: z.string().max(120).nullable(),
      })
    )
    .max(60),
  aviso: z.string().max(200).nullable(),
})
export type BorradoresDeProductos = z.infer<typeof borradoresDeProductosSchema>

/**
 * Qué es cada columna de una planilla, deducido por su encabezado y por lo
 * que contienen sus celdas, y si la lectura está segura. Lo dudoso se le
 * pregunta a la persona. El sistema lee todas las filas con esto: la IA no
 * reescribe —ni inventa— cientos de productos.
 */
export const lecturaDePlanillaSchema = z.object({
  filaDeEncabezado: z.number().int().min(0).max(20).nullable(),
  columnas: z
    .array(
      z.object({
        columna: z.number().int().min(0).max(49),
        campo: z
          .enum([
            "nombre",
            "precio",
            "stock",
            "categoria",
            "talla",
            "color",
            "descripcion",
            "codigo",
            "costo",
          ])
          .nullable(),
        seguro: z.boolean(),
      })
    )
    .max(50),
  aviso: z.string().max(200).nullable(),
})
export type LecturaDePlanilla = z.infer<typeof lecturaDePlanillaSchema>
