import { z } from "zod"

import {
  AIError,
  type AIProvider,
  type GenerateObjectOptions,
  type GenerateObjectResult,
  type GenerateTextResult,
} from "../types"

type JsonSchema = Record<string, unknown>

/** Textos de relleno según el nombre del campo, para que la demo se lea bien. */
const SAMPLE_TEXT: Record<string, string> = {
  name: "Café de especialidad Venduo",
  title: "Tienda de ejemplo",
  slug: "tienda-demo",
  description:
    "Contenido de ejemplo generado en modo demo. Configurá AI_PROVIDER y AI_API_KEY para usar un modelo real.",
  summary: "Resumen de ejemplo del período analizado.",
  headline: "Vendé más, con menos vueltas",
  tagline: "Tu tienda online lista en minutos",
  categor: "Café",
  hashtag: "venduo",
  currency: "ARS",
  color: "#0f172a",
  insight: "Las ventas crecen los fines de semana.",
  recommendation: "Reforzá el stock de los tres productos más vendidos.",
  channel: "Instagram",
  message: "Mensaje de marketing de ejemplo.",
}

function sampleString(key: string): string {
  const normalized = key.toLowerCase()
  for (const [needle, value] of Object.entries(SAMPLE_TEXT)) {
    if (normalized.includes(needle)) return value
  }
  return `Ejemplo de ${key || "texto"}`
}

function resolve(schema: JsonSchema, defs: JsonSchema): JsonSchema {
  const ref = schema.$ref
  if (typeof ref !== "string") return schema

  const key = ref.replace(/^#\/\$defs\//, "")
  return (defs[key] as JsonSchema | undefined) ?? {}
}

/** Genera un valor de ejemplo que cumple el JSON Schema recibido. */
function sampleFromSchema(
  input: JsonSchema,
  defs: JsonSchema,
  key = ""
): unknown {
  const schema = resolve(input, defs)

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[0]
  }
  if (schema.const !== undefined) return schema.const

  const union = (schema.anyOf ?? schema.oneOf) as JsonSchema[] | undefined
  if (union?.length) {
    const first =
      union.find((s) => resolve(s, defs).type !== "null") ?? union[0]
    return sampleFromSchema(first, defs, key)
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

  switch (type) {
    case "object": {
      const properties = (schema.properties ?? {}) as Record<string, JsonSchema>
      const out: Record<string, unknown> = {}
      for (const [name, property] of Object.entries(properties)) {
        out[name] = sampleFromSchema(property, defs, name)
      }
      return out
    }
    case "array": {
      const items = (schema.items ?? {}) as JsonSchema
      const min = typeof schema.minItems === "number" ? schema.minItems : 2
      return Array.from({ length: Math.max(min, 2) }, (_, i) => {
        const value = sampleFromSchema(items, defs, key)
        // Numerar los elementos de texto para que la demo no se vea repetida.
        return typeof value === "string" ? `${value} ${i + 1}` : value
      })
    }
    case "integer":
    case "number": {
      const min = typeof schema.minimum === "number" ? schema.minimum : 1
      return Math.max(min, /price|cents|amount|total/i.test(key) ? 4500 : 12)
    }
    case "boolean":
      return true
    case "null":
      return null
    default:
      return sampleString(key)
  }
}

/**
 * Proveedor por defecto cuando no hay ninguna API key configurada.
 * Deriva la respuesta del propio esquema zod, así que siempre valida
 * y el proyecto se puede levantar y demostrar sin credenciales.
 */
export function createMockProvider(
  config: { model?: string } = {}
): AIProvider {
  const model = config.model ?? "demo"

  return {
    name: "mock",
    model,

    async generateText(options): Promise<GenerateTextResult> {
      const last = options.messages.at(-1)?.content ?? ""
      return {
        text:
          "[modo demo] No hay proveedor de IA configurado. " +
          "Definí AI_PROVIDER, AI_MODEL y AI_API_KEY en .env.local para usar un modelo real.\n\n" +
          `Pedido recibido: ${last.slice(0, 280)}`,
        provider: "mock",
        model,
      }
    },

    async generateObject<T>(
      options: GenerateObjectOptions<T>
    ): Promise<GenerateObjectResult<T>> {
      const jsonSchema = z.toJSONSchema(options.schema, {
        io: "output",
      }) as JsonSchema
      const defs = (jsonSchema.$defs ?? {}) as JsonSchema

      const sample = sampleFromSchema(jsonSchema, defs, options.schemaName)
      const result = options.schema.safeParse(sample)

      if (!result.success) {
        throw new AIError(
          `El modo demo no pudo generar un ejemplo para "${options.schemaName}". ` +
            "Configurá un proveedor real de IA.",
          "mock"
        )
      }

      return {
        object: result.data,
        raw: JSON.stringify(sample, null, 2),
        provider: "mock",
        model,
      }
    },
  }
}
