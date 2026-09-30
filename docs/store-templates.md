# Plantillas de tienda

Cómo una tienda de Venduo toma su identidad visual, dónde vive cada parte, cómo se cambia
de plantilla sin perder nada y qué hay que hacer para sumar una plantilla nueva.

> **La arquitectura y persistencia necesarias para la futura edición de plantillas mediante
> IA ya están preparadas, pero la funcionalidad de edición en vivo mediante IA todavía NO
> está implementada.**

---

## Índice

1. [Qué había antes](#1-qué-había-antes)
2. [La idea en una frase](#2-la-idea-en-una-frase)
3. [Las tres capas](#3-las-tres-capas)
4. [La base de datos](#4-la-base-de-datos)
5. [El código](#5-el-código)
6. [Cómo se dibuja una tienda](#6-cómo-se-dibuja-una-tienda)
7. [El panel del emprendedor](#7-el-panel-del-emprendedor)
8. [Cambiar de plantilla](#8-cambiar-de-plantilla)
9. [Las plantillas iniciales](#9-las-plantillas-iniciales)
10. [Agregar una plantilla](#10-agregar-una-plantilla)
11. [El editor de la tienda](#11-el-editor-de-la-tienda)
12. [Lo que no se construyó](#12-lo-que-no-se-construyó)
13. [Límites conocidos](#13-límites-conocidos)

---

## 1. Qué había antes

Este sistema no empezó de cero. El análisis del proyecto encontró esto:

| Pieza          | Estado                                                                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework      | Next.js 15, App Router, componentes de servidor por defecto, Server Actions                                                                                                                                      |
| Estilos        | Tailwind v4 con tokens en `app/globals.css` (`papel`, `tinta`, `senal`, `font-titular`), shadcn/ui vestido con `lib/estilos.ts`                                                                                  |
| Base de datos  | Supabase: PostgreSQL con RLS y borrado lógico                                                                                                                                                                    |
| Autenticación  | Supabase Auth con correo y contraseña. Los permisos salen de los datos (`my_store_id()`), no del rol                                                                                                             |
| Tienda         | `stores`, una por dueño, con `template_key` y un `theme` jsonb                                                                                                                                                   |
| Productos      | `products` con `product_categories` por tienda                                                                                                                                                                   |
| Carrito        | En el navegador, por tienda (`components/tienda/carrito.tsx`)                                                                                                                                                    |
| Pedido         | Solo por `create_order`, que recalcula precios en el servidor                                                                                                                                                    |
| Tienda visual  | `templates` y `template_pages` (catálogo), `store_pages` y `store_blocks` (por tienda, con orden, visibilidad y propiedades en jsonb), `block_types` con su esquema, `block_edit_proposals` con el estado previo |
| Tienda pública | `app/t/[slug]` con componentes de `components/tienda`, en el mundo editorial de Venduo                                                                                                                           |
| Paneles        | `app/(privado)`, en el mismo mundo editorial                                                                                                                                                                     |

Y tres problemas:

- **Diez plantillas por rubro que solo cambiaban el texto sembrado.** Todas se veían igual.
- **`templates.theme` y `stores.theme` guardaban colores y una fuente que nadie leía.**
- **Las páginas sembradas quedaban en `borrador`.** La política de lectura solo muestra las
  `publicada`, así que el comprador anónimo no veía los bloques y el dueño sí: la tienda se
  veía distinta según quién la mirara.

La decisión fue **extender lo que ya existía** en vez de crear un sistema paralelo: los
bloques ya resolvían estructura, orden, visibilidad y contenido; faltaban la identidad
visual, la separación entre base y personalización, y el historial.

---

## 2. La idea en una frase

**Una plantilla es un conjunto de tokens más un kit de componentes; una tienda guarda solo
lo que cambia respecto de su plantilla; lo que se dibuja se calcula en el momento.**

Ninguna página pregunta qué plantilla tiene la tienda. Piden el kit y lo componen:

```tsx
const kit = kitDePlantilla(tienda.plantilla)

<kit.Cabecera marco={marco} referido={referido} codigo={codigo} />
<kit.Inicio tienda={tienda} codigo={codigo} filtros={filtros} />
<kit.Pie marco={marco} codigo={codigo} />
```

No hay un solo `if (plantilla === "fashion")` en el código.

---

## 3. Las tres capas

```
 BASE DE LA PLANTILLA            PERSONALIZACIÓN DE LA TIENDA        LO QUE SE DIBUJA
 ────────────────────            ────────────────────────────        ────────────────
 Código                          Base de datos                       Calculado al pedir
   lib/plantillas/{clave}.ts       stores.template_key                 resolverApariencia(
     tokens y disposición          stores.theme_overrides                base,
   components/plantillas/{clave}   store_pages / store_blocks            personalización)
     kit de componentes              estructura y contenido            → variables CSS
 Base de datos                                                         → kit de componentes
   templates (ficha y versión)
   template_pages (contenido
     que siembra)
```

### La base

Vive **en código** por tres razones que no son de comodidad:

1. **Las fuentes se compilan.** `next/font` las declara al construir. Una fuente escrita
   en la base no existe en la página.
2. **Los tokens y los componentes van juntos.** Una tarjeta de perfumería asume un fondo de
   pedestal; una cabecera de moda asume titulares condensados. Separarlos en dos lugares es
   invitar a que se desincronicen.
3. **Se tipa y se revisa.** Un cambio en la base pasa por el compilador y por una revisión
   de código; una fila editada en producción, no.

La base tiene además una **ficha en la base de datos** (`templates`): nombre visible,
rubro, descripción, si se ofrece y su **versión**. El nombre se puede cambiar sin desplegar,
y la versión es lo que registra el historial.

### La personalización

Vive **en la base**, por tienda:

- `stores.template_key` — qué plantilla eligió.
- `stores.theme_overrides` — **solo lo que cambia** respecto de la base. `{}` es la
  plantilla tal cual.
- `store_pages` y `store_blocks` — qué secciones tiene su portada, en qué orden, cuáles se
  ven y con qué textos.

### Lo que se dibuja

**No se guarda.** Se calcula en cada visita con `aparienciaDeTienda(clave, personalizacion)`
y se convierte en variables CSS. Guardarlo resuelto sería una copia que se desactualiza en
cuanto cambia la base. Lo único que lo congela es una versión del historial.

---

## 4. La base de datos

Migración: `supabase/migrations/20260917120000_plantillas_de_tienda.sql`.

### Tablas y columnas

| Tabla / columna               | Capa            | Qué guarda                                                                       |
| ----------------------------- | --------------- | -------------------------------------------------------------------------------- |
| `templates`                   | Base            | Ficha de catálogo: `key`, `name`, `sector`, `description`, `is_active`           |
| `templates.version`           | Base            | **Nueva.** Se sube cuando cambia la base en código de forma que afecte algo      |
| `template_pages`              | Base            | Las páginas y bloques que siembra la plantilla                                   |
| `block_types`                 | Catálogo        | Tipos de bloque con su esquema. **Nuevo:** `categories`; `product_grid.featured` |
| `stores.template_key`         | Personalización | La plantilla elegida                                                             |
| `stores.theme_overrides`      | Personalización | **Renombrada** desde `theme`. Solo lo que la tienda cambia. Check: es objeto     |
| `store_pages`, `store_blocks` | Personalización | Estructura, orden, visibilidad y contenido                                       |
| `store_design_versions`       | Historial       | **Nueva.** Puntos de restauración inmutables                                     |

Se retiró `templates.theme`: guardaba datos que nunca se leyeron, y dejarla invitaba a
creer que ahí vivía la base.

### `store_design_versions`

| Columna            | Qué es                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `store_id`         | La tienda. `on delete cascade`: la purga de una tienda se lleva su historial                                  |
| `number`           | 1, 2, 3… por tienda. Nunca se reusa, ni siquiera después de un borrado lógico                                 |
| `origin`           | Por qué se guardó: `inicial`, `alta`, `antes_de_cambiar_plantilla`, `antes_de_publicar`, `antes_de_restaurar` |
| `note`             | Texto para mostrar, p. ej. "Pasarela → Esencia"                                                               |
| `template_key`     | La plantilla que tenía                                                                                        |
| `template_version` | Contra qué versión de la base se guardó                                                                       |
| `theme_overrides`  | La personalización que tenía                                                                                  |
| `logo_url`         | El logo que tenía. Nulo en las versiones anteriores al editor, y es exacto: ninguna tienda tenía logo         |
| `pages`            | Las páginas con sus bloques: `key`, `title`, `is_home`, `status`, `blocks[]`                                  |
| `created_by`       | Quién hizo el cambio                                                                                          |

**RLS:** el dueño lee las de su tienda. **No hay políticas de escritura**: las versiones
las escriben solo las funciones. Una versión editable desde el cliente dejaría de ser un
respaldo.

### JSONB, tablas normalizadas o híbrido

Se eligió **híbrido**, y cada parte por una razón:

| Qué                        | Cómo                                   | Por qué                                                                                                                                                 |
| -------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bloques de una página      | **Filas** (`store_blocks`)             | Se reordenan, se ocultan y se editan de a uno. La IA va a proponer operaciones sobre bloques sueltos, y RLS se aplica por fila                          |
| Propiedades de cada bloque | **JSONB** (`props`)                    | Cada tipo tiene otra forma. Normalizarlas exige una tabla por tipo. Se validan contra `block_types.props_schema`                                        |
| Personalización visual     | **JSONB** (`theme_overrides`)          | Es un árbol chico, parcial y que se lee entero. Una fila por token no se consulta nunca por separado y multiplica escrituras. Se valida con zod al leer |
| Versiones                  | **JSONB** (`pages`, `theme_overrides`) | Una foto inmutable se lee y se restaura entera. Normalizarla duplicaría `store_pages` y `store_blocks` con otra clave para nada                         |
| Plantilla elegida, versión | **Columnas**                           | Se filtran, se unen y tienen clave foránea                                                                                                              |

El riesgo del JSONB es aceptar cualquier cosa. Se cubre en la lectura: `resolverApariencia`
**ignora entera** una personalización que no cumple el esquema, y la base impone al menos
que sea un objeto.

### Funciones

| Función                                                     | Acceso      | Qué hace                                                                                                         |
| ----------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `change_store_template(p_template_key, p_keep_sections)`    | Dueño       | Guarda una versión, cambia la plantilla, descarta la personalización y, si se pide, siembra las secciones nuevas |
| `apply_template(p_store_id, p_template_key)`                | Dueño       | La usa `create_store` en el alta. Siembra y deja la versión 1                                                    |
| `capture_design_version(p_store_id, p_origin, p_note)`      | **Interna** | Toma el punto de restauración. No comprueba dueño, así que no se expone                                          |
| `seed_template_pages(p_store_id, p_template_key)`           | **Interna** | Siembra páginas **publicadas** y reemplaza los bloques de las que ya existían                                    |
| `publicar_diseno(p_theme_overrides, p_logo_url, p_bloques)` | Dueño       | Lo que publica el editor. Guarda una versión y escribe apariencia, logo y secciones en una transacción           |
| `restaurar_version(p_version_id)`                           | Dueño       | Vuelve a una versión del historial. Guarda antes la que había                                                    |
| `portada_de_tienda(p_store_id)`                             | **Interna** | La portada de la tienda; la crea si no existe                                                                    |

Las internas tienen `revoke all ... from public, anon, authenticated`: solo las llaman otras
funciones `security definer` que ya comprobaron la tienda.

`run_insight_sql` suma `store_design_versions` y `product_categories` a las tablas que la
consulta de la IA no puede nombrar.

### Qué pasó con las tiendas que ya existían

La migración hace cuatro cosas, en este orden:

1. **Publica** las páginas en borrador. Ver arriba: el comprador no las veía.
2. **Guarda la versión inicial** de cada tienda (`origin = 'inicial'`), antes de tocar
   nada más.
3. **Pasa a la plantilla nueva de su rubro** las de moda y belleza, sembrando sus
   secciones: `moda` y `moda_calzado` → `fashion`; `belleza` → `perfume`. Rosa Deportes,
   Zapatería Illimani y Calzados Paris quedaron en Pasarela; Bella Piel, en Esencia.
4. **Retira del catálogo** las diez plantillas anteriores (`is_active = false`), sin
   borrarlas: `stores.template_key` las sigue referenciando.

Las tiendas con plantillas de otros rubros —Casa Illimani, TecnoAndes, World Tech,
Panadería Doña Elsa— **se ven exactamente como antes**, con la base editorial. Su dueño
puede pasarse a una plantilla nueva desde el panel.

---

## 5. El código

```
lib/plantillas/
  apariencia.ts     El contrato: esquema zod, resolver, contraste y variables CSS
  fuentes.ts        Las fuentes que una plantilla puede nombrar (sin next/font)
  definicion.ts     El tipo de una base en código
  clasica.ts        La base editorial de Venduo: respaldo, no se ofrece
  fashion.ts        Pasarela
  perfume.ts        Esencia
  bloques.ts        Qué significa cada bloque, sin decir cómo se ve
  index.ts          El registro: PLANTILLAS, ClavePlantilla, plantillaDeTienda()

lib/fuentes.ts      Las fuentes compiladas con next/font. Van todas en <html>
lib/catalogo.ts     Filtrar y ordenar el catálogo público (sin dependencias de servidor)
lib/data/apariencia.ts  La plantilla de mi tienda, las elegibles y el historial

components/plantillas/
  kit.ts            La interfaz KitDeTienda y las props de cada pieza
  index.ts          kitDePlantilla(): la única tabla que une clave y componentes
  estilo.tsx        <EstiloDePlantilla>: inyecta las variables en :root
  bloques.tsx       <Bloques>: recorre los bloques con los componentes de un kit
  miniatura.tsx     Una tienda en miniatura con su identidad, para galería y panel
  clasica/          El kit editorial. Los demás heredan de este
  fashion/          cabecera, piezas, bloques, galeria, paginas, index
  perfume/          cabecera, piezas, bloques, galeria, paginas, index

components/tienda/  Lo compartido: carrito, checkout, pago, agregar, filtros,
                    buscar, barra-del-carrito

app/t/[slug]/
  layout.tsx        Pinta el tema en el servidor
  page.tsx          kit.Inicio
  catalogo/         kit.Catalogo — nueva
  p/[id]/           kit.Ficha
  carrito/          kit.Encabezado + Checkout compartido
  pedido/[id]/      Pago compartido
  loading.tsx, error.tsx, not-found.tsx

app/(privado)/panel/apariencia/   La pantalla y la acción de cambiar plantilla
```

### El contrato: `Apariencia`

```ts
{
  colores: {
    ;(papel, tinta, senal, senalAlta)
  } // "#rrggbb"
  tipografia: {
    ;(titular,
      cuerpo, // clave de fuente
      pesoTitular,
      espaciadoTitular,
      mayusculas)
  } // null = lo decide el componente
  forma: {
    radio
  } // recto | suave | redondo
  disposicion: {
    ;(tarjeta, columnas)
  } // cuadrada | retrato; 2 | 3 | 4
}
```

**Todo es un token cerrado, nunca CSS libre.** No es prolijidad: la apariencia termina
dentro de una etiqueta `<style>` en la tienda pública, y un valor libre ahí es una
inyección. Un color que no cumple `^#[0-9a-fA-F]{6}$` no pasa el esquema; una fuente que no
está en `FUENTES` tampoco.

`resolverApariencia(base, personalizacion)`:

- Si la personalización no cumple el esquema, **se ignora entera**. Aplicar la mitad de un
  cambio produce una combinación que nadie eligió.
- Si la tienda cambió colores y no se leen —tinta contra papel menor a 7:1, señal contra
  papel o blanco contra señal menor a 4,5:1—, **vuelven los de la base**.

### El kit: `KitDeTienda`

| Pieza        | Qué es                                                     |
| ------------ | ---------------------------------------------------------- |
| `Cabecera`   | De cliente: muestra el contador del carrito                |
| `Pie`        |                                                            |
| `Inicio`     | La portada: cómo se ordenan los bloques y qué va alrededor |
| `Catalogo`   | El listado con filtros, búsqueda y orden                   |
| `Ficha`      | El detalle de un producto                                  |
| `Tarjeta`    | Un producto en una grilla                                  |
| `Encabezado` | El título de carrito y pedido                              |
| `Vacio`      | Lo que se ve cuando no hay nada                            |
| `bloques`    | **Un componente por cada tipo de bloque**, todos           |

Un kit se arma **encima del editorial** y reemplaza lo que cambia:

```ts
export const KIT_PERFUME: KitDeTienda = {
  ...KIT_CLASICO,
  Cabecera,
  Pie,
  Inicio,
  Catalogo,
  Ficha,
  Tarjeta,
  Encabezado,
  Vacio,
  bloques: BLOQUES_PERFUME, // también { ...BLOQUES_CLASICOS, hero: …, … }
}
```

Así una plantilla a medio escribir se ve completa, y un tipo de bloque nuevo existe en
todas desde el día que se escribe en la base editorial.

**Lo que es igual en todas no está en el kit**: carrito, checkout, pago, agregar al
carrito, filtros y buscador. Toman la identidad de los tokens, y lo que resuelven —quién
eres, cuánto llevas, cómo pagas— no cambia con el rubro.

### El registro

```ts
// lib/plantillas/index.ts
export const PLANTILLAS = { clasica, fashion, perfume }
export type ClavePlantilla = keyof typeof PLANTILLAS

// components/plantillas/index.ts
const KITS: Record<ClavePlantilla, KitDeTienda> = { clasica: …, fashion: …, perfume: … }
```

`KITS` está tipado contra `ClavePlantilla`: **una base registrada sin su kit no compila.**

`plantillaDeTienda(clave)` devuelve la clave si tiene base en código y `"clasica"` si no. Es
lo que hace que una tienda con una plantilla retirada se siga viendo como antes.

---

## 6. Cómo se dibuja una tienda

```
petición /t/rosa-deportes
  │
  ├─ layout.tsx
  │    getTiendaPublica(slug)          ← en caché por visita (react cache)
  │      stores.template_key, theme_overrides
  │      → plantilla: "fashion"
  │      → apariencia: resolverApariencia(base, personalización)
  │    <EstiloDePlantilla>              ← <style>html:root{--papel:…;--font-titular:…}</style>
  │
  └─ page.tsx
       getTiendaPublica(slug)          ← la misma lectura, sin volver a la base
       kitDePlantilla("fashion")
       <kit.Cabecera> <kit.Inicio> <kit.Pie>
```

### Por qué variables en `:root` y no clases por plantilla

Los tokens de Tailwind están declarados con `@theme inline` en `globals.css`. Eso hace que
`bg-papel` compile a `background-color: var(--papel)` y no al valor fijo. **Redefinir las
variables tiñe todo lo que ya existe**: los componentes compartidos, los de shadcn vestidos
con `lib/estilos.ts`, las cifras del panel.

Van en `:root` y no en un contenedor porque **los diálogos, cajones y avisos se dibujan en
un portal** fuera del árbol. Con las variables en un `<div>`, esas piezas salían con los
colores de Venduo.

La etiqueta `<style>` **no lleva `precedence`**: React no retira del documento una hoja con
precedencia al desmontarse, y al volver a la portada de Venduo el tema quedaría pegado.

Se pinta **en el servidor**, junto con el HTML. Si esperara al navegador, la tienda
aparecería un instante con los colores de Venduo.

### Las variables

| Variable         | Qué cambia                                        |
| ---------------- | ------------------------------------------------- |
| `--papel`        | Fondo                                             |
| `--tinta`        | Texto, reglas; jerarquías como tinta con opacidad |
| `--senal`        | Botón principal, rebajas, pendientes              |
| `--senal-alta`   | La señal al pasar el cursor                       |
| `--font-titular` | Titulares y cifras (`font-titular`)               |
| `--font-cuerpo`  | Texto de cuerpo (`font-sans`)                     |
| `--radio`        | Botones y controles (`rounded-plantilla`)         |

Y, si la plantilla lo pide, una regla sobre `.font-titular` con peso, espaciado y
mayúsculas. Va **sin capa y sin `!important`**: las utilidades de Tailwind viven en una
capa, y una regla fuera de capas les gana por cascada. Excluye `[data-miniatura]`, para que
una miniatura de perfumería no salga en mayúsculas dentro de un panel de moda.

### Las fuentes

`lib/fuentes.ts` declara todas con `next/font` y cada una expone una variable `--fuente-*`.
Ninguna se aplica sola: `globals.css` asigna `--font-titular` y `--font-cuerpo`, y una
plantilla las reasigna. Asignarlas en un paso aparte es lo que evita la referencia circular
que habría si la plantilla redefiniera la variable de la propia fuente.

Las de plantilla van con `preload: false`. Declararlas en `<html>` suma unas líneas de
`@font-face`, pero el navegador baja solo el archivo de la que se usa.

### Estados

| Estado    | Dónde                        | Cómo toma la identidad                                                         |
| --------- | ---------------------------- | ------------------------------------------------------------------------------ |
| Cargando  | `app/t/[slug]/loading.tsx`   | El layout ya pintó el tema: el esqueleto sale con papel, tinta y radio         |
| Error     | `app/t/[slug]/error.tsx`     | Igual. Ofrece reintentar y recuerda que el carrito sigue guardado              |
| No existe | `app/t/[slug]/not-found.tsx` | Igual, si la tienda existe                                                     |
| Vacío     | `kit.Vacio`                  | Cada plantilla con su voz                                                      |
| Sin foto  | Categorías, tarjetas, fichas | Pasarela: la categoría sobre un recuadro negro. Esencia: la inicial en cursiva |

---

## 7. El panel del emprendedor

`app/(privado)/layout.tsx` pinta la apariencia de la tienda cuando la persona **tiene
tienda**. `getBarraLateral()` la calcula con la misma función que la tienda pública.

**Cambia la piel, no la estructura.** Resumen, pedidos, productos, categorías, vendedores,
estadísticas y cuenta son las mismas pantallas en todas las plantillas: son una herramienta
que se aprende una vez. Lo que cambia es la letra, el papel, el color de acción y la forma
de los botones. El panel se siente del negocio sin dejar de ser Venduo.

| Quién                         | Panel                                    |
| ----------------------------- | ---------------------------------------- |
| Tiene tienda                  | Con la identidad de su plantilla         |
| Solo vende para otras tiendas | Mundo editorial de Venduo: cruza tiendas |
| Las dos cosas                 | Con la identidad de su tienda            |

Quedan en el mundo de Venduo la portada, el ingreso, el alta, las vitrinas del vendedor, su
perfil público y **el informe PDF de estadísticas**, que tiene su propia marca.

### `/panel/apariencia`

- **La puerta al editor**, arriba de todo: el editor vive aparte, en `/editor`, a pantalla
  completa.
- La plantilla actual, con su miniatura, rubro, descripción y rasgos. Si es una plantilla
  retirada, lo dice.
- Las otras plantillas, cada una con **Usar {nombre}**.
- El historial de diseño: las últimas ocho versiones, con su origen, fecha y **Restaurar**.

---

## 8. Cambiar de plantilla

`cambiarPlantilla` (Server Action) valida la forma con zod y llama a
`change_store_template`. La función:

1. Comprueba que la persona tenga tienda y que la plantilla **se ofrezca**.
2. Rechaza elegir la que ya usa.
3. **Guarda una versión** con `origin = 'antes_de_cambiar_plantilla'`.
4. Cambia `template_key` y deja `theme_overrides = '{}'`.
5. Si se pidió, siembra las secciones de la plantilla nueva.

Después, `revalidatePath("/", "layout")` y `router.refresh()`: **el panel cambia de piel en
el acto**.

### Qué se conserva

| Se conserva siempre                                | Depende de la elección           | Se descarta (queda en la versión) |
| -------------------------------------------------- | -------------------------------- | --------------------------------- |
| Productos, categorías, fotos, stock                | Secciones de la portada y textos | La personalización visual         |
| Pedidos, comisiones, vendedores, invitaciones      |                                  |                                   |
| Nombre, slug, enlace, QR, WhatsApp, datos de cobro |                                  |                                   |

**Por defecto se conservan las secciones.** Sus textos pueden ser trabajo del emprendedor,
y la plantilla nueva las dibuja a su manera. Elegir "Empezar con las de {plantilla}"
siembra las secciones de ejemplo.

**La personalización se descarta** porque unos colores elegidos contra una base no tienen
por qué funcionar sobre otra. No se pierde: está en la versión.

---

## 9. Las plantillas iniciales

### Pasarela (`fashion`) — Moda: ropa, calzado y carteras

Se vende con la foto. Todo lo demás se retira para dejarle lugar.

| Token         | Valor                                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| Papel / tinta | `#f5f4f0` / `#0e0e10` — 17,5:1                                                     |
| Señal         | `#2340d0`, un azul profundo que no compite con ninguna prenda — 7,0:1 contra papel |
| Titular       | Oswald 600, mayúsculas, espaciado abierto                                          |
| Cuerpo        | Geist                                                                              |
| Forma         | Recta                                                                              |
| Tarjeta       | Retrato 3:4, dos por fila en el celular, cuatro en escritorio                      |

- **Cabecera** en tres pisos: franja negra con el servicio —o con quién trajo la visita—,
  nombre centrado, y las categorías a la vista, porque en moda se compra por sección.
- **Portada** con foto a sangre y titular encima; tipográfica si la tienda no tiene fotos.
- **Categorías** como fotos grandes; en negro con el nombre si no hay foto.
- **Tarjeta** que muestra la segunda foto al pasar el cursor: la espalda o el detalle
  deciden tanto como el frente.
- **Ficha** con fotos que se pasan con el dedo en el celular y todas a la vista en
  escritorio, "Últimas N" cuando el stock baja del umbral, y sugerencias.
- **Pie** negro con el nombre enorme.

### Esencia (`perfume`) — Perfumes, fragancias y cuidado personal

Un perfume no se prueba por internet: la tienda tiene que transmitir lo que la foto no
alcanza.

| Token         | Valor                                                      |
| ------------- | ---------------------------------------------------------- |
| Papel / tinta | Marfil `#f4eee5` / ciruela casi negra `#241b1f` — 14,5:1   |
| Señal         | Oro viejo `#7d5c33` — 5,3:1 contra papel, 6,1:1 con blanco |
| Titular       | Cormorant Garamond 500, en cursiva en los títulos          |
| Cuerpo        | Jost, de la familia de Futura                              |
| Forma         | Píldora                                                    |
| Tarjeta       | Retrato 4:5, sobre pedestal, con paspartú                  |

- **Cabecera** simétrica, nombre en cursiva al centro, líneas de la tienda en versalitas.
- **Portada** como escaparate de noche, con la foto enmarcada en un arco.
- **Categorías** en círculos que se recorren con el pulgar.
- **Grillas** centradas: una fila incompleta no queda pegada a la izquierda.
- **Preguntas** plegables con `<details>`, sin JavaScript.
- **Ficha** con foto en arco y miniaturas circulares, y un "¿No sabes si es para ti?
  Pregúntanos" que abre WhatsApp con el producto ya nombrado.

### La editorial (`clasica`) — respaldo

No se ofrece. Es la base de todos los kits y la que dibuja las tiendas con plantillas
retiradas. Conserva la portada con el catálogo completo debajo.

---

## 10. Agregar una plantilla

Cinco pasos. Ningún archivo existente cambia salvo los dos registros.

**1. La base en código** — `lib/plantillas/{clave}.ts`

```ts
export const joyeria: DefinicionDePlantilla = {
  nombre: "Quilate",
  descripcion: "…",
  rasgos: ["…", "…", "…"],
  apariencia: { colores: {…}, tipografia: {…}, forma: {…}, disposicion: {…} },
}
```

Medir el contraste antes: tinta contra papel ≥ 7:1, señal contra papel ≥ 4,5:1, blanco
contra señal ≥ 4,5:1. `contraste()` de `apariencia.ts` sirve.

**2. Registrarla** en `PLANTILLAS` (`lib/plantillas/index.ts`).

**3. Las fuentes**, si son nuevas: declararlas en `lib/fuentes.ts` con `preload: false` y
sumarlas a `FUENTES` en `lib/plantillas/fuentes.ts` con **la misma variable**.

**4. El kit** — `components/plantillas/{clave}/`, empezando por `{ ...KIT_CLASICO }` y
reemplazando lo que cambia. Registrarlo en `KITS`: TypeScript avisa si falta. Agregar su
dibujo a `DIBUJOS` en `miniatura.tsx`.

**5. La migración** — insertar la fila en `templates` (con `sector` y `version = 1`) y sus
`template_pages`.

Una variante que solo cambia tokens —otra paleta sobre el mismo kit— es el paso 1, el 2 y
el 5, con `KITS[clave] = KIT_FASHION`.

### Cambiar una plantilla que ya se usa

- Un cambio en la base **se ve al instante en todas las tiendas** que la usan. Es lo
  esperable para una corrección.
- Si el cambio puede romper una personalización —renombrar un token, cambiar el sentido
  de un valor—, **subir `templates.version`** en la migración que acompaña el cambio.
- **No cambiar la clave** de una plantilla: está en `stores.template_key` y en el historial.
- Para retirarla, `is_active = false`. Nunca borrar la fila.

### Agregar un tipo de bloque

Migración en `block_types` con su `props_schema`, su semántica en
`lib/plantillas/bloques.ts` si la tiene, y **su componente en `BLOQUES_CLASICOS`**: desde
ahí todas las plantillas lo dibujan. Cada kit lo reemplaza cuando quiera.

---

## 11. El editor de la tienda

`/editor`, a pantalla completa y fuera del armazón del panel. Seis pasos —Tu marca,
Portada, Catálogo, Producto, Carrito y Publicar— en una barra arriba (abajo en el celular),
los controles del paso a la izquierda y la tienda de verdad a la derecha. La IA es una sola
línea al pie de los controles: las ideas aparecen al tocarla. Se entra
desde `/panel/apariencia`, desde el resumen del panel y al terminar el alta
(`/crear/listo`).

### El borrador

**Nada de lo que se edita llega al comprador hasta publicar.** El editor trabaja sobre un
**borrador en el navegador** —`{ personalizacion, logoUrl, secciones }`— con deshacer y
rehacer (`components/editor/estado.ts`). Escribir seguido en un mismo campo es un solo
paso. El borrador se guarda en el dispositivo y, al volver, se ofrece recuperarlo si lo
publicado sigue siendo el mismo del que partió.

Todo cambio es una lista de **operaciones** (`lib/plantillas/borrador.ts`): `apariencia`,
`restablecer`, `logo`, `agregar`, `editar`, `mover`, `mostrar` y `quitar`.
`aplicarOperaciones` las aplica **todas o ninguna** y devuelve los motivos en palabras. Las
usa el editor a mano y las usa la IA: lo que puede hacer una es exactamente lo que puede
hacer la otra, validado igual.

Qué campos tiene cada sección, con su etiqueta, su largo y su ejemplo inicial, vive en
`lib/plantillas/secciones.ts`. De esa tabla salen los formularios **y** los esquemas zod: no
pueden desencontrarse.

### La vista previa

Un `<iframe>` a `/editor/vista-previa`, que dibuja la tienda del dueño —publicada o no—
con el kit de su plantilla. El editor le manda el borrador por `postMessage`
(`lib/editor/protocolo.ts`) y los dos lados validan cada mensaje con zod.

- **Por qué un `iframe`:** las media queries responden a su ancho, así que el modo celular
  es un celular de verdad; y los colores del borrador tiñen la tienda sin teñir los
  controles del editor, que quedan en el mundo de Venduo.
- **La apariencia se dibuja con `combinarApariencia`**, sin corregir el contraste: si algo
  no se lee, la persona lo ve y lee por qué, en vez de ver otros colores sin entender.
- Cada sección lleva `data-seccion` solo en el editor (`TiendaPublica.enEdicion`): tocarla
  la selecciona y soltar una foto encima la usa. La tienda pública no cambia en nada.
- Nada navega ni crea pedidos: los toques y los envíos de formulario se interceptan.
- **Sin productos propios**, el catálogo, la ficha y el carrito se llenan con productos de
  ejemplo del rubro de la plantilla (`lib/editor/muestras.ts`), con un aviso de que lo
  son. La portada no: su foto sale del primer producto, y una de ejemplo ahí haría creer
  que la portada real la tiene.

### Publicar y restaurar

`publicarDiseno` (Server Action) vuelve a armar las reglas con lo que lee de la base y
valida el borrador entero —contraste y campos obligatorios incluidos— antes de llamar a
`publicar_diseno`, que guarda una versión `antes_de_publicar` y escribe todo en una
transacción. Las secciones que ya existían conservan su id; las quitadas se dan de baja.

`restaurar_version` vuelve a cualquier versión y guarda antes la que había
(`antes_de_restaurar`): restaurar nunca pierde nada.

### La IA

`proponerEdicion` (`lib/ai/tasks.ts`) recibe el pedido, la apariencia, las secciones, las
categorías y las imágenes que puede usar, y devuelve operaciones. `proponerCambios` las
prueba sobre el borrador —con el contraste exigido— y, si no pasan, le devuelve los motivos
para un segundo intento. La propuesta se ve en la vista previa con lo que cambia marcado;
aplicarla es un solo paso de deshacer. Todo queda en `block_edit_proposals` (con
`theme_before`) y en `ai_generations`.

### Las imágenes

El logo y las fotos se comprimen en el navegador a WebP y van a `store-assets`, donde cada
tienda escribe solo en su carpeta. El bucket rechaza lo que no sea JPG, PNG o WebP o pase
de 5 MB. Una imagen de una sección solo puede salir de ese bucket o de las fotos de los
productos de la tienda.

---

## 12. Lo que no se construyó

A propósito, **no existe**:

- Un lienzo libre, con elementos en posiciones de píxel. Arrastrar es reordenar secciones.
- CSS, HTML o colores escritos a mano fuera de los tokens.
- Colores por sección: los colores son de toda la tienda.
- Subir fuentes: solo las que compila `next/font`.
- Páginas aparte de la portada, o cambiar la estructura del catálogo, la ficha o el carrito.
- Que la IA publique sola.

---

## 13. Límites conocidos

- **Los datos de ejemplo no tienen fotos para casi ningún producto.** Las dos plantillas
  resuelven ese caso con dignidad, pero se lucen con fotos. Para una demostración, cargar
  fotos en Rosa Deportes y Bella Piel.
- **Al publicar las páginas en borrador, algunos textos de ejemplo quedaron a la vista** del
  comprador en tiendas con plantillas retiradas —p. ej. "Cuenta aquí de dónde salen tus
  piezas" en Casa Illimani—. Antes solo los veía el dueño.
- **El informe PDF no toma la plantilla.** Tiene su propia marca y sus fuentes se leen del
  disco.
- **La vista previa de la galería es un dibujo**, no la tienda real con los productos de
  quien la elige. La del editor, en cambio, sí es la tienda real.
- **La plantilla editorial no dibuja las grillas de productos de su portada**: muestra su
  catálogo completo. El editor lo avisa en esas tiendas.
- **No hay atributos por rubro** —talla para moda, mililitros o familia olfativa para
  perfumería—. Pedirían variantes en el carrito y en `create_order`, y eso es otro trabajo.
- **El rojo de la base editorial está a 4,35:1 contra el papel**, un poco por debajo de lo
  que dice `DESIGN.md`. No se tocó porque es la marca de Venduo; queda anotado.
