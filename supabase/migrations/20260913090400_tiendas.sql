-- ============================================================================
-- Venduo — 0004 tiendas: el tenant, su suscripción y su catálogo
-- ============================================================================

-- ----------------------------------------------------------------------------
-- La tienda es el tenant. Todo dato de negocio cuelga de acá.
--
-- No hay columna de moneda: el boliviano es constante del sistema.
-- ----------------------------------------------------------------------------
create table if not exists public.stores (
  id                      uuid primary key default gen_random_uuid(),
  owner_id                uuid not null references auth.users(id) on delete cascade,
  name                    text not null,
  slug                    text not null,
  tagline                 text,
  description             text,
  logo_url                text,
  template_key            text references public.templates(key) on delete set null,
  theme                   jsonb not null default '{}'::jsonb,
  commission_bps          integer not null default 0
                            check (commission_bps between 0 and 10000),
  seller_network_enabled  boolean not null default false,
  seller_join_mode        public.seller_join_mode not null default 'abierta',
  is_published            boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz
);

-- Una tienda por usuario: multi-tienda está fuera de alcance y se impide
-- en la base, no solo en la interfaz. Parcial, por el borrado lógico.
create unique index if not exists stores_owner_id_key
  on public.stores (owner_id) where deleted_at is null;

create unique index if not exists stores_slug_key
  on public.stores (slug) where deleted_at is null;

-- ----------------------------------------------------------------------------
-- Suscripción: una por tienda.
--
-- `purge_at` marca el único borrado físico del sistema: la eliminación de los
-- datos de una tienda que venció su prueba y no se suscribió.
-- ----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null unique references public.stores(id) on delete cascade,
  plan_key       text not null references public.plans(key),
  status         public.subscription_status not null default 'prueba',
  trial_ends_at  timestamptz not null default (now() + interval '30 days'),
  blocked_at     timestamptz,
  purge_at       timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists subscriptions_status_idx
  on public.subscriptions (status, trial_ends_at);

-- ----------------------------------------------------------------------------
-- Catálogo.
--
-- `condition` la elige el emprendedor al cargar el producto y es lo que
-- alimenta el filtro de segunda mano. `compare_at_price_cents` es el precio
-- anterior: la diferencia contra `price_cents` produce el descuento destacado.
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id                      uuid primary key default gen_random_uuid(),
  store_id                uuid not null references public.stores(id) on delete cascade,
  name                    text not null,
  description             text,
  price_cents             integer not null check (price_cents >= 0),
  compare_at_price_cents  integer check (compare_at_price_cents >= price_cents),
  stock                   integer not null default 0 check (stock >= 0),
  category                text,
  condition               public.product_condition not null default 'nuevo',
  condition_note          text,
  image_url               text,
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz
);

create index if not exists products_store_activos_idx
  on public.products (store_id, is_active) where deleted_at is null;

-- Índice parcial para el filtro de segunda mano: solo indexa lo que no es nuevo.
create index if not exists products_segunda_mano_idx
  on public.products (store_id, condition)
  where deleted_at is null and condition <> 'nuevo';
