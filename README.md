<p align="center">
  <img src="public/marca/venduo-horizontal.svg" alt="Venduo" width="320">
</p>

<h3 align="center">Generador de tiendas online para quien vende por redes sociales</h3>

<p align="center">
  Tu tienda online lista en minutos —sobre una plantilla que la IA edita por bloques— y
  todo lo que hay detrás: stock, pedidos que llegan por WhatsApp, estadísticas y
  catálogos en PDF.
</p>

<p align="center">
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js_15-000000?logo=nextdotjs&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React_19-149ECA?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white">
  <img alt="Tailwind CSS v4" src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="shadcn/ui" src="https://img.shields.io/badge/shadcn%2Fui-000000?logo=shadcnui&logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white">
</p>

---

## ¿Qué es Venduo?

**Venduo es una plataforma que genera tiendas online para emprendedores que venden por
TikTok, Instagram, Facebook y WhatsApp.** Quien vende por redes no necesita "una página
web": necesita dejar de responder "¿precio?" cincuenta veces al día, no vender lo que ya
no tiene y dejar de perder pedidos entre mensajes.

Con Venduo, el emprendedor:

1. **Elige una plantilla** según su rubro (moda, perfumería o editorial).
2. **Cuenta su negocio** en un párrafo, deja el **WhatsApp de su tienda** y la **IA
   ajusta la tienda**: secciones, textos, colores y tipografía.
3. **Carga sus productos** con fotos, stock y condición (nuevo, segunda mano o
   reacondicionado).
4. **Publica** y obtiene el enlace de su tienda y un código QR para su bio y WhatsApp.
5. **Recibe los pedidos por WhatsApp**: su cliente arma el carrito y se lo manda con el
   total y el número del pedido, sin llenar formularios.
6. **Gestiona** pedidos, stock, estadísticas y catálogos en PDF desde su panel.

> Proyecto nacido en una hackathon de 48 horas, pensado para Bolivia.

---

## Funcionalidades

### Para el emprendedor

| Módulo                                  | Qué hace                                                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 🛍️ **Generador de tiendas**             | Alta en tres pasos: plantilla, datos del negocio y tienda publicada con URL propia (`/t/{slug}`) y QR                                       |
| 🎨 **Editor visual con IA**             | Seis pasos con vista previa real: marca, portada, catálogo, ficha de producto, carrito y publicar. Arrastrar secciones, deshacer, versiones |
| 🤖 **La IA edita por bloques**          | Se le pide en palabras ("ponla en tonos de verano") y devuelve operaciones que el sistema valida antes de mostrarlas                        |
| 📦 **Productos y stock**                | Fotos, stock con umbral de aviso, categorías, precio anterior para descuentos, segunda mano y reacondicionados                              |
| 🧾 **Pedidos por WhatsApp**             | El carrito se manda al WhatsApp de la tienda con su número y su total; en el panel se marca pagado y el stock baja solo                     |
| 📊 **Estadísticas en lenguaje natural** | "¿Qué producto se vende más este mes?" → la IA arma la consulta y la respuesta llega como gráfico, con informe descargable en PDF           |
| 📄 **Catálogos en PDF**                 | Doce plantillas, packs y ofertas, con los colores de la tienda. Se descargan, se comparten por enlace o se siguen editando en Canva         |

### Para el comprador

- Tienda **pensada para el celular**, con catálogo, filtros, búsqueda y ficha de producto.
- **Sin cuenta y sin formularios**: elige, ve el total y toca "Enviar pedido por
  WhatsApp". El chat se abre con su pedido ya escrito para la tienda.

---

## Tecnologías y lenguajes

| Capa                        | Tecnología                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Lenguajes**               | TypeScript (TSX), SQL / PL/pgSQL, CSS                                                                                              |
| **Framework**               | Next.js 15 con App Router, React 19 y Server Components / Server Actions                                                           |
| **Base de datos**           | Supabase: PostgreSQL con Row Level Security, funciones y disparadores                                                              |
| **Autenticación**           | Supabase Auth (correo y contraseña)                                                                                                |
| **Archivos**                | Supabase Storage (fotos de productos, imágenes de la tienda)                                                                       |
| **Estilos**                 | Tailwind CSS v4 y componentes de shadcn/ui sobre Radix                                                                             |
| **Inteligencia artificial** | Capa propia con proveedor intercambiable: Anthropic Claude, Google Gemini, cualquier API compatible con OpenAI, o un modo simulado |
| **Validación**              | zod en todos los límites: formularios, entorno y respuestas de la IA                                                               |
| **Formularios**             | react-hook-form                                                                                                                    |
| **PDF**                     | @react-pdf/renderer y sharp, generados en el servidor                                                                              |
| **Arrastrar y soltar**      | @dnd-kit (funciona con el dedo y el teclado)                                                                                       |
| **Gráficos**                | SVG dibujado a mano, sin biblioteca                                                                                                |
| **Otros**                   | qrcode, sonner (avisos), lucide-react (íconos), date-fns                                                                           |
| **Hosting y CI**            | Vercel (región São Paulo) y GitHub Actions                                                                                         |

---

## Arquitectura en corto

```
Comprador ─▶ /t/{slug} ─┬─▶ Next.js (Server Components) ─▶ Supabase (PostgreSQL + RLS)
Emprendedor ─▶ /panel ──┘              │
     ▲                                 └─▶ Capa de IA ─▶ Claude · Gemini · OpenAI · mock
     └──────── el pedido llega por WhatsApp ◀── carrito del comprador
```

Algunas decisiones que vale la pena conocer:

