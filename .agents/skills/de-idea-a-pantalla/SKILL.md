---
name: de-idea-a-pantalla
description: >-
  Use this skill proactively, without waiting for the person to type /idea,
  whenever a request in Venduo is medium or large: a new feature or screen,
  redoing a screen that "looks odd" or "confuses", something that touches the
  database or both web and app for the first time, or a vague request with
  several reasonable solutions. It takes the idea to a finished, verified
  change: interview into a brief, research, technical plan, design, approval,
  implementation and verification. Skip it for small or already-decided work
  (a clear bug, a text, an alignment, porting an approved design, a question);
  the sizing table is in workflow.md.
---

# De la idea a la pantalla

La persona dice lo que quiere con sus palabras; esto lo lleva hasta un cambio construido
y probado, con dos pausas para que decida. Cada etapa tiene su responsable:

| #   | Quién                                         | Qué entrega                          |
| --- | --------------------------------------------- | ------------------------------------ |
| 1   | **Entrevista** (quien conversa, no un agente) | El brief, en `docs/briefs/`          |
| 2   | Agente `investigador-de-producto`             | Cómo lo hacen otros, con fuentes     |
| 3   | Agente `analista-tecnico`                     | El plan técnico y sus riesgos        |
| 4   | Agente `disenador`                            | Bocetos a 375 y 1280 px y los textos |
|     | Quien conversa                                | Que brief, plan y boceto cuadren     |
| ⏸   | **La persona**                                | Aprueba brief, plan y boceto         |
| 5   | Quien conversa, con las skills del proyecto   | El cambio, en la web y en la app     |
| 6   | Agente `verificador`                          | Defectos ordenados, o "listo"        |

---

## 0. Medir el tamaño

Antes de nada, decidir el tamaño y decirlo en una línea. No todo merece el recorrido
completo, y cada agente cuesta tiempo:

| Tamaño      | Ejemplo                                                         | Qué etapas                                           |
| ----------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| **Chico**   | Alinear unos botones, cambiar un texto                          | Directo a construir (5) y verificar (6), sin agentes |
| **Mediano** | Rehacer una pantalla que ya existe                              | Entrevista corta, analista y diseñador, pausa, 5 y 6 |
| **Grande**  | Una función nueva, algo que toca la base o los dos repositorios | Todo                                                 |

Si la persona pide otro tamaño, manda ella.

## 1. La entrevista: del pedido al brief

**La hace quien conversa con la persona**, con `AskUserQuestion`: un agente en segundo
plano no le puede preguntar nada. Entre **3 y 6 preguntas**, solo las que cambian lo que
se construye, con opciones concretas y la recomendada primero. Lo que ya se sabe por el
código, el pedido o el proyecto no se pregunta. Las de siempre, si no están claras:

- **Quién lo usa**: quien vende (el panel o la app) o quien compra (la tienda).
- **Qué problema resuelve**, en su idioma: "vendí algo que ya no tenía", no "gestión de
  inventario".
- **Cómo se sabe que salió bien**: qué hace la persona en cuántos toques.
- **Dónde**: la web, la app o las dos (en el celular son la misma pantalla: casi siempre
  las dos).
- **Qué no tiene que pasar**: lo que hoy funciona y no se puede romper.
- Si roza `VENDUO.md` §7 (cobrar dentro, envíos, pedirle datos a quien compra…),
  preguntar antes de seguir.

Con las respuestas, escribir el **brief** en `docs/briefs/AAAA-MM-DD-nombre-corto.md`:

```markdown
# Nombre corto

**Pedido**: lo que dijo la persona, con sus palabras.
**Para quién**: …
**Problema**: …
**Sale bien si**: …
**Dónde**: web, app, o las dos.
**No tiene que romper**: …
**Fuera de alcance**: lo que se decidió no hacer.
```

Mostrarle el brief en pocas líneas y seguir; si algo está mal, lo corrige ahí.

## 2 y 3. Investigar y planear, a la vez

Lanzar **en el mismo mensaje**, para que corran en paralelo:

- `investigador-de-producto`, con el brief y la duda de diseño concreta (y las capturas
  de la pantalla actual, si existe: `.playwright-mcp/` o el emulador).
- `analista-tecnico`, con el brief.

Esperar los dos. No predecir lo que van a decir.

## 4. Diseñar

Lanzar `disenador` con el brief, lo del investigador y el plan del analista. Para una
pantalla de crear o editar algo, la base es la skill `pantalla-por-filas`.

## Revisar que cuadre

Antes de mostrarle nada a la persona, leer juntos el brief, el plan y el boceto, y
buscar contradicciones. Las que más pasan:

- El boceto usa un dato que el plan no trae, o el plan construye algo que el boceto no
  muestra.
- El brief dice "web y app" y el plan cubre una sola.
- El boceto pide un campo que la base no tiene, y el plan no dice que se agrega.
- Algo de "No tiene que romper" o de "Fuera de alcance" del brief aparece igual en el
  plan o en el boceto.

Lo que se resuelve con lo que ya se sabe, se corrige ahí mismo. Lo que necesita una
decisión, se lleva a la pausa como pregunta.

## ⏸ La pausa: la persona decide

Mostrarle, corto y en este orden: **el boceto recomendado** (y el otro, si hay dos), **el
plan en pasos**, **los riesgos** que importan (sobre todo si toca la base, que es
producción) y **qué queda fuera**. Preguntar si se construye así. Sin su sí, no se
escribe código.

## 5. Construir

Con las skills del proyecto que correspondan: `implement-feature`, `database-migration`,
`pantalla-por-filas`, `pedidos-por-whatsapp`, `ai-task-workflow`. Y las reglas de siempre:

- **Una tarea grande se parte en tareas chicas antes de empezar**, cada una con cómo se
  comprueba que está hecha: "Migración con la columna `x`: `db query` la muestra",
  "La fila de categoría abre su hoja: probada a 375 px". Van al final del brief como
  lista con casillas (`- [ ]`), y se marca cada una al terminarla y comprobarla. Así un
  trabajo largo se retoma donde quedó, aunque la conversación se corte o se resuma, y
  nada se da por hecho sin haberlo comprobado. Una tarea chica o mediana no lo necesita.
- **La web primero si la persona quiere verlo antes**; si no, web y app en la misma
  tarea.
- Las migraciones con `npx supabase db push`, avisando antes: cambian producción.
- Revisar con `impeccable` (`polish`) antes de darlo por hecho.

## 6. Verificar

Lanzar `verificador` con el brief, los archivos tocados y cómo debería comportarse.
Corregir lo que traiga y, si fue algo serio, volver a verificar **una vez**. Después:

- Actualizar `docs/estado-del-proyecto.md` y lo demás que pida `workflow.md`.
- Contarle a la persona qué quedó, qué se probó y qué no, con la ruta para verlo.
- **Commit y push solo cuando la persona lo pide.**
