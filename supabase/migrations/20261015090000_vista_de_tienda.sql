-- ============================================================================
-- La vista de la tienda: una captura real de su portada, para la app.
--
-- La saca la web con un Chrome sin ventana (`lib/vista.ts`) y la guarda en
-- `store-assets/{tienda}/`. Acá vive lo que decide cuándo hay que sacarla de
-- nuevo: la base marca `vista_cambio_at` cada vez que cambia algo que se ve en
-- la portada —el diseño, las secciones, un producto—, venga el cambio de la
-- web, de la app o de un disparador. Si `vista_cambio_at` es más nueva que
-- `vista_at`, la captura quedó vieja.
--
-- Marcarlo en la base, y no en cada pantalla que edita, es lo que asegura que
-- ningún camino se olvide: la app escribe productos directo contra Supabase.
-- ============================================================================

alter table public.stores
  add column if not exists vista_url text,
  add column if not exists vista_at timestamptz,
  -- Nace en ahora: toda tienda existente arranca sin captura y pide una.
  add column if not exists vista_cambio_at timestamptz not null default now(),
  -- El candado: cuándo se empezó la última captura, para no sacar dos a la vez.
  add column if not exists vista_pedida_at timestamptz;

-- ----------------------------------------------------------------------------
-- La tienda misma: su nombre, su diseño, si está publicada
-- ----------------------------------------------------------------------------

create or replace function public.vista_cambio_tienda()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Escribir la captura no la vuelve vieja: solo lo que se ve en la portada.
  if row(new.name, new.tagline, new.description, new.logo_url, new.theme_overrides,
         new.template_key, new.is_published, new.whatsapp, new.slug,
         new.suspended_at, new.closed_at)
     is distinct from
     row(old.name, old.tagline, old.description, old.logo_url, old.theme_overrides,
         old.template_key, old.is_published, old.whatsapp, old.slug,
         old.suspended_at, old.closed_at)
  then
    new.vista_cambio_at := now();
  end if;
  return new;
end $$;

drop trigger if exists vista_cambio_tienda on public.stores;
create trigger vista_cambio_tienda
  before update on public.stores
  for each row execute function public.vista_cambio_tienda();

-- ----------------------------------------------------------------------------
-- Las secciones de la portada y los productos
-- ----------------------------------------------------------------------------

create or replace function public.marcar_vista_vieja(p_store_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.stores
     set vista_cambio_at = now()
   where id = p_store_id
     and vista_cambio_at < now();
$$;

revoke all on function public.marcar_vista_vieja(uuid) from public, anon, authenticated;

create or replace function public.vista_cambio_seccion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.marcar_vista_vieja(coalesce(new.store_id, old.store_id));
  return null;
end $$;

drop trigger if exists vista_cambio_bloque on public.store_blocks;
create trigger vista_cambio_bloque
  after insert or update or delete on public.store_blocks
  for each row execute function public.vista_cambio_seccion();

drop trigger if exists vista_cambio_pagina on public.store_pages;
create trigger vista_cambio_pagina
  after insert or update or delete on public.store_pages
  for each row execute function public.vista_cambio_seccion();

-- Un producto cambia la portada si cambia lo que se ve de él. El stock solo
-- cuenta cuando se agota o vuelve: el resto de los movimientos no se notan, y
-- cada venta marcada pagada pediría una captura nueva.
create or replace function public.vista_cambio_producto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and row(new.name, new.price_cents, new.compare_at_price_cents, new.images,
             new.is_active, new.is_featured, new.deleted_at, new.moderated_at,
             new.category_id, new.stock = 0)
         is not distinct from
         row(old.name, old.price_cents, old.compare_at_price_cents, old.images,
             old.is_active, old.is_featured, old.deleted_at, old.moderated_at,
             old.category_id, old.stock = 0)
  then
    return null;
  end if;

  perform public.marcar_vista_vieja(coalesce(new.store_id, old.store_id));
  return null;
end $$;

drop trigger if exists vista_cambio_producto on public.products;
create trigger vista_cambio_producto
  after insert or update or delete on public.products
  for each row execute function public.vista_cambio_producto();

revoke all on function public.vista_cambio_seccion() from public, anon, authenticated;
revoke all on function public.vista_cambio_producto() from public, anon, authenticated;