- **Multi-tenant con Row Level Security.** Cada tabla de negocio lleva su `store_id` y
  Postgres impone el aislamiento: una tienda por emprendedor, y ninguna ve los datos de
  otra.
- **El pedido no confía en el navegador.** Se crea con una función del servidor
  (`create_order`) que recalcula los precios y comprueba el stock; el mensaje de WhatsApp
  se arma con lo que ella devuelve.
- **El stock baja al marcar el pedido pagado**, y lo mueve un disparador de la base: un
  carrito mandado y nunca concretado no retiene unidades.
- **Dinero en centavos enteros**, porcentajes en puntos básicos. Nunca punto flotante.
- **La IA propone, el sistema valida y ejecuta.** Toda respuesta del modelo pasa por un
  esquema zod antes de tocar la base o la pantalla. La IA de estadísticas solo puede leer,
  en una transacción de solo lectura y contra vistas acotadas a la propia tienda.
- **Plantillas como kits de componentes.** Una tienda se dibuja con el kit de su
  plantilla, y la personalización se guarda como diferencia respecto de la base.
- **Borrado lógico** en todas partes: los pedidos se cancelan, nunca se borran.
- **Modo demo**: sin credenciales, el proyecto arranca igual con datos e IA simulados.

---

## Estructura del repositorio

```
app/                    Rutas de Next.js
  page.tsx              Portada pública
  t/[slug]/             Tienda pública: portada, catálogo, producto y carrito
  crear/                Alta de la tienda (el generador), con su WhatsApp
  editor/               Editor visual de la tienda, a pantalla completa
  (privado)/panel/      Panel del emprendedor: productos, pedidos, estadísticas,
                        apariencia y catálogos
  c/[token]/            Catálogo en PDF compartido por enlace

components/             Componentes de React por área (tienda, editor, panel, catálogos…)
  plantillas/           Un kit de componentes por plantilla de tienda
  ui/                   shadcn/ui

lib/                    Lógica sin interfaz
  ai/                   Capa de IA: proveedores, tareas y esquemas
  supabase/             Clientes de navegador, servidor y administración
  data/                 Consultas de lectura
  plantillas/           Tokens, bloques y operaciones del editor
  catalogos/            Modelo y generación de los catálogos en PDF
  insights/             Estadísticas en lenguaje natural

supabase/migrations/    Esquema SQL: tablas, políticas RLS, funciones y disparadores
types/                  Tipos generados de la base y alias
docs/                   Documentación técnica
```

---

## Cómo correrlo

Requiere **Node.js 20.9** o superior.

```bash
npm install
npm run dev
```

Y abre <http://localhost:3000>.

**Funciona sin configurar nada.** Sin credenciales el proyecto arranca en **modo demo**:
datos de ejemplo y una IA simulada que responde con el mismo formato que la real.

Para conectar los servicios reales:

```bash
npm run setup   # crea .env.local desde .env.example y dice qué falta
```

- **Supabase**: la URL y la clave pública del proyecto. Las migraciones se aplican con
  `npx supabase link --project-ref <ref>` y `npm run db:push`.
- **IA**: `AI_PROVIDER` (`anthropic`, `google`, `openai-compatible` o `mock`),
  `AI_MODEL` y `AI_API_KEY`. Cambiar de proveedor es cambiar el entorno, no el código.

### Comandos

| Comando            | Qué hace                                             |
| ------------------ | ---------------------------------------------------- |
| `npm run dev`      | Servidor de desarrollo con Turbopack                 |
| `npm run build`    | Build de producción                                  |
| `npm start`        | Sirve el build                                       |
| `npm run check`    | Tipos, lint y formato en secuencia (lo mismo que CI) |
| `npm run format`   | Formatea con Prettier                                |
| `npm run db:push`  | Aplica las migraciones a Supabase                    |
| `npm run db:types` | Regenera los tipos de la base                        |
| `npm run marca`    | Regenera los archivos del logo                       |

---

## Estado del proyecto

| Funcionalidad                                          | Estado |
| ------------------------------------------------------ | ------ |
| Registro e ingreso                                     | ✅     |
| Generación de la tienda desde una plantilla del rubro  | ✅     |
| Editor visual de la tienda asistido por IA             | ✅     |
| Tienda pública con URL propia, navegable en el celular | ✅     |
| Productos con fotos, stock, categorías y condición     | ✅     |
| Carrito que manda el pedido por WhatsApp, sin datos    | ✅     |
| Pedidos en el panel, con stock que baja al pagar       | ✅     |
| Estadísticas en lenguaje natural con informe en PDF    | ✅     |
| Catálogos en PDF con doce plantillas y Canva           | ✅     |
| Copys de marketing con IA y publicación en redes       | ❌     |

✅ hecho · ❌ pendiente. El detalle está en
[`docs/estado-del-proyecto.md`](docs/estado-del-proyecto.md).

---

## Documentación

| Archivo                                                      | Qué contiene                                             |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| [`VENDUO.md`](VENDUO.md)                                     | La especificación del producto: problema, modelo y datos |
| [`DESIGN.md`](DESIGN.md)                                     | El sistema visual de Venduo                              |
| [`docs/estado-del-proyecto.md`](docs/estado-del-proyecto.md) | Qué está hecho y qué falta                               |
| [`docs/store-templates.md`](docs/store-templates.md)         | Cómo funcionan las plantillas de tienda                  |
| [`docs/catalogos-pdf.md`](docs/catalogos-pdf.md)             | Cómo se arman los catálogos en PDF                       |
| [`CLAUDE.md`](CLAUDE.md) y [`AGENTS.md`](AGENTS.md)          | Reglas del proyecto para agentes de código               |
