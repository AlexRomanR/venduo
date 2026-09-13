import type { ZodType } from "zod"

export type AIProviderName =
  "anthropic" | "openai-compatible" | "google" | "mock"

export interface AIMessage {
  role: "user" | "assistant"
  content: string
}

export interface GenerateTextOptions {
  system?: string
  messages: AIMessage[]
  maxTokens?: number
  temperature?: number
}

export interface AIUsage {
  inputTokens?: number
  outputTokens?: number
}

export interface GenerateTextResult {
  text: string
  provider: AIProviderName
  model: string
  usage?: AIUsage
}

export interface GenerateObjectOptions<T> extends GenerateTextOptions {
  /** Esquema zod con el que se valida la respuesta del modelo. */
  schema: ZodType<T>
  /** Nombre descriptivo del objeto, se le pasa al modelo como contexto. */
  schemaName: string
}

export interface GenerateObjectResult<T> {
  object: T
  raw: string
  provider: AIProviderName
  model: string
  usage?: AIUsage
}

/**
 * Contrato único de la capa de IA.
 *
 * Todo el código de la aplicación habla con esta interfaz. Cambiar de
 * proveedor es cambiar `AI_PROVIDER` en el entorno: ningún componente,
 * ruta ni servicio importa un SDK de proveedor directamente.
 */
export interface AIProvider {
  readonly name: AIProviderName
  readonly model: string
  generateText(options: GenerateTextOptions): Promise<GenerateTextResult>
  generateObject<T>(
    options: GenerateObjectOptions<T>
  ): Promise<GenerateObjectResult<T>>
}

export class AIError extends Error {
  constructor(
    message: string,
    readonly provider: AIProviderName,
    readonly cause?: unknown
  ) {
    super(message)
    this.name = "AIError"
  }
}
