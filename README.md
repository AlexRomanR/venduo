# Venduo MVP

Marketplace boliviano donde un negocio publica declarando solo su costo base y una
red de jóvenes lo vende a comisión. El precio, la comisión y el reparto los calcula
la plataforma. Frontend y backend en un solo repositorio.

**El modelo de negocio está en [`docs/modelo-de-negocio.md`](docs/modelo-de-negocio.md)**
y el producto en [`VENDUO.md`](VENDUO.md). Buena parte de lo construido responde al
modelo anterior —una tienda online por negocio, con plantillas—: qué sigue en pie y qué
hay que rehacer está en
[`docs/estado-del-proyecto.md`](docs/estado-del-proyecto.md).

---

## Arrancar en dos comandos

```bash
npm install
npm run dev
```

Abrí <http://localhost:3000>.

**Funciona sin configurar nada.** Sin credenciales el proyecto corre en _modo
demo_: el middleware deja pasar y la capa de IA usa un proveedor simulado que
genera respuestas válidas contra los mismos esquemas zod. Sirve para levantar
el proyecto antes de conectar servicios.

Para preparar el archivo de entorno de una:

```bash
npm run setup   # crea .env.local desde .env.example y te dice qué falta
```

---

## Stack

| Capa          | Tecnología                            | Dónde vive                                           |
| ------------- | ------------------------------------- | ---------------------------------------------------- |
| Framework     | Next.js 15 (App Router) + TypeScript  | `app/`                                               |
| Estilos       | Tailwind CSS v4                       | `app/globals.css`                                    |
| Componentes   | shadcn/ui                             | `components/ui/`                                     |
| Base de datos | Supabase (PostgreSQL)                 | `supabase/migrations/`, `lib/supabase/`              |
| Autenticación | Supabase Auth (email + Google)        | `app/login/`, `app/auth/`, `middleware.ts`           |
| Archivos      | Supabase Storage                      | `lib/supabase/storage.ts`                            |
| IA            | Capa propia, proveedor intercambiable | `lib/ai/`                                            |
| Gráficos      | Recharts                              | `components/ui/chart.tsx`                            |
| Códigos QR    | qrcode                                | `lib/qr.ts`, `app/api/qr/`                           |
| Validación    | zod                                   | `lib/ai/schemas.ts`, `lib/validation/`, `lib/env.ts` |
| Hosting       | Vercel                                | —                                                    |
| Versionado    | GitHub, una rama por persona          | `.github/workflows/ci.yml`                           |

---

## Comandos

| Comando             | Qué hace                                         |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Servidor de desarrollo con Turbopack             |
| `npm run build`     | Build de producción                              |
| `npm start`         | Sirve el build (esto es lo que corre en la nube) |
| `npm run check`     | Tipos + lint + formato, todo junto               |
| `npm run typecheck` | Solo TypeScript                                  |
| `npm run lint`      | Solo ESLint                                      |
| `npm run format`    | Formatea con Prettier                            |
| `npm run setup`     | Crea `.env.local` y reporta qué falta            |
| `npm run db:push`   | Aplica las migraciones al proyecto de Supabase   |
| `npm run db:types`  | Regenera `types/database.ts` desde la base real  |

---

## Configuración

Copiá `.env.example` a `.env.local` y completá lo que vayas a usar. Todo es
opcional: lo que falte simplemente cae en modo demo.

### Supabase

1. Creá un proyecto en <https://supabase.com>.
2. **Project Settings → API**: copiá la URL y la `anon` key a
   `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **SQL Editor**: pegá las migraciones de `supabase/migrations/` en orden y
   ejecutalas. `0001_profiles.sql` es lo mínimo para que funcione el login;
   `0002_app_schema.sql` agrega catálogo, pedidos, IA y los buckets de Storage.
4. **Authentication → URL Configuration**: agregá
   `http://localhost:3000/auth/callback` y la URL de Vercel a las _Redirect
   URLs_.
5. Para login con Google: **Authentication → Providers → Google**, cargá el
   client ID y secret de Google Cloud.

Con la CLI, en lugar del paso 3:

```bash
npx supabase link --project-ref <tu-project-ref>
npm run db:push
```

### Inteligencia artificial

El código de la aplicación nunca importa un SDK de proveedor: habla con la
interfaz `AIProvider` de `lib/ai/types.ts`. Cambiar de modelo es cambiar el
entorno.

```bash
# Claude (SDK oficial de Anthropic)
AI_PROVIDER=anthropic
AI_MODEL=claude-opus-5
AI_API_KEY=sk-ant-...

# Cualquier API con formato OpenAI: OpenAI, Groq, OpenRouter, Ollama, vLLM…
AI_PROVIDER=openai-compatible
AI_MODEL=gpt-4o-mini
AI_API_KEY=sk-...
AI_BASE_URL=https://api.openai.com/v1

# Google Gemini
AI_PROVIDER=google
AI_MODEL=gemini-2.0-flash
AI_API_KEY=...

# Sin credenciales: respuestas simuladas, válidas contra los mismos esquemas
AI_PROVIDER=mock
```

Si elegís un proveedor real y falta la API key, la capa avisa por consola y cae
sola al modo demo en vez de romper el arranque.

**Agregar un proveedor nuevo** son dos pasos:

1. Escribí el adaptador en `lib/ai/providers/`, implementando `AIProvider`.
2. Registralo en `REGISTRY`, en `lib/ai/index.ts`.

