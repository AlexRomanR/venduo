import { z } from "zod"

import { propuestaDeDemostracion } from "./mock-propuesta"
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
  name: "Zapatilla urbana Venduo",
  title: "Tienda de ejemplo",
  slug: "tienda-demo",
  description:
    "Contenido de ejemplo generado en modo demo. Configura AI_PROVIDER y AI_API_KEY para usar un modelo real.",
  summary: "Resumen de ejemplo del período analizado.",
  headline: "Vende más, con menos vueltas",
  tagline: "Tu tienda online, con stock y cobros incluidos",
  categor: "Calzado",
  hashtag: "venduo",
  currency: "BOB",
  color: "#0f172a",
  insight: "Las ventas crecen los fines de semana.",
  recommendation: "Refuerza el stock de los tres productos más vendidos.",
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
 * Consulta plausible a partir de palabras sueltas del pedido.
 *
 * No pretende entender: busca términos y devuelve una consulta que existe. Las
 * cifras son reales porque salen de la base igual que con un modelo de verdad
 * — lo simulado es la interpretación de la pregunta, no el dato.
 *
 * El orden de las ramas importa: la de vendedores va primero porque "han
 * vendido" contiene "vendid" y se comía las preguntas sobre la red.
 */
function sqlDeDemostracion(pedido: string) {
  const t = pedido.toLowerCase()

  if (/vendedor|comisi|red|qui[eé]n vende/.test(t)) {
    return {
      titulo: "Comisiones por vendedor",
      explicacion:
        "Comisiones confirmadas y pagadas de cada vendedor, de mayor a menor.",
      grafico: "barra",
      formato: "dinero",
      vistas: ["mis_comisiones"],
      sql: "select nombre as etiqueta, sum(amount_cents) as valor from mis_comisiones where status in ('confirmada','pagada') group by 1 order by 2 desc limit 15",
    }
  }

  if (/producto|art[ií]culo|m[aá]s vendid/.test(t)) {
    return {
      titulo: "Productos más vendidos",
      explicacion: "Unidades vendidas por producto, sin contar los cancelados.",
      grafico: "barra",
      formato: "cantidad",
      vistas: ["mis_items"],
      sql: "select product_name as etiqueta, sum(quantity) as valor from mis_items where status <> 'cancelado' group by 1 order by 2 desc limit 15",
    }
  }

  if (/inventario|stock|categor/.test(t)) {
    return {
      titulo: "Stock por categoría",
      explicacion: "Unidades en stock agrupadas por categoría del catálogo.",
      grafico: "barra",
      formato: "cantidad",
      vistas: ["mis_productos"],
      sql: "select coalesce(category, 'Sin categoría') as etiqueta, sum(stock) as valor from mis_productos where is_active group by 1 order by 2 desc limit 15",
    }
  }

  if (/semana/.test(t)) {
    return {
      titulo: "Ventas por semana",
      explicacion: "Ingresos por semana de los últimos 90 días.",
      grafico: "linea",
      formato: "dinero",
      vistas: ["mis_ventas"],
      sql: "select to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as etiqueta, sum(total_cents) as valor from mis_ventas where status <> 'cancelado' and created_at >= now() - interval '90 days' group by 1 order by 1",
    }
  }

  if (/mes|mensual/.test(t)) {
    return {
      titulo: "Ventas por mes",
      explicacion: "Ingresos por mes del último año.",
      grafico: "columna",
      formato: "dinero",
      vistas: ["mis_ventas"],
      sql: "select to_char(date_trunc('month', created_at), 'YYYY-MM') as etiqueta, sum(total_cents) as valor from mis_ventas where status <> 'cancelado' and created_at >= now() - interval '365 days' group by 1 order by 1",
    }
  }

  if (/estado|pendiente|cancelad/.test(t)) {
    return {
      titulo: "Pedidos por estado",
      explicacion: "Cuántos pedidos hay en cada estado.",
      grafico: "barra",
      formato: "cantidad",
      vistas: ["mis_ventas"],
      sql: "select status as etiqueta, count(*) as valor from mis_ventas group by 1 order by 2 desc",
    }
  }

  if (/cu[aá]nto vend|total|ingreso|factur/.test(t)) {
    return {
      titulo: "Ventas del período",
      explicacion: "Total facturado en los últimos 30 días.",
      grafico: "numero",
      formato: "dinero",
      vistas: ["mis_ventas"],
      sql: "select 'Total' as etiqueta, coalesce(sum(total_cents), 0) as valor from mis_ventas where status <> 'cancelado' and created_at >= now() - interval '30 days'",
    }
  }

  return {
    titulo: "Ventas por día",
    explicacion: "Ingresos diarios de los últimos 30 días.",
    grafico: "linea",
    formato: "dinero",
    vistas: ["mis_ventas"],
    sql: "select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as etiqueta, sum(total_cents) as valor from mis_ventas where status <> 'cancelado' and created_at >= now() - interval '30 days' group by 1 order by 1",
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
          "Define AI_PROVIDER, AI_MODEL y AI_API_KEY en .env.local para usar un modelo real.\n\n" +
          `Pedido recibido: ${last.slice(0, 280)}`,
        provider: "mock",
        model,
      }
    },

    async generateObject<T>(
      options: GenerateObjectOptions<T>
    ): Promise<GenerateObjectResult<T>> {
      // La consulta de inteligencia de negocio necesita un caso aparte. Derivar
      // el ejemplo del esquema daría siempre la misma respuesta, y un chat que
      // contesta lo mismo a cualquier pregunta se lee como roto, no como demo.
      if (options.schemaName === "InsightSql") {
        const pedido = options.messages.at(-1)?.content ?? ""
        const sugerido = sqlDeDemostracion(pedido)
        const validado = options.schema.safeParse(sugerido)

        if (validado.success) {
          return {
            object: validado.data,
            raw: JSON.stringify(sugerido, null, 2),
            provider: "mock",
            model,
          }
        }
      }

      // Lo mismo para la edición de la tienda: la propuesta sale del pedido y
      // de los ids reales de sus secciones, que vienen en el mensaje.
      if (options.schemaName === "PropuestaDeDiseno") {
        const pedido = options.messages.at(-1)?.content ?? ""
        const sugerida = propuestaDeDemostracion(pedido)
        const validada = options.schema.safeParse(sugerida)

        if (validada.success) {
          return {
            object: validada.data,
            raw: JSON.stringify(sugerida, null, 2),
            provider: "mock",
            model,
          }
        }
      }

      const jsonSchema = z.toJSONSchema(options.schema, {
        io: "output",
      }) as JsonSchema
      const defs = (jsonSchema.$defs ?? {}) as JsonSchema

      const sample = sampleFromSchema(jsonSchema, defs, options.schemaName)
      const result = options.schema.safeParse(sample)

      if (!result.success) {
        throw new AIError(
          `El modo demo no pudo generar un ejemplo para "${options.schemaName}". ` +
            "Configura un proveedor real de IA.",
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
