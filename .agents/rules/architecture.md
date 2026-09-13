# Arquitectura

La especificación del producto vive en `VENDUO.md`. Esta regla cubre solo cómo se
organiza el código.

## Next.js 15, App Router

**Todo componente es de servidor salvo que diga lo contrario.** `"use client"` va solo
donde hace falta interactividad real: estado, eventos, formularios. Un componente de
servidor puede hacer `await` a la base directamente en el cuerpo, sin capa intermedia.

La marca `"use client"` es contagiosa hacia abajo: todo lo que importa un componente de
cliente viaja al navegador. Ponerla lo más abajo posible del árbol.

## Rutas

| Ruta          | Qué es                          | Acceso          |
| ------------- | ------------------------------- | --------------- |
| `/`           | Redirige a `/login`             | Público         |
| `/login`      | Registro e ingreso              | Público         |
| `/t/{slug}`   | Tienda pública del emprendedor  | Público         |
| `/v/{slug}`   | Perfil público del vendedor     | Público         |
| `/panel`      | Panel del emprendedor           | Requiere sesión |
| `/vendedor`   | Panel del vendedor              | Requiere sesión |
| `/auth/*`     | Callback y cierre de sesión     | —               |
| `/api/health` | Estado del servidor y sus capas | Público         |

Ruteo **por path, no por subdominio**. Se usa el slug y no el identificador porque estas
URLs se imprimen en códigos QR y se mandan por WhatsApp.

**No se usa `/dashboard`.** Es la única ruta que estuvo en inglés y ya se renombró.

## Estructura real del proyecto

Esto es lo que existe hoy. No inventar carpetas: si hace falta una nueva, crearla y
actualizar esta lista.

```
app/
  (privado)/          Grupo de rutas: no aparece en la URL
    layout.tsx        Shell compartido de las áreas privadas
    panel/            Panel del emprendedor
    vendedor/         Panel del vendedor
  login/
  auth/callback/      Intercambio de código por sesión
  auth/sign-out/
  api/health/

components/
  ui/                 shadcn/ui. No editar a mano: se regeneran
  auth/               Formulario de ingreso y registro
  config-status.tsx   Checklist de capas configuradas
  theme-provider.tsx

lib/
  supabase/           Clientes de navegador, servidor y administración
  data/               Consultas de lectura
  validation/         Esquemas zod compartidos
  ai/                 Capa de IA
  format.ts           Moneda, fechas, slugs
  qr.ts               Códigos QR
  env.ts              Entorno validado con zod

types/
  database.ts         GENERADO. No editar a mano
  index.ts            Alias escritos a mano

supabase/migrations/  SQL con marca de tiempo en el nombre
```

## Los tres clientes de Supabase

| Función                                        | Dónde se usa                             |
| ---------------------------------------------- | ---------------------------------------- |
| `createClient()` de `lib/supabase/client`      | Componentes de cliente, en el navegador  |
| `createClient()` de `lib/supabase/server`      | Componentes de servidor y route handlers |
| `createAdminClient()` de `lib/supabase/server` | Solo servidor. **Salta RLS**             |

Los tres devuelven `null` si faltan credenciales. **Siempre comprobar antes de usar:**

```ts
const supabase = await createClient()
if (!supabase) return datosDeDemostracion
```

Ese `null` es lo que sostiene el modo demo: el proyecto arranca sin `.env.local` y la
interfaz sigue teniendo qué mostrar.

`createAdminClient()` nunca se llama desde código que llegue al navegador.

## Tipos de la base

`types/database.ts` lo **genera** la CLI con `npm run db:types` y se sobrescribe entero.
Nunca se edita a mano: el próximo que regenere borra el cambio.

Los alias (`Product`, `Store`, `Order`, `Commission`…) viven en `types/index.ts`, que sí
es escrito a mano. Importar desde `@/types`, no desde `@/types/database`.

## Middleware

`middleware.ts` en la raíz delega en `lib/supabase/middleware.ts`. Hace dos cosas:
refresca el token de Supabase en cada request, y redirige a `/login` a quien pida una
ruta de `PROTECTED_PREFIXES` sin sesión.

**No poner lógica entre `createServerClient` y `getUser()`:** rompe el refresco del token.

Sin credenciales configuradas el middleware deja pasar todo, para que el modo demo sea
navegable.
