---
name: pantalla-por-filas
description: >-
  Use this skill when designing or redesigning a screen where the entrepreneur
  creates or edits something in Venduo (a product, a sale, the store data, a
  catalog, a category) and it feels heavy, text-heavy or confusing on mobile.
  It is the procedure behind the "pantalla por filas": essentials on top, every
  optional field a row with its current value that opens a sheet.
---

# Pantalla por filas: crear o editar algo

La receta salió del formulario de producto (`components/productos/formulario.tsx`),
que tenía todos los campos abiertos, cada uno con su rótulo y su frase de ayuda, y se
leía en vez de mirarse. La regla que no se negocia está en `ui-styling.md`, "Crear o
editar algo"; esto es **cómo se llega** a una pantalla así, paso por paso. Vale igual
para la web y para la app, que llevan la misma pantalla.

---

## 1. Mirar la pantalla real antes de opinar

Capturas a **375 px** de la web (Playwright, a `.playwright-mcp/`) y del emulador si
existe en la app. La pantalla entera, no solo el primer pantallazo. Contar:

- Cuántos campos están abiertos y cuántos son de verdad obligatorios.
- Cuántas frases de ayuda permanentes hay, y cuáles dicen algo que el rótulo ya dice.
- Cuántos paneles, títulos y subtítulos hay solo para separar.
- Qué se escribe que podría tocarse: una cantidad, un sí o no, elegir de una lista.

## 2. Recortar con _distill_

Invocar `impeccable` con `distill` sobre el archivo. La pregunta de fondo es una sola:
**¿sin qué no se puede guardar?** Eso va arriba, grande y escrito ahí mismo. Lo demás
se clasifica:

| Si el dato…                                | Va como                                          |
| ------------------------------------------ | ------------------------------------------------ |
| Es lo mínimo para que exista               | Campo arriba, grande, sin rótulo visible         |
| Se cambia casi siempre y es un número      | `Cantidad` en su fila                            |
| Es un sí o no                              | `Palanca`                                        |
| Se elige de una lista o se escribe a veces | `Fila` con su valor, que abre `HojaDeAjuste`     |
| Es una explicación                         | La `descripcion` de su hoja, nunca bajo el campo |

Agrupar las filas en dos o tres paneles **por para qué sirven** ("lo de vender",
"cómo se muestra"), no por tipo de campo.

## 3. Investigar cómo lo resuelven otros

Lanzar el agente **`investigador-de-producto`** con la pantalla, las capturas y la
duda concreta. Compara con lo que el público ya usa —Shopify, Tiendanube, Mercado Libre,
WhatsApp Business, Meta, Instagram— y devuelve una recomendación con fuentes. Sirve para
no inventar un patrón que la persona no reconoce, y para descartar una idea que parecía
buena ("que la categoría cree las tallas" funciona en Mercado Libre porque sus
categorías son fijas; las de Venduo las nombra cada tienda).

## 4. Proponer con boceto, y elegir con la persona

Antes de escribir código: **dos opciones como máximo, dibujadas en texto a 375 px**,
con una recomendada y por qué. La persona elige. Un cambio de estructura sin boceto
termina rehecho.

## 5. Construir con las piezas que ya existen

- `components/panel/ajustes.tsx`: `Fila`, `Palanca`, `Cantidad`, `CampoMonto`,
  `HojaDeAjuste`, `ErrorDeAjuste`. En la app, sus equivalentes en `src/components/`.
- El formulario sigue siendo `react-hook-form` con el esquema zod de siempre. Los
  campos de las hojas escriben con `setValue` (`poner` en el formulario de producto):
  el portal de la hoja queda fuera del `<form>`, el contexto no.
- Cada fila muestra el **valor actual en palabras** ("Ropa", "S, M, L", "Al quedar 3").
  Lo vacío, en tinta al 55%. Una fila con error se pinta de rojo con su mensaje.
- Abrir algo y no completarlo no es un error: al cerrar la hoja y al guardar, lo que
  quedó vacío se descarta (como las opciones sin valores en el producto).
- La acción principal, fija sobre las pestañas en el celular
  (`fixed … bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:static`), y el formulario
  con `pb-24 lg:pb-0` para que no tape lo último.
- Si hay algo que sugerir, sugerirlo: abrir la hoja ya en lo más probable
  (`tipoSugerido` en `lib/variantes.ts` es el ejemplo).

## 6. Revisar con _polish_

Invocar `impeccable` con `polish`. Lo que más se escapa en estas pantallas:

- Un rótulo de fila que se parte en dos renglones porque el valor ocupa lugar:
  acortarlo ("Aviso de stock", no "Avisarme si se acaba").
- Dos lugares para cargar lo mismo a la vez (el total y las tallas abiertas).
- Un grupo de botones del mismo peso que salta de renglón desalineado: columnas
  iguales (`ui-styling.md`).
- Objetivos de menos de 44 px, texto secundario por debajo de tinta al 65%.

## 7. Verificar de verdad

- **375 y 1280 px**, sin desplazamiento horizontal. Abrir cada hoja.
- **Guardar uno existente sin cambios** y mirar en la base que quedó igual
  (`npx supabase db query --linked "select …"`).
- **Intentar guardar uno vacío**: los errores en rojo, en su fila.
- `npm run check`, y la consola sin errores con la página ya compilada (un aviso de
  hidratación recién recompilado desaparece al recargar; si no, es real).
- En la app, lo mismo en el emulador, y las dos lado a lado.

## Pantallas candidatas

Las que hoy tienen campos abiertos y se beneficiarían: Nueva venta
(`/panel/pedidos/nueva`), los datos de la tienda y la cuenta (`/cuenta`), Nuevo catálogo
(`/panel/catalogos/nuevo`), los datos del negocio en el alta (`/crear/negocio`) y
Categorías (`/panel/productos/categorias`).
