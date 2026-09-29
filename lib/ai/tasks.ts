import { ESQUEMA, REGLAS_SQL } from "@/lib/insights/esquema"
import { getAIProvider } from "./index"
import {
  insightSqlSchema,
  marketingCampaignSchema,
  salesInsightSchema,
  storeBlueprintSchema,
  type GenerateStoreRequest,
  type InsightSql,
  type InsightsRequest,
  type MarketingCampaign,
  type SalesInsight,
  type StoreBlueprint,
} from "./schemas"

const BASE_SYSTEM =
  "Eres el asistente de Venduo, una plataforma que ayuda a emprendedores " +
  "bolivianos a vender online. Escribes en español neutro de Bolivia, " +
  "tratando de tú, claro y concreto, sin relleno. Los montos son en " +
  "bolivianos."

/** Genera la tienda completa (datos + catálogo + copy) a partir de una idea. */
export async function generateStoreBlueprint(
  input: GenerateStoreRequest
): Promise<{ blueprint: StoreBlueprint; provider: string; model: string }> {
  const ai = getAIProvider()

  const { object, provider, model } = await ai.generateObject({
    schema: storeBlueprintSchema,
    schemaName: "StoreBlueprint",
    system: BASE_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          `Crea una tienda online para este negocio: ${input.prompt}`,
          `Moneda: ${input.currency}. Cantidad de productos: ${input.productCount}.`,
          "Los precios van en centavos (enteros) y tienen que ser realistas para el mercado local.",
        ].join("\n"),
      },
    ],
  })

  return { blueprint: object, provider, model }
}

/** Análisis conversacional sobre las ventas del período. */
export async function analyzeSales(
  input: InsightsRequest
): Promise<{ insight: SalesInsight; provider: string; model: string }> {
  const ai = getAIProvider()

  const { object, provider, model } = await ai.generateObject({
    schema: salesInsightSchema,
    schemaName: "SalesInsight",
    system: BASE_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          `Pregunta del vendedor: ${input.question}`,
          "Series de ventas (JSON, montos en centavos):",
          JSON.stringify(input.sales),
        ].join("\n"),
      },
    ],
  })

  return { insight: object, provider, model }
}

/**
 * Traduce una pregunta en palabras a una consulta SQL.
 *
 * Hace los tres pasos —qué gráfico, qué vistas, qué consulta— en **una sola
 * llamada**. Encadenar tres viajes al modelo para una pregunta que no cambia
 * entre uno y otro cuesta tres veces más y triplica las oportunidades de que
 * algo se pierda por el camino; pedirle que razone en ese orden dentro de un
 * mismo esquema da el mismo razonamiento por un tercio del precio.
 *
 * `anterior` es lo que permite seguir editando por chat: el modelo ve la
 * consulta que está en pantalla y la modifica en vez de empezar de cero.
 */
export async function buildInsightSql(input: {
  pregunta: string
  anterior?: InsightSql | null
  hoy: string
}): Promise<{ consulta: InsightSql; provider: string; model: string }> {
  const ai = getAIProvider()

  const { object, provider, model } = await ai.generateObject({
    schema: insightSqlSchema,
    schemaName: "InsightSql",
    system: [
      BASE_SYSTEM,
      "Traduces preguntas sobre el negocio a una consulta SQL de PostgreSQL.",
      "",
      "Razona en este orden:",
      "1. Qué forma pide la pregunta. Una evolución en el tiempo es linea o",
      "   area; pocos períodos, columna; un ranking o una comparación entre",
      "   categorías, barra; una sola cifra, numero; muchas filas donde el",
      "   detalle importa, tabla.",
      "   Si la persona nombra un tipo de gráfico, usa ese y no el que habrías",
      "   elegido. Es su pantalla.",
      "   No hay torta ni dona, y no se pueden agregar: la paleta es un solo",
      "   rojo, así que el color no puede separar categorías. Si las piden, usa",
      "   barra ordenada de mayor a menor —que responde lo mismo y se lee",
      "   mejor— y dilo en la explicación en una frase, sin pedir disculpas.",
      "2. Qué vistas hacen falta para responderla.",
      "3. La consulta.",
      "",
      "Esquema disponible:",
      ESQUEMA,
      "",
      "Reglas de la consulta:",
      REGLAS_SQL,
    ].join("\n"),
    messages: [
      {
        role: "user",
        content: [
          `Hoy es ${input.hoy}.`,
          input.anterior
            ? `La consulta en pantalla es:\n${input.anterior.sql}\nLa persona quiere modificarla.`
            : "No hay ninguna consulta en pantalla todavía.",
          `Pregunta: ${input.pregunta}`,
        ].join("\n"),
      },
    ],
  })

  return { consulta: object, provider, model }
}

/** Campaña de marketing multicanal para una tienda. */
export async function generateCampaign(input: {
  storeName: string
  audience: string
  objective: string
}): Promise<{ campaign: MarketingCampaign; provider: string; model: string }> {
  const ai = getAIProvider()

  const { object, provider, model } = await ai.generateObject({
    schema: marketingCampaignSchema,
    schemaName: "MarketingCampaign",
    system: BASE_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          `Tienda: ${input.storeName}`,
          `Público: ${input.audience}`,
          `Objetivo: ${input.objective}`,
          "Genera publicaciones listas para usar en distintos canales.",
        ].join("\n"),
      },
    ],
  })

  return { campaign: object, provider, model }
}
