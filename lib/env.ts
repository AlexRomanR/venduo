import { z } from "zod"

/**
 * Validación de variables de entorno con zod.
 *
 * Todo es opcional a propósito: el proyecto tiene que arrancar con
 * `npm run dev` recién clonado, sin credenciales. Cada capa consulta su
 * bandera `is*Configured` y, si falta configuración, cae en modo demo.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Capa de IA: el proveedor se elige por configuración, no por código.
  AI_PROVIDER: z
    .enum(["anthropic", "openai-compatible", "google", "mock"])
    .default("mock"),
  AI_MODEL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().url().optional(),

  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
})

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  AI_PROVIDER: process.env.AI_PROVIDER || undefined,
  AI_MODEL: process.env.AI_MODEL || undefined,
  AI_API_KEY: process.env.AI_API_KEY || undefined,
  AI_BASE_URL: process.env.AI_BASE_URL || undefined,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
})

if (!parsed.success) {
  console.warn(
    "[env] Variables de entorno inválidas, se usan los valores por defecto:\n" +
      z.prettifyError(parsed.error)
  )
}

export const env = parsed.success ? parsed.data : envSchema.parse({})

export const isSupabaseConfigured = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export const isAIConfigured =
  env.AI_PROVIDER === "mock" ? true : Boolean(env.AI_API_KEY)

export function getSiteUrl(): string {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}
