import { z, type ZodType } from "zod"

import { AIError, type AIProviderName } from "./types"

/**
 * Construye la instrucción de formato que reciben todos los proveedores.
 * El esquema JSON sale del propio esquema zod, así que la instrucción y
 * la validación nunca se desincronizan.
 */
export function buildJsonInstruction(schema: ZodType, schemaName: string) {
  const jsonSchema = z.toJSONSchema(schema, { io: "output" })

  return [
    `Respondé únicamente con un JSON válido que represente un objeto "${schemaName}".`,
    "No incluyas explicaciones, comentarios ni bloques de código markdown.",
    "El JSON debe cumplir exactamente este JSON Schema:",
    JSON.stringify(jsonSchema, null, 2),
  ].join("\n")
}

/** Recorta ```json ... ``` y texto suelto alrededor del objeto. */
export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced ? fenced[1] : text).trim()

  const start = candidate.search(/[[{]/)
  if (start === -1) return candidate

  const openChar = candidate[start]
  const closeChar = openChar === "{" ? "}" : "]"
  const end = candidate.lastIndexOf(closeChar)

  return end > start ? candidate.slice(start, end + 1) : candidate.slice(start)
}

/** Parsea y valida con zod la respuesta cruda del modelo. */
export function parseAndValidate<T>(
  raw: string,
  schema: ZodType<T>,
  provider: AIProviderName
): T {
  let parsed: unknown

  try {
    parsed = JSON.parse(extractJson(raw))
  } catch (cause) {
    throw new AIError(
      `El modelo no devolvió JSON válido: ${raw.slice(0, 300)}`,
      provider,
      cause
    )
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    throw new AIError(
      `La respuesta del modelo no cumple el esquema:\n${z.prettifyError(result.error)}`,
      provider
    )
  }

  return result.data
}
