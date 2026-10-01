# Venduo

Plataforma boliviana donde un emprendedor elige una plantilla, describe su negocio y
obtiene una tienda online que la IA edita por bloques. Esa tienda puede activar una red de
vendedores jóvenes que colocan sus productos a comisión y construyen, con cada venta, un
historial laboral verificable.

MVP de hackathon de 48 horas. **La especificación del producto es `VENDUO.md`** y es la
fuente de verdad: si algo de acá la contradice, gana `VENDUO.md`.

## Stack

Next.js 15 con App Router y TypeScript · Supabase (PostgreSQL con RLS, Auth, Storage) ·
Tailwind v4 y shadcn/ui · capa de IA propia con proveedor intercambiable · Vercel.

## Comandos

| Comando                | Qué hace                                                         |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo                                           |
| `npm run check`        | Tipos, lint y formato **en secuencia**. Lo mismo que corre el CI |
| `npm run format`       | Arregla el formato                                               |
| `npm run build`        | Build de producción                                              |
| `npx supabase db push` | Aplica las migraciones pendientes                                |
| `npm run db:types`     | Regenera `types/database.ts` desde el esquema real               |
| `npm run sync:agents`  | Copia las skills de `.agents/` a `.claude/`                      |

## Lo que hay que saber antes de tocar nada

- **Una tienda por usuario**, impuesto por índice único. Un vendedor, en cambio, pertenece
  a varias: ahí está toda la dificultad del aislamiento.
- **Dinero en centavos enteros, porcentajes en puntos básicos.** Nunca punto flotante. La
  moneda es el boliviano y es constante del sistema: no hay columna de moneda.
- **Borrado lógico en todas partes.** Toda consulta filtra `deleted_at is null`, y los
  índices únicos son parciales.
- **El checkout no es una inserción del cliente.** `orders` no tiene política de INSERT: el
  pedido se crea con la función `create_order`, que recalcula los precios en el servidor.
- **La comisión se congela al momento de la venta.** Nunca se recalcula después.
- **`types/database.ts` es generado.** Los alias van en `types/index.ts`.
- **La IA propone, el sistema valida y ejecuta.** Toda salida del modelo se valida con zod
  antes de tocar la base o la pantalla.
- **Toda pantalla de la cuenta lleva la barra lateral** desde que la persona tiene panel.
  Se decide en `components/panel/armazon.tsx`, no en cada layout. Detalle en `ui-styling.md`.
- **Una tienda se ve con su plantilla, y ningún componente pregunta cuál es.** La base
  vive en código, la personalización en `stores.theme_overrides` y lo que se dibuja se
  calcula. Todo en `docs/store-templates.md`.
- **Hay una sola base de datos y es la de producción**, y cada push a `main` se publica
  solo en Vercel. `npx supabase db push` cambia producción en el acto. Antes de migrar o
  de subir a `main`, leer `workflow.md`.

## Lo que NO se construye

Está en `VENDUO.md` §7 y vale tanto como la lista de lo que sí. Si una tarea pide algo de
acá, frena y pregunta antes de escribir código:

multi-tienda por usuario · gestión de envíos · recibir o guardar el dinero de una venta
(lo hace PagoFácil) · cobro de la suscripción · notificaciones por correo · app móvil
nativa · **tests automatizados**.

## Documentos

| Archivo                       | Qué es                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| `VENDUO.md`                   | La especificación del producto. Fuente de verdad             |
| `DESIGN.md`                   | El mundo visual de Venduo y la base editorial                |
| `docs/estado-del-proyecto.md` | Qué está hecho y qué falta. **Leerlo antes de elegir tarea** |
| `docs/store-templates.md`     | El sistema de plantillas de tienda                           |

## Reglas

Se cargan solas. Son la misma fuente que lee Antigravity desde `.agents/rules/`.

@.agents/rules/architecture.md
@.agents/rules/database-rls.md
@.agents/rules/domain-venduo.md
@.agents/rules/ui-styling.md
@.agents/rules/ai-layer.md
@.agents/rules/code-quality.md
@.agents/rules/workflow.md

## Skills

En `.claude/skills/`, que se genera desde `.agents/skills/`. **Editá siempre el original
en `.agents/skills/` y corré `npm run sync:agents`**; un cambio hecho en `.claude/skills/`
se pierde en la próxima sincronización.

| Skill                   | Cuándo                                                      |
| ----------------------- | ----------------------------------------------------------- |
| `implement-feature`     | Una feature de punta a punta, de la migración a la pantalla |
| `database-migration`    | Migraciones, políticas RLS, índices, funciones              |
| `sales-and-commissions` | Checkout, referidos, comisiones, entrega por WhatsApp       |
| `visual-block-editor`   | Plantillas, tipos de bloque, propuestas de la IA            |
| `ai-task-workflow`      | Agregar o cambiar una tarea de IA                           |
| `qa-verification`       | Verificación antes de commitear                             |

### Skills de terceros

Instaladas para diseño y animación. **No se editan y el script de sincronización no las toca.** Las reglas de `ui-styling.md` mandan sobre ellas cuando se contradigan.

| Skill                      | Para qué                                                | Origen               |
| -------------------------- | ------------------------------------------------------- | -------------------- |
| `impeccable`               | Auditar y pulir lo construido                           | pbakaus/impeccable   |
| `design-taste-frontend-v1` | Jerarquía, espaciado y tipografía de una pantalla nueva | leonxlnx/taste-skill |
| `animate`                  | Construir una animación                                 | emilkowalski/skills  |
| `review-animations`        | Criticar una animación existente                        | emilkowalski/skills  |
| `ask-sonner`               | Avisos con Sonner                                       | emilkowalski/skills  |

Sus binarios no se versionan: quien clone el repositorio corre `npx impeccable install` para bajar el de su plataforma.
