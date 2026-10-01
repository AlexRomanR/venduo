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

En `lib/ai/tasks.ts` hay **seis**, y todas siguen el mismo molde:

| Tarea                    | Devuelve                         |
| ------------------------ | -------------------------------- |
| `generateStoreBlueprint` | `{ blueprint, provider, model }` |
| `analyzeSales`           | `{ insight, provider, model }`   |
| `generateCampaign`       | `{ campaign, provider, model }`  |
| `buildInsightSql`        | `{ consulta, provider, model }`  |
| `proponerEdicion`        | `{ propuesta, provider, model }` |
| `proponerCatalogo`       | `{ propuesta, provider, model }` |

Para agregar otra:

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

### Dos trampas del adaptador

**El razonamiento viaja dentro de la respuesta.** Gemini 3 piensa antes de
contestar, ese pensamiento llega como una parte más —marcada con `thought`— y
**gasta el mismo presupuesto de salida**. Un adaptador que concatena todas las
partes le pega el razonamiento delante al JSON y no parsea nada; y con el nivel
por defecto el modelo se comía los 4096 tokens deliberando sobre qué vista usar,
así que el JSON llegaba cortado a mitad de una frase. `google.ts` filtra las
partes de pensamiento y baja el nivel con `thinkingConfig`. La misma pregunta
pasó de 18 a 6 segundos.

El nombre del parámetro cambió entre generaciones —`thinkingLevel` en la 3,
`thinkingBudget` en la 2.5— y mandar el de la otra es un 400. Por eso se elige
por modelo, y los que no razonan no lo reciben.

**Saturación no es error.** Un 503 de Google dice "high demand" y un momento
después responde bien; si eso llega a la pantalla como "la IA no pudo
responder", es falso y además no dice qué hacer. Se reintenta 429, 500 y 503 con
espera creciente. Nunca un 400: volvería a fallar igual.

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

Tres reglas que no son negociables:

- **La IA solo lee.** Nunca borra, actualiza ni ejecuta nada que modifique datos.
- **El `store_id` lo impone el sistema, nunca la IA.**
- **Lista blanca de tablas**, tope de filas y rango acotado.

### La IA escribe SQL, pero no elige dónde corre

El modelo devuelve la consulta. Lo que la hace segura no es confiar en él ni
filtrar palabras —eso siempre se rodea— sino **dónde se ejecuta**.
`run_insight_sql` impone tres cosas que las hace cumplir Postgres, no la
aplicación:

1. **`security invoker`**: corre como el usuario, con RLS activa.
2. **`set local transaction read only`**: la base rechaza toda escritura, aunque
   el filtro de texto se rodee. Comprobado: un UPDATE levanta
   _"cannot execute UPDATE in a read-only transaction"_.
3. **`statement_timeout` y `limit` impuesto por el servidor**, no por la
   consulta que llegó.

### Solo las vistas de mi tienda

RLS no alcanza por sí sola. La política de `products` deja leer el catálogo de
**toda tienda publicada** —hace falta para que un comprador navegue— y la de
`seller_profiles` es pública por el historial laboral. Con las tablas base a la
vista, "mis productos más vendidos" podía mezclar los de todos: no una fuga de
datos privados, pero sí **una respuesta incorrecta**, que en una herramienta de
análisis es igual de grave.

Por eso la IA escribe contra cinco vistas ya acotadas a `my_store_id()`:

| Vista            | Qué trae                       |
| ---------------- | ------------------------------ |
| `mis_ventas`     | Pedidos                        |
| `mis_items`      | Líneas de pedido, por producto |
| `mis_productos`  | Catálogo y stock               |
| `mis_vendedores` | La red                         |
| `mis_comisiones` | Lo que generó cada vendedor    |

**En esas vistas no existe `store_id`.** El alcance deja de depender de que el
modelo se acuerde de filtrar. Nombrar una tabla base corta la consulta.

El contrato de salida es fijo: toda consulta devuelve `etiqueta` y `valor`. Eso
es lo que permite dibujar sin adivinar qué vino.

**Una fila no siempre es una cifra.** `normalizarForma` degrada a `numero` solo
cuando la etiqueta es un rótulo de total. Una consulta agrupada que devolvió un
único grupo —"activo", "2026-09"— conserva su gráfico: volverla un número suelto
tira la etiqueta, y "5" no contesta "¿en qué estado están mis vendedores?".

**El tipo de gráfico que nombra la persona manda.** Torta y dona no existen —la
paleta es un solo rojo y el color no puede separar categorías, ver
`ui-styling.md`—, así que el modelo tiene instrucción de contestar con barra
ordenada **y decirlo**, en vez de ignorar el pedido en silencio.

**El esquema que ve el modelo vive en `lib/insights/esquema.ts`.** Es lo único
que sabe de la base: agregar una columna a una vista sin agregarla ahí la deja
invisible.

### La lectura del gráfico se calcula, no se pregunta

La `explicacion` que devuelve el modelo se escribe **antes** de ejecutar la
consulta, así que solo puede describir la intención —"voy a mostrar las ventas
por vendedor"—, nunca lo que salió. Sirve de epígrafe del gráfico y nada más.

Lo que **lee** el gráfico es `leerGrafico()` de `lib/insights/lectura.ts`, que
mira las filas ya calculadas y dice quién encabeza, con cuánta ventaja y cómo
viene la tendencia. Se calcula en vez de pedírselo al modelo por dos razones:
sale al instante, y las cifras no pueden estar mal porque salen del mismo
resultado que se está dibujando. Un segundo viaje al proveedor costaría otros
seis segundos y podría contradecir al gráfico que tiene al lado.

`analyzeSales` es otra cosa y sigue como estaba: recibe una serie ya calculada y la
comenta en palabras. No genera consultas.

## Edición de la tienda

`proponerEdicion` devuelve una **lista de operaciones** —cambiar un ajuste de la
apariencia, agregar, editar, mover, ocultar o quitar una sección—, nunca HTML ni el
estado final. Son las mismas que usa el editor a mano (`lib/plantillas/borrador.ts`).

`proponerCambios` (Server Action) las aplica sobre el borrador **todas o ninguna**, con el
contraste exigido. Si no pasan, le devuelve los motivos al modelo para **un** segundo
intento; si en ese intento solo fallan los colores, ofrece el resto y lo dice. La
propuesta nunca se aplica sola: se ve en la vista previa y la persona decide. Queda en
`block_edit_proposals` —con `snapshot_before` y `theme_before`— y en `ai_generations`.

Lo que el modelo sabe de cada sección sale de `lib/plantillas/secciones.ts`, la misma
tabla que arma los formularios: un campo nuevo ahí es un campo que la IA conoce.

El modo demo lee el pedido por palabras clave y responde con los ids reales de la
tienda (`lib/ai/providers/mock-propuesta.ts`): colores, letra, orden, secciones nuevas,
textos de temporada y catálogo.

Ver la skill `visual-block-editor` para el procedimiento completo.

## Catálogos en PDF

`proponerCatalogo` recibe una frase y los productos de la tienda, y devuelve qué
productos van, en qué orden, con qué plantilla, un nombre y una bajada. Elige
ids, nunca precios: el servidor descarta los que no son de la tienda —o del
catálogo abierto, si se pidió un orden— antes de que la persona vea nada, y la
propuesta no se aplica sola. En modo demo responde
`lib/ai/providers/mock-catalogo.ts`, por palabras clave y con los productos
reales de la tienda.
