# Plan: administración de Venduo y visitas

Lo que viene después del MVP de hackathon, ahora que Venduo es una startup: un panel
para operar la plataforma y un sistema de visitas por tienda. **Está construido**: este
documento queda como el porqué de cada decisión. Cómo se usa cada pieza está en las
reglas (`architecture.md`, `database-rls.md`, `domain-venduo.md`, `ai-layer.md`).

| Fase | Qué                                                                 | Estado |
| ---- | ------------------------------------------------------------------- | ------ |
| 0    | Quitar la segunda mano                                              | Hecho  |
| 1    | Base del administrador y empezar a contar visitas                   | Hecho  |
| 2    | Plantillas de tienda y de catálogo                                  | Hecho  |
| 3    | Funciones con tres estados, generales y por tienda                  | Hecho  |
| 4    | Tiendas: lista, ficha, pausar, suscripción, moderación              | Hecho  |
| 5    | Resumen, uso de IA, salud del sistema y las visitas del emprendedor | Hecho  |
| 6    | Registro abierto o cerrado y exportación                            | Hecho  |

**Lo que quedó distinto de lo planeado:**

- El uso de IA no sale de `ai_generations` sino de **`ai_requests`**, una fila por
  pedido al modelo con cuánto tardó y si falló (`lib/data/uso-ia.ts`).
  `ai_generations` guarda lo que generó, no lo que falló.
- La salud del sistema no muestra el último despliegue: no hay de dónde leerlo sin una
  clave de Vercel en el servidor.
- La exportación a CSV es de las tiendas con sus métricas; los datos de una tienda en
  CSV siguen siendo el pendiente de la suscripción bloqueada.

---

## Decisiones tomadas

- **Hay dos tipos de cuenta** (`VENDUO.md` §7). La del administrador de Venduo no sale
  del registro: se da de alta a mano. La primera es `alexromanramos96@gmail.com`, que
  ya existe en Supabase y no tiene tienda. Su contraseña no se escribe en ningún lado.
- **`/admin` no existe para nadie más**: responde 404, no "acceso denegado".
- **Apagarle algo a una tienda no le avisa nada.** Lo único que puede ver es el aviso de
  una función desactivada, y solo si toca su botón.
- **Funciones por plan: después.** Hoy hay un solo plan; queda la estructura lista.
- **Las visitas se cuentan desde la fase 1**, aunque nadie las vea todavía: cuanto antes
  se mide, más historia hay el día que se activan.
- **El emprendedor no ve sus visitas por defecto.** El administrador las activa por
  tienda o para todas; él las ve siempre.

---

## Fase 0 — Quitar la segunda mano

Era para la demostración de la hackathon. Está en unos 50 archivos y en la base:

- `products.condition` y `condition_note`, el formulario y la lista de productos.
- La propiedad `condition` de `product_grid` (`block_types.props_schema`,
  `lib/plantillas/secciones.ts`, `filtroDeGrilla`) y las portadas sembradas que la usan
  (`template_pages`, también en `store_blocks` de las tiendas que ya existen).
- Los filtros de la tienda pública y del panel, `CONDICIONES` y las etiquetas de cada kit.
- La vista `mis_productos` de la IA y `lib/insights/esquema.ts`.
- Los catálogos en PDF: filtros del selector y variantes que muestran la condición.
- Los productos de ejemplo, el modo demo, el mock de la IA y la documentación.

La migración es aditiva primero: las grillas sembradas dejan de pedir `condition`, y la
columna se borra recién cuando ningún código la lee. Las grillas "Segunda mano" de las
portadas existentes se quitan o pasan a "Lo nuevo".

---

## Fase 1 — La base

### El administrador

- `platform_admins (user_id)` y la función `is_platform_admin()`, `security definer`.
- `/admin` con su propio armazón, en el mundo de Venduo y con barra lateral, pensado para
  escritorio pero usable en el celular.
- Protegido en el middleware y comprobado de nuevo en el servidor con `exigirAdmin()`,
  la única puerta antes de usar el cliente de servicio (`createAdminClient`). Así no se
  tocan las políticas RLS de las tiendas.
- `/auth/destino` manda al administrador a `/admin`.
- `admin_audit_log`: quién cambió qué, cuándo, el antes y el después. Todo cambio del
  panel pasa por una función del servidor que lo escribe.

### Las visitas: cómo se cuentan

**Sin identificar a nadie.** Quien compra no deja datos, y eso vale también para quien
solo mira.

- **Qué se registra:** vista de la portada, del catálogo y de cada producto; agregar al
  carrito; mandar el pedido.
- **De dónde vienen:** WhatsApp, TikTok, Instagram y Facebook por la página de origen;
  **QR** y **catálogo en PDF** por una marca en el enlace (`?o=qr`, `?o=catalogo`) que
  ponen los QR y los catálogos de Venduo; el resto, directo.
- **Visitantes únicos:** una huella diaria —tienda, dirección de red, navegador y una sal
  que cambia cada día—. La dirección nunca se guarda y la huella de ayer no se cruza con
  la de hoy. Sin cookies.
- **Lo que no se cuenta:** robots, precargas (la visita la manda la página ya abierta,
  no el servidor al dibujarla), la vista previa del editor, el dueño mirando su propia
  tienda y la misma persona recargando dentro de 30 minutos.
