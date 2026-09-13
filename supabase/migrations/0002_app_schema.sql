-- ============================================================================
-- Venduo MVP - 0002: tiendas, catálogo, pedidos, IA y Storage
--
-- Depende de 0001_profiles.sql. Aplicar cuando se empiecen a construir las
-- secciones del dashboard; el login funciona sin esta migración.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tipos
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.order_status as enum
    ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_generation_kind as enum
    ('tienda', 'analisis', 'marketing');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Tablas
-- ----------------------------------------------------------------------------
create table if not exists public.stores (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  slug          text not null unique,
  tagline       text,
  description   text,
  logo_url      text,
  currency      text not null default 'ARS',
  is_published  boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  name         text not null,
  description  text,
  price_cents  integer not null check (price_cents >= 0),
  stock        integer not null default 0 check (stock >= 0),
  category     text,
  image_url    text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  store_id           uuid not null references public.stores(id) on delete cascade,
  buyer_name         text not null,
  buyer_email        text,
  buyer_phone        text,
  total_cents        integer not null check (total_cents >= 0),
  status             public.order_status not null default 'pendiente',
  payment_proof_url  text,
  created_at         timestamptz not null default now()
);

create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  product_name      text not null,
  quantity          integer not null check (quantity > 0),
  unit_price_cents  integer not null check (unit_price_cents >= 0)
);

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

create index if not exists products_store_id_idx on public.products(store_id);
create index if not exists orders_store_id_idx   on public.orders(store_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists stores_owner_id_idx   on public.stores(owner_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.stores         enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.ai_generations enable row level security;

-- stores: el dueno hace todo; el publico solo ve las publicadas
drop policy if exists "tiendas publicadas: leer" on public.stores;
create policy "tiendas publicadas: leer" on public.stores
  for select using (is_published or auth.uid() = owner_id);

drop policy if exists "tiendas propias: administrar" on public.stores;
create policy "tiendas propias: administrar" on public.stores
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- products: visibles si la tienda esta publicada y el producto activo
drop policy if exists "productos publicados: leer" on public.products;
create policy "productos publicados: leer" on public.products
  for select using (
    exists (
      select 1 from public.stores s
      where s.id = products.store_id
        and ((s.is_published and products.is_active) or s.owner_id = auth.uid())
    )
  );

drop policy if exists "productos propios: administrar" on public.products;
create policy "productos propios: administrar" on public.products
  for all using (
    exists (select 1 from public.stores s
            where s.id = products.store_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.stores s
            where s.id = products.store_id and s.owner_id = auth.uid())
  );

-- orders: cualquiera puede crear un pedido; solo el dueno de la tienda lo ve
drop policy if exists "pedidos: crear" on public.orders;
create policy "pedidos: crear" on public.orders
  for insert with check (
    exists (select 1 from public.stores s
            where s.id = orders.store_id and s.is_published)
  );

drop policy if exists "pedidos de mi tienda: leer" on public.orders;
create policy "pedidos de mi tienda: leer" on public.orders
  for select using (
    exists (select 1 from public.stores s
            where s.id = orders.store_id and s.owner_id = auth.uid())
  );

drop policy if exists "pedidos de mi tienda: actualizar" on public.orders;
create policy "pedidos de mi tienda: actualizar" on public.orders
  for update using (
    exists (select 1 from public.stores s
            where s.id = orders.store_id and s.owner_id = auth.uid())
  );

drop policy if exists "items: crear" on public.order_items;
create policy "items: crear" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o
            join public.stores s on s.id = o.store_id
            where o.id = order_items.order_id and s.is_published)
  );

drop policy if exists "items de mi tienda: leer" on public.order_items;
create policy "items de mi tienda: leer" on public.order_items
  for select using (
    exists (select 1 from public.orders o
            join public.stores s on s.id = o.store_id
            where o.id = order_items.order_id and s.owner_id = auth.uid())
  );

-- ai_generations: historial privado de cada usuario
drop policy if exists "generaciones propias: leer" on public.ai_generations;
create policy "generaciones propias: leer" on public.ai_generations
  for select using (auth.uid() = user_id);

drop policy if exists "generaciones propias: crear" on public.ai_generations;
create policy "generaciones propias: crear" on public.ai_generations
  for insert with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Storage
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

drop policy if exists "imagenes de producto: leer" on storage.objects;
create policy "imagenes de producto: leer" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "imagenes de producto: subir" on storage.objects;
create policy "imagenes de producto: subir" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "imagenes de producto: borrar" on storage.objects;
create policy "imagenes de producto: borrar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and owner = auth.uid());

drop policy if exists "comprobantes: subir" on storage.objects;
create policy "comprobantes: subir" on storage.objects
  for insert with check (bucket_id = 'payment-proofs');

drop policy if exists "comprobantes: leer propios" on storage.objects;
create policy "comprobantes: leer propios" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and owner = auth.uid());
