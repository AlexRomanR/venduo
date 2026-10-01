-- ============================================================================
-- Venduo — los catálogos en PDF
--
-- Un catálogo guarda qué mostrar y cómo, nunca precios ni stock: cada vez que
-- se arma el PDF se leen del catálogo de la tienda, así que un catálogo
-- guardado hace un mes sale con los precios de hoy. La configuración entera
-- —bloques, productos elegidos, packs y estilo— va en `config`, y la valida
-- `catalogoSchema` en el servidor al guardarla y otra vez al leerla.
--
-- El enlace para compartir lleva `share_token` y no el id: el id circula por
-- el panel; el token, solo por el enlace que la persona decide mandar. Quien
-- lo abre no tiene cuenta, así que lo lee `catalogo_compartido`, acotada a un
-- catálogo por su token. La tabla no se abre con una política para anónimos:
-- expondría los catálogos de todas las tiendas.
--
-- Aditiva: no toca nada de lo que ya existe.
-- ============================================================================

create table if not exists public.catalogs (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references public.stores (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  -- La plantilla con la que se armó: es solo para mostrarla en la lista. Lo
  -- que se dibuja está entero en `config`.
  template_key text not null,
  config       jsonb not null,
  share_token  text not null default replace(gen_random_uuid()::text, '-', ''),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

-- La lista del panel: los de mi tienda, el último editado primero.
create index if not exists catalogs_tienda_idx
  on public.catalogs (store_id, updated_at desc)
  where deleted_at is null;

-- Parcial, como todo único: un catálogo dado de baja no ocupa su token.
create unique index if not exists catalogs_token_idx
  on public.catalogs (share_token)
  where deleted_at is null;

alter table public.catalogs enable row level security;

-- ----------------------------------------------------------------------------
-- El catálogo compartido
--
-- Devuelve un solo catálogo y solo si su tienda se sirve al público: una
-- tienda sin publicar o bloqueada tampoco reparte sus catálogos. Los
-- productos y la tienda los lee después la ruta pública con sus políticas de
-- siempre, que ya exponen lo de una tienda publicada.
-- ----------------------------------------------------------------------------
create or replace function public.catalogo_compartido(p_token text)
returns table (id uuid, store_id uuid, name text, config jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.store_id, c.name, c.config
    from public.catalogs c
   where c.share_token = p_token
     and c.deleted_at is null
     and public.store_is_live(c.store_id)
$$;

revoke all on function public.catalogo_compartido(text) from public;
grant execute on function public.catalogo_compartido(text) to anon, authenticated;
