---
name: database-migration
description: >-
  Use this skill when creating, modifying, or auditing Supabase database
  migrations, Row Level Security (RLS) policies, indexes, or database
  functions for Venduo.
---

# Flujo de Creación y Auditoría de Migraciones de Base de Datos

Este skill detalla el procedimiento para escribir migraciones SQL seguras e idempotentes en **PostgreSQL (Supabase)**, garantizando el aislamiento RLS y la integridad del modelo de datos de **Venduo**.

---

## Estructura y Convenciones

1. **Ubicación y Nomenclatura:**
   - Ubicación: `supabase/migrations/`.
   - Formato: `YYYYMMDDHHMMSS_descripcion_corta.sql` (ej. `20260913120000_agregar_vistas_segunda_mano.sql`).
2. **Idempotencia Obligatoria:**
   - Las migraciones deben ser reejecutables sin fallar.
   - Para extensiones: `create extension if not exists "pgcrypto";`
   - Para enums:
     ```sql
     do $$ begin
       create type public.mi_nuevo_enum as enum ('valor_1', 'valor_2');
     exception when duplicate_object then null; end $$;
     ```
   - Para tablas: `create table if not exists public.mi_tabla (...);`
   - Para políticas RLS: `drop policy if exists "nombre_politica" on public.mi_tabla; create policy ...`
3. **Nunca editar una migración ya aplicada.** La CLI rastrea cuáles corrió por su marca
   de tiempo: un archivo modificado no se vuelve a ejecutar. Los cambios van en una
   migración nueva.
4. **Las políticas RLS van juntas** en su propio archivo, para poder auditar el
   aislamiento de una sola lectura en vez de repartido entre diez archivos.

---

## Lista de Verificación para Nuevas Tablas

Al crear una nueva tabla de negocio:

- [ ] ¿Tiene columna `id uuid primary key default gen_random_uuid()`?
- [ ] Si pertenece a una tienda: ¿tiene `store_id uuid not null references public.stores(id) on delete cascade`?
- [ ] ¿Tiene marcas de tiempo `created_at timestamptz default now() not null` y `updated_at timestamptz default now() not null`?
- [ ] ¿Tiene columna de borrado lógico `deleted_at timestamptz default null`? _(Excepto `orders`, `order_items` y `commissions`: un pedido se cancela por estado y una comisión se anula, nunca se borran)_
- [ ] Si maneja dinero: ¿está en centavos enteros con sufijo `_cents` (`integer` o `bigint`)? NUNCA `float` ni `numeric`.
- [ ] Si maneja porcentajes: ¿está en puntos básicos enteros con sufijo `_bps` (`integer` de 0 a 10000)?
- [ ] ¿Tiene índices únicos parciales `where deleted_at is null` para slugs, códigos o pares únicos?
- [ ] ¿Se activó RLS explícitamente (`alter table public.mi_tabla enable row level security;`)?
- [ ] ¿Las políticas RLS evalúan `(select auth.uid())` en lugar de `auth.uid()`?
- [ ] ¿Las políticas RLS incluyen la condición `deleted_at is null`?

---

## Reglas Críticas de RLS y Prevención de Recursión

1. **Evitar Recursión en Vendedores y Tiendas:**
   - La tabla `store_sellers` no debe consultarse a sí misma dentro de su política RLS.
   - Utilizar las funciones auxiliares declaradas en `supabase/migrations/20260913090900_funciones.sql`:
     - `public.my_store_id()`: Obtiene la tienda viva del usuario actual.
     - `public.my_seller_ids()`: Obtiene el arreglo de IDs de vendedor activos del usuario actual.
     - `public.store_is_live(p_store_id)`: Comprueba si la tienda está viva y con suscripción activa.
2. **Definición Segura de Funciones:**
   - Toda función `security definer` debe fijar explícitamente el `search_path`:
     ```sql
     create or replace function public.mi_funcion_auxiliar()
     returns uuid
     language sql
     stable
     security definer
     set search_path = public
     as $$
       ...
     $$;
     ```

---

## Despliegue y Regeneración de Tipos

1. **Aplicar Migraciones Localmente / Remotamente:**

   ```bash
   # Si usas Supabase local (Docker):
   npm run db:start

   # Para aplicar migraciones a tu proyecto vinculado de Supabase:
   npm run db:push
   ```

2. **Regenerar Tipos TypeScript:**
   - Una vez aplicadas las migraciones a Supabase, regenera el archivo de tipos de TypeScript:

   ```bash
   npm run db:types
   ```
   - Este comando actualiza `types/database.ts` garantizando que todo el código en `app/` y `lib/` esté perfectamente tipado.

3. **Verificación de Calidad:**
   ```bash
   npm run typecheck
   ```
