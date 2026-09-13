import { buildJsonInstruction, parseAndValidate } from "../json"
import {
  AIError,
  type AIProvider,
  type GenerateObjectOptions,
  type GenerateObjectResult,
  type GenerateTextOptions,
  type GenerateTextResult,
} from "../types"

const DEFAULT_BASE_URL = "https://api.openai.com/v1"
const DEFAULT_MODEL = "gpt-4o-mini"

interface ChatCompletion {
  choices: Array<{ message?: { content?: string | null } }>
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

/**
 * Adaptador para cualquier API con formato OpenAI `/chat/completions`:
 * OpenAI, Groq, Together, OpenRouter, vLLM, Ollama, LM Studio…
 * Solo cambia `AI_BASE_URL`.
 */
export function createOpenAICompatibleProvider(config: {
  apiKey?: string
  model?: string
  baseURL?: string
}): AIProvider {
  const model = config.model ?? DEFAULT_MODEL
  const baseURL = (config.baseURL ?? DEFAULT_BASE_URL).replace(/\/$/, "")

  async function call(
    options: GenerateTextOptions,
    jsonMode: boolean
  ): Promise<ChatCompletion> {
    const messages = [
      ...(options.system
        ? [{ role: "system" as const, content: options.system }]
        : []),
      ...options.messages,
    ]

    let response: Response
    try {
      response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey
            ? { Authorization: `Bearer ${config.apiKey}` }
            : {}),
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options.maxTokens ?? 4096,
          temperature: options.temperature ?? 0.7,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
      })
    } catch (cause) {
      throw new AIError(
        `No se pudo contactar a ${baseURL}`,
        "openai-compatible",
        cause
      )
    }

    if (!response.ok) {
      throw new AIError(
        `${response.status} ${response.statusText}: ${await response.text()}`,
        "openai-compatible"
      )
    }

    return (await response.json()) as ChatCompletion
  }

  function textOf(completion: ChatCompletion): string {
    return (completion.choices?.[0]?.message?.content ?? "").trim()
  }

  function usageOf(completion: ChatCompletion) {
    return {
      inputTokens: completion.usage?.prompt_tokens,
      outputTokens: completion.usage?.completion_tokens,
    }
  }

  return {
    name: "openai-compatible",
    model,

    async generateText(options): Promise<GenerateTextResult> {
      const completion = await call(options, false)
      return {
        text: textOf(completion),
        provider: "openai-compatible",
        model,
        usage: usageOf(completion),
      }
    },

    async generateObject<T>(
      options: GenerateObjectOptions<T>
    ): Promise<GenerateObjectResult<T>> {
      const instruction = buildJsonInstruction(
        options.schema,
        options.schemaName
      )

      const completion = await call(
        {
          ...options,
          system: [options.system, instruction].filter(Boolean).join("\n\n"),
        },
        true
      )

      const raw = textOf(completion)

      return {
        object: parseAndValidate(raw, options.schema, "openai-compatible"),
        raw,
        provider: "openai-compatible",
        model,
        usage: usageOf(completion),
      }
    },
  }
}
