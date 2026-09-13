import { buildJsonInstruction, parseAndValidate } from "../json"
import {
  AIError,
  type AIProvider,
  type GenerateObjectOptions,
  type GenerateObjectResult,
  type GenerateTextOptions,
  type GenerateTextResult,
} from "../types"

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
const DEFAULT_MODEL = "gemini-2.0-flash"

interface GenerateContentResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
}

/** Adaptador de Google Gemini (API REST `generateContent`). */
export function createGoogleProvider(config: {
  apiKey?: string
  model?: string
  baseURL?: string
}): AIProvider {
  const model = config.model ?? DEFAULT_MODEL
  const baseURL = (config.baseURL ?? DEFAULT_BASE_URL).replace(/\/$/, "")

  async function call(
    options: GenerateTextOptions,
    jsonMode: boolean
  ): Promise<GenerateContentResponse> {
    if (!config.apiKey) {
      throw new AIError("Falta AI_API_KEY para Google.", "google")
    }

    let response: Response
    try {
      response = await fetch(
        `${baseURL}/models/${model}:generateContent?key=${config.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(options.system
              ? { systemInstruction: { parts: [{ text: options.system }] } }
              : {}),
            contents: options.messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            generationConfig: {
              maxOutputTokens: options.maxTokens ?? 4096,
              temperature: options.temperature ?? 0.7,
              ...(jsonMode ? { responseMimeType: "application/json" } : {}),
            },
          }),
        }
      )
    } catch (cause) {
      throw new AIError(`No se pudo contactar a ${baseURL}`, "google", cause)
    }

    if (!response.ok) {
      throw new AIError(
        `${response.status} ${response.statusText}: ${await response.text()}`,
        "google"
      )
    }

    return (await response.json()) as GenerateContentResponse
  }

  function textOf(response: GenerateContentResponse): string {
    return (response.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim()
  }

  function usageOf(response: GenerateContentResponse) {
    return {
      inputTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
    }
  }

  return {
    name: "google",
    model,

    async generateText(options): Promise<GenerateTextResult> {
      const response = await call(options, false)
      return {
        text: textOf(response),
        provider: "google",
        model,
        usage: usageOf(response),
      }
    },

    async generateObject<T>(
      options: GenerateObjectOptions<T>
    ): Promise<GenerateObjectResult<T>> {
      const instruction = buildJsonInstruction(
        options.schema,
        options.schemaName
      )

      const response = await call(
        {
          ...options,
          system: [options.system, instruction].filter(Boolean).join("\n\n"),
        },
        true
      )

      const raw = textOf(response)

      return {
        object: parseAndValidate(raw, options.schema, "google"),
        raw,
        provider: "google",
        model,
        usage: usageOf(response),
      }
    },
  }
}
