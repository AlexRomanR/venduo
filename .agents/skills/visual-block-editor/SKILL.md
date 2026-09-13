---
name: visual-block-editor
description: >-
  Use this skill when developing, editing, or customizing store templates,
  visual block types, block properties validation, and AI-assisted block
  proposals with undo capability in Venduo.
---

# Editor visual de bloques

La tienda de cada emprendedor es un árbol de bloques que la IA edita. El principio que
gobierna todo: **la IA propone, el sistema valida y ejecuta.**

---

## El modelo

| Tabla                         | Alcance    | Qué guarda                                                  |
| ----------------------------- | ---------- | ----------------------------------------------------------- |
| `block_types`                 | Global     | Catálogo de tipos, con su esquema de propiedades            |
| `templates`, `template_pages` | Global     | Plantillas por rubro y los bloques que siembran             |
| `store_pages`                 | Por tienda | Páginas, en borrador o publicadas                           |
| `store_blocks`                | Por tienda | Bloques concretos: tipo, posición, propiedades, visibilidad |
| `block_edit_proposals`        | Por tienda | Lo que la IA propuso y el estado previo                     |

Los dos primeros son catálogo compartido: lectura para todos, escritura solo con la clave
de servicio. No escribirlos desde la aplicación.

`store_blocks.store_id` está repetido aunque se deduzca de la página. Es deliberado: hace
que la política RLS sea una comparación sobre una sola tabla.

El vínculo de un bloque con su tipo es **`on delete restrict`**: no se retira del catálogo
un tipo que alguna tienda esté usando.

---

## Sembrar una tienda desde una plantilla

No copiar las páginas a mano. Existe la función del servidor:

```ts
await supabase.rpc("apply_template", {
  p_store_id: storeId,
  p_template_key: "abarrotes",
})
```

Copia las páginas y bloques de la plantilla, fija el tema, y es idempotente por página:
volver a aplicarla reemplaza los bloques en vez de duplicarlos.

Las plantillas sembradas son `abarrotes`, `carpinteria`, `moda` y `gastronomia`.

---

## Los tipos de bloque

Cada fila de `block_types` trae `props_schema` (JSON Schema) y `default_props`. El esquema
es lo que se le pasa a la IA como catálogo y contra lo que se valida lo que devuelve.

Los tipos sembrados son `hero`, `product_grid`, `about`, `testimonials`, `cta`, `contact`
y `faq`.

**El filtro de segunda mano no es un tipo aparte:** es la propiedad `condition` del bloque
`product_grid`, que acepta `todos`, `nuevo`, `segunda_mano` o `reacondicionado`.

Para agregar un tipo nuevo: una migración que lo inserte en `block_types` con su
`props_schema`, y el componente que lo renderiza. Ambas cosas o ninguna — un tipo sin
componente rompe la tienda pública.

---

## El ciclo de edición con IA

### 1. Se le da contexto

Los tipos activos con su `props_schema`, y el estado actual de la página.

### 2. La IA devuelve operaciones, no HTML

Una lista de `{ op, ... }` donde `op` es `add`, `remove`, `update` o `move`. Nunca el
estado final de la página ni marcado: operaciones discretas que se pueden validar una por
una y revertir.

### 3. Se guarda la propuesta con el estado previo

```ts
await supabase.from("block_edit_proposals").insert({
  store_id: storeId,
  page_id: pageId,
  prompt: loQuePidioElUsuario, // not null
  operations, // jsonb
  snapshot_before: bloquesActuales,
})
```

Las columnas son `prompt`, `operations` y **`snapshot_before`**. Guardar el estado previo
es lo que habilita deshacer, y en una demostración en vivo eso vale mucho.

### 4. Se valida antes de aplicar

Cada operación se comprueba contra el esquema del tipo de bloque correspondiente:

- ¿El `block_type_key` existe y está activo?
- ¿Las propiedades cumplen su `props_schema`?
- ¿La página pertenece a la tienda del usuario?
- ¿La posición está dentro de rango?

Si algo falla, la propuesta queda como `invalida` con los errores en
`validation_errors`. **No se aplica parcialmente.**

### 5. Se aplica en una transacción

Estados: `propuesta` → `aplicada`, o `rechazada` / `invalida`.

---

## Renderizar

La tienda pública lee los bloques visibles de la página publicada, ordenados por posición,
y los mapea a componentes por su `block_type_key`.

Un tipo desconocido **no rompe la página**: se omite. Puede pasar si alguien sembró un
tipo cuyo componente todavía no existe.

Las propiedades ya vienen validadas contra el esquema, así que el componente puede confiar
en ellas.

La tienda pública es lo que ve un comprador desde el celular: arrancar el diseño en
375 px, no adaptarlo después.

---

## Verificación

- [ ] El tipo nuevo tiene fila en `block_types` **y** componente que lo renderiza.
- [ ] La propuesta guarda `prompt`, `operations` y `snapshot_before`.
- [ ] Una operación inválida no se aplica ni a medias.
- [ ] Un `block_type_key` desconocido se omite sin romper la tienda.
- [ ] Deshacer restaura el estado previo.
- [ ] La página se ve bien en 375 px.
- [ ] Los bloques ocultos no aparecen en la tienda pública.