- **Cómo llega a la base:** `/api/visita`, que anota en `store_visits`. Nunca una
  inserción directa desde el navegador: cualquiera podría inflar los números de otra
  tienda.
- **Cuánto se guarda:** el detalle 90 días; después queda resumido por día en
  `store_visits_daily`, para siempre.
- **No hace lenta la tienda:** el aviso sale con la página ya visible y no espera nada.

---

## Fase 2 — Plantillas

- **De tienda:** visible u oculta, orden en la galería, marca de "Nueva" y cuál se
  recomienda primero en cada rubro. Ocultar una no se la quita a quien ya la usa.
  Columnas nuevas en `templates`.
- **De catálogo:** las doce, visibles u ocultas y en orden, en
  `catalog_template_settings`. Lo que ve el emprendedor sale de cruzar el código con la
  tabla, igual que las plantillas de tienda.

---

## Fase 3 — Funciones

Cada función tiene tres estados:

| Estado                   | Lo que ve el emprendedor                                                                |
| ------------------------ | --------------------------------------------------------------------------------------- |
| **Activa**               | Todo normal                                                                             |
| **Desactivada**          | El botón está pero no responde; al tocarlo: "Esta función no está disponible por ahora" |
| **Desactivada y oculta** | No aparece                                                                              |

En los dos estados apagados **el servidor rechaza la acción**: ocultar el botón no
alcanza. Hay un estado general y uno por tienda, y el de la tienda manda.

| Grupo        | Función                                                         |
| ------------ | --------------------------------------------------------------- |
| IA           | IA en el editor (pedir cambios y escribir la portada)           |
| IA           | IA en estadísticas                                              |
| IA           | IA en catálogos                                                 |
| Herramientas | Catálogos en PDF                                                |
| Herramientas | Llevar a Canva                                                  |
| Herramientas | Enlace público de catálogo                                      |
| Herramientas | Estadísticas e informe en PDF                                   |
| Tienda       | Editor de la tienda                                             |
| Tienda       | Cambiar de plantilla                                            |
| Visitas      | Ver sus visitas (**oculta por defecto** para todas las tiendas) |

Además, dos interruptores generales: **apagar toda la IA de golpe** —para una caída del
proveedor o una demostración— y un **tope diario de pedidos a la IA** por tienda.

**Por dentro:** la lista cerrada vive en `lib/funciones.ts` (clave, nombre, grupo, estado
por defecto). Los estados en `feature_states` (general) y `store_feature_states` (por
tienda). `funcionesDeMiTienda()` resuelve el estado final una vez por pedido, junto con
`getMiTienda()`, sin viajes extra. Queda preparada la capa por plan, entre la general y
la de la tienda, sin pantalla.

---

## Fase 4 — Tiendas

- **Lista** con buscador y filtros: plantilla, estado de la suscripción, visitas de 7 y
  30 días, y "trabadas" —sin productos, sin visitas o sin pedidos en 14 días—.
- **Ficha de cada tienda:** sus números y su tienda pública; **sus visitas, siempre**;
  sus funciones con los tres estados; pausar la tienda pública; la suscripción
  (extender la prueba, bloquear, desbloquear: el estado que ya se modela, no un cobro);
  **moderación** (despublicar la tienda o un producto, con el motivo registrado); notas
  internas (`store_notes`); y escribirle al dueño por WhatsApp.

---

## Fase 5 — Resumen, IA, salud y las visitas del emprendedor

### Para el administrador

- **Resumen:** tiendas totales, nuevas, publicadas, en prueba y bloqueadas; pedidos y
  ventas pagadas de la plataforma; visitas y tiendas con más tráfico; **el embudo de
  activación**: cuenta registrada → tienda creada → primer producto → primera visita →
  primer pedido → primera venta pagada.
- **Uso de IA:** pedidos por tienda y por tipo, fallas y demoras de las últimas 24 horas,
  las tiendas que más la usan. Sale de `ai_generations`.
- **Salud del sistema:** Supabase, proveedor y modelo de IA con su tasa de fallas, Canva
  configurado, último despliegue.

### Para el emprendedor, si tiene "Visitas" activa

- **Resumen:** un panel "Quién visita tu tienda": visitas y visitantes de 7 y 30 días con
  su gráfico, de dónde vienen y el recorrido: visitas → vieron un producto → agregaron al
  carrito → mandaron el pedido → pagado.
- **Productos:** las vistas de cada producto y el filtro **"Muy vistos, poco vendidos"**:
  lo que se mira y no se compra pide revisar el precio, la foto o la descripción.
- **Estadísticas:** una vista nueva para la IA, `mis_visitas`, que solo puede leer si la
  función está activa en esa tienda.

---

## Fase 6 — Registro y exportación

- **Registro abierto o cerrado:** pausar las altas nuevas, o dejarlas solo por invitación,
  para una beta controlada.
- **Exportar a CSV** las tiendas con sus métricas.

---

## Lo que no cambia

Nada de esto entra en `VENDUO.md` §7: no se cobra la suscripción, no se le piden datos a
quien compra, no se manda correo. El panel opera la plataforma; no vende ni cobra.
