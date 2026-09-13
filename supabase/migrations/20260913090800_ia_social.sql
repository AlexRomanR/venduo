-- ============================================================================
-- Venduo — 0008 IA y difusión
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Historial de todo lo que generó la IA.
-- ----------------------------------------------------------------------------
create table if not exists public.ai_generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  store_id    uuid references public.stores(id) on delete set null,
  kind        public.ai_generation_kind not null,
  provider    text not null,
  model       text not null,
  prompt      text not null,
  output      jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists ai_generations_user_idx
  on public.ai_generations (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Credenciales de redes sociales.
--
-- Esta tabla NO lleva políticas de lectura: solo se accede desde el servidor
-- con la clave de servicio. Un token de Meta en manos del navegador es una
-- cuenta comprometida.
-- ----------------------------------------------------------------------------
create table if not exists public.social_connections (
  id                   uuid primary key default gen_random_uuid(),
  store_id             uuid not null references public.stores(id) on delete cascade,
  provider             public.social_provider not null,
  external_account_id  text,
  access_token         text,
  expires_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (store_id, provider)
);

-- ----------------------------------------------------------------------------
-- Posteos generados.
--
-- El estado distingue 'publicado' por API (plan A) de 'compartido' por enlace
-- manual (plan B). Por eso el modelo sostiene los dos caminos sin cambios.
-- ----------------------------------------------------------------------------
create table if not exists public.social_posts (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references public.stores(id) on delete cascade,
  ai_generation_id  uuid references public.ai_generations(id) on delete set null,
  product_id        uuid references public.products(id) on delete set null,
  provider          public.social_provider not null,
  content           text not null,
  media_url         text,
  status            public.social_post_status not null default 'borrador',
  external_post_id  text,
  error             text,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index if not exists social_posts_store_idx
  on public.social_posts (store_id, status) where deleted_at is null;
