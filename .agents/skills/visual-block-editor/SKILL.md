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

| Tabla                         | Alcance    | Qué guarda                                                   |
| ----------------------------- | ---------- | ------------------------------------------------------------ |
| `block_types`                 | Global     | Catálogo de tipos, con su esquema de propiedades             |
| `templates`, `template_pages` | Global     | Ficha y versión de cada plantilla, y los bloques que siembra |
| `store_pages`                 | Por tienda | Páginas, en borrador o publicadas                            |
| `store_blocks`                | Por tienda | Bloques concretos: tipo, posición, propiedades, visibilidad  |
| `block_edit_proposals`        | Por tienda | Lo que la IA propuso y el estado previo                      |
| `store_design_versions`       | Por tienda | Puntos de restauración de todo el diseño                     |

**Los bloques son el contenido y la estructura; la plantilla es cómo se ven.** La identidad
visual —tokens y componentes— vive en código (`lib/plantillas`, `components/plantillas`) y
está explicada en `docs/store-templates.md`. Un mismo bloque se dibuja distinto en cada
plantilla.

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

Copia las páginas y bloques de la plantilla —**publicadas**— y deja la personalización en
`{}`. Es idempotente por página: volver a aplicarla reemplaza los bloques en vez de
duplicarlos, y antes guarda una versión si había algo.

Para **cambiar** la plantilla de una tienda existente no se usa esta, sino
`change_store_template(p_template_key, p_keep_sections)`, que conserva las secciones por
defecto.

Las plantillas que se ofrecen son `fashion` (Pasarela) y `perfume` (Esencia). Las del
catálogo anterior —`abarrotes`, `moda`, `belleza` y demás— siguen en la tabla con
`is_active = false` y se dibujan con la base editorial.

---

## Los tipos de bloque

Cada fila de `block_types` trae `props_schema` (JSON Schema) y `default_props`. El esquema
es lo que se le pasa a la IA como catálogo y contra lo que se valida lo que devuelve.

Los tipos sembrados son `hero`, `categories`, `product_grid`, `about`, `testimonials`,
`cta`, `contact` y `faq`.

**El filtro de segunda mano no es un tipo aparte:** es la propiedad `condition` del bloque
`product_grid`, que acepta `todos`, `nuevo`, `segunda_mano` o `reacondicionado`. La
propiedad `featured` la limita a los destacados.

Para agregar un tipo nuevo: una migración que lo inserte en `block_types` con su
`props_schema`, su clave en `TIPOS_DE_BLOQUE` (`lib/plantillas/bloques.ts`) y **su
componente en `BLOQUES_CLASICOS`**. Desde ahí lo dibujan todas las plantillas, porque
todos los kits heredan de la base editorial; cada kit lo reemplaza cuando quiera. El tipo
`Record<TipoDeBloque, …>` hace que un tipo sin componente no compile.

---

## El editor y la IA

El editor vive en `/editor` y todo lo que hace pasa por un **borrador** en el navegador:
`{ personalizacion, logoUrl, secciones }`. El recorrido completo está en
`docs/store-templates.md` §11; acá va lo que hay que respetar al tocarlo.

### Un solo camino para cambiar el borrador

Todo cambio es una lista de operaciones de `lib/plantillas/borrador.ts`:

| `op`          | Qué hace                                               |
| ------------- | ------------------------------------------------------ |
| `apariencia`  | Un ajuste por su ruta: `colores.senal`, `forma.radio`… |
| `restablecer` | Vuelve un ajuste al valor de la plantilla              |
| `logo`        | Pone o quita el logo (la IA no puede)                  |
| `agregar`     | Una sección nueva en una posición                      |
| `editar`      | Solo los campos que cambian de una sección             |
| `mover`       | Una sección a otra posición                            |
| `mostrar`     | Ocultarla o mostrarla                                  |
| `quitar`      | Sacarla de la portada                                  |

`aplicarOperaciones` las aplica **todas o ninguna** y devuelve los motivos en palabras.
La usa el editor a mano y la usa la IA: nunca escribir el borrador de otra forma, o lo que
hace una persona y lo que hace la IA dejarían de validarse igual.

### Los campos de cada sección

`lib/plantillas/secciones.ts` dice qué campos tiene cada tipo, con su etiqueta, su largo y
un ejemplo inicial. De esa tabla salen **los formularios, los esquemas zod y lo que la IA
sabe de cada sección**. Un campo nuevo se agrega ahí y en `block_types.props_schema`, con
los mismos límites.

### La propuesta de la IA

1. `proponerEdicion` recibe el pedido, la apariencia, las secciones, las categorías y las
   imágenes que puede usar. Devuelve operaciones, nunca HTML ni el estado final.
2. `proponerCambios` las aplica al borrador de prueba con el contraste exigido. Si fallan,
   el modelo recibe los motivos para **un** segundo intento.
3. Se registra en `block_edit_proposals`: `prompt`, `operations`, **`snapshot_before`** y
   `theme_before`, con estado `propuesta` o `invalida` y los errores en
   `validation_errors`.
4. La persona la ve en la vista previa y decide. `aplicada` quiere decir que entró a su
   borrador —un solo paso de deshacer—; `rechazada`, que la descartó.

### Publicar

Nada llega a la tienda hasta **publicar**: `publicar_diseno` guarda una versión y escribe
apariencia, logo y secciones en una transacción. Nunca escribir `store_blocks` ni
`theme_overrides` con `update` sueltos desde el editor.

---

## Renderizar

La tienda pública lee los bloques visibles de la página publicada, ordenados por posición,
y `<Bloques>` los mapea a los componentes **del kit de la plantilla** por su
`block_type_key`. Qué significa un bloque —qué productos entran en una grilla, qué foto
representa una categoría— está en `lib/plantillas/bloques.ts`, igual para todos los kits.

Un tipo desconocido **no rompe la página**: se omite. Puede pasar si alguien sembró un
tipo cuyo componente todavía no existe.

Las propiedades ya vienen validadas contra el esquema, así que el componente puede confiar
en ellas.

La tienda pública es lo que ve un comprador desde el celular: arrancar el diseño en
375 px, no adaptarlo después.

---

## Verificación

- [ ] El tipo nuevo tiene fila en `block_types` **y** componente en `BLOQUES_CLASICOS`.
- [ ] El bloque se ve bien en cada plantilla, no solo en la editorial.
- [ ] El campo nuevo está en `secciones.ts` **y** en `block_types.props_schema`, con los
      mismos límites.
- [ ] La propuesta guarda `prompt`, `operations`, `snapshot_before` y `theme_before`.
- [ ] Una operación inválida no se aplica ni a medias.
- [ ] La sección se puede tocar en la vista previa del editor y editar en su formulario.
- [ ] Un `block_type_key` desconocido se omite sin romper la tienda.
- [ ] Deshacer revierte una propuesta de la IA entera, en un paso.
- [ ] La página se ve bien en 375 px.
- [ ] Los bloques ocultos no aparecen en la tienda pública.
