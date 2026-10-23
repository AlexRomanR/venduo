# Venduo

Más que una tienda online: el sistema para quien vende por TikTok, Facebook, Instagram y WhatsApp.
Tiene su tienda online —lista en minutos, sobre una plantilla que edita a mano o con
la IA— y con ella el stock, los pedidos, las estadísticas y los catálogos en PDF. Quien
compra no deja datos: arma su carrito y lo manda al WhatsApp de la tienda.

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

- **Una tienda por usuario**, impuesto por índice único. Por eso `my_store_id()` devuelve
  un identificador y toda política es una comparación directa.
- **Dos tipos de cuenta**: la del emprendedor, que sale del registro, y la del
  administrador de Venduo, que se da de alta a mano y opera la plataforma desde `/admin`.
- **Lo que el administrador apaga, se apaga en el servidor.** Cada acción de una función
  la pide con `exigirFuncion` y cada llamada a la IA con `permisoDeIa`; ocultar el botón
  no alcanza. Detalle en `domain-venduo.md`.
- **Dinero en centavos enteros, porcentajes en puntos básicos.** Nunca punto flotante. La
  moneda es el boliviano y es constante del sistema: no hay columna de moneda.
- **Borrado lógico en todas partes.** Toda consulta filtra `deleted_at is null`, y los
  índices únicos son parciales.
- **El pedido no es una inserción del cliente.** `orders` no tiene política de INSERT: el
  pedido se crea con `create_order`, que recalcula los precios en el servidor y devuelve
  con qué armar el mensaje de WhatsApp. Quien compra no deja ningún dato.
- **El stock baja al marcar un pedido pagado, no al crearlo**, y lo mueve un disparador.
  La aplicación nunca ajusta el stock por un cambio de estado.
- **El WhatsApp de la tienda es obligatorio**: ahí llega cada pedido. Todo enlace a
  WhatsApp pasa por `numeroDeWhatsApp`, que le pone el 591.
- **`types/database.ts` es generado.** Los alias van en `types/index.ts`.
- **La IA propone, el sistema valida y ejecuta.** Toda salida del modelo se valida con zod
  antes de tocar la base o la pantalla.
- **Toda pantalla de la cuenta lleva la barra lateral** desde que la persona tiene panel.
  Se decide en `components/panel/armazon.tsx`, no en cada layout. Detalle en `ui-styling.md`.
- **El celular es uno solo.** El panel de la web en un celular y la app son la misma
  pantalla: todo cambio a algo que existe en las dos se hace en los dos repositorios en
  la misma tarea. Detalle en `ui-styling.md`.
- **Toda pantalla del panel se arma como el Resumen**: cada cosa en su panel con borde,
  con las piezas de `components/panel/piezas.tsx`. Detalle en `ui-styling.md`.
- **Una tienda se ve con su plantilla, y ningún componente pregunta cuál es.** La base
  vive en código, la personalización en `stores.theme_overrides` y lo que se dibuja se
  calcula. Todo en `docs/store-templates.md`.
- **Lo que hace lenta una pantalla es esperar a la base en fila.** La sesión sale de
  `getUsuario()`, nunca de `auth.getUser()`; las consultas van en paralelo, y las
  funciones corren en São Paulo, junto a la base. Detalle en `performance.md`.
- **Hay una sola base de datos y es la de producción**, y cada push a `main` se publica
  solo en Vercel. `npx supabase db push` cambia producción en el acto. Antes de migrar o
  de subir a `main`, leer `workflow.md`.

## Lo que NO se construye

Está en `VENDUO.md` §7 y vale tanto como la lista de lo que sí. Si una tarea pide algo de
acá, frena y pregunta antes de escribir código:

multi-tienda por usuario · red de vendedores, comisiones o referidos · gestión de envíos
· cobrar dentro de la plataforma (el pago se acuerda por WhatsApp) · pedirle datos a
quien compra · cobro de la suscripción · notificaciones por correo ·
**tests automatizados**.

La app móvil nativa ya no está en esta lista: era de la hackathon. Va en un repositorio
aparte y su plan es `docs/plan-app-movil.md`.

## Documentos

