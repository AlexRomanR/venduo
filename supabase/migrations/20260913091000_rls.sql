-- ============================================================================
-- Venduo — 0010 Row Level Security
--
-- Todas las políticas juntas, a propósito: el aislamiento entre tiendas se
-- audita de una sola lectura y no repartido entre diez archivos.
--
-- Dos reglas que se repiten en todo el archivo:
--   1. `(select auth.uid())` y no `auth.uid()`: así Postgres lo evalúa una vez
--      por consulta y no una vez por fila.
--   2. `deleted_at is null` va en la política, no solo en la consulta. Si se
--      deja en la capa de datos, la próxima consulta se olvida de filtrarlo.
-- ============================================================================

alter table public.profiles             enable row level security;
alter table public.seller_profiles      enable row level security;
alter table public.plans                enable row level security;
alter table public.templates            enable row level security;
alter table public.template_pages       enable row level security;
alter table public.block_types          enable row level security;
alter table public.stores               enable row level security;
alter table public.subscriptions        enable row level security;
alter table public.products             enable row level security;
alter table public.store_sellers        enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.commissions          enable row level security;
alter table public.store_pages          enable row level security;
alter table public.store_blocks         enable row level security;
alter table public.block_edit_proposals enable row level security;
alter table public.ai_generations       enable row level security;
alter table public.social_connections   enable row level security;
alter table public.social_posts         enable row level security;

-- ----------------------------------------------------------------------------
-- Catálogos globales: lectura para todos, escritura solo con clave de servicio
-- (que salta RLS y por eso no necesita política).
-- ----------------------------------------------------------------------------
drop policy if exists "planes: leer" on public.plans;
create policy "planes: leer" on public.plans
  for select using (is_active);

drop policy if exists "plantillas: leer" on public.templates;
create policy "plantillas: leer" on public.templates
  for select using (is_active);

drop policy if exists "paginas de plantilla: leer" on public.template_pages;
create policy "paginas de plantilla: leer" on public.template_pages
  for select using (true);

drop policy if exists "tipos de bloque: leer" on public.block_types;
create policy "tipos de bloque: leer" on public.block_types
  for select using (is_active);

-- ----------------------------------------------------------------------------
-- Perfiles
-- ----------------------------------------------------------------------------
drop policy if exists "perfil propio: leer" on public.profiles;
create policy "perfil propio: leer" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) and deleted_at is null);

drop policy if exists "perfil propio: actualizar" on public.profiles;
create policy "perfil propio: actualizar" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and deleted_at is null)
  with check (id = (select auth.uid()));

-- El perfil del vendedor es público: es su historial laboral verificable, y
-- quien recibe su currículum tiene que poder abrirlo sin cuenta.
drop policy if exists "perfil de vendedor: leer" on public.seller_profiles;
create policy "perfil de vendedor: leer" on public.seller_profiles
  for select using (deleted_at is null);

drop policy if exists "perfil de vendedor propio: actualizar" on public.seller_profiles;
create policy "perfil de vendedor propio: actualizar" on public.seller_profiles
  for update to authenticated
  using (user_id = (select auth.uid()) and deleted_at is null)
  with check (user_id = (select auth.uid()));

-- ----------------------------------------------------------------------------
-- Tiendas
-- ----------------------------------------------------------------------------
drop policy if exists "tiendas: leer" on public.stores;
create policy "tiendas: leer" on public.stores
  for select
  using (
    deleted_at is null
    and (is_published or owner_id = (select auth.uid()))
  );

drop policy if exists "tienda propia: crear" on public.stores;
create policy "tienda propia: crear" on public.stores
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "tienda propia: actualizar" on public.stores;
create policy "tienda propia: actualizar" on public.stores
  for update to authenticated
  using (owner_id = (select auth.uid()) and deleted_at is null)
  with check (owner_id = (select auth.uid()));

-- La suscripción se lee, no se edita desde el cliente: su estado lo cambia el
-- servidor, nunca el emprendedor.
drop policy if exists "suscripcion propia: leer" on public.subscriptions;
create policy "suscripcion propia: leer" on public.subscriptions
  for select to authenticated
  using (store_id = public.my_store_id());

-- ----------------------------------------------------------------------------
-- Productos
-- ----------------------------------------------------------------------------
drop policy if exists "productos publicados: leer" on public.products;
create policy "productos publicados: leer" on public.products
  for select
  using (
    deleted_at is null
    and (
      (is_active and public.store_is_live(store_id))
      or store_id = public.my_store_id()
    )
  );

drop policy if exists "productos propios: administrar" on public.products;
create policy "productos propios: administrar" on public.products
  for all to authenticated
  using (store_id = public.my_store_id())
  with check (store_id = public.my_store_id());

-- ----------------------------------------------------------------------------
-- Vendedores
--
-- Cuidado: acá está la trampa de recursión. Esta política NO puede consultar
-- store_sellers. Por eso compara contra la columna directamente y usa el
-- auxiliar `my_store_id`, que es security definer.
-- ----------------------------------------------------------------------------
drop policy if exists "vendedores: leer los propios y los de mi tienda" on public.store_sellers;
create policy "vendedores: leer los propios y los de mi tienda" on public.store_sellers
  for select to authenticated
  using (
    deleted_at is null
    and (user_id = (select auth.uid()) or store_id = public.my_store_id())
  );

