---
name: ai-task-workflow
description: >-
  Use this skill when defining, implementing, or updating an AI-assisted task in
  Venduo, including prompt engineering, Zod schema validation, mock fallback,
  and audit logging in ai_generations.
---

# Agregar una tarea de IA

Todas las tareas de IA de Venduo siguen el mismo molde. Este procedimiento lo replica sin
inventar interfaz.

---

## El contrato real

El código de la aplicación **nunca importa un SDK de proveedor**. Habla con `AIProvider`
de `lib/ai/types.ts`, que tiene exactamente dos métodos:

```ts
generateText(options: GenerateTextOptions): Promise<GenerateTextResult>
generateObject<T>(options: GenerateObjectOptions<T>): Promise<GenerateObjectResult<T>>
```

`generateObject` recibe `{ schema, schemaName, system, messages }` y devuelve
`{ object, raw, provider, model, usage }`.

Para tareas nuevas se usa **siempre `generateObject`**: una respuesta estructurada y
validada, no texto libre que después hay que parsear.

---

## Paso 1 — El esquema

En `lib/ai/schemas.ts`. Es el contrato con el modelo y la defensa contra una respuesta mal
formada. Poner límites en todo: longitudes máximas, cantidades mínimas, enums cerrados.

```ts
export const descripcionProductoSchema = z.object({
  title: z.string().max(120),
  description: z.string().max(600),
  tags: z.array(z.string().max(30)).min(1).max(8),
})

export type DescripcionProducto = z.infer<typeof descripcionProductoSchema>
```

Los límites no son decorativos: sin un máximo, un modelo verborrágico rompe el diseño de
la pantalla.

---

## Paso 2 — La tarea

En `lib/ai/tasks.ts`, siguiendo el molde de las tres que ya existen
(`generateStoreBlueprint`, `analyzeSales`, `generateCampaign`):

```ts
export async function describeProduct(input: {
  name: string
  category: string
}): Promise<{
  descripcion: DescripcionProducto
  provider: string
  model: string
}> {
  const ai = getAIProvider()

  const { object, provider, model } = await ai.generateObject({
    schema: descripcionProductoSchema,
    schemaName: "DescripcionProducto",
    system: BASE_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          `Producto: ${input.name}`,
          `Categoría: ${input.category}`,
          "Escribe una descripción para la tienda.",
        ].join("\n"),
      },
    ],
  })

  return { descripcion: object, provider, model }
}
```

Devolver siempre `provider` y `model` junto con el objeto: son las columnas que el
registro necesita.

Reutilizar `BASE_SYSTEM` para que el registro sea consistente entre tareas.

---

## Paso 3 — El registro

Guardar lo generado sirve para auditar y para deshacer. **`user_id`, `kind`, `provider`,
`model`, `prompt` y `output` son obligatorias**: omitir cualquiera hace fallar el insert.

```ts
await supabase.from("ai_generations").insert({
  user_id: user.id,
  store_id: storeId,
  kind: "marketing", // tienda | bloques | analisis | marketing
  provider,
  model,
  prompt: promptDelUsuario,
  output: descripcion, // jsonb, ya validado: no hace falta ningún cast
})
```

No existe columna de tokens consumidos. El `usage` que devuelve el proveedor sirve para
instrumentar, no para persistir.

**Nunca `output: resultado as any`.** Si hiciera falta un cast, el esquema está mal.

---

## Paso 4 — Probar con mock

```bash
AI_PROVIDER=mock npm run dev
```

El proveedor simulado devuelve respuestas **válidas contra los mismos esquemas zod**. Si
la tarea nueva no da un resultado presentable con `mock`, no está terminada: ese es el
camino que ve alguien que clona el repositorio sin credenciales, y el respaldo si la API
falla en medio de la demostración.

Si se elige un proveedor real y falta la clave, la capa avisa por consola y cae sola a
mock. No escribir código que dependa de que la IA esté disponible de verdad.

---

## Paso 5 — Conectar a la interfaz

La tarea se llama desde el servidor, nunca desde el navegador: la clave de la API no puede
viajar al cliente.

Del lado de la interfaz hacen falta tres estados: pidiendo, resultado, y error con una
salida. Una llamada a un modelo tarda segundos; sin indicador de carga el usuario aprieta
dos veces.

**La IA propone, la persona decide.** Toda salida se muestra para revisar antes de
aplicarse. Nada de escribir directo en la base con lo que devolvió el modelo.

---

## Agregar un proveedor

Dos pasos y nada más cambia:

1. El adaptador en `lib/ai/providers/`, implementando `AIProvider`.
2. Registrarlo en `REGISTRY` de `lib/ai/index.ts`.

---

## Verificación

- [ ] El esquema tiene límites en todos los campos de texto.
- [ ] La tarea usa `generateObject`, no texto libre parseado a mano.
- [ ] Devuelve `provider` y `model`.
- [ ] El registro incluye las seis columnas obligatorias.
- [ ] No hay ningún `as any`.
- [ ] Con `AI_PROVIDER=mock` la pantalla se ve bien.
- [ ] La llamada ocurre en el servidor.
- [ ] Hay estado de carga y de error.
