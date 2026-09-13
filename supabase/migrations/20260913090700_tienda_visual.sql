-- ============================================================================
-- Venduo — 0007 tienda visual: páginas, bloques y propuestas de la IA
--
-- La IA no escribe la tienda: propone operaciones, el sistema las valida
-- contra el esquema de cada tipo de bloque y recién entonces las aplica.
-- ============================================================================

create table if not exists public.store_pages (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references public.stores(id) on delete cascade,
  key           text not null,
  title         text not null,
  status        public.page_status not null default 'borrador',
  is_home       boolean not null default false,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create unique index if not exists store_pages_store_key_key
  on public.store_pages (store_id, key) where deleted_at is null;

-- Una sola portada viva por tienda.
create unique index if not exists store_pages_home_key
  on public.store_pages (store_id) where is_home and deleted_at is null;

-- ----------------------------------------------------------------------------
-- Bloques concretos de cada página.
--
-- `store_id` repetido a propósito, aunque sea deducible vía la página: mantiene
-- la política de seguridad como una comparación sobre una sola tabla.
--
-- El vínculo con el tipo es `restrict`: no se retira del catálogo un tipo de
-- bloque que alguna tienda esté usando.
-- ----------------------------------------------------------------------------
create table if not exists public.store_blocks (
  id               uuid primary key default gen_random_uuid(),
  store_id         uuid not null references public.stores(id) on delete cascade,
  page_id          uuid not null references public.store_pages(id) on delete cascade,
  block_type_key   text not null references public.block_types(key) on delete restrict,
  position         integer not null check (position >= 0),
  props            jsonb not null default '{}'::jsonb,
  is_visible       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index if not exists store_blocks_page_idx
  on public.store_blocks (page_id, position) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- Propuestas de edición de la IA.
--
-- Guardar el estado previo cumple dos funciones: auditoría de lo que la IA
-- propuso, y deshacer — que en una demostración en vivo vale mucho.
-- ----------------------------------------------------------------------------
create table if not exists public.block_edit_proposals (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null references public.stores(id) on delete cascade,
  page_id            uuid not null references public.store_pages(id) on delete cascade,
  prompt             text not null,
  operations         jsonb not null,
  snapshot_before    jsonb not null,
  status             public.block_proposal_status not null default 'propuesta',
  validation_errors  jsonb,
  created_at         timestamptz not null default now(),
  applied_at         timestamptz
);

create index if not exists block_edit_proposals_page_idx
  on public.block_edit_proposals (page_id, created_at desc);
