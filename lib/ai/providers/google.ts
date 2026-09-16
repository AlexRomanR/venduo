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
const DEFAULT_MODEL = "gemini-3.6-flash"

interface GenerateContentResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> }
    finishReason?: string
  }>
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
}

/**
 * Cuánto se le deja razonar antes de responder.
 *
 * Gemini 3 razona por defecto, ese razonamiento viaja como una parte más de la
 * respuesta y **gasta el mismo presupuesto de salida**. Con el nivel por
 * defecto se comía los 4096 tokens deliberando sobre qué vista usar y el JSON
 * llegaba cortado a mitad de una frase. Traducir una pregunta a una consulta
 * corta no necesita deliberación, y bajarlo es además lo que saca la respuesta
 * de los veinte segundos.
 *
 * El nombre del parámetro cambió entre generaciones, y mandar el de la otra es
 * un 400: por eso se elige por modelo y los que no razonan no lo reciben.
 */
function razonamientoDe(model: string): Record<string, unknown> | undefined {
  if (model.startsWith("gemini-3")) return { thinkingLevel: "low" }
  if (model.startsWith("gemini-2.5")) return { thinkingBudget: 0 }
  return undefined
}

/** Adaptador de Google Gemini (API REST `generateContent`). */
export function createGoogleProvider(config: {
  apiKey?: string
  model?: string
  baseURL?: string
}): AIProvider {
  const model = config.model ?? DEFAULT_MODEL
  const baseURL = (config.baseURL ?? DEFAULT_BASE_URL).replace(/\/$/, "")
  const thinkingConfig = razonamientoDe(model)

  /**
   * Un modelo saturado devuelve 503 y un minuto después responde bien. Sin
   * reintento eso llega a la pantalla como "la IA no pudo responder", que es
   * falso y además no dice qué hacer. Solo se reintenta lo que se arregla
   * esperando: nunca un 400, que volvería a fallar igual.
   */
  function vuelveAIntentarse(status: number) {
    return status === 429 || status === 500 || status === 503
  }

  async function call(
    options: GenerateTextOptions,
    jsonMode: boolean,
    intento = 0
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
              ...(thinkingConfig ? { thinkingConfig } : {}),
            },
          }),
        }
      )
    } catch (cause) {
      throw new AIError(`No se pudo contactar a ${baseURL}`, "google", cause)
    }

    if (!response.ok) {
      if (vuelveAIntentarse(response.status) && intento < 2) {
        await new Promise((listo) => setTimeout(listo, 700 * (intento + 1)))
        return call(options, jsonMode, intento + 1)
      }

      throw new AIError(
        `${response.status} ${response.statusText}: ${await response.text()}`,
        "google"
      )
    }

    return (await response.json()) as GenerateContentResponse
  }

  /**
   * El razonamiento llega como una parte más, marcada con `thought`. Sin este
   * filtro se concatena delante del JSON y nada parsea.
   */
  function textOf(response: GenerateContentResponse): string {
    return (response.candidates?.[0]?.content?.parts ?? [])
      .filter((part) => !part.thought)
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

      // Sin esto, quedarse sin presupuesto es indistinguible de un JSON mal
      // formado, y son dos problemas distintos con dos arreglos distintos.
      if (!raw) {
        const motivo = response.candidates?.[0]?.finishReason
        throw new AIError(
          motivo === "MAX_TOKENS"
            ? "El modelo agotó el presupuesto de salida antes de responder."
            : `El modelo no devolvió contenido (${motivo ?? "sin motivo"}).`,
          "google"
        )
      }

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
