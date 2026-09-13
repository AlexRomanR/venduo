import { z } from "zod"

/* -------------------------------------------------------------------------
 * Entradas (formularios y cuerpos de request)
 * ---------------------------------------------------------------------- */

export const generateStoreRequestSchema = z.object({
  prompt: z
    .string()
    .min(15, "Contá un poco más sobre el negocio (mínimo 15 caracteres).")
    .max(2000),
  currency: z.string().length(3).default("ARS"),
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

export const marketingCampaignSchema = z.object({
  objective: z.string().min(1).max(200),
  posts: z
    .array(
      z.object({
        channel: z.enum(["instagram", "whatsapp", "email", "tiktok"]),
        hook: z.string().min(1).max(140),
        body: z.string().min(1).max(800),
        hashtags: z.array(z.string().min(1).max(40)).max(10),
      })
    )
    .min(1)
    .max(4),
})
export type MarketingCampaign = z.infer<typeof marketingCampaignSchema>
