import Anthropic from "@anthropic-ai/sdk"

import { buildJsonInstruction, parseAndValidate } from "../json"
import {
  AIError,
  LIMITE_POR_DEFECTO_MS,
  type AIProvider,
  type GenerateObjectOptions,
  type GenerateObjectResult,
  type GenerateTextOptions,
  type GenerateTextResult,
} from "../types"

const DEFAULT_MODEL = "claude-opus-5"

/** Adaptador de Claude (SDK oficial de Anthropic). */
export function createAnthropicProvider(config: {
  apiKey?: string
  model?: string
  baseURL?: string
}): AIProvider {
  const model = config.model ?? DEFAULT_MODEL
  const client = new Anthropic({
    ...(config.apiKey ? { apiKey: config.apiKey } : {}),
    ...(config.baseURL ? { baseURL: config.baseURL } : {}),
  })

  async function call(options: GenerateTextOptions) {
    try {
      return await client.messages.create(
        {
          model,
          max_tokens: options.maxTokens ?? 16000,
          thinking: { type: "adaptive" },
          ...(options.system ? { system: options.system } : {}),
          messages: options.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        { timeout: options.limiteMs ?? LIMITE_POR_DEFECTO_MS }
      )
    } catch (cause) {
      throw new AIError(
        cause instanceof Error ? cause.message : "Error llamando a Anthropic",
        "anthropic",
        cause
      )
    }
  }

  function textOf(response: Anthropic.Message): string {
    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim()
  }

  return {
    name: "anthropic",
    model,

    async generateText(options): Promise<GenerateTextResult> {
      const response = await call(options)

      if (response.stop_reason === "refusal") {
        throw new AIError("El modelo rechazó la solicitud.", "anthropic")
      }

      return {
        text: textOf(response),
        provider: "anthropic",
        model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      }
    },

    async generateObject<T>(
      options: GenerateObjectOptions<T>
    ): Promise<GenerateObjectResult<T>> {
      const instruction = buildJsonInstruction(
        options.schema,
        options.schemaName
      )

      const response = await call({
        ...options,
        system: [options.system, instruction].filter(Boolean).join("\n\n"),
      })

      if (response.stop_reason === "refusal") {
        throw new AIError("El modelo rechazó la solicitud.", "anthropic")
      }

      const raw = textOf(response)

      return {
        object: parseAndValidate(raw, options.schema, "anthropic"),
        raw,
        provider: "anthropic",
        model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      }
    },
  }
}
