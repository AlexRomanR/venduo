# Trabajo en equipo y entorno

Lo que no está en el código y se aprende rompiendo algo. Aplica a personas y a agentes.

## Hay una sola base de datos, y es la de producción

El proyecto de Supabase enlazado (`supabase link`) es **el mismo** que usa la página
publicada en Vercel. Los scripts `db:start` y `db:stop` levantan una base local, pero el
equipo no la usa: no hay una base de pruebas con los datos de la demostración.

- **`npx supabase db push` cambia producción en el acto**, para todo el equipo. No hay
  vuelta atrás automática: deshacer es escribir otra migración.
- **Antes de crear una migración, `git pull`.** Dos migraciones escritas en paralelo
  pueden chocar —dos `create or replace` de la misma función, la segunda pisa a la
  primera sin avisar— aunque tengan distinto nombre.
- **Avisar al equipo antes de aplicar una migración**, y hacer commit de la migración y
  de `types/database.ts` regenerado en el mismo push.
- **Una migración aplicada no se edita.** Los cambios van en una nueva
  (`database-rls.md`).
- **Preferir migraciones aditivas**: agregar columnas y funciones antes de quitar las
  viejas. Entre que se aplica la migración y se publica el código, producción corre el
  código anterior contra la base nueva.
- **Para mirar datos**, `npx supabase db query --linked "select …"`. Nunca un `update` o
  `delete` a mano sobre datos de otros sin acordarlo: son las tiendas de la demostración.

## `main` es producción

Vercel publica **cada push a `main`**, sin paso intermedio. El CI (`.github/workflows/ci.yml`)
corre tipos, lint, formato y build en cada push a cualquier rama, pero no frena el deploy.

- **Trabajar en una rama y abrir un PR a `main`.** Vercel arma una vista previa por rama.
- **`npm run check` antes de cada push** (`code-quality.md`). El CI además corre
  `npm run build`, que atrapa errores que `check` no ve.
- **El push publica el código, no la base.** Una feature con migración necesita las dos
  cosas: `db push` y el merge a `main`.
- `npx vercel --prod` no está autorizado para el equipo. No hace falta: el push publica.
- **Commit o push solo cuando la persona lo pide.** Un agente no sube cambios por su cuenta.

## Trampas del entorno

**No correr `npm run build` con `npm run dev` levantado.** Los dos escriben en `.next/` y el
servidor de desarrollo queda roto con errores que no dicen por qué. Para probar un build:
detener el servidor del puerto 3000, borrar `.next/` y recién entonces construir.

**PowerShell rompe las tildes** al escribir archivos con `Set-Content` o redirecciones: el
código queda con `Ã³` donde había `ó`. Editar con el editor o con herramientas que
escriban UTF-8. Todo el texto de la interfaz lleva tildes y eñes.

**Los archivos `.env*` no se leen ni se copian.** `.env.local` tiene la clave de servicio
de Supabase, que salta RLS. Si falta una variable, se pide al equipo; nunca se pega en un
chat, en un commit ni en un archivo versionado. A `.env.example` le falta
`NEXT_PUBLIC_DOMINIO_TIENDAS` (vacía por ahora).

**Sin credenciales el proyecto arranca en modo demo.** Si la pantalla dice "Modo demo", no
es un error del código: falta `.env.local`.

## La frontera entre servidor y cliente

Dos errores que ya pasaron y no los atrapa el compilador:

- **Un componente de cliente no puede importar un módulo de `lib/data/`**: esos módulos
  importan el cliente de Supabase del servidor. La página da 500. Lo que ambos lados
  necesitan —constantes, tipos, funciones puras— va en un módulo neutral: así nacieron
  `lib/pedidos.ts`, `lib/catalogo.ts` y `lib/preferencias.ts`.
- **Una constante exportada desde un archivo `"use client"` no es una constante** cuando
  la importa un componente de servidor: llega como una referencia de cliente. Mismo
  remedio: moverla a un módulo neutral.

## Cuentas de demostración

Las tiendas sembradas tienen dueños con correo `@demo.venduo.bo` —`rosa@` (Rosa Deportes,
plantilla Pasarela), `bella@` (Bella Piel, Esencia), `casa@`, `elsa@`, `tecno@`—.
`ana@demo.venduo.bo` era una vendedora de Rosa: con la red de vendedores borrada queda
como una cuenta sin tienda, que entra a `/crear`. **La contraseña se pide al equipo**, no
se escribe en el repositorio.

Son los datos de la demostración y viven en producción: probar sobre ellas está bien,
dejarlas rotas no. Si un cambio de prueba las altera —cambiar la plantilla de Rosa, por
ejemplo—, devolverlas a como estaban.

## Verificar en el navegador

Los puntos de control son 375 px y 1280 px (`ui-styling.md`). Las capturas de Playwright
van a `.playwright-mcp/`, que está ignorada: no guardarlas en otro lado del repositorio.

**En el navegador de Playwright, toda descarga queda en una carpeta temporal, con un
nombre al azar y sin extensión.** Es la herramienta, no la página: el nombre que eligió
la página es el que Playwright informa como sugerido. Una descarga se prueba de verdad en
un navegador normal.

## Documentos que hay que mantener al día

| Al terminar…                     | Actualizar                                     |
| -------------------------------- | ---------------------------------------------- |
| Una feature o un pendiente       | `docs/estado-del-proyecto.md`                  |
| Una carpeta o una ruta nueva     | La estructura y las rutas de `architecture.md` |
| Una regla de negocio             | `VENDUO.md` y `domain-venduo.md`               |
| Algo del sistema de plantillas   | `docs/store-templates.md`                      |
| Una skill en `.agents/skills/`   | Correr `npm run sync:agents`                   |
| Una regla o algo de este archivo | `CLAUDE.md` y `AGENTS.md` si cambia su resumen |

`CLAUDE.md` (Claude Code) y `AGENTS.md` (Antigravity, Cursor, Codex y otros) resumen lo
mismo para herramientas distintas: **si se cambia uno, se cambia el otro.**