| Archivo                       | Qué es                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| `VENDUO.md`                   | La especificación del producto. Fuente de verdad             |
| `DESIGN.md`                   | El mundo visual de Venduo y la base editorial                |
| `docs/estado-del-proyecto.md` | Qué está hecho y qué falta. **Leerlo antes de elegir tarea** |
| `docs/plan-administracion.md` | El panel `/admin` y las visitas: qué se hizo y por qué       |
| `docs/plan-app-movil.md`      | La app nativa del emprendedor: decisiones, pantallas, fases  |
| `docs/store-templates.md`     | El sistema de plantillas de tienda                           |
| `docs/catalogos-pdf.md`       | Los catálogos en PDF: un dibujo, dos salidas, sus trampas    |
| `docs/tiktok.md`              | Publicar en TikTok: cómo está hecho, configurarlo y revisión |

## Reglas

En `.agents/rules/`, que Antigravity carga solo. Son la misma fuente que importa Claude
Code desde `CLAUDE.md`, así que las dos herramientas aplican los mismos estándares.

| Archivo            | Cubre                                                            |
| ------------------ | ---------------------------------------------------------------- |
| `architecture.md`  | App Router, componentes de servidor, rutas, clientes de Supabase |
| `database-rls.md`  | Dinero, borrado lógico, políticas RLS, migraciones               |
| `domain-venduo.md` | Reglas de negocio, pedidos por WhatsApp, cuentas, alcance        |
| `ui-styling.md`    | Móvil primero, Tailwind v4, shadcn/ui, textos                    |
| `ai-layer.md`      | Interfaz del proveedor, esquemas zod, modo mock                  |
| `code-quality.md`  | TypeScript estricto, secretos, commits                           |
| `performance.md`   | Región, sesión sin viajes, consultas en paralelo, esqueletos     |
| `workflow.md`      | Base compartida con producción, ramas, trampas del entorno       |
| `marca.md`         | El logo: dónde vive, sus colores, cómo se regenera               |

## Skills

En `.agents/skills/`, que es la **fuente única**: `.claude/skills/` se genera desde acá
con `npm run sync:agents`. Editar siempre el original.

| Skill                  | Cuándo                                                      |
| ---------------------- | ----------------------------------------------------------- |
| `implement-feature`    | Una feature de punta a punta, de la migración a la pantalla |
| `database-migration`   | Migraciones, políticas RLS, índices, funciones              |
| `pedidos-por-whatsapp` | Carrito, el pedido por WhatsApp, sus estados y el stock     |
| `visual-block-editor`  | Plantillas, tipos de bloque, propuestas de la IA            |
| `ai-task-workflow`     | Agregar o cambiar una tarea de IA                           |
| `qa-verification`      | Verificación antes de commitear                             |
| `pantalla-por-filas`   | Una pantalla para crear o editar algo: lo esencial y filas  |
| `de-idea-a-pantalla`   | De una idea en palabras a un cambio construido: `/idea`     |

### De la idea a la pantalla: `/idea`

**No hace falta escribirlo: cada pedido se mide antes de empezar** (`workflow.md`). Lo
mediano o grande pasa por `/idea` solo, avisando en una línea; lo chico se hace directo.

Para algo nuevo o un cambio que no es trivial, **`/idea lo que quiero`** usa la skill
`de-idea-a-pantalla`: mide el tamaño, hace una entrevista corta y deja el brief en
`docs/briefs/`, y pasa por un equipo de agentes (`.claude/agents/`) con una pausa para
que la persona apruebe antes de construir:

| Agente                     | Qué hace                                                             |
| -------------------------- | -------------------------------------------------------------------- |
| `investigador-de-producto` | Cómo lo resuelven Shopify, Tiendanube, Mercado Libre, WhatsApp, Meta |
| `analista-tecnico`         | Qué se reutiliza, qué se toca, la migración y sus riesgos            |
| `disenador`                | Bocetos a 375 y 1280 px, los textos y los estados                    |
| `verificador`              | Prueba de verdad lo construido y devuelve los defectos               |

### Skills de terceros

Instaladas para diseño y animación, en el mismo directorio. **No se editan y el script de sincronización no las toca.** Las reglas de `ui-styling.md` mandan sobre ellas cuando se contradigan.

| Skill                      | Para qué                                                | Origen               |
| -------------------------- | ------------------------------------------------------- | -------------------- |
| `impeccable`               | Auditar y pulir lo construido                           | pbakaus/impeccable   |
| `design-taste-frontend-v1` | Jerarquía, espaciado y tipografía de una pantalla nueva | leonxlnx/taste-skill |
| `animate`                  | Construir una animación                                 | emilkowalski/skills  |
| `review-animations`        | Criticar una animación existente                        | emilkowalski/skills  |
| `ask-sonner`               | Avisos con Sonner                                       | emilkowalski/skills  |

Sus binarios no se versionan: quien clone el repositorio corre `npx impeccable install` para bajar el de su plataforma.
