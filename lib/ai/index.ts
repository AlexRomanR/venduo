import { env } from "@/lib/env"

import { createAnthropicProvider } from "./providers/anthropic"
import { createGoogleProvider } from "./providers/google"
import { createMockProvider } from "./providers/mock"
import { createOpenAICompatibleProvider } from "./providers/openai-compatible"
import type { AIProvider, AIProviderName } from "./types"

export * from "./types"
export * from "./schemas"

type Factory = (config: {
  apiKey?: string
  model?: string
  baseURL?: string
}) => AIProvider

/** Registro de adaptadores. Agregar un proveedor es agregar una entrada acá. */
const REGISTRY: Record<AIProviderName, Factory> = {
  anthropic: createAnthropicProvider,
  "openai-compatible": createOpenAICompatibleProvider,
  google: createGoogleProvider,
  mock: createMockProvider,
}

let cached: AIProvider | null = null

/**
 * Devuelve el proveedor de IA activo.
 *
 * Se elige por configuración (`AI_PROVIDER`). Si el proveedor pedido no
 * tiene API key, cae al modo demo en lugar de romper el arranque.
 */
export function getAIProvider(
  overrides: { provider?: AIProviderName; model?: string } = {}
): AIProvider {
  if (!overrides.provider && !overrides.model && cached) return cached

  const requested = overrides.provider ?? env.AI_PROVIDER
  const usable = requested !== "mock" && !env.AI_API_KEY ? "mock" : requested

  if (usable !== requested) {
    console.warn(
      `[ai] AI_PROVIDER="${requested}" sin AI_API_KEY: se usa el modo demo.`
    )
  }

  const provider = REGISTRY[usable]({
    apiKey: env.AI_API_KEY,
    model: overrides.model ?? env.AI_MODEL,
    baseURL: env.AI_BASE_URL,
  })

  if (!overrides.provider && !overrides.model) cached = provider

  return provider
}

/** Información del proveedor activo, para mostrar en la UI. */
export function getAIStatus() {
  const provider = getAIProvider()
  return {
    provider: provider.name,
    model: provider.model,
    demo: provider.name === "mock",
  }
}
