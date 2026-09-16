-- ----------------------------------------------------------------------------
-- El catálogo del emprendedor.
--
-- Hasta acá la categoría era texto suelto en cada producto: dos productos de la
-- misma categoría podían escribirla distinto y no había forma de renombrarla ni
-- de listar las que existen. Ahora hay una tabla por tienda, y el texto queda
-- como copia derivada porque los bloques de la tienda pública filtran por
-- nombre y las vistas de análisis lo leen.
--
-- Se suman además las columnas que faltaban para poder cargar un producto de
-- verdad: la galería de fotos, el código interno, el aviso de poco stock y el
-- destacado.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Categorías
-- ----------------------------------------------------------------------------
create table if not exists public.product_categories (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  name        text not null,
  description text,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- Único parcial y sobre minúsculas: "Poleras" y "poleras" son la misma, y una
-- categoría dada de baja no puede bloquear ese nombre para siempre.
create unique index if not exists product_categories_nombre_idx
  on public.product_categories (store_id, lower(name))
  where deleted_at is null;

create index if not exists product_categories_orden_idx
  on public.product_categories (store_id, position)
  where deleted_at is null;

alter table public.product_categories enable row level security;

-- Se leen como se leen los productos: las de mi tienda siempre, las de una
-- tienda publicada también, porque son los filtros de su vitrina.
drop policy if exists "categorias: leer" on public.product_categories;
create policy "categorias: leer" on public.product_categories
  for select
  using (
    deleted_at is null
    and (
      public.store_is_live(store_id)
      or store_id = public.my_store_id()
    )
  );

drop policy if exists "categorias propias: administrar" on public.product_categories;
create policy "categorias propias: administrar" on public.product_categories
  for all to authenticated
  using (store_id = public.my_store_id())
  with check (store_id = public.my_store_id());

-- ----------------------------------------------------------------------------
-- Lo que le faltaba al producto
-- ----------------------------------------------------------------------------
alter table public.products
  add column if not exists category_id uuid
    references public.product_categories(id) on delete set null,
  -- La galería. La primera es la portada, y de ahí sale `image_url`.
  add column if not exists images text[] not null default '{}',
  -- Código interno del emprendedor: lo dicta por teléfono y lo busca en el panel.
  add column if not exists sku text,
  -- Debajo de esto el panel avisa. Cero apaga el aviso.
  add column if not exists low_stock_threshold integer not null default 3
    check (low_stock_threshold >= 0),
  add column if not exists is_featured boolean not null default false;

create index if not exists products_categoria_idx
  on public.products (category_id)
  where deleted_at is null;

create unique index if not exists products_sku_idx
  on public.products (store_id, upper(sku))
  where deleted_at is null and sku is not null;

-- ----------------------------------------------------------------------------
-- Traspaso de lo que ya existe
-- ----------------------------------------------------------------------------

-- Cada texto distinto de `category` pasa a ser una fila, por tienda.
insert into public.product_categories (store_id, name)
select distinct p.store_id, btrim(p.category)
  from public.products p
 where p.deleted_at is null
   and p.category is not null
   and btrim(p.category) <> ''
on conflict do nothing;

update public.products p
   set category_id = c.id
  from public.product_categories c
 where c.store_id = p.store_id
   and lower(c.name) = lower(btrim(p.category))
   and p.category_id is null
   and p.deleted_at is null;

-- La foto que ya tenían pasa a ser la primera de la galería.
update public.products
   set images = array[image_url]
 where image_url is not null
   and image_url <> ''
   and cardinality(images) = 0;

-- ----------------------------------------------------------------------------
-- Lo derivado lo mantiene la base, no la aplicación
--
-- `image_url` y `category` son copias: la fuente son `images` y `category_id`.
-- Dejarlas en manos de quien escriba la próxima consulta garantiza que un
-- camino se las olvide.
-- ----------------------------------------------------------------------------
create or replace function public.producto_derivados()
returns trigger
language plpgsql
as $$
begin
  new.image_url := case
    when cardinality(new.images) > 0 then new.images[1]
    else null
  end;

  new.category := case
    when new.category_id is null then null
    else (select c.name from public.product_categories c where c.id = new.category_id)
  end;

  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists producto_derivados_trg on public.products;
create trigger producto_derivados_trg
  before insert or update on public.products
  for each row execute function public.producto_derivados();

-- Renombrar una categoría tiene que arrastrar la copia, o el filtro de la
-- vitrina deja de encontrar los productos que sí le pertenecen.
create or replace function public.categoria_renombrada()
returns trigger
language plpgsql
as $$
begin
  if new.name is distinct from old.name then
    update public.products
       set category = new.name
     where category_id = new.id;
  end if;
  return new;
end
$$;

drop trigger if exists categoria_renombrada_trg on public.product_categories;
create trigger categoria_renombrada_trg
  after update on public.product_categories
  for each row execute function public.categoria_renombrada();

-- ----------------------------------------------------------------------------
-- La vista que ve la IA: si una columna no está acá, no existe para ella.
--
-- Las nuevas van al final y no intercaladas donde corresponderían: un
-- `create or replace view` solo admite agregar columnas después de las que ya
-- había, y renombrar una de las viejas aborta la migración entera.
-- ----------------------------------------------------------------------------
create or replace view public.mis_productos as
select p.id,
       p.name,
       p.category,
       p.condition,
       p.price_cents,
       p.compare_at_price_cents,
       p.stock,
       p.is_active,
       p.seller_enabled,
       p.created_at,
       p.low_stock_threshold,
       p.sku,
       p.is_featured
  from public.products p
 where p.store_id = public.my_store_id()
   and p.deleted_at is null;

comment on view public.mis_productos is
  'Catálogo de mi tienda. condition: nuevo, segunda_mano, reacondicionado.';

comment on table public.product_categories is
  'Categorías del catálogo, por tienda. products.category es su copia derivada.';