-- El alta pasa por `join_store`, que decide el estado inicial según la
-- configuración de la tienda. Sin política de INSERT: el cliente no elige
-- su propio estado.
drop policy if exists "vendedores de mi tienda: administrar" on public.store_sellers;
create policy "vendedores de mi tienda: administrar" on public.store_sellers
  for update to authenticated
  using (store_id = public.my_store_id() and deleted_at is null)
  with check (store_id = public.my_store_id());

-- ----------------------------------------------------------------------------
-- Pedidos
--
-- Sin política de INSERT a propósito: el checkout pasa por `create_order`,
-- que recalcula los precios. Un comprador anónimo que pudiera insertar acá
-- declararía el total que quiera.
-- ----------------------------------------------------------------------------
drop policy if exists "pedidos de mi tienda: leer" on public.orders;
create policy "pedidos de mi tienda: leer" on public.orders
  for select to authenticated
  using (store_id = public.my_store_id());

-- El vendedor ve las ventas que generó, en todas las tiendas donde trabaja.
-- Esta es la consulta que cruza tenants.
drop policy if exists "pedidos referidos: leer" on public.orders;
create policy "pedidos referidos: leer" on public.orders
  for select to authenticated
  using (seller_id = any (public.my_seller_ids()));

drop policy if exists "pedidos de mi tienda: actualizar" on public.orders;
create policy "pedidos de mi tienda: actualizar" on public.orders
  for update to authenticated
  using (store_id = public.my_store_id())
  with check (store_id = public.my_store_id());

drop policy if exists "items de mi tienda: leer" on public.order_items;
create policy "items de mi tienda: leer" on public.order_items
  for select to authenticated
  using (store_id = public.my_store_id());

drop policy if exists "items referidos: leer" on public.order_items;
create policy "items referidos: leer" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.seller_id = any (public.my_seller_ids())
    )
  );

-- ----------------------------------------------------------------------------
-- Comisiones
--
-- El vendedor las lee por `seller_user_id`, que está denormalizado justamente
-- para que esta política no necesite un join.
-- ----------------------------------------------------------------------------
drop policy if exists "comisiones: leer las propias y las de mi tienda" on public.commissions;
create policy "comisiones: leer las propias y las de mi tienda" on public.commissions
  for select to authenticated
  using (
    seller_user_id = (select auth.uid())
    or store_id = public.my_store_id()
  );

drop policy if exists "comisiones de mi tienda: actualizar" on public.commissions;
create policy "comisiones de mi tienda: actualizar" on public.commissions
  for update to authenticated
  using (store_id = public.my_store_id())
  with check (store_id = public.my_store_id());

-- ----------------------------------------------------------------------------
-- Tienda visual
-- ----------------------------------------------------------------------------
drop policy if exists "paginas publicadas: leer" on public.store_pages;
create policy "paginas publicadas: leer" on public.store_pages
  for select
  using (
    deleted_at is null
    and (
      (status = 'publicada' and public.store_is_live(store_id))
      or store_id = public.my_store_id()
    )
  );

drop policy if exists "paginas propias: administrar" on public.store_pages;
create policy "paginas propias: administrar" on public.store_pages
  for all to authenticated
  using (store_id = public.my_store_id())
  with check (store_id = public.my_store_id());

drop policy if exists "bloques publicados: leer" on public.store_blocks;
create policy "bloques publicados: leer" on public.store_blocks
  for select
  using (
    deleted_at is null
    and (
      (
        is_visible
        and public.store_is_live(store_id)
        and exists (
          select 1 from public.store_pages p
          where p.id = store_blocks.page_id
            and p.status = 'publicada'
            and p.deleted_at is null
        )
      )
      or store_id = public.my_store_id()
    )
  );

drop policy if exists "bloques propios: administrar" on public.store_blocks;
create policy "bloques propios: administrar" on public.store_blocks
  for all to authenticated
  using (store_id = public.my_store_id())
  with check (store_id = public.my_store_id());

drop policy if exists "propuestas propias: administrar" on public.block_edit_proposals;
create policy "propuestas propias: administrar" on public.block_edit_proposals
  for all to authenticated
  using (store_id = public.my_store_id())
  with check (store_id = public.my_store_id());

-- ----------------------------------------------------------------------------
-- IA y difusión
-- ----------------------------------------------------------------------------
drop policy if exists "generaciones propias: leer" on public.ai_generations;
create policy "generaciones propias: leer" on public.ai_generations
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "generaciones propias: crear" on public.ai_generations;
create policy "generaciones propias: crear" on public.ai_generations
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "posteos propios: administrar" on public.social_posts;
create policy "posteos propios: administrar" on public.social_posts
  for all to authenticated
  using (store_id = public.my_store_id())
  with check (store_id = public.my_store_id());

-- `social_connections` queda SIN ninguna política, a propósito: guarda tokens
-- de Meta y solo debe accederse desde el servidor con la clave de servicio.
-- RLS activo y cero políticas significa que nadie más la lee.
