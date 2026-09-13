---
description: Crear y aplicar una migración de base de datos
---

Usá la skill `database-migration` y seguí su procedimiento para: $ARGUMENTS

Recordá lo que más se olvida:

- Nombre con marca de tiempo en `supabase/migrations/`.
- SQL idempotente: `if not exists`, `drop policy if exists` antes de cada `create policy`.
- `store_id` en toda tabla de negocio, y `deleted_at` salvo en `orders`, `order_items` y
  `commissions`.
- Índices únicos **parciales** (`where deleted_at is null`).
- Dinero en centavos enteros, porcentajes en puntos básicos.
- Políticas con `(select auth.uid())` y con los auxiliares `my_store_id()` /
  `my_seller_ids()`, nunca consultando la tabla que protegen.

Antes de aplicar, mostrame el SQL. Después de `npx supabase db push`, corré
`npm run db:types` y `npm run typecheck`.
