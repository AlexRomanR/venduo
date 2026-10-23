# Tests automatizados

**Pedido**: "hagamos lo de los tests que actualmente no están permitidos en Venduo por
criterios de la hackathon, pero como ya pasó sería bueno tenerlos, así de paso lo
fusionamos con lo de ponytail".

**Para quién**: el equipo que cambia el código (personas y agentes).

**Problema**: `VENDUO.md` §7 excluye los tests desde la hackathon. Hoy solo hay
`npm run check` (tipos, lint, formato) y prueba a mano. Un error de lógica en el dinero o
el stock compila igual y lo descubre una tienda real, porque la única base es la de
producción. Ponytail pide un test chico por lógica nueva, y hoy se lo frena.

**Sale bien si**:

- Hay tests de la lógica de TypeScript que mueve dinero y datos: totales en centavos,
  el porcentaje de rebaja de una oferta, variantes, el número de WhatsApp.
- Hay tests de la base sobre una copia local en Docker, nunca contra producción:
  `create_order` recalcula precios, el stock baja al marcar pagado y vuelve al cancelar,
  y una tienda no ve los datos de otra.
- Un test en rojo frena `npm run check` y el CI. El deploy de Vercel sigue igual.
- Las reglas dicen cuándo se escribe un test: toda lógica nueva o cambiada que toque
  dinero, stock, pedidos o permisos. Textos, pantallas y estilos, no.
- Ponytail queda sin la excepción "en Venduo no".

**Dónde**: la web. La app, después de que la persona lo apruebe.

**No tiene que romper**: `npm run check` rápido para el día a día; el build; el deploy;
la base de producción (los tests nunca la tocan).

**Fuera de alcance**: tests de pantallas con Playwright; frenar el deploy de Vercel con
el CI; la app en esta vuelta; cubrir todo el código existente.

## Decisiones de la pausa

- Herramientas: Vitest para TypeScript (`npm test`, entra en `npm run check`) y pgTAP
  con `supabase test db --local` para la base (`npm run test:db`, aparte, con Docker).
  El CI corre los dos; el de base en un job sin credenciales.
- La cuenta de bolivianos a centavos, copiada en tres lugares, se unifica en
  `lib/format.ts` y se testea.
- Cancelar un pedido pagado cuya variante se borró: la unidad vuelve a la variante viva
  con la misma combinación, si existe; si no, no se suma a nada. Va en una migración.
- El CI sube de Node 20 a 22.
- Rama `tests-automatizados`, desde `fase-6-variantes`.

## Tareas

- [x] Base local desde cero: las migraciones corren limpias (`migration list --local`).
- [x] Vitest: `npm test` en verde; un assert roto pone en rojo `npm run check`.
- [x] Tests de `lib/pedidos.ts`, `lib/format.ts`, `descuento` y `rebajaDe`.
- [x] `aCentavos` en `lib/format.ts`, usado en los tres lugares, con test. Sin venta a mano:
      es la misma cuenta, y probarla escribe en producción.
- [x] Tests de `lib/variantes.ts`, `lib/tablero.ts`, `lib/funciones.ts`.
- [x] pgTAP: `create_order`; `npm run test:db` en verde y en rojo con un precio cambiado.
- [x] pgTAP: estado y stock, `registrar_venta`, stock de variantes, RLS entre tiendas.
- [x] Migración: la unidad vuelve a la variante con la misma combinación; su test.
- [x] CI: `npm test` en `verify`, job `base`, Node 22; los dos en verde en la rama.
- [x] Reglas, skills y documentos; `sync:agents:check` en verde.
- [x] Cierre: `npm run check` y `npm run build` con el servidor detenido.
