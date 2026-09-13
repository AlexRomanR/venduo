import { getAIProvider } from "./index"
import {
  marketingCampaignSchema,
  salesInsightSchema,
  storeBlueprintSchema,
  type GenerateStoreRequest,
  type InsightsRequest,
  type MarketingCampaign,
  type SalesInsight,
  type StoreBlueprint,
} from "./schemas"

const BASE_SYSTEM =
  "Sos el asistente de Venduo, una plataforma que ayuda a emprendedores " +
  "de Latinoamérica a vender online. Escribís en español rioplatense, " +
  "claro y concreto, sin relleno."

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
          `Creá una tienda online para este negocio: ${input.prompt}`,
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
          "Generá posts listos para publicar en distintos canales.",
        ].join("\n"),
      },
    ],
  })

  return { campaign: object, provider, model }
}
