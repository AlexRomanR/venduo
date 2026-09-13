# Capa de IA

Los tres usos de la IA están descritos en `VENDUO.md` §9. Esta regla cubre cómo se
escriben.

## El principio

> **La IA nunca ejecuta nada por su cuenta: propone, el sistema valida y ejecuta.**

Toda salida del modelo se valida con zod **antes** de tocar la base o la interfaz. Un
modelo que devuelve un JSON mal formado produce un error claro, no una pantalla rota.

## El contrato

El código de la aplicación **nunca importa un SDK de proveedor**. Habla con la interfaz
`AIProvider` de `lib/ai/types.ts`:

```ts
interface AIProvider {
  readonly name: AIProviderName
  readonly model: string
  generateText(options: GenerateTextOptions): Promise<GenerateTextResult>
  generateObject<T>(
    options: GenerateObjectOptions<T>
  ): Promise<GenerateObjectResult<T>>
}
```

Son esos dos métodos y no otros. `generateObject` recibe `{ schema, schemaName, system,
messages }` y devuelve `{ object, raw, provider, model, usage }`.

Se obtiene con `getAIProvider()` de `lib/ai/index.ts`. `getAIStatus()` devuelve
`{ provider, model, demo }` para mostrar en la interfaz.

## Las tareas que existen

En `lib/ai/tasks.ts` hay **tres**, y todas siguen el mismo molde:

| Tarea                    | Devuelve                         |
| ------------------------ | -------------------------------- |
| `generateStoreBlueprint` | `{ blueprint, provider, model }` |
| `analyzeSales`           | `{ insight, provider, model }`   |
| `generateCampaign`       | `{ campaign, provider, model }`  |

Para agregar una cuarta:

1. Escribir el esquema zod en `lib/ai/schemas.ts`.
2. Escribir la tarea en `lib/ai/tasks.ts`: obtener el proveedor, llamar `generateObject`
   con el esquema, devolver el objeto junto con `provider` y `model`.
3. Reutilizar `BASE_SYSTEM` como instrucción de sistema, para que el registro sea
   consistente entre tareas.

## Cambiar de proveedor

Es cambiar el entorno, no el código:

```bash
AI_PROVIDER=anthropic          # o openai-compatible, google, mock
AI_MODEL=claude-opus-5
AI_API_KEY=...
```

Para sumar un proveedor nuevo: escribir el adaptador en `lib/ai/providers/` implementando
`AIProvider`, y registrarlo en `REGISTRY` de `lib/ai/index.ts`. Nada más cambia.

## El modo mock no es opcional

`AI_PROVIDER=mock` devuelve respuestas simuladas **válidas contra los mismos esquemas
zod**. Es lo que permite que el proyecto arranque sin credenciales, y es el respaldo si la
API falla durante la demostración.

Si se elige un proveedor real y falta la clave, la capa avisa por consola y cae sola a
mock en vez de romper el arranque. **No agregar código que dependa de que la IA esté
disponible de verdad.**

Toda función nueva de IA tiene que dar un resultado presentable con `mock`.

## Registro en `ai_generations`

Guardar lo que generó la IA sirve para auditar y para deshacer. Las columnas obligatorias
son `user_id`, `kind`, `provider`, `model`, `prompt` y `output`:

```ts
await supabase.from("ai_generations").insert({
  user_id: user.id,
  store_id: storeId,
  kind: "marketing", // tienda | bloques | analisis | marketing
  provider,
  model,
  prompt: promptDelUsuario,
  output: campaign,
})
```

No hay columna de tokens consumidos. El `usage` que devuelve el proveedor es opcional y
sirve para instrumentación, no para persistir.

## Inteligencia de negocio: las defensas

Cuando la IA arme consultas sobre los datos, tres reglas que no son negociables:

- **La IA solo lee.** Nunca borra, actualiza ni ejecuta nada que modifique datos. Rol de
  base de datos de solo lectura.
- **El `store_id` lo impone el sistema, nunca la IA.** El filtro se inyecta del lado del
  servidor, después de recibir la propuesta.
- **Lista blanca de tablas**, tiempo máximo de consulta y tope de filas.

Hoy `analyzeSales` recibe un arreglo de ventas ya calculado y no genera consultas. Esas
defensas hay que escribirlas antes de que empiece a hacerlo.

## Edición de la tienda

La IA devuelve una **lista de operaciones** sobre bloques (agregar, quitar, editar,
mover), no HTML ni el estado final de la página. El sistema las valida contra el esquema
de propiedades de cada tipo de bloque y recién entonces las aplica en una transacción,
guardando el estado previo en `block_edit_proposals.snapshot_before` para poder deshacer.

Ver la skill `visual-block-editor` para el procedimiento completo.