Nada más cambia. Toda salida de la IA se valida con zod
(`lib/ai/schemas.ts`) antes de llegar a la UI, así que un modelo que devuelve
un JSON mal formado produce un error claro, no una pantalla rota.

---

## Estructura

```
app/
  page.tsx                 Portada pública
  login/                   Registro e ingreso con correo y contraseña
  crear/                   Alta de la tienda: plantilla (paso 1) y negocio (paso 2)
  sumarme/                 Alta del vendedor: cómo sumarse a una tienda
  auth/callback/           Intercambio de código por sesión
  auth/sign-out/           Cierre de sesión
  (privado)/               Grupo de rutas: no aparece en la URL
    layout.tsx             Shell compartido de las áreas privadas
    panel/                 Resumen del negocio y sus secciones, apariencia incluida
    vendedor/              Panel del vendedor
  api/
    health/                Estado del servidor y de las capas

lib/                       Infraestructura lista para usar, sin UI encima
  ai/                      Capa de IA: tipos, registro, adaptadores, tareas
  supabase/                Clientes (browser, server, admin), middleware, storage
  data/                    Consultas de lectura: panel, plantillas, dashboard
  plantillas/              La base de cada plantilla de tienda: tokens y registro
  validation/              Esquemas zod compartidos entre formularios y acciones
  demo-data.ts             Datos de ejemplo del modo demo
  env.ts                   Entorno validado con zod
  qr.ts                    Generación de códigos QR
  format.ts                Moneda, fechas, slugs

components/
  ui/                      shadcn/ui completo
  auth/acceso.tsx          Ingreso y registro, con la promesa de cada rol
  onboarding/              Altas: marco, pasos y galería de plantillas
  plantillas/              Un kit de componentes por plantilla de tienda
  tienda/                  Lo que comparten todas las plantillas: carrito, checkout, pago
  panel/                   Piezas de los paneles del negocio y del joven
  landing/                 Piezas de la portada
  config-status.tsx        Checklist de capas configuradas

supabase/migrations/       Esquema SQL, RLS y buckets
docs/modelo-de-negocio.md  El modelo vigente: precio, comisiones y reparto
docs/estado-del-proyecto.md Qué está hecho y qué falta
docs/store-templates.md    El sistema de plantillas de tienda (fuera del modelo vigente)
types/database.ts          Tipos de la base (regenerables con npm run db:types)
```

---

## Modelo de datos

| Tabla            | Para qué                                        |
| ---------------- | ----------------------------------------------- |
| `profiles`       | Perfil del usuario, se crea solo al registrarse |
| `stores`         | Tiendas; una por dueño en el MVP                |
| `products`       | Catálogo, precios en centavos (enteros)         |
| `orders`         | Pedidos con su estado y la custodia del pago    |
| `order_items`    | Líneas del pedido                               |
| `ai_generations` | Historial de lo que generó la IA                |

Row Level Security está activo en todas. El dueño administra lo suyo; el
público solo ve tiendas publicadas y productos activos.

Buckets de Storage: `product-images` (público) y `payment-proofs` (privado).

> Los montos se guardan **en centavos, como enteros**. Nunca uses `float` para
> plata.

---

## Deploy en Vercel

1. Subí el repositorio a GitHub.
2. En <https://vercel.com> → **Add New → Project** → importá el repo.
3. Cargá las variables de entorno de `.env.example` que estés usando.
4. Deploy. Cada push a `main` publica producción; cada PR genera un preview con
   HTTPS.

Después del primer deploy, agregá la URL de Vercel a las _Redirect URLs_ de
Supabase Auth y a `NEXT_PUBLIC_SITE_URL`.

Para correr el build de producción localmente:

```bash
npm run build && npm start
```

---

## Trabajo en equipo

- Una rama por persona: `git checkout -b nombre/lo-que-hago`.
- Integrar cada tres horas: `git pull --rebase origin main`, resolver, push, PR.
- El CI (`.github/workflows/ci.yml`) corre tipos, lint, formato y build en cada
  push y cada PR. Tiene que estar en verde antes de mergear.
- Antes de pushear: `npm run check`.

---

## Qué hay listo para construir encima

El proyecto es un punto de partida: la infraestructura está completa y probada,
pero no hay vistas más allá del login. Lo que ya está disponible en `lib/`:

- **Capa de IA** (`lib/ai/`) con cuatro adaptadores intercambiables por entorno
  y tres tareas listas: `generateStoreBlueprint`, `analyzeSales` y
  `generateCampaign`. Toda salida validada con zod antes de usarse.
- **Supabase** (`lib/supabase/`): clientes de browser, servidor y admin, helper
  de Storage y el middleware que protege `/panel` y `/vendedor`.
- **Esquema de base** (`supabase/migrations/`) con seis tablas,
  RLS en todas y los dos buckets de Storage.
- **QR** (`lib/qr.ts`) para generar códigos en PNG o SVG.
- **Validación y formato** (`lib/validation/`, `lib/format.ts`).
- **shadcn/ui completo** en `components/ui/`.

Para agregar una sección: creá la carpeta bajo `app/(privado)/panel/`, sumá el
link en `app/(privado)/layout.tsx` y usá lo que ya está en `lib/`.

Las reglas y skills que siguen Claude Code y Antigravity están en `CLAUDE.md`,
`AGENTS.md` y `.agents/`.
